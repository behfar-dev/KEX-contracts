/**
 * Minimal KEX System Deployment Script
 *
 * This script deploys ONLY the core bonding curve system without the full
 * Agent/Virtual Persona subsystem. Use this for simpler deployments focused
 * on the bonding curve functionality.
 *
 * Deployed contracts:
 *   - TestERC20 (USDT) - Asset token
 *   - FFactory - Pair factory
 *   - FRouter - Swap router
 *   - Bonding - Bonding curve contract
 *
 * Usage:
 *   npx hardhat run scripts/kex/deployMinimal.ts --network <network_name>
 */

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

const hre = require("hardhat");

// Network-specific configurations
const NETWORK_CONFIG: any = {
    saga: {
        gasPrice: 0,
        verificationDelay: 30000
    },
    base_sepolia: {
        gasPrice: undefined,
        verificationDelay: 30000
    },
    base: {
        gasPrice: undefined,
        verificationDelay: 30000
    },
    sepolia: {
        gasPrice: undefined,
        verificationDelay: 30000
    }
};

const DEPLOYMENT_PARAMS = {
    assetTokenName: "USDT-Kex Test",
    assetTokenSymbol: "KEX_USDT",
    buyTax: 0,
    sellTax: 0,
    fee: "100000000000000000000", // 100 USDT
    initialSupply: "1000000000", // 1 billion tokens
    assetRate: "5000", // 0.5%
    maxTx: 100,
    gradThreshold: "125000000000000000000000000", // 125M tokens
};

