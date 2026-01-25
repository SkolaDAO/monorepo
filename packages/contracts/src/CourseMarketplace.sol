// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";

interface ICreatorRegistry {
    function isRegistered(address creator) external view returns (bool);
}

/// @title CourseMarketplace
/// @notice Marketplace for creating and purchasing courses
/// @dev UUPS Upgradeable with Chainlink price feeds
contract CourseMarketplace is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Course {
        address creator;
        uint256 priceUsd;
        string metadataURI;
        bool active;
        uint256 totalSales;
        uint256 totalRevenue;
    }

    IERC20 public usdc;
    ICreatorRegistry public creatorRegistry;
    AggregatorV3Interface public priceFeed;

    uint256 public protocolFeeBps;
    uint256 public referrerFeeBps;
    uint256 public constant MAX_BPS = 10000;

    address public treasury;

    uint256 public nextCourseId;
    mapping(uint256 => Course) public courses;
    mapping(uint256 => mapping(address => bool)) public hasPurchased;

    event CourseCreated(
        uint256 indexed courseId,
        address indexed creator,
        uint256 priceUsd,
        string metadataURI
    );
    event CourseUpdated(uint256 indexed courseId, uint256 priceUsd, string metadataURI);
    event CourseDeactivated(uint256 indexed courseId);
    event CourseReactivated(uint256 indexed courseId);
    event CoursePurchasedWithETH(
        uint256 indexed courseId,
        address indexed buyer,
        address indexed referrer,
        uint256 ethPaid,
        uint256 usdValue
    );
    event CoursePurchasedWithUSDC(
        uint256 indexed courseId,
        address indexed buyer,
        address indexed referrer,
        uint256 usdcPaid
    );
    event TreasuryUpdated(address indexed newTreasury);
    event FeesUpdated(uint256 protocolFeeBps, uint256 referrerFeeBps);
    event PriceFeedUpdated(address indexed priceFeed);

    error NotStaked();
    error NotCourseCreator();
    error CourseNotActive();
    error AlreadyPurchased();
    error InvalidPrice();
    error InvalidMetadata();
    error SelfPurchase();
    error SelfReferral();
    error InsufficientPayment();
    error TransferFailed();
    error StalePrice();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdc,
        address _creatorRegistry,
        address _priceFeed,
        address _treasury,
        address _owner
    ) external initializer {
        __Ownable_init(_owner);

        usdc = IERC20(_usdc);
        creatorRegistry = ICreatorRegistry(_creatorRegistry);
        priceFeed = AggregatorV3Interface(_priceFeed);
        treasury = _treasury;

        protocolFeeBps = 500;
        referrerFeeBps = 300;
        nextCourseId = 1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getEthPriceUsd() public view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        if (price <= 0) revert InvalidPrice();
        if (block.timestamp - updatedAt > 1 hours) revert StalePrice();
        return uint256(price) * 1e6 / 1e8;
    }

    function createCourse(uint256 priceUsd, string calldata metadataURI) external returns (uint256) {
        if (!creatorRegistry.isRegistered(msg.sender)) revert NotStaked();
        if (priceUsd == 0) revert InvalidPrice();
        if (bytes(metadataURI).length == 0) revert InvalidMetadata();

        uint256 courseId = nextCourseId++;

        courses[courseId] = Course({
            creator: msg.sender,
            priceUsd: priceUsd,
            metadataURI: metadataURI,
            active: true,
            totalSales: 0,
            totalRevenue: 0
        });

        emit CourseCreated(courseId, msg.sender, priceUsd, metadataURI);
        return courseId;
    }

    function updateCourse(uint256 courseId, uint256 priceUsd, string calldata metadataURI) external {
        Course storage course = courses[courseId];
        if (course.creator != msg.sender) revert NotCourseCreator();
        if (priceUsd == 0) revert InvalidPrice();
        if (bytes(metadataURI).length == 0) revert InvalidMetadata();

        course.priceUsd = priceUsd;
        course.metadataURI = metadataURI;

        emit CourseUpdated(courseId, priceUsd, metadataURI);
    }

    function deactivateCourse(uint256 courseId) external {
        Course storage course = courses[courseId];
        if (course.creator != msg.sender) revert NotCourseCreator();

        course.active = false;

        emit CourseDeactivated(courseId);
    }

    function reactivateCourse(uint256 courseId) external {
        Course storage course = courses[courseId];
        if (course.creator != msg.sender) revert NotCourseCreator();

        course.active = true;

        emit CourseReactivated(courseId);
    }

    function purchaseWithETH(
        uint256 courseId,
        address referrer
    ) external payable nonReentrant {
        Course storage course = courses[courseId];
        if (!course.active) revert CourseNotActive();
        if (hasPurchased[courseId][msg.sender]) revert AlreadyPurchased();
        if (course.creator == msg.sender) revert SelfPurchase();
        if (referrer == msg.sender) revert SelfReferral();

        uint256 ethPriceUsd = getEthPriceUsd();
        uint256 requiredEth = (course.priceUsd * 1e18) / ethPriceUsd;
        if (msg.value < requiredEth) revert InsufficientPayment();

        uint256 protocolFee = (requiredEth * protocolFeeBps) / MAX_BPS;
        uint256 referrerFee = referrer != address(0) ? (requiredEth * referrerFeeBps) / MAX_BPS : 0;
        uint256 creatorAmount = requiredEth - protocolFee - referrerFee;

        (bool sentCreator, ) = course.creator.call{value: creatorAmount}("");
        if (!sentCreator) revert TransferFailed();

        (bool sentTreasury, ) = treasury.call{value: protocolFee}("");
        if (!sentTreasury) revert TransferFailed();

        if (referrerFee > 0) {
            (bool sentReferrer, ) = referrer.call{value: referrerFee}("");
            if (!sentReferrer) revert TransferFailed();
        }

        uint256 refund = msg.value - requiredEth;
        if (refund > 0) {
            (bool refunded, ) = msg.sender.call{value: refund}("");
            if (!refunded) revert TransferFailed();
        }

        hasPurchased[courseId][msg.sender] = true;
        course.totalSales++;
        course.totalRevenue += course.priceUsd;

        emit CoursePurchasedWithETH(courseId, msg.sender, referrer, requiredEth, course.priceUsd);
    }

    function purchaseWithUSDC(
        uint256 courseId,
        address referrer
    ) external nonReentrant {
        Course storage course = courses[courseId];
        if (!course.active) revert CourseNotActive();
        if (hasPurchased[courseId][msg.sender]) revert AlreadyPurchased();
        if (course.creator == msg.sender) revert SelfPurchase();
        if (referrer == msg.sender) revert SelfReferral();

        uint256 protocolFee = (course.priceUsd * protocolFeeBps) / MAX_BPS;
        uint256 referrerFee = referrer != address(0) ? (course.priceUsd * referrerFeeBps) / MAX_BPS : 0;
        uint256 creatorAmount = course.priceUsd - protocolFee - referrerFee;

        usdc.safeTransferFrom(msg.sender, course.creator, creatorAmount);
        usdc.safeTransferFrom(msg.sender, treasury, protocolFee);
        if (referrerFee > 0) {
            usdc.safeTransferFrom(msg.sender, referrer, referrerFee);
        }

        hasPurchased[courseId][msg.sender] = true;
        course.totalSales++;
        course.totalRevenue += course.priceUsd;

        emit CoursePurchasedWithUSDC(courseId, msg.sender, referrer, course.priceUsd);
    }

    function getCourse(uint256 courseId) external view returns (Course memory) {
        return courses[courseId];
    }

    function hasAccess(uint256 courseId, address user) external view returns (bool) {
        return hasPurchased[courseId][user] || courses[courseId].creator == user;
    }

    function getPriceInETH(uint256 courseId) external view returns (uint256) {
        uint256 ethPriceUsd = getEthPriceUsd();
        return (courses[courseId].priceUsd * 1e18) / ethPriceUsd;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setFees(
        uint256 _protocolFeeBps,
        uint256 _referrerFeeBps
    ) external onlyOwner {
        require(_protocolFeeBps + _referrerFeeBps <= 2000, "Fees too high");

        protocolFeeBps = _protocolFeeBps;
        referrerFeeBps = _referrerFeeBps;

        emit FeesUpdated(_protocolFeeBps, _referrerFeeBps);
    }

    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = AggregatorV3Interface(_priceFeed);
        emit PriceFeedUpdated(_priceFeed);
    }

    function setCreatorRegistry(address _creatorRegistry) external onlyOwner {
        creatorRegistry = ICreatorRegistry(_creatorRegistry);
    }
}
