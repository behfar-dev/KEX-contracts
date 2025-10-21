/**
 * Complete KEX System Deployment Script
 *
 * This script deploys and configures the entire KEX bonding curve system
 * including the Agent/Virtual Persona subsystem.
 *
 * Usage:
 *   npx hardhat run scripts/kex/deployComplete.ts --network <network_name>
 *
 * Networks: saga, base_sepolia, base, sepolia
 *
 * Environment variables required:
 *   PRIVATE_KEY - Deployer private key
 *   ETHERSCAN_API_KEY - For contract verification (optional)
 */

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

const hre = require("hardhat");

// Configuration per network
const NETWORK_CONFIG: any = {
    saga: {
        uniswapV3Factory: "0x454050C4c9190390981Ac4b8d5AFcd7aC65eEffa",
        uniswapV3PositionManager: "0xdD489C75be1039ec7d843A6aC2Fd658350B067Cf",
        gasPrice: 0,
        verificationDelay: 30000
    },
    base_sepolia: {
        uniswapV3Factory: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
        uniswapV3PositionManager: "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2",
        gasPrice: undefined,
        verificationDelay: 30000
    },
    base: {
        uniswapV3Factory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
        uniswapV3PositionManager: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
        gasPrice: undefined,
        verificationDelay: 30000
    },
    sepolia: {
        uniswapV3Factory: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
        uniswapV3PositionManager: "0x1238536071E1c677A632429e3655c799b22cDA52",
        gasPrice: undefined,
        verificationDelay: 30000
    }
};

// Deployment parameters
const DEPLOYMENT_PARAMS = {
    // Asset token (USDT) parameters
    assetTokenName: "USDT-Kex Test",
    assetTokenSymbol: "KEX_USDT",

    // FFactory parameters
    buyTax: 0,
    sellTax: 0,

    // Bonding parameters
    fee: "100000000000000000000", // 100 USDT
    initialSupply: "1000000000", // 1 billion tokens
    assetRate: "5000", // 0.5% (5000/10000)
    maxTx: 100,
    gradThreshold: "125000000000000000000000000", // 125M tokens

    // AgentFactory parameters
    applicationThreshold: 0,
    maturityDuration: 0,
    nextId: 0
};

interface DeployedAddresses {
    ownerAddress?: string;
    assetToken?: string;
    FFactory?: string;
    FRouter?: string;
    agentToken?: string;
    erc6551?: string;
    agentNft?: string;
    agentFactory?: string;
    Bonding?: string;
    multicall?: string;
    uniswapFactory?: string;
    uniswapNFTPositionManager?: string;
}