async function main() {
    console.log("\n==============================================");
    console.log("KEX Minimal Deployment (Bonding Only)");
    console.log("==============================================\n");

    const network = hre.network.name;
    const config = NETWORK_CONFIG[network] || { gasPrice: undefined, verificationDelay: 30000 };

    console.log(`📡 Network: ${network}\n`);

    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log(`👤 Deployer: ${deployerAddress}\n`);

    const deployedPath = path.resolve(__dirname, './deployed.json');
    let deployed: any = {};

    if (fs.existsSync(deployedPath)) {
        deployed = JSON.parse(fs.readFileSync(deployedPath).toString());
    }

    deployed.ownerAddress = deployerAddress;
    const deployOptions = config.gasPrice !== undefined ? { gasPrice: config.gasPrice } : {};

    // Deploy TestERC20
    if (!deployed.assetToken) {
        console.log("📝 Deploying Asset Token (USDT)...");
        const TestERC20 = await ethers.getContractFactory("TestERC20");
        const assetToken = await TestERC20.deploy(
            DEPLOYMENT_PARAMS.assetTokenName,
            DEPLOYMENT_PARAMS.assetTokenSymbol,
            deployOptions
        );
        await assetToken.waitForDeployment();
        deployed.assetToken = await assetToken.getAddress();
        console.log(`✅ Asset Token: ${deployed.assetToken}\n`);
        saveDeployment(deployed);
        await verify(deployed.assetToken, [DEPLOYMENT_PARAMS.assetTokenName, DEPLOYMENT_PARAMS.assetTokenSymbol], config.verificationDelay);
    } else {
        console.log(`✓ Asset Token: ${deployed.assetToken}\n`);
    }

    // Deploy FFactory
    if (!deployed.FFactory) {
        console.log("📝 Deploying FFactory...");
        const FFactory = await ethers.getContractFactory("FFactory");
        const fFactory = await FFactory.deploy(deployOptions);
        await fFactory.waitForDeployment();
        deployed.FFactory = await fFactory.getAddress();
        console.log(`✅ FFactory: ${deployed.FFactory}\n`);
        saveDeployment(deployed);
        await verify(deployed.FFactory, [], config.verificationDelay);
    } else {
        console.log(`✓ FFactory: ${deployed.FFactory}\n`);
    }

    // Deploy FRouter
    if (!deployed.FRouter) {
        console.log("📝 Deploying FRouter...");
        const FRouter = await ethers.getContractFactory("FRouter");
        const fRouter = await FRouter.deploy(deployOptions);
        await fRouter.waitForDeployment();
        deployed.FRouter = await fRouter.getAddress();
        console.log(`✅ FRouter: ${deployed.FRouter}\n`);
        saveDeployment(deployed);
        await verify(deployed.FRouter, [], config.verificationDelay);
    } else {
        console.log(`✓ FRouter: ${deployed.FRouter}\n`);
    }

    // Deploy Bonding
    if (!deployed.Bonding) {
        console.log("📝 Deploying Bonding...");
        const Bonding = await ethers.getContractFactory("Bonding");
        const bonding = await Bonding.deploy(deployOptions);
        await bonding.waitForDeployment();
        deployed.Bonding = await bonding.getAddress();
        console.log(`✅ Bonding: ${deployed.Bonding}\n`);
        saveDeployment(deployed);
        await verify(deployed.Bonding, [], config.verificationDelay);
    } else {
        console.log(`✓ Bonding: ${deployed.Bonding}\n`);
    }

    console.log("==============================================");
    console.log("INITIALIZATION");
    console.log("==============================================\n");

    // Initialize FFactory
    console.log("📝 Initializing FFactory...");
    const fFactory = await ethers.getContractAt("FFactory", deployed.FFactory);
    const taxVault = await fFactory.taxVault();

    if (taxVault === ethers.ZeroAddress) {
        await fFactory.initialize(deployerAddress, DEPLOYMENT_PARAMS.buyTax, DEPLOYMENT_PARAMS.sellTax, deployOptions);
        console.log("   ✅ Initialized");
    } else {
        console.log("   ✓ Already initialized");
    }

    const router = await fFactory.router();
    if (router === ethers.ZeroAddress) {
        await fFactory.setRouter(deployed.FRouter, deployOptions);
        console.log("   ✅ Router set\n");
    } else {
        console.log("   ✓ Router already set\n");
    }

    // Initialize FRouter
    console.log("📝 Initializing FRouter...");
    const fRouter = await ethers.getContractAt("FRouter", deployed.FRouter);
    const routerFactory = await fRouter.factory();

    if (routerFactory === ethers.ZeroAddress) {
        await fRouter.initialize(deployed.FFactory, deployed.assetToken, deployOptions);
        console.log("   ✅ Initialized\n");
    } else {
        console.log("   ✓ Already initialized\n");
    }

    // Initialize Bonding (with minimal agentFactory - use zero address or placeholder)
    console.log("📝 Initializing Bonding...");
    const bonding = await ethers.getContractAt("Bonding", deployed.Bonding);
    const bondingFactory = await bonding.factory();

    if (bondingFactory === ethers.ZeroAddress) {
        await bonding.initialize(
            deployed.FFactory,
            deployed.FRouter,
            deployerAddress,
            DEPLOYMENT_PARAMS.fee,
            DEPLOYMENT_PARAMS.initialSupply,
            DEPLOYMENT_PARAMS.assetRate,
            DEPLOYMENT_PARAMS.maxTx,
            deployerAddress, // Use deployer as placeholder for agentFactory
            DEPLOYMENT_PARAMS.gradThreshold,
            deployOptions
        );
        console.log("   ✅ Initialized");
        console.log("   ⚠️  Note: agentFactory set to deployer (no graduation functionality)\n");
    } else {
        console.log("   ✓ Already initialized\n");
    }

    // Grant roles
    console.log("==============================================");
    console.log("ROLES");
    console.log("==============================================\n");

    const CREATOR_ROLE = await fFactory.CREATOR_ROLE();
    const ADMIN_ROLE = await fFactory.ADMIN_ROLE();
    const EXECUTOR_ROLE = await fRouter.EXECUTOR_ROLE();

    if (!(await fFactory.hasRole(CREATOR_ROLE, deployed.Bonding))) {
        await fFactory.grantRole(CREATOR_ROLE, deployed.Bonding, deployOptions);
        console.log("✅ CREATOR_ROLE granted to Bonding");
    }

    if (!(await fFactory.hasRole(ADMIN_ROLE, deployed.Bonding))) {
        await fFactory.grantRole(ADMIN_ROLE, deployed.Bonding, deployOptions);
        console.log("✅ ADMIN_ROLE granted to Bonding");
    }

    if (!(await fRouter.hasRole(EXECUTOR_ROLE, deployed.Bonding))) {
        await fRouter.grantRole(EXECUTOR_ROLE, deployed.Bonding, deployOptions);
        console.log("✅ EXECUTOR_ROLE granted to Bonding");
    }

    console.log("\n✅ Deployment Complete!\n");
    console.log("📋 Summary:");
    console.log(`  Asset Token: ${deployed.assetToken}`);
    console.log(`  FFactory:    ${deployed.FFactory}`);
    console.log(`  FRouter:     ${deployed.FRouter}`);
    console.log(`  Bonding:     ${deployed.Bonding}\n`);
}

function saveDeployment(deployed: any) {
    fs.writeFileSync(path.resolve(__dirname, './deployed.json'), JSON.stringify(deployed, null, 4));
}

async function verify(address: string, constructorArguments: any[], delay: number) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    try {
        await hre.run("verify:verify", { address, constructorArguments });
    } catch (error: any) {
        if (!error.message.includes("Already Verified")) {
            console.log(`   ⚠️  Verification failed: ${error.message}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
