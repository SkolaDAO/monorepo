// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {CreatorRegistry} from "../src/CreatorRegistry.sol";
import {CourseMarketplace} from "../src/CourseMarketplace.sol";

contract DeployScript is Script {
    // USDC addresses
    address constant BASE_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant BASE_MAINNET_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    // Chainlink ETH/USD price feed addresses
    address constant BASE_SEPOLIA_ETH_USD = 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1;
    address constant BASE_MAINNET_ETH_USD = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        bool isMainnet = block.chainid == 8453;
        address usdc = isMainnet ? BASE_MAINNET_USDC : BASE_SEPOLIA_USDC;
        address priceFeed = isMainnet ? BASE_MAINNET_ETH_USD : BASE_SEPOLIA_ETH_USD;

        console.log("Deploying contracts with deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("USDC address:", usdc);
        console.log("Price Feed address:", priceFeed);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy CreatorRegistry implementation
        CreatorRegistry registryImpl = new CreatorRegistry();
        console.log("CreatorRegistry implementation:", address(registryImpl));

        // Deploy CreatorRegistry proxy
        bytes memory registryData = abi.encodeWithSelector(
            CreatorRegistry.initialize.selector,
            usdc,
            priceFeed,
            deployer, // treasury
            deployer  // owner
        );
        ERC1967Proxy registryProxy = new ERC1967Proxy(address(registryImpl), registryData);
        console.log("CreatorRegistry proxy:", address(registryProxy));

        // Deploy CourseMarketplace implementation
        CourseMarketplace marketplaceImpl = new CourseMarketplace();
        console.log("CourseMarketplace implementation:", address(marketplaceImpl));

        // Deploy CourseMarketplace proxy
        bytes memory marketplaceData = abi.encodeWithSelector(
            CourseMarketplace.initialize.selector,
            usdc,
            address(registryProxy),
            priceFeed,
            deployer, // treasury
            deployer  // owner
        );
        ERC1967Proxy marketplaceProxy = new ERC1967Proxy(address(marketplaceImpl), marketplaceData);
        console.log("CourseMarketplace proxy:", address(marketplaceProxy));

        // Set CourseMarketplace in CreatorRegistry
        CreatorRegistry(address(registryProxy)).setCourseMarketplace(address(marketplaceProxy));
        console.log("CourseMarketplace set in CreatorRegistry");

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("CreatorRegistry (proxy):", address(registryProxy));
        console.log("CreatorRegistry (impl):", address(registryImpl));
        console.log("CourseMarketplace (proxy):", address(marketplaceProxy));
        console.log("CourseMarketplace (impl):", address(marketplaceImpl));
        console.log("Treasury:", deployer);
        console.log("USDC:", usdc);
        console.log("Price Feed:", priceFeed);
    }
}
