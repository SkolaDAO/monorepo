// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";

/// @title CreatorRegistry
/// @notice One-time $20 payment to become a creator. Pay once, publish forever.
/// @dev UUPS Upgradeable. Early ETH/USDC payers tracked for future token airdrop.
contract CreatorRegistry is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct CreatorInfo {
        bool registered;
        uint256 paidUsd;
        uint256 paidAt;
    }

    IERC20 public usdc;
    AggregatorV3Interface public priceFeed;

    uint256 public registrationFeeUsd;
    address public courseMarketplace;
    address public treasury;

    mapping(address => CreatorInfo) public creators;

    event CreatorRegistered(address indexed creator, uint256 paidUsd, bool paidWithEth);
    event CourseMarketplaceSet(address indexed marketplace);
    event TreasurySet(address indexed treasury);
    event PriceFeedSet(address indexed priceFeed);
    event RegistrationFeeSet(uint256 feeUsd);

    error AlreadyRegistered();
    error InsufficientPayment();
    error NotRegistered();
    error TransferFailed();
    error TreasuryNotSet();
    error StalePrice();
    error InvalidPrice();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdc,
        address _priceFeed,
        address _treasury,
        address _owner
    ) external initializer {
        __Ownable_init(_owner);

        usdc = IERC20(_usdc);
        priceFeed = AggregatorV3Interface(_priceFeed);
        treasury = _treasury;
        registrationFeeUsd = 20e6; // $20 in 6 decimals
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getEthPriceUsd() public view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        if (price <= 0) revert InvalidPrice();
        if (block.timestamp - updatedAt > 1 hours) revert StalePrice();
        return uint256(price) * 1e6 / 1e8;
    }

    function registerWithETH() external payable nonReentrant {
        if (treasury == address(0)) revert TreasuryNotSet();
        if (creators[msg.sender].registered) revert AlreadyRegistered();

        uint256 ethPriceUsd = getEthPriceUsd();
        uint256 requiredEth = (registrationFeeUsd * 1e18 + ethPriceUsd - 1) / ethPriceUsd;

        if (msg.value < requiredEth) revert InsufficientPayment();

        uint256 refund = msg.value - requiredEth;

        creators[msg.sender] = CreatorInfo({
            registered: true,
            paidUsd: registrationFeeUsd,
            paidAt: block.timestamp
        });

        (bool sent, ) = treasury.call{value: requiredEth}("");
        if (!sent) revert TransferFailed();

        if (refund > 0) {
            (bool refundSent, ) = msg.sender.call{value: refund}("");
            if (!refundSent) revert TransferFailed();
        }

        emit CreatorRegistered(msg.sender, registrationFeeUsd, true);
    }

    function registerWithUSDC() external nonReentrant {
        if (treasury == address(0)) revert TreasuryNotSet();
        if (creators[msg.sender].registered) revert AlreadyRegistered();

        usdc.safeTransferFrom(msg.sender, treasury, registrationFeeUsd);

        creators[msg.sender] = CreatorInfo({
            registered: true,
            paidUsd: registrationFeeUsd,
            paidAt: block.timestamp
        });

        emit CreatorRegistered(msg.sender, registrationFeeUsd, false);
    }

    function isRegistered(address creator) external view returns (bool) {
        return creators[creator].registered;
    }

    function getCreatorInfo(address creator) external view returns (CreatorInfo memory) {
        return creators[creator];
    }

    function getRequiredETH() external view returns (uint256) {
        uint256 ethPriceUsd = getEthPriceUsd();
        return (registrationFeeUsd * 1e18 + ethPriceUsd - 1) / ethPriceUsd;
    }

    function setCourseMarketplace(address _marketplace) external onlyOwner {
        courseMarketplace = _marketplace;
        emit CourseMarketplaceSet(_marketplace);
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit TreasurySet(_treasury);
    }

    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = AggregatorV3Interface(_priceFeed);
        emit PriceFeedSet(_priceFeed);
    }

    function setRegistrationFee(uint256 _feeUsd) external onlyOwner {
        registrationFeeUsd = _feeUsd;
        emit RegistrationFeeSet(_feeUsd);
    }
}
