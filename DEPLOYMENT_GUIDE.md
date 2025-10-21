# KEX Contracts - BASE Mainnet Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [BASE Mainnet Configuration](#base-mainnet-configuration)
4. [Quick Start Deployment](#quick-start-deployment)
5. [Detailed Deployment Steps](#detailed-deployment-steps)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Verification](#verification)
8. [Production Checklist](#production-checklist)
9. [Monitoring & Operations](#monitoring--operations)
10. [Troubleshooting](#troubleshooting)
11. [Appendix](#appendix)

---

## Overview

This guide provides step-by-step instructions for deploying the KEX bonding curve system to **BASE mainnet**. The KEX system is a bonding curve-based token launch platform with integrated virtual agent/persona functionality, allowing tokens to graduate to Uniswap V3 when they reach certain thresholds.

### System Components

**Bonding Curve System:**
- **FFactory**: Factory for creating token/USDC trading pairs
- **FRouter**: Router for swaps and liquidity operations
- **Bonding**: Main bonding curve contract for launching and trading tokens

**Agent/Virtual Persona System:**
- **AgentFactoryV3V3**: Factory for creating graduated agent tokens with Uniswap V3 integration
- **AgentNftV2**: NFT contract representing virtual agents
- **AgentToken**: ERC20 implementation for agent tokens (cloned for each agent)
- **ERC6551Registry**: Token-bound account registry

**Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

---

## Prerequisites

### 1. Environment Setup

**Required Software:**
```bash
node --version    # v16+ required
npm --version     # or yarn
```

**Install Dependencies:**
```bash
yarn install
# or
npm install
```

### 2. Environment Variables

Create `.env` file in project root:

```env
# REQUIRED: Deployer wallet private key
PRIVATE_KEY=0x...your_private_key_here

# REQUIRED: BaseScan API key for contract verification
ETHERSCAN_API_KEY=your_basescan_api_key

# OPTIONAL: For Fireblocks integration (enterprise deployments)
FIREBLOCKS_API_PRIVATE_KEY_PATH=/path/to/fireblocks_secret.key
FIREBLOCKS_API_KEY=your_fireblocks_api_key
FIREBLOCKS_VAULT_ACCOUNT_IDS=0
```

**Get BaseScan API Key:**
1. Go to https://basescan.org/
2. Sign up for an account
3. Navigate to API-KEYs section
4. Create a new API key
5. Copy the key to your `.env` file

### 3. Wallet Preparation

**Minimum ETH Required:**
- **Deployment**: ~0.05 ETH (estimate for gas fees)
- **Testing**: Additional 0.01 ETH
- **Safety Buffer**: Keep 0.1 ETH total recommended

**Get ETH on Base:**
- Bridge from Ethereum mainnet via [Base Bridge](https://bridge.base.org/)
- Use exchanges that support Base network withdrawals (Coinbase, etc.)
- Use on-ramps like [Transak](https://global.transak.com/)

### 4. Base Currency (Asset Token)

For mainnet, you'll use **USDC** as the base trading pair currency.

**USDC on Base Mainnet:**
- Address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Symbol: USDC
- Decimals: 6

**Important:** Unlike testnet deployments, you do NOT deploy a test USDC token on mainnet.

---

## BASE Mainnet Configuration

### Network Details

| Parameter | Value |
|-----------|-------|
| Network Name | Base Mainnet |
| Chain ID | 8453 |
| RPC URL | `https://mainnet.base.org` |
| Block Explorer | https://basescan.org |
| Native Currency | ETH |
| Bridge | https://bridge.base.org |

### Uniswap V3 Contracts (BASE Mainnet)

These are pre-deployed Uniswap V3 contracts you'll integrate with:

| Contract | Address |
|----------|---------|
| UniswapV3Factory | `0x33128a8fC17869897dcE68Ed026d694621f6FDfD` |
| NonfungiblePositionManager | `0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1` |
| SwapRouter | `0x2626664c2603336E57B271c5C0b26F421741e481` |
| QuoterV2 | `0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a` |

### RPC Endpoints

**Primary (Official):**
```
https://mainnet.base.org
```

**Alternatives (for redundancy):**
```
https://base.llamarpc.com
https://base.blockpi.network/v1/rpc/public
https://1rpc.io/base
```

**Rate Limits:**
- Official RPC: ~100 requests/second
- Consider using Alchemy, Infura, or QuickNode for production

### Gas Configuration

**Typical Gas Prices on Base:**
- Low: 0.001-0.01 Gwei
- Average: 0.05-0.1 Gwei
- Fast: 0.1-1 Gwei

**Note:** Base has significantly lower gas costs than Ethereum mainnet.

---

## Quick Start Deployment

### Option 1: Automated Complete Deployment (Recommended)

Deploy the entire system with one command:

```bash
npx hardhat run scripts/kex/deployComplete.ts --network base
```

This script will:
1. ✅ Deploy all 8 contracts
2. ✅ Initialize all contracts with production parameters
3. ✅ Configure all roles and permissions
4. ✅ Set up Uniswap V3 integration
5. ✅ Verify all contracts on BaseScan
6. ✅ Save deployment addresses to `scripts/kex/deployed.json`

**Expected Duration:** 15-20 minutes (including verification delays)

### Option 2: Manual Step-by-Step Deployment

For more control, follow the [Detailed Deployment Steps](#detailed-deployment-steps) section below.

---

## Detailed Deployment Steps

### Configuration Parameters

Before deploying, review these parameters in `scripts/kex/deployComplete.ts`:

```typescript
const DEPLOYMENT_PARAMS = {
    // Asset token configuration
    // NOTE: On mainnet, use existing USDC instead of deploying
    assetToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base

    // FFactory parameters
    buyTax: 0,      // No buy tax
    sellTax: 0,     // No sell tax

    // Bonding parameters
    fee: "100000000", // 100 USDC (6 decimals)
    initialSupply: "1000000000", // 1 billion tokens
    assetRate: "5000", // 0.5% (5000/10000)
    maxTx: 100,
    gradThreshold: "125000000000000000000000000", // 125M tokens

    // AgentFactory parameters
    applicationThreshold: 0,
    maturityDuration: 0,
    nextId: 0
};
```

**⚠️ IMPORTANT MODIFICATIONS FOR MAINNET:**

Update `scripts/kex/deployComplete.ts` to skip USDC deployment:

```typescript
// STEP 1: Use existing USDC instead of deploying
if (!deployed.assetToken) {
    console.log("📝 Using existing USDC on Base mainnet...");
    deployed.assetToken = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    console.log(`✅ Asset Token (USDC): ${deployed.assetToken}\n`);
    saveDeployment(deployed);
    // Skip verification for existing contract
} else {
    console.log(`✓ Asset Token already set: ${deployed.assetToken}\n`);
}
```

### Step-by-Step Manual Deployment

If you prefer manual control over each step:

#### Step 1: Set Asset Token (USDC)

Update `scripts/kex/deployed.json` manually:

```json
{
    "assetToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "ownerAddress": "YOUR_DEPLOYER_ADDRESS"
}
```

#### Step 2: Deploy FFactory

```bash
npx hardhat run scripts/kex/deployFactory.ts --network base
```

**Expected Output:**
```
FFactory deployed to: 0x...
FFactory verifying...
✅ Verified
```

#### Step 3: Deploy FRouter

```bash
npx hardhat run scripts/kex/deployRouter.ts --network base
```

#### Step 4: Deploy AgentToken Implementation

Create `scripts/kex/deployAgentToken.ts` if it doesn't exist:

```typescript
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
const hre = require("hardhat");

(async () => {
    try {
        const deployedPath = path.resolve(__dirname, './deployed.json');
        let deployed = JSON.parse(fs.readFileSync(deployedPath).toString());

        const AgentToken = await ethers.getContractFactory("AgentToken");
        const agentToken = await AgentToken.deploy();
        await agentToken.waitForDeployment();

        deployed.agentToken = await agentToken.getAddress();
        console.log("AgentToken deployed:", deployed.agentToken);

        fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 4));

        await new Promise(resolve => setTimeout(resolve, 30000));
        await hre.run("verify:verify", {
            address: deployed.agentToken,
            constructorArguments: []
        });
    } catch (e) {
        console.log(e);
    }
})();
```

```bash
npx hardhat run scripts/kex/deployAgentToken.ts --network base
```

#### Step 5: Deploy ERC6551 Registry

Create `scripts/kex/deployERC6551.ts`:

```typescript
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
const hre = require("hardhat");

(async () => {
    try {
        const deployedPath = path.resolve(__dirname, './deployed.json');
        let deployed = JSON.parse(fs.readFileSync(deployedPath).toString());

        const ERC6551Registry = await ethers.getContractFactory("ERC6551Registry");
        const registry = await ERC6551Registry.deploy();
        await registry.waitForDeployment();

        deployed.erc6551 = await registry.getAddress();
        console.log("ERC6551Registry deployed:", deployed.erc6551);

        fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 4));

        await new Promise(resolve => setTimeout(resolve, 30000));
        await hre.run("verify:verify", {
            address: deployed.erc6551,
            constructorArguments: []
        });
    } catch (e) {
        console.log(e);
    }
})();
```

```bash
npx hardhat run scripts/kex/deployERC6551.ts --network base
```

#### Step 6: Deploy AgentNftV2

Create `scripts/kex/deployAgentNft.ts`:

```typescript
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
const hre = require("hardhat");

(async () => {
    try {
        const deployedPath = path.resolve(__dirname, './deployed.json');
        let deployed = JSON.parse(fs.readFileSync(deployedPath).toString());

        const AgentNftV2 = await ethers.getContractFactory("AgentNftV2");
        const agentNft = await AgentNftV2.deploy();
        await agentNft.waitForDeployment();

        deployed.agentNft = await agentNft.getAddress();
        console.log("AgentNftV2 deployed:", deployed.agentNft);

        // Initialize
        const agentNftContract = await ethers.getContractAt("AgentNftV2", deployed.agentNft);
        const [deployer] = await ethers.getSigners();
        await agentNftContract.initialize(await deployer.getAddress());
        console.log("AgentNftV2 initialized");

        fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 4));

        await new Promise(resolve => setTimeout(resolve, 30000));
        await hre.run("verify:verify", {
            address: deployed.agentNft,
            constructorArguments: []
        });
    } catch (e) {
        console.log(e);
    }
})();
```

```bash
npx hardhat run scripts/kex/deployAgentNft.ts --network base
```

#### Step 7: Deploy AgentFactoryV3V3

```bash
npx hardhat run scripts/kex/deployAgentFactory.ts --network base
```

**Note:** You may need to modify this script to deploy `AgentFactoryV3V3` instead of `AgentFactoryV3`.

#### Step 8: Deploy Bonding Contract

```bash
npx hardhat run scripts/kex/deployBonding.ts --network base
```

#### Step 9: Deploy Multicall (Optional)

```bash
npx hardhat run scripts/kex/deployMulticall.ts --network base
```

---

## Post-Deployment Configuration

After all contracts are deployed, initialize and configure them:

### Step 1: Initialize FFactory

```bash
npx hardhat run scripts/kex/initializeFactory.ts --network base
```

**What it does:**
- Calls `FFactory.initialize(taxVault, buyTax, sellTax)`
- Sets `FRouter` address

**Verify initialization:**
```bash
npx hardhat console --network base
```
```javascript
const factory = await ethers.getContractAt("FFactory", "FACTORY_ADDRESS");
console.log("Tax Vault:", await factory.taxVault());
console.log("Router:", await factory.router());
```

### Step 2: Initialize FRouter

```bash
npx hardhat run scripts/kex/initializeRouter.ts --network base
```

**Modify script to use USDC:**
```typescript
await testERC20.initialize(addresse.FFactory, "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
```

### Step 3: Initialize AgentFactory

**⚠️ CRITICAL:** Update `initializeAgentFactory.ts` for mainnet:

```typescript
await testERC20.initialize(
    deployed.agentToken,                              // tokenImplementation
    ethers.ZeroAddress,                               // veTokenImplementation
    ethers.ZeroAddress,                               // daoImplementation
    deployed.erc6551,                                 // tbaRegistry
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // assetToken (USDC)
    deployed.agentNft,                                // nft
    0,                                                // applicationThreshold
    YOUR_VAULT_ADDRESS,                               // vault
    0                                                 // nextId
);

// Set Uniswap V3 contracts
await agentFactory.setUniswapFactory("0x33128a8fC17869897dcE68Ed026d694621f6FDfD");
await agentFactory.setUniswapNFTPositionManager("0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1");
await agentFactory.setTokenAdmin(YOUR_ADMIN_ADDRESS);
await agentFactory.setTokenTaxParams(0, 0, 0, YOUR_TAX_VAULT_ADDRESS);
```

```bash
npx hardhat run scripts/kex/initializeAgentFactory.ts --network base
```

### Step 4: Initialize Bonding Contract

**⚠️ CRITICAL:** Update `initializeBonding.ts` for USDC (6 decimals):

```typescript
await bonding.initialize(
    deployed.FFactory,
    deployed.FRouter,
    YOUR_FEE_RECIPIENT_ADDRESS,
    "100000000",        // 100 USDC (6 decimals, not 18!)
    "1000000000",       // 1B tokens
    "5000",             // 0.5%
    100,                // maxTx
    deployed.agentFactory,
    "125000000000000000000000000", // 125M tokens
    {}
);
```

```bash
npx hardhat run scripts/kex/initializeBonding.ts --network base
```

### Step 5: Grant Roles

```bash
npx hardhat run scripts/kex/addCreatorToFactory.ts --network base
```

**Manual role granting via console:**

```bash
npx hardhat console --network base
```

```javascript
const [deployer] = await ethers.getSigners();

// Load contracts
const factory = await ethers.getContractAt("FFactory", "FACTORY_ADDRESS");
const router = await ethers.getContractAt("FRouter", "ROUTER_ADDRESS");
const agentFactory = await ethers.getContractAt("AgentFactoryV3V3", "AGENT_FACTORY_ADDRESS");
const agentNft = await ethers.getContractAt("AgentNftV2", "AGENT_NFT_ADDRESS");
const bonding = await ethers.getContractAt("Bonding", "BONDING_ADDRESS");

// Get role hashes
const CREATOR_ROLE = await factory.CREATOR_ROLE();
const ADMIN_ROLE = await factory.ADMIN_ROLE();
const EXECUTOR_ROLE = await router.EXECUTOR_ROLE();
const BONDING_ROLE = await agentFactory.BONDING_ROLE();
const MINTER_ROLE = await agentNft.MINTER_ROLE();

// Grant roles
await factory.grantRole(CREATOR_ROLE, bonding.target);
await factory.grantRole(ADMIN_ROLE, bonding.target);
await router.grantRole(EXECUTOR_ROLE, bonding.target);
await agentFactory.grantRole(BONDING_ROLE, bonding.target);
await agentNft.grantRole(MINTER_ROLE, agentFactory.target);

console.log("✅ All roles granted");
```

---

## Verification

### Verify All Contracts on BaseScan

The deployment scripts should auto-verify, but if needed:

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

**Examples:**

```bash
# FFactory (no constructor args)
npx hardhat verify --network base 0x...

# FRouter (no constructor args)
npx hardhat verify --network base 0x...

# Bonding (no constructor args)
npx hardhat verify --network base 0x...
```

### Verify Configuration

Create `scripts/kex/verifyDeployment.ts`:

```typescript
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const deployedPath = path.resolve(__dirname, './deployed.json');
    const deployed = JSON.parse(fs.readFileSync(deployedPath).toString());

    console.log("Verifying deployment configuration...\n");

    // Load contracts
    const factory = await ethers.getContractAt("FFactory", deployed.FFactory);
    const router = await ethers.getContractAt("FRouter", deployed.FRouter);
    const bonding = await ethers.getContractAt("Bonding", deployed.Bonding);
    const agentFactory = await ethers.getContractAt("AgentFactoryV3V3", deployed.agentFactory);

    // Verify FFactory
    console.log("FFactory:");
    console.log("  Router:", await factory.router());
    console.log("  Tax Vault:", await factory.taxVault());
    console.log("  Buy Tax:", await factory.buyTax());
    console.log("  Sell Tax:", await factory.sellTax());

    // Verify FRouter
    console.log("\nFRouter:");
    console.log("  Factory:", await router.factory());
    console.log("  Asset Token:", await router.assetToken());

    // Verify Bonding
    console.log("\nBonding:");
    console.log("  Factory:", await bonding.factory());
    console.log("  Router:", await bonding.router());
    console.log("  Fee:", ethers.formatUnits(await bonding.fee(), 6), "USDC");
    console.log("  Agent Factory:", await bonding.agentFactory());
    console.log("  Grad Threshold:", await bonding.gradThreshold());

    // Verify AgentFactory
    console.log("\nAgentFactory:");
    console.log("  Asset Token:", await agentFactory.assetToken());
    console.log("  Uniswap Factory:", await agentFactory._uniswapFactory());
    console.log("  Position Manager:", await agentFactory._nftPositionManager());
    console.log("  Token Admin:", await agentFactory.tokenAdmin());

    // Verify roles
    console.log("\nRoles:");
    const CREATOR_ROLE = await factory.CREATOR_ROLE();
    const EXECUTOR_ROLE = await router.EXECUTOR_ROLE();
    const BONDING_ROLE = await agentFactory.BONDING_ROLE();

    console.log("  Bonding has CREATOR_ROLE:", await factory.hasRole(CREATOR_ROLE, deployed.Bonding));
    console.log("  Bonding has EXECUTOR_ROLE:", await router.hasRole(EXECUTOR_ROLE, deployed.Bonding));
    console.log("  Bonding has BONDING_ROLE:", await agentFactory.hasRole(BONDING_ROLE, deployed.Bonding));

    console.log("\n✅ Verification complete");
}

main().catch(console.error);
```

```bash
npx hardhat run scripts/kex/verifyDeployment.ts --network base
```

---

## Production Checklist

Before launching to production:

### Security

- [ ] **Multi-sig wallet**: Use Gnosis Safe for contract ownership
- [ ] **Audit**: Get professional security audit
- [ ] **Testing**: Thoroughly test on Base Sepolia testnet first
- [ ] **Roles**: Review all role assignments
- [ ] **Parameters**: Verify all initialization parameters
- [ ] **Emergency controls**: Understand pause mechanisms

### Operations

- [ ] **Monitoring**: Set up contract event monitoring
- [ ] **Alerts**: Configure alerts for critical events
- [ ] **Backup RPC**: Have multiple RPC endpoints
- [ ] **Documentation**: Document all deployed addresses
- [ ] **Access**: Secure private keys (hardware wallet/multi-sig)
- [ ] **Team**: Train team on contract interaction

### Business

- [ ] **Fee recipient**: Configure fee collection address
- [ ] **Tax vault**: Set up tax collection address (if applicable)
- [ ] **Launch parameters**: Confirm fee amounts and thresholds
- [ ] **USDC**: Ensure sufficient USDC for testing/operations
- [ ] **Legal**: Ensure regulatory compliance

### Technical

- [ ] **Verification**: All contracts verified on BaseScan
- [ ] **Configuration**: All contracts properly initialized
- [ ] **Roles**: All necessary roles granted
- [ ] **Uniswap**: V3 integration configured correctly
- [ ] **Gas**: Optimize gas settings for production
- [ ] **Frontend**: Update frontend with contract addresses

---

## Monitoring & Operations

### Key Metrics to Monitor

```javascript
// Monitor via ethers.js
const bonding = await ethers.getContractAt("Bonding", BONDING_ADDRESS);

// Listen for token launches
bonding.on("Launched", (token, pair, id) => {
    console.log("New token launched:", token);
});

// Listen for graduations
bonding.on("Graduated", (token, agentToken) => {
    console.log("Token graduated:", token);
});

// Monitor factory
const factory = await ethers.getContractAt("FFactory", FACTORY_ADDRESS);
factory.on("PairCreated", (tokenA, tokenB, pair, index) => {
    console.log("New pair created:", pair);
});
```

### Important Events

| Contract | Event | Description |
|----------|-------|-------------|
| Bonding | `Launched` | New token created |
| Bonding | `Graduated` | Token graduated to Uniswap V3 |
| FFactory | `PairCreated` | New trading pair created |
| AgentFactory | `NewPersona` | New agent created |

### Health Checks

Create `scripts/kex/healthCheck.ts`:

```typescript
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const deployedPath = path.resolve(__dirname, './deployed.json');
    const deployed = JSON.parse(fs.readFileSync(deployedPath).toString());

    const bonding = await ethers.getContractAt("Bonding", deployed.Bonding);
    const factory = await ethers.getContractAt("FFactory", deployed.FFactory);

    console.log("System Health Check\n");
    console.log("Total tokens launched:", (await bonding.tokenInfos()).length);
    console.log("Total pairs:", await factory.allPairsLength());
    console.log("Current fee:", ethers.formatUnits(await bonding.fee(), 6), "USDC");

    // Add more checks as needed
}

main().catch(console.error);
```

### BaseScan Links

After deployment, save these links for quick access:

```
FFactory: https://basescan.org/address/YOUR_FACTORY_ADDRESS
FRouter: https://basescan.org/address/YOUR_ROUTER_ADDRESS
Bonding: https://basescan.org/address/YOUR_BONDING_ADDRESS
AgentFactory: https://basescan.org/address/YOUR_AGENT_FACTORY_ADDRESS
```

---

## Troubleshooting

### Common Issues

#### 1. "insufficient funds for gas"

**Solution:**
- Ensure deployer wallet has enough ETH
- Check current gas prices: `eth_gasPrice` RPC call
- Bridge more ETH to Base

#### 2. "replacement transaction underpriced"

**Solution:**
```javascript
// Increase gas price in deployment
const tx = await contract.deploy({
    gasPrice: ethers.parseUnits("0.1", "gwei")
});
```

#### 3. "nonce too low"

**Solution:**
```bash
# Reset nonce in hardhat
npx hardhat clean
```

#### 4. Contract verification fails

**Solution:**
- Wait longer (BaseScan can be slow)
- Verify manually with exact constructor args
- Check network is "base" not "base_sepolia"

```bash
npx hardhat verify --network base ADDRESS ARGS...
```

#### 5. "Only role X can execute"

**Solution:**
- Verify roles were granted correctly
- Check the calling account has the right permissions
- Re-run role granting scripts

#### 6. Initialization fails with "Already initialized"

**Solution:**
- Check if contract is already initialized
- Scripts should handle this, but verify state
- Don't re-initialize, just update configuration

### Getting Help

1. **Check logs**: Review deployment script output
2. **BaseScan**: Check transaction details on BaseScan
3. **Console**: Use `npx hardhat console --network base` to inspect
4. **Test first**: Always test on Base Sepolia before mainnet

---

## Appendix

### A. Deployment Summary Template

Save this after deployment:

```markdown
# KEX Deployment - Base Mainnet

**Date**: YYYY-MM-DD
**Deployer**: 0x...
**Network**: Base Mainnet (Chain ID: 8453)

## Contract Addresses

- Asset Token (USDC): `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- FFactory: `0x...`
- FRouter: `0x...`
- AgentToken: `0x...`
- ERC6551Registry: `0x...`
- AgentNftV2: `0x...`
- AgentFactoryV3V3: `0x...`
- Bonding: `0x...`
- Multicall: `0x...`

## Configuration

- Launch Fee: 100 USDC
- Graduation Threshold: 125M tokens
- Asset Rate: 0.5%
- Buy/Sell Tax: 0%

## Verification

All contracts verified on BaseScan: ✅

## Roles

- Bonding → CREATOR_ROLE on FFactory: ✅
- Bonding → EXECUTOR_ROLE on FRouter: ✅
- Bonding → BONDING_ROLE on AgentFactory: ✅
- AgentFactory → MINTER_ROLE on AgentNft: ✅

## Operations

- Fee Recipient: `0x...`
- Tax Vault: `0x...`
- Admin: `0x...`
```

### B. Base Sepolia Testnet (for testing)

Before mainnet deployment, test on Base Sepolia:

**Network Configuration:**
```javascript
base_sepolia: {
    url: "https://sepolia.base.org",
    chainId: 84532,
    accounts: [process.env.PRIVATE_KEY]
}
```

**Faucets:**
- Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Or bridge from Sepolia: https://bridge.base.org/

**Uniswap V3 (Sepolia):**
- Factory: `0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24`
- Position Manager: `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2`

**Deploy test USDC:**
```bash
npx hardhat run scripts/kex/deployFakeUSDT.ts --network base_sepolia
```

### C. Production vs Testnet Differences

| Aspect | Base Mainnet | Base Sepolia |
|--------|--------------|--------------|
| Asset Token | Use existing USDC | Deploy test token |
| Gas Costs | Real ETH | Free testnet ETH |
| Verification | Required | Optional but recommended |
| Testing | Critical testing required | Test freely |
| Security | Maximum security | Development practices OK |

### D. Useful Commands

```bash
# Check deployment status
npx hardhat run scripts/kex/verifyDeployment.ts --network base

# Interact via console
npx hardhat console --network base

# Check balance
npx hardhat run scripts/checkBalance.ts --network base

# Verify single contract
npx hardhat verify --network base ADDRESS

# Run tests
npx hardhat test

# Check network
npx hardhat run scripts/checkNetwork.ts --network base
```

### E. Gas Estimation

Estimated gas costs for deployment (at 0.1 Gwei):

| Contract | Gas Used | ETH Cost (est) |
|----------|----------|----------------|
| FFactory | ~2M | ~0.0002 ETH |
| FRouter | ~2M | ~0.0002 ETH |
| AgentToken | ~3M | ~0.0003 ETH |
| ERC6551Registry | ~500k | ~0.00005 ETH |
| AgentNftV2 | ~4M | ~0.0004 ETH |
| AgentFactoryV3V3 | ~5M | ~0.0005 ETH |
| Bonding | ~6M | ~0.0006 ETH |
| **Total** | ~22.5M | **~0.00225 ETH** |

**Note:** Actual costs may vary based on gas prices. Add 3x for initialization transactions.

### F. Contract Upgrade Path

While current contracts are not upgradeable, future versions can use:

1. **UUPS Proxy Pattern**
2. **Transparent Proxy Pattern**
3. **Diamond Pattern**

For now, deployment is immutable - plan carefully!

### G. Emergency Procedures

**If something goes wrong during deployment:**

1. **Stop immediately** - Don't continue deploying
2. **Save `deployed.json`** - Don't lose deployed addresses
3. **Document the issue** - Note what failed and where
4. **Check transactions** - Verify on BaseScan
5. **Assess impact** - What contracts are affected?
6. **Recovery options**:
   - Resume from last successful step
   - Redeploy affected contracts
   - Deploy to new addresses if needed

**If bug found post-deployment:**

1. **Assess severity** - Critical? Can wait?
2. **Pause if possible** - Use pause functions if available
3. **Communicate** - Inform users/stakeholders
4. **Plan fix** - New deployment or workaround?
5. **Test thoroughly** - Don't rush the fix
6. **Execute carefully** - Follow change management

---

## Additional Resources

- **Base Documentation**: https://docs.base.org/
- **BaseScan**: https://basescan.org/
- **Uniswap V3 Docs**: https://docs.uniswap.org/
- **Hardhat Docs**: https://hardhat.org/
- **OpenZeppelin**: https://docs.openzeppelin.com/

---

**Version**: Base Mainnet Focused (v2.0)
**Last Updated**: 2025-10-21
**Based on**: Commit `425aa7f`
