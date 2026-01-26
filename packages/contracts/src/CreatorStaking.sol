// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CreatorStaking
/// @notice Stake ETH or USDC to unlock creator tiers and course limits
/// @dev UUPS Upgradeable
contract CreatorStaking is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Tier {
        None,
        Starter,
        Pro,
        Elite
    }

    enum StakeAsset {
        ETH,
        USDC
    }

    struct CreatorInfo {
        uint256 stakedAmount;
        StakeAsset stakeAsset;
        uint256 stakedAt;
        uint256 unstakeRequestedAt;
        uint8 activeCourses;
    }

    IERC20 public usdc;

    uint256 public starterStakeUsd;
    uint256 public proStakeUsd;
    uint256 public eliteStakeUsd;

    uint256 public ethPriceUsd;

    uint8 public starterMaxCourses;
    uint8 public proMaxCourses;
    uint8 public eliteMaxCourses;

    uint256 public unstakeCooldown;

    mapping(address => CreatorInfo) public creators;

    address public courseMarketplace;

    event StakedETH(address indexed creator, uint256 amount, Tier tier);
    event StakedUSDC(address indexed creator, uint256 amount, Tier tier);
    event UnstakeRequested(address indexed creator, uint256 unlockTime);
    event Unstaked(address indexed creator, uint256 amount, StakeAsset asset);
    event TierUpdated(address indexed creator, Tier oldTier, Tier newTier);
    event CourseMarketplaceSet(address indexed marketplace);
    event EthPriceUpdated(uint256 newPrice);
    event StakeTokenUpdated(address indexed token);

    error InsufficientStake();
    error AlreadyStaked();
    error NotStaked();
    error UnstakeNotRequested();
    error CooldownNotPassed();
    error MaxCoursesReached();
    error OnlyMarketplace();
    error InvalidAmount();
    error TransferFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _usdc, address _owner) external initializer {
        __Ownable_init(_owner);

        usdc = IERC20(_usdc);
        
        starterStakeUsd = 10e6;
        proStakeUsd = 50e6;
        eliteStakeUsd = 200e6;
        
        ethPriceUsd = 3000e6;
        
        starterMaxCourses = 1;
        proMaxCourses = 5;
        eliteMaxCourses = 255;
        
        unstakeCooldown = 7 days;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function stakeETH(Tier targetTier) external payable nonReentrant {
        if (creators[msg.sender].stakedAmount > 0) revert AlreadyStaked();

        uint256 requiredUsd = _getRequiredUsdForTier(targetTier);
        uint256 requiredEth = (requiredUsd * 1e18 + ethPriceUsd - 1) / ethPriceUsd;

        if (msg.value < requiredEth) revert InsufficientStake();

        uint256 refund = msg.value - requiredEth;

        creators[msg.sender] = CreatorInfo({
            stakedAmount: requiredEth,
            stakeAsset: StakeAsset.ETH,
            stakedAt: block.timestamp,
            unstakeRequestedAt: 0,
            activeCourses: 0
        });
        if (refund > 0) {
            (bool sent, ) = msg.sender.call{value: refund}("");
            if (!sent) revert TransferFailed();
        }

        emit StakedETH(msg.sender, requiredEth, targetTier);
    }

    function stakeUSDC(uint256 amount) external nonReentrant {
        if (amount < starterStakeUsd) revert InsufficientStake();
        if (creators[msg.sender].stakedAmount > 0) revert AlreadyStaked();

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        creators[msg.sender] = CreatorInfo({
            stakedAmount: amount,
            stakeAsset: StakeAsset.USDC,
            stakedAt: block.timestamp,
            unstakeRequestedAt: 0,
            activeCourses: 0
        });

        emit StakedUSDC(msg.sender, amount, getTier(msg.sender));
    }

    function increaseStakeETH() external payable nonReentrant {
        if (msg.value == 0) revert InvalidAmount();
        CreatorInfo storage creator = creators[msg.sender];
        if (creator.stakedAmount == 0) revert NotStaked();
        if (creator.stakeAsset != StakeAsset.ETH) revert InvalidAmount();

        Tier oldTier = getTier(msg.sender);
        creator.stakedAmount += msg.value;
        creator.unstakeRequestedAt = 0;

        Tier newTier = getTier(msg.sender);
        if (oldTier != newTier) {
            emit TierUpdated(msg.sender, oldTier, newTier);
        }
    }

    function increaseStakeUSDC(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();
        CreatorInfo storage creator = creators[msg.sender];
        if (creator.stakedAmount == 0) revert NotStaked();
        if (creator.stakeAsset != StakeAsset.USDC) revert InvalidAmount();

        Tier oldTier = getTier(msg.sender);

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        creator.stakedAmount += amount;
        creator.unstakeRequestedAt = 0;

        Tier newTier = getTier(msg.sender);
        if (oldTier != newTier) {
            emit TierUpdated(msg.sender, oldTier, newTier);
        }
    }

    function requestUnstake() external {
        CreatorInfo storage creator = creators[msg.sender];
        if (creator.stakedAmount == 0) revert NotStaked();

        creator.unstakeRequestedAt = block.timestamp;

        emit UnstakeRequested(msg.sender, block.timestamp + unstakeCooldown);
    }

    function unstake() external nonReentrant {
        CreatorInfo storage creator = creators[msg.sender];
        if (creator.stakedAmount == 0) revert NotStaked();
        if (creator.unstakeRequestedAt == 0) revert UnstakeNotRequested();
        if (block.timestamp < creator.unstakeRequestedAt + unstakeCooldown) {
            revert CooldownNotPassed();
        }

        uint256 amount = creator.stakedAmount;
        StakeAsset asset = creator.stakeAsset;
        delete creators[msg.sender];

        if (asset == StakeAsset.ETH) {
            (bool sent, ) = msg.sender.call{value: amount}("");
            if (!sent) revert TransferFailed();
        } else {
            usdc.safeTransfer(msg.sender, amount);
        }

        emit Unstaked(msg.sender, amount, asset);
    }

    function cancelUnstake() external {
        CreatorInfo storage creator = creators[msg.sender];
        if (creator.stakedAmount == 0) revert NotStaked();
        creator.unstakeRequestedAt = 0;
    }

    function incrementCourseCount(address creator) external {
        if (msg.sender != courseMarketplace) revert OnlyMarketplace();
        CreatorInfo storage info = creators[creator];
        if (info.activeCourses >= getMaxCourses(creator)) revert MaxCoursesReached();
        info.activeCourses++;
    }

    function decrementCourseCount(address creator) external {
        if (msg.sender != courseMarketplace) revert OnlyMarketplace();
        CreatorInfo storage info = creators[creator];
        if (info.activeCourses > 0) {
            info.activeCourses--;
        }
    }

    function getTier(address creator) public view returns (Tier) {
        CreatorInfo storage info = creators[creator];
        uint256 stakedUsd;

        if (info.stakeAsset == StakeAsset.ETH) {
            stakedUsd = (info.stakedAmount * ethPriceUsd) / 1e18;
        } else {
            stakedUsd = info.stakedAmount;
        }

        if (stakedUsd >= eliteStakeUsd) return Tier.Elite;
        if (stakedUsd >= proStakeUsd) return Tier.Pro;
        if (stakedUsd >= starterStakeUsd) return Tier.Starter;
        return Tier.None;
    }

    function getMaxCourses(address creator) public view returns (uint8) {
        Tier tier = getTier(creator);
        if (tier == Tier.Elite) return eliteMaxCourses;
        if (tier == Tier.Pro) return proMaxCourses;
        if (tier == Tier.Starter) return starterMaxCourses;
        return 0;
    }

    function isStaked(address creator) external view returns (bool) {
        return getTier(creator) != Tier.None;
    }

    function getCreatorInfo(address creator) external view returns (CreatorInfo memory) {
        return creators[creator];
    }

    function getRequiredETHForTier(Tier tier) external view returns (uint256) {
        uint256 requiredUsd = _getRequiredUsdForTier(tier);
        return (requiredUsd * 1e18 + ethPriceUsd - 1) / ethPriceUsd;
    }

    function _getRequiredUsdForTier(Tier tier) internal view returns (uint256) {
        if (tier == Tier.Elite) return eliteStakeUsd;
        if (tier == Tier.Pro) return proStakeUsd;
        if (tier == Tier.Starter) return starterStakeUsd;
        return 0;
    }

    // ============ Admin Functions ============

    function setStakeToken(address _token) external onlyOwner {
        usdc = IERC20(_token);
        emit StakeTokenUpdated(_token);
    }

    function setCourseMarketplace(address _marketplace) external onlyOwner {
        courseMarketplace = _marketplace;
        emit CourseMarketplaceSet(_marketplace);
    }

    function setEthPrice(uint256 _priceUsd) external onlyOwner {
        ethPriceUsd = _priceUsd;
        emit EthPriceUpdated(_priceUsd);
    }

    function setStakeAmounts(
        uint256 _starter,
        uint256 _pro,
        uint256 _elite
    ) external onlyOwner {
        starterStakeUsd = _starter;
        proStakeUsd = _pro;
        eliteStakeUsd = _elite;
    }

    function setMaxCourses(
        uint8 _starter,
        uint8 _pro,
        uint8 _elite
    ) external onlyOwner {
        starterMaxCourses = _starter;
        proMaxCourses = _pro;
        eliteMaxCourses = _elite;
    }

    function setUnstakeCooldown(uint256 _cooldown) external onlyOwner {
        unstakeCooldown = _cooldown;
    }

    receive() external payable {}
}
