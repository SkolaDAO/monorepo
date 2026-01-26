// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {CreatorRegistry} from "../src/CreatorRegistry.sol";
import {CourseMarketplace} from "../src/CourseMarketplace.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockPriceFeed {
    int256 public price = 3000e8;
    uint256 public updatedAt;

    constructor() {
        updatedAt = block.timestamp;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt_,
        uint80 answeredInRound
    ) {
        return (1, price, block.timestamp, updatedAt, 1);
    }

    function setPrice(int256 _price) external {
        price = _price;
        updatedAt = block.timestamp;
    }

    function setUpdatedAt(uint256 _updatedAt) external {
        updatedAt = _updatedAt;
    }
}

contract DeLearnTest is Test {
    CreatorRegistry public registry;
    CourseMarketplace public marketplace;
    MockUSDC public usdc;
    MockPriceFeed public priceFeed;

    address public owner = address(1);
    address public treasury = address(2);
    address public creator = address(3);
    address public learner = address(4);
    address public referrer = address(5);

    uint256 public constant REGISTRATION_FEE = 20e6;
    uint256 public constant ETH_PRICE = 3000e6;

    function setUp() public {
        usdc = new MockUSDC();
        priceFeed = new MockPriceFeed();

        vm.startPrank(owner);
        
        CreatorRegistry registryImpl = new CreatorRegistry();
        bytes memory registryData = abi.encodeWithSelector(
            CreatorRegistry.initialize.selector,
            address(usdc),
            address(priceFeed),
            treasury,
            owner
        );
        ERC1967Proxy registryProxy = new ERC1967Proxy(address(registryImpl), registryData);
        registry = CreatorRegistry(address(registryProxy));

        CourseMarketplace marketplaceImpl = new CourseMarketplace();
        bytes memory marketplaceData = abi.encodeWithSelector(
            CourseMarketplace.initialize.selector,
            address(usdc),
            address(registry),
            address(priceFeed),
            treasury,
            owner
        );
        ERC1967Proxy marketplaceProxy = new ERC1967Proxy(address(marketplaceImpl), marketplaceData);
        marketplace = CourseMarketplace(address(marketplaceProxy));

        registry.setCourseMarketplace(address(marketplace));
        vm.stopPrank();

        usdc.mint(creator, 1000e6);
        usdc.mint(learner, 1000e6);
        vm.deal(creator, 10 ether);
        vm.deal(learner, 10 ether);
    }

    function test_RegisterWithETH() public {
        uint256 requiredEth = registry.getRequiredETH();

        vm.prank(creator);
        registry.registerWithETH{value: requiredEth}();

        assertTrue(registry.isRegistered(creator));
        
        CreatorRegistry.CreatorInfo memory info = registry.getCreatorInfo(creator);
        assertTrue(info.registered);
        assertEq(info.paidUsd, REGISTRATION_FEE);
    }

    function test_RegisterWithUSDC() public {
        vm.startPrank(creator);
        usdc.approve(address(registry), REGISTRATION_FEE);
        registry.registerWithUSDC();
        vm.stopPrank();

        assertTrue(registry.isRegistered(creator));
    }

    function test_CannotRegisterTwice() public {
        vm.startPrank(creator);
        usdc.approve(address(registry), REGISTRATION_FEE * 2);
        registry.registerWithUSDC();

        vm.expectRevert(CreatorRegistry.AlreadyRegistered.selector);
        registry.registerWithUSDC();
        vm.stopPrank();
    }

    function test_ETHRefundsExcess() public {
        uint256 requiredEth = registry.getRequiredETH();
        uint256 sentEth = requiredEth + 0.5 ether;
        uint256 balanceBefore = creator.balance;

        vm.prank(creator);
        registry.registerWithETH{value: sentEth}();

        assertEq(creator.balance, balanceBefore - requiredEth);
    }

    function test_FirstCourseIsFree() public {
        // First course should work without registration
        vm.prank(creator);
        uint256 courseId = marketplace.createCourse(50e6, "ipfs://test");
        assertEq(courseId, 1);
        assertEq(marketplace.getCreatorCourseCount(creator), 1);
    }

    function test_SecondCourseRequiresRegistration() public {
        // First course free
        vm.prank(creator);
        marketplace.createCourse(50e6, "ipfs://test1");

        // Second course should fail without registration
        vm.prank(creator);
        vm.expectRevert();
        marketplace.createCourse(50e6, "ipfs://test2");
    }

    function test_CreateCourse() public {
        vm.startPrank(creator);
        usdc.approve(address(registry), REGISTRATION_FEE);
        registry.registerWithUSDC();

        uint256 courseId = marketplace.createCourse(50e6, "ipfs://metadata");
        vm.stopPrank();

        assertEq(courseId, 1);
        (address courseCreator, uint256 price, , bool active, bool hidden, , ) = marketplace.courses(courseId);
        assertEq(courseCreator, creator);
        assertEq(price, 50e6);
        assertTrue(active);
        assertFalse(hidden);
    }

    function test_CreateUnlimitedCourses() public {
        vm.startPrank(creator);
        usdc.approve(address(registry), REGISTRATION_FEE);
        registry.registerWithUSDC();

        for (uint i = 0; i < 10; i++) {
            marketplace.createCourse(50e6, "ipfs://metadata");
        }
        vm.stopPrank();

        assertEq(marketplace.nextCourseId(), 11);
    }

    function test_PurchaseWithETH() public {
        vm.startPrank(creator);
        usdc.approve(address(registry), REGISTRATION_FEE);
        registry.registerWithUSDC();
        marketplace.createCourse(50e6, "ipfs://metadata");
        vm.stopPrank();

        uint256 ethPrice = marketplace.getPriceInETH(1);
        uint256 creatorBalanceBefore = creator.balance;

        vm.prank(learner);
        marketplace.purchaseWithETH{value: ethPrice + 0.01 ether}(1, address(0));

        assertTrue(marketplace.hasAccess(1, learner));
        assertGt(creator.balance, creatorBalanceBefore);
    }

    function test_PurchaseWithUSDC() public {
        vm.startPrank(creator);
        usdc.approve(address(registry), REGISTRATION_FEE);
        registry.registerWithUSDC();
        marketplace.createCourse(50e6, "ipfs://metadata");
        vm.stopPrank();

        uint256 creatorUsdcBefore = usdc.balanceOf(creator);

        vm.startPrank(learner);
        usdc.approve(address(marketplace), 50e6);
        marketplace.purchaseWithUSDC(1, address(0));
        vm.stopPrank();

        assertTrue(marketplace.hasAccess(1, learner));
        assertGt(usdc.balanceOf(creator), creatorUsdcBefore);
    }

    function test_PurchaseWithReferrer() public {
        vm.startPrank(creator);
        usdc.approve(address(registry), REGISTRATION_FEE);
        registry.registerWithUSDC();
        marketplace.createCourse(100e6, "ipfs://metadata");
        vm.stopPrank();

        uint256 referrerBefore = usdc.balanceOf(referrer);

        vm.startPrank(learner);
        usdc.approve(address(marketplace), 100e6);
        marketplace.purchaseWithUSDC(1, referrer);
        vm.stopPrank();

        assertEq(usdc.balanceOf(referrer), referrerBefore + 3e6);
    }

    function test_TreasuryReceivesPayment() public {
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        vm.startPrank(creator);
        usdc.approve(address(registry), REGISTRATION_FEE);
        registry.registerWithUSDC();
        vm.stopPrank();

        assertEq(usdc.balanceOf(treasury), treasuryBefore + REGISTRATION_FEE);
    }

    function test_AirdropTracking() public {
        vm.startPrank(creator);
        usdc.approve(address(registry), REGISTRATION_FEE);
        registry.registerWithUSDC();
        vm.stopPrank();

        CreatorRegistry.CreatorInfo memory info = registry.getCreatorInfo(creator);
        assertEq(info.paidUsd, REGISTRATION_FEE);
        assertGt(info.paidAt, 0);
    }

    function test_ChainlinkPriceFeed() public view {
        uint256 ethPrice = registry.getEthPriceUsd();
        assertEq(ethPrice, ETH_PRICE);
    }

    function test_StalePriceReverts() public {
        vm.warp(1704067200);
        priceFeed.setUpdatedAt(block.timestamp - 2 hours);

        vm.expectRevert(CreatorRegistry.StalePrice.selector);
        registry.getEthPriceUsd();
    }

    function test_DeactivateReactivateCourse() public {
        vm.startPrank(creator);
        usdc.approve(address(registry), REGISTRATION_FEE);
        registry.registerWithUSDC();
        uint256 courseId = marketplace.createCourse(50e6, "ipfs://metadata");
        
        marketplace.deactivateCourse(courseId);
        (, , , bool activeAfterDeactivate, , , ) = marketplace.courses(courseId);
        assertFalse(activeAfterDeactivate);

        marketplace.reactivateCourse(courseId);
        (, , , bool activeAfterReactivate, , , ) = marketplace.courses(courseId);
        assertTrue(activeAfterReactivate);
        vm.stopPrank();
    }

    function test_ModeratorCanHideCourse() public {
        vm.prank(creator);
        uint256 courseId = marketplace.createCourse(50e6, "ipfs://metadata");

        address moderator = marketplace.moderator();
        
        vm.prank(moderator);
        marketplace.hideCourse(courseId);

        (, , , bool active, bool hidden, , ) = marketplace.courses(courseId);
        assertTrue(hidden);
        assertFalse(active);
        assertFalse(marketplace.isVisible(courseId));
    }

    function test_ModeratorCanUnhideCourse() public {
        vm.prank(creator);
        uint256 courseId = marketplace.createCourse(50e6, "ipfs://metadata");

        address moderator = marketplace.moderator();
        
        vm.prank(moderator);
        marketplace.hideCourse(courseId);

        vm.prank(moderator);
        marketplace.unhideCourse(courseId);

        (, , , , bool hidden, , ) = marketplace.courses(courseId);
        assertFalse(hidden);
        assertTrue(marketplace.isVisible(courseId));
    }

    function test_ModeratorCanDeleteCourse() public {
        vm.prank(creator);
        uint256 courseId = marketplace.createCourse(50e6, "ipfs://metadata");
        assertEq(marketplace.getCreatorCourseCount(creator), 1);

        address moderator = marketplace.moderator();
        
        vm.prank(moderator);
        marketplace.deleteCourse(courseId);

        (address courseCreator, , , , , , ) = marketplace.courses(courseId);
        assertEq(courseCreator, address(0));
        assertEq(marketplace.getCreatorCourseCount(creator), 0);
    }

    function test_CannotPurchaseHiddenCourse() public {
        vm.prank(creator);
        uint256 courseId = marketplace.createCourse(50e6, "ipfs://metadata");

        address moderator = marketplace.moderator();
        vm.prank(moderator);
        marketplace.hideCourse(courseId);

        vm.startPrank(learner);
        usdc.approve(address(marketplace), 50e6);
        vm.expectRevert();
        marketplace.purchaseWithUSDC(courseId, address(0));
        vm.stopPrank();
    }

    function test_OwnerCanSetModerator() public {
        address newModerator = address(99);
        
        vm.prank(owner);
        marketplace.setModerator(newModerator);

        assertEq(marketplace.moderator(), newModerator);
    }
}