async function main() {
    console.log("\n==============================================");
    console.log("KEX System Complete Deployment Script");
    console.log("==============================================\n");

    const network = hre.network.name;
    const config = NETWORK_CONFIG[network];

    if (!config) {
        console.error(`⚠️  Network ${network} not configured. Please add configuration.`);
        console.log("Available networks:", Object.keys(NETWORK_CONFIG).join(", "));
        process.exit(1);
    }

    console.log(`📡 Network: ${network}`);
    console.log(`⛽ Gas Price: ${config.gasPrice ?? "market"}\n`);

    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log(`👤 Deployer: ${deployerAddress}\n`);

    // Load or create deployed.json
    const deployedPath = path.resolve(__dirname, './deployed.json');
    let deployed: DeployedAddresses = {};

    if (fs.existsSync(deployedPath)) {
        deployed = JSON.parse(fs.readFileSync(deployedPath).toString());
        console.log("📄 Loaded existing deployed.json\n");
    } else {
        console.log("📄 Creating new deployed.json\n");
    }

    deployed.ownerAddress = deployerAddress;
    deployed.uniswapFactory = config.uniswapV3Factory;
    deployed.uniswapNFTPositionManager = config.uniswapV3PositionManager;

    const deployOptions = config.gasPrice !== undefined ? { gasPrice: config.gasPrice } : {};

    // ==============================================
    // STEP 1: Deploy Asset Token (USDT)
    // ==============================================
    if (!deployed.assetToken) {
        console.log("📝 Step 1: Deploying Asset Token (USDT)...");
        const TestERC20 = await ethers.getContractFactory("TestERC20");
        const assetToken = await TestERC20.deploy(
            DEPLOYMENT_PARAMS.assetTokenName,
            DEPLOYMENT_PARAMS.assetTokenSymbol,
            deployOptions
        );
        await assetToken.waitForDeployment();
        deployed.assetToken = await assetToken.getAddress();
        console.log(`✅ Asset Token deployed: ${deployed.assetToken}\n`);
        saveDeployment(deployed);
        await verify(deployed.assetToken, [DEPLOYMENT_PARAMS.assetTokenName, DEPLOYMENT_PARAMS.assetTokenSymbol], config.verificationDelay);
    } else {
        console.log(`✓ Asset Token already deployed: ${deployed.assetToken}\n`);
    }

    // ==============================================
    // STEP 2: Deploy FFactory
    // ==============================================
    if (!deployed.FFactory) {
        console.log("📝 Step 2: Deploying FFactory...");
        const FFactory = await ethers.getContractFactory("FFactory");
        const fFactory = await FFactory.deploy(deployOptions);
        await fFactory.waitForDeployment();
        deployed.FFactory = await fFactory.getAddress();
        console.log(`✅ FFactory deployed: ${deployed.FFactory}\n`);
        saveDeployment(deployed);
        await verify(deployed.FFactory, [], config.verificationDelay);
    } else {
        console.log(`✓ FFactory already deployed: ${deployed.FFactory}\n`);
    }

    // ==============================================
    // STEP 3: Deploy FRouter
    // ==============================================
    if (!deployed.FRouter) {
        console.log("📝 Step 3: Deploying FRouter...");
        const FRouter = await ethers.getContractFactory("FRouter");
        const fRouter = await FRouter.deploy(deployOptions);
        await fRouter.waitForDeployment();
        deployed.FRouter = await fRouter.getAddress();
        console.log(`✅ FRouter deployed: ${deployed.FRouter}\n`);
        saveDeployment(deployed);
        await verify(deployed.FRouter, [], config.verificationDelay);
    } else {
        console.log(`✓ FRouter already deployed: ${deployed.FRouter}\n`);
    }

    // ==============================================
    // STEP 4: Deploy AgentToken Implementation
    // ==============================================
    if (!deployed.agentToken) {
        console.log("📝 Step 4: Deploying AgentToken Implementation...");
        const AgentToken = await ethers.getContractFactory("AgentToken");
        const agentToken = await AgentToken.deploy(deployOptions);
        await agentToken.waitForDeployment();
        deployed.agentToken = await agentToken.getAddress();
        console.log(`✅ AgentToken deployed: ${deployed.agentToken}\n`);
        saveDeployment(deployed);
        await verify(deployed.agentToken, [], config.verificationDelay);
    } else {
        console.log(`✓ AgentToken already deployed: ${deployed.agentToken}\n`);
    }

    // ==============================================
    // STEP 5: Deploy ERC6551 Registry
    // ==============================================
    if (!deployed.erc6551) {
        console.log("📝 Step 5: Deploying ERC6551 Registry...");
        const ERC6551Registry = await ethers.getContractFactory("ERC6551Registry");
        const erc6551 = await ERC6551Registry.deploy(deployOptions);
        await erc6551.waitForDeployment();
        deployed.erc6551 = await erc6551.getAddress();
        console.log(`✅ ERC6551 Registry deployed: ${deployed.erc6551}\n`);
        saveDeployment(deployed);
        await verify(deployed.erc6551, [], config.verificationDelay);
    } else {
        console.log(`✓ ERC6551 already deployed: ${deployed.erc6551}\n`);
    }

    // ==============================================
    // STEP 6: Deploy AgentNftV2
    // ==============================================
    if (!deployed.agentNft) {
        console.log("📝 Step 6: Deploying AgentNftV2...");
        const AgentNftV2 = await ethers.getContractFactory("AgentNftV2");
        const agentNft = await AgentNftV2.deploy(deployOptions);
        await agentNft.waitForDeployment();
        deployed.agentNft = await agentNft.getAddress();
        console.log(`✅ AgentNftV2 deployed: ${deployed.agentNft}`);

        // Initialize AgentNftV2
        console.log("   Initializing AgentNftV2...");
        const agentNftContract = await ethers.getContractAt("AgentNftV2", deployed.agentNft);
        const owner = await agentNftContract.owner().catch(() => null);

        if (!owner || owner === ethers.ZeroAddress) {
            const tx = await agentNftContract.initialize(deployerAddress, deployOptions);
            await tx.wait();
            console.log("   ✅ AgentNftV2 initialized\n");
        } else {
            console.log("   ✓ AgentNftV2 already initialized\n");
        }

        saveDeployment(deployed);
        await verify(deployed.agentNft, [], config.verificationDelay);
    } else {
        console.log(`✓ AgentNftV2 already deployed: ${deployed.agentNft}\n`);
    }

    // ==============================================
    // STEP 7: Deploy AgentFactory
    // ==============================================
    if (!deployed.agentFactory) {
        console.log("📝 Step 7: Deploying AgentFactoryV3V3...");
        const AgentFactory = await ethers.getContractFactory("AgentFactoryV3V3");
        const agentFactory = await AgentFactory.deploy(deployOptions);
        await agentFactory.waitForDeployment();
        deployed.agentFactory = await agentFactory.getAddress();
        console.log(`✅ AgentFactoryV3V3 deployed: ${deployed.agentFactory}\n`);
        saveDeployment(deployed);
        await verify(deployed.agentFactory, [], config.verificationDelay);
    } else {
        console.log(`✓ AgentFactory already deployed: ${deployed.agentFactory}\n`);
    }

    // ==============================================
    // STEP 8: Deploy Bonding Contract
    // ==============================================
    if (!deployed.Bonding) {
        console.log("📝 Step 8: Deploying Bonding...");
        const Bonding = await ethers.getContractFactory("Bonding");
        const bonding = await Bonding.deploy(deployOptions);
        await bonding.waitForDeployment();
        deployed.Bonding = await bonding.getAddress();
        console.log(`✅ Bonding deployed: ${deployed.Bonding}\n`);
        saveDeployment(deployed);
        await verify(deployed.Bonding, [], config.verificationDelay);
    } else {
        console.log(`✓ Bonding already deployed: ${deployed.Bonding}\n`);
    }

    // ==============================================
    // STEP 9: Deploy Multicall (Optional)
    // ==============================================
    if (!deployed.multicall) {
        console.log("📝 Step 9: Deploying Multicall...");
        const Multicall = await ethers.getContractFactory("Multicall");
        const multicall = await Multicall.deploy(deployOptions);
        await multicall.waitForDeployment();
        deployed.multicall = await multicall.getAddress();
        console.log(`✅ Multicall deployed: ${deployed.multicall}\n`);
        saveDeployment(deployed);
        await verify(deployed.multicall, [], config.verificationDelay);
    } else {
        console.log(`✓ Multicall already deployed: ${deployed.multicall}\n`);
    }

    console.log("\n==============================================");
    console.log("INITIALIZATION & CONFIGURATION");
    console.log("==============================================\n");

    // ==============================================
    // Initialize FFactory
    // ==============================================
    console.log("📝 Initializing FFactory...");
    const fFactory = await ethers.getContractAt("FFactory", deployed.FFactory!);
    const taxVault = await fFactory.taxVault();

    if (taxVault === ethers.ZeroAddress) {
        console.log("   Calling initialize()...");
        const tx1 = await fFactory.initialize(
            deployerAddress,
            DEPLOYMENT_PARAMS.buyTax,
            DEPLOYMENT_PARAMS.sellTax,
            deployOptions
        );
        await tx1.wait();
        console.log("   ✅ FFactory initialized");
    } else {
        console.log("   ✓ FFactory already initialized");
    }

    const router = await fFactory.router();
    if (router === ethers.ZeroAddress) {
        console.log("   Setting router...");
        const tx2 = await fFactory.setRouter(deployed.FRouter!, deployOptions);
        await tx2.wait();
        console.log("   ✅ Router set\n");
    } else {
        console.log("   ✓ Router already set\n");
    }

    // ==============================================
    // Initialize FRouter
    // ==============================================
    console.log("📝 Initializing FRouter...");
    const fRouter = await ethers.getContractAt("FRouter", deployed.FRouter!);
    const routerFactory = await fRouter.factory();

    if (routerFactory === ethers.ZeroAddress) {
        console.log("   Calling initialize()...");
        const tx = await fRouter.initialize(deployed.FFactory!, deployed.assetToken!, deployOptions);
        await tx.wait();
        console.log("   ✅ FRouter initialized\n");
    } else {
        console.log("   ✓ FRouter already initialized\n");
    }

    // ==============================================
    // Initialize AgentFactory
    // ==============================================
    console.log("📝 Initializing AgentFactoryV3V3...");
    const agentFactory = await ethers.getContractAt("AgentFactoryV3V3", deployed.agentFactory!);
    const agentAssetToken = await agentFactory.assetToken();

    if (agentAssetToken === ethers.ZeroAddress) {
        console.log("   Calling initialize()...");
        const tx = await agentFactory.initialize(
            deployed.agentToken!,        // tokenImplementation
            ethers.ZeroAddress,          // veTokenImplementation (not used)
            ethers.ZeroAddress,          // daoImplementation (not used)
            deployed.erc6551!,           // tbaRegistry
            deployed.assetToken!,        // assetToken
            deployed.agentNft!,          // nft
            DEPLOYMENT_PARAMS.applicationThreshold,
            deployerAddress,             // vault
            DEPLOYMENT_PARAMS.nextId,
            deployOptions
        );
        await tx.wait();
        console.log("   ✅ AgentFactory initialized");
    } else {
        console.log("   ✓ AgentFactory already initialized");
    }

    // Configure AgentFactory
    console.log("   Configuring AgentFactory...");

    const currentUniFactory = await agentFactory._uniswapFactory();
    if (currentUniFactory === ethers.ZeroAddress || currentUniFactory !== config.uniswapV3Factory) {
        const tx1 = await agentFactory.setUniswapFactory(config.uniswapV3Factory, deployOptions);
        await tx1.wait();
        console.log("   ✅ Uniswap V3 Factory set");
    }

    const currentPosManager = await agentFactory._nftPositionManager();
    if (currentPosManager === ethers.ZeroAddress || currentPosManager !== config.uniswapV3PositionManager) {
        const tx2 = await agentFactory.setUniswapNFTPositionManager(config.uniswapV3PositionManager, deployOptions);
        await tx2.wait();
        console.log("   ✅ Uniswap V3 Position Manager set");
    }

    const currentTokenAdmin = await agentFactory.tokenAdmin();
    if (currentTokenAdmin === ethers.ZeroAddress) {
        const tx3 = await agentFactory.setTokenAdmin(deployerAddress, deployOptions);
        await tx3.wait();
        console.log("   ✅ Token admin set");
    }

    // Set token tax params (0 for all taxes)
    const tx4 = await agentFactory.setTokenTaxParams(0, 0, 0, deployerAddress, deployOptions);
    await tx4.wait();
    console.log("   ✅ Token tax params set\n");

    // ==============================================
    // Initialize Bonding
    // ==============================================
    console.log("📝 Initializing Bonding...");
    const bonding = await ethers.getContractAt("Bonding", deployed.Bonding!);
    const bondingFactory = await bonding.factory();

    if (bondingFactory === ethers.ZeroAddress) {
        console.log("   Calling initialize()...");
        const tx = await bonding.initialize(
            deployed.FFactory!,
            deployed.FRouter!,
            deployerAddress,                    // feeTo
            DEPLOYMENT_PARAMS.fee,
            DEPLOYMENT_PARAMS.initialSupply,
            DEPLOYMENT_PARAMS.assetRate,
            DEPLOYMENT_PARAMS.maxTx,
            deployed.agentFactory!,
            DEPLOYMENT_PARAMS.gradThreshold,
            deployOptions
        );
        await tx.wait();
        console.log("   ✅ Bonding initialized\n");
    } else {
        console.log("   ✓ Bonding already initialized\n");
    }

    // ==============================================
    // Grant Roles
    // ==============================================
    console.log("\n==============================================");
    console.log("ROLE CONFIGURATION");
    console.log("==============================================\n");

    // FFactory roles
    console.log("📝 Configuring FFactory roles...");
    const CREATOR_ROLE = await fFactory.CREATOR_ROLE();
    const ADMIN_ROLE = await fFactory.ADMIN_ROLE();

    const hasCreatorRole = await fFactory.hasRole(CREATOR_ROLE, deployed.Bonding!);
    if (!hasCreatorRole) {
        const tx1 = await fFactory.grantRole(CREATOR_ROLE, deployed.Bonding!, deployOptions);
        await tx1.wait();
        console.log("   ✅ CREATOR_ROLE granted to Bonding");
    } else {
        console.log("   ✓ CREATOR_ROLE already granted");
    }

    const hasAdminRole = await fFactory.hasRole(ADMIN_ROLE, deployed.Bonding!);
    if (!hasAdminRole) {
        const tx2 = await fFactory.grantRole(ADMIN_ROLE, deployed.Bonding!, deployOptions);
        await tx2.wait();
        console.log("   ✅ ADMIN_ROLE granted to Bonding\n");
    } else {
        console.log("   ✓ ADMIN_ROLE already granted\n");
    }

    // FRouter roles
    console.log("📝 Configuring FRouter roles...");
    const EXECUTOR_ROLE = await fRouter.EXECUTOR_ROLE();

    const hasExecutorRole = await fRouter.hasRole(EXECUTOR_ROLE, deployed.Bonding!);
    if (!hasExecutorRole) {
        const tx = await fRouter.grantRole(EXECUTOR_ROLE, deployed.Bonding!, deployOptions);
        await tx.wait();
        console.log("   ✅ EXECUTOR_ROLE granted to Bonding\n");
    } else {
        console.log("   ✓ EXECUTOR_ROLE already granted\n");
    }

    // AgentFactory roles
    console.log("📝 Configuring AgentFactory roles...");
    const BONDING_ROLE = await agentFactory.BONDING_ROLE();

    const hasBondingRole = await agentFactory.hasRole(BONDING_ROLE, deployed.Bonding!);
    if (!hasBondingRole) {
        const tx = await agentFactory.grantRole(BONDING_ROLE, deployed.Bonding!, deployOptions);
        await tx.wait();
        console.log("   ✅ BONDING_ROLE granted to Bonding\n");
    } else {
        console.log("   ✓ BONDING_ROLE already granted\n");
    }

    // AgentNft roles
    console.log("📝 Configuring AgentNft roles...");
    const agentNftContract = await ethers.getContractAt("AgentNftV2", deployed.agentNft!);
    const MINTER_ROLE = await agentNftContract.MINTER_ROLE();

    const hasMinterRole = await agentNftContract.hasRole(MINTER_ROLE, deployed.agentFactory!);
    if (!hasMinterRole) {
        const tx = await agentNftContract.grantRole(MINTER_ROLE, deployed.agentFactory!, deployOptions);
        await tx.wait();
        console.log("   ✅ MINTER_ROLE granted to AgentFactory\n");
    } else {
        console.log("   ✓ MINTER_ROLE already granted\n");
    }

    // ==============================================
    // Deployment Summary
    // ==============================================
    console.log("\n==============================================");
    console.log("DEPLOYMENT COMPLETE!");
    console.log("==============================================\n");

    console.log("📋 Deployment Summary:\n");
    console.log(`Network:                      ${network}`);
    console.log(`Deployer:                     ${deployerAddress}\n`);
    console.log("Contract Addresses:");
    console.log(`  Asset Token (USDT):         ${deployed.assetToken}`);
    console.log(`  FFactory:                   ${deployed.FFactory}`);
    console.log(`  FRouter:                    ${deployed.FRouter}`);
    console.log(`  AgentToken:                 ${deployed.agentToken}`);
    console.log(`  ERC6551 Registry:           ${deployed.erc6551}`);
    console.log(`  AgentNftV2:                 ${deployed.agentNft}`);
    console.log(`  AgentFactoryV3V3:           ${deployed.agentFactory}`);
    console.log(`  Bonding:                    ${deployed.Bonding}`);
    console.log(`  Multicall:                  ${deployed.multicall}\n`);

    console.log("External Dependencies:");
    console.log(`  Uniswap V3 Factory:         ${config.uniswapV3Factory}`);
    console.log(`  Uniswap V3 Position Mgr:    ${config.uniswapV3PositionManager}\n`);

    console.log("Configuration:");
    console.log(`  Launch Fee:                 ${DEPLOYMENT_PARAMS.fee} wei (100 USDT)`);
    console.log(`  Initial Supply:             ${DEPLOYMENT_PARAMS.initialSupply} tokens`);
    console.log(`  Asset Rate:                 ${DEPLOYMENT_PARAMS.assetRate} (0.5%)`);
    console.log(`  Graduation Threshold:       ${DEPLOYMENT_PARAMS.gradThreshold} tokens (125M)\n`);

    console.log("✅ All contracts deployed and configured!");
    console.log("✅ All roles granted!");
    console.log("\n📄 Deployment info saved to: scripts/kex/deployed.json\n");

    console.log("==============================================");
    console.log("NEXT STEPS");
    console.log("==============================================\n");
    console.log("1. Verify all contracts on block explorer (if not auto-verified)");
    console.log("2. Test token launch:");
    console.log("   npx hardhat run scripts/kex/mintUSDT.ts --network " + network);
    console.log("   npx hardhat run scripts/kex/approveUSDT.ts --network " + network);
    console.log("   npx hardhat run scripts/kex/launch.ts --network " + network);
    console.log("3. Review DEPLOYMENT_GUIDE.md for full documentation\n");
}

function saveDeployment(deployed: DeployedAddresses) {
    const deployedPath = path.resolve(__dirname, './deployed.json');
    fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 4));
}

async function verify(address: string, constructorArguments: any[], delay: number) {
    console.log(`   Waiting ${delay/1000}s before verification...`);
    await new Promise((resolve) => setTimeout(resolve, delay));

    console.log(`   Verifying ${address}...`);
    try {
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: constructorArguments,
        });
        console.log(`   ✅ Verified`);
    } catch (error: any) {
        if (error.message.includes("Already Verified")) {
            console.log(`   ✓ Already verified`);
        } else {
            console.log(`   ⚠️  Verification failed: ${error.message}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
