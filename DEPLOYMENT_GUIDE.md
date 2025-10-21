# KEX Contracts Deployment Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Verification](#verification)
7. [Testing Deployment](#testing-deployment)
8. [Network-Specific Configurations](#network-specific-configurations)

---

## System Overview

The KEX system is a bonding curve-based token launch platform with integrated agent/virtual persona functionality. It consists of two main subsystems:

### 1. Bonding Curve System (Fun Tokens)
A pump.fun-inspired bonding curve system that allows users to launch tokens with automatic liquidity provision and graduation to Uniswap V3 when certain thresholds are met.

### 2. Virtual Persona / Agent System
An integrated system for creating and managing AI agent tokens with governance, NFTs, and token-bound accounts (ERC-6551).

---

## Architecture

### Core Contracts

#### Bonding Curve System
- **FFactory**: Factory contract for creating token pairs
  - Manages pair creation with role-based access control
  - Configurable buy/sell taxes
  - Role: `CREATOR_ROLE` required to create pairs

- **FRouter**: Router for swapping and liquidity operations
  - Handles swaps between asset token (USDT) and launched tokens
  - Manages liquidity provision
  - Role: `EXECUTOR_ROLE` required for liquidity operations

- **Bonding**: Main bonding curve contract
  - Launches new tokens with bonding curve pricing
  - Manages token graduation to Uniswap V3
  - Tracks token metadata, trading status, and user profiles
  - Uses constant K = 3,000,000,000,000 for pricing curve

#### Agent/Virtual Persona System
- **AgentFactoryV3V3**: Factory for creating agent tokens
  - Creates agent tokens that graduate from bonding curve
  - Manages Uniswap V3 pool creation and liquidity
  - Role: `BONDING_ROLE` required for bonding contract integration

- **AgentNftV2**: NFT contract for virtual personas
  - ERC721 implementation with metadata
  - Core registry and validator system
  - Role: `MINTER_ROLE` required for minting

- **AgentToken**: Implementation contract for agent ERC20 tokens
  - Cloned for each new agent
  - Integrated with governance and taxation

- **ERC6551Registry**: Token-bound account registry
  - Creates token-bound accounts for NFTs

#### Supporting Contracts
- **TestERC20**: Asset token (USDT equivalent) for testnet
  - Used as the base trading pair currency
  - Mintable for testing purposes

- **Multicall**: Utility for batching multiple calls

---

## Prerequisites

### Environment Setup

1. **Node.js & Package Manager**
   ```bash
   node --version  # v16+ required
   yarn --version  # or npm
   ```

2. **Install Dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PRIVATE_KEY=your_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key

   # Optional: For Fireblocks integration
   FIREBLOCKS_API_PRIVATE_KEY_PATH=path_to_key
   FIREBLOCKS_API_KEY=your_fireblocks_key
   FIREBLOCKS_VAULT_ACCOUNT_IDS=vault_id
   ```

4. **Hardhat Network Configuration**
   Networks are already configured in `hardhat.config.js`:
   - `saga`: Saga EVM mainnet
   - `base`: Base mainnet
   - `base_sepolia`: Base testnet
   - `sepolia`: Ethereum testnet

---

## Deployment Steps

### Step 1: Deploy Asset Token (USDT)

For testnet deployments, deploy a test USDT token:

```bash
npx hardhat run scripts/kex/deployFakeUSDT.ts --network <network_name>
```

**What it does:**
- Deploys `TestERC20` contract with name "USDT-Kex Test" and symbol "KEX_USDT"
- Saves address to `scripts/kex/deployed.json` as `assetToken`
- Automatically verifies on block explorer

**Contract deployed:** `TestERC20`

**Output:** Address saved in `deployed.json` → `assetToken`

---

### Step 2: Deploy FFactory

Deploy the factory contract for creating trading pairs:

```bash
npx hardhat run scripts/kex/deployFactory.ts --network <network_name>
```

**What it does:**
- Deploys `FFactory` contract
- Saves address to `deployed.json` as `FFactory`
- Automatically verifies contract

**Contract deployed:** `FFactory`

**Output:** Address saved in `deployed.json` → `FFactory`

---

### Step 3: Deploy FRouter

Deploy the router for handling swaps and liquidity:

```bash
npx hardhat run scripts/kex/deployRouter.ts --network <network_name>
```

**What it does:**
- Deploys `FRouter` contract
- Saves address to `deployed.json` as `FRouter`
- Automatically verifies contract

**Contract deployed:** `FRouter`

**Output:** Address saved in `deployed.json` → `FRouter`

---

### Step 4: Deploy AgentToken Implementation

Deploy the implementation contract for agent tokens (this will be cloned):

```bash
npx hardhat run scripts/kex/deployAgentToken.ts --network <network_name>
```

**Note:** If this script doesn't exist, you can create it or deploy manually. The AgentToken is used as an implementation contract.

**Contract deployed:** `AgentToken`

**Required for:** AgentFactory initialization

---

### Step 5: Deploy ERC6551 Registry

Deploy the token-bound account registry:

```bash
# If no dedicated script exists, deploy via console
npx hardhat console --network <network_name>
```

```javascript
const ERC6551Registry = await ethers.getContractFactory("ERC6551Registry");
const registry = await ERC6551Registry.deploy();
await registry.waitForDeployment();
console.log("ERC6551Registry:", await registry.getAddress());
```

**Contract deployed:** `ERC6551Registry`

**Output:** Save address as `erc6551` in `deployed.json`

---

### Step 6: Deploy AgentNftV2

Deploy the NFT contract for agents:

```bash
# Deploy via console or create script
npx hardhat console --network <network_name>
```

```javascript
const AgentNftV2 = await ethers.getContractFactory("AgentNftV2");
const agentNft = await AgentNftV2.deploy();
await agentNft.waitForDeployment();
const agentNftAddress = await agentNft.getAddress();

// Initialize
await agentNft.initialize("YOUR_ADMIN_ADDRESS");
console.log("AgentNftV2:", agentNftAddress);
```

**Contract deployed:** `AgentNftV2`

**Output:** Save address as `agentNft` in `deployed.json`

---

### Step 7: Deploy AgentFactoryV3V3

Deploy the agent factory (or use AgentFactoryV3 for simpler deployments):

```bash
npx hardhat run scripts/kex/deployAgentFactory.ts --network <network_name>
```

**What it does:**
- Deploys `AgentFactoryV3` contract (or modify to use V3V3)
- Saves address to `deployed.json` as `agentFactory`
- Automatically verifies contract

**Contract deployed:** `AgentFactoryV3` or `AgentFactoryV3V3`

**Output:** Address saved in `deployed.json` → `agentFactory`

---

### Step 8: Deploy Bonding Contract

Deploy the main bonding curve contract:

```bash
npx hardhat run scripts/kex/deployBonding.ts --network <network_name>
```

**What it does:**
- Deploys `Bonding` contract
- Saves address to `deployed.json` as `Bonding`
- Automatically verifies contract

**Contract deployed:** `Bonding`

**Output:** Address saved in `deployed.json` → `Bonding`

---

### Step 9: Deploy Multicall (Optional)

Deploy multicall utility for batched operations:

```bash
npx hardhat run scripts/kex/deployMulticall.ts --network <network_name>
```

**What it does:**
- Deploys `Multicall` contract for batching calls
- Saves address to `deployed.json`

---

## Post-Deployment Configuration

After all contracts are deployed, they must be initialized and configured with proper roles and parameters.

### Step 1: Initialize FFactory

```bash
npx hardhat run scripts/kex/initializeFactory.ts --network <network_name>
```

**What it does:**
- Calls `FFactory.initialize(taxVault, buyTax, sellTax)`
  - `taxVault`: Address to receive taxes (typically deployer)
  - `buyTax`: 0 (no buy tax)
  - `sellTax`: 0 (no sell tax)
- Sets router address via `setRouter(FRouter)`

**Parameters used:**
- Tax vault: Your admin address
- Buy tax: 0
- Sell tax: 0

---

### Step 2: Initialize FRouter

```bash
npx hardhat run scripts/kex/initializeRouter.ts --network <network_name>
```

**What it does:**
- Calls `FRouter.initialize(FFactory, assetToken)`

---

### Step 3: Initialize AgentFactory

```bash
npx hardhat run scripts/kex/initializeAgentFactory.ts --network <network_name>
```

**What it does:**
- Calls `AgentFactoryV3.initialize()` with parameters:
  - `tokenImplementation`: AgentToken address
  - `veTokenImplementation`: Address(0) or VeToken if deployed
  - `daoImplementation`: Address(0) or DAO if deployed
  - `tbaRegistry`: ERC6551Registry address
  - `assetToken`: USDT address
  - `nft`: AgentNftV2 address
  - `applicationThreshold`: 0
  - `vault`: Admin address
  - `nextId`: 0

**Additional Configuration Required:**
```javascript
// Set Uniswap V3 contracts (for graduation)
await agentFactory.setUniswapFactory("UNISWAP_V3_FACTORY");
await agentFactory.setUniswapNFTPositionManager("UNISWAP_V3_NFT_POSITION_MANAGER");

// Set token admin
await agentFactory.setTokenAdmin("ADMIN_ADDRESS");

// Set token tax parameters
await agentFactory.setTokenTaxParams(0, 0, 0, "TAX_VAULT_ADDRESS");
```

---

### Step 4: Initialize Bonding Contract

```bash
npx hardhat run scripts/kex/initializeBonding.ts --network <network_name>
```

**What it does:**
- Calls `Bonding.initialize()` with parameters:
  - `factory_`: FFactory address
  - `router_`: FRouter address
  - `feeTo_`: Fee recipient address (admin)
  - `fee_`: "100000000000000000000" (100 tokens in wei, represents 100 USDT base fee)
  - `initialSupply_`: "1000000000" (1 billion tokens)
  - `assetRate_`: "5000" (0.5% graduation rate, means 5000/10000)
  - `maxTx_`: 100 (max transaction percentage)
  - `agentFactory_`: AgentFactory address
  - `gradThreshold_`: "125000000000000000000000000" (125M tokens graduation threshold)

**Current parameters in script:**
```javascript
{
  feeRecipient: "0xA7A6395Cf611D260357b611D91bf702e99d14dD2",
  fee: "100000000000000000000", // 100 USDT
  initialSupply: "1000000000",  // 1B tokens
  assetRate: "5000",            // 0.5%
  maxTx: 100,
  gradThreshold: "125000000000000000000000000" // 125M tokens
}
```

---

### Step 5: Grant Roles

Grant necessary roles to allow contracts to interact:

```bash
npx hardhat run scripts/kex/addCreatorToFactory.ts --network <network_name>
```

**What it does:**
- Grants `CREATOR_ROLE` to Bonding contract on FFactory
- Grants `ADMIN_ROLE` to Bonding contract on FFactory (if needed)

**Additional roles to configure manually:**

1. **FRouter Roles:**
   ```javascript
   await fRouter.grantRole(EXECUTOR_ROLE, bondingAddress);
   ```

2. **AgentFactory Roles:**
   ```javascript
   await agentFactory.grantRole(BONDING_ROLE, bondingAddress);
   ```

3. **AgentNftV2 Roles:**
   ```javascript
   await agentNft.grantRole(MINTER_ROLE, agentFactoryAddress);
   ```

---

## Verification

After deployment and configuration, verify all contracts:

1. **Automated Verification**: Most deploy scripts include automatic verification after a 30-second wait

2. **Manual Verification**:
   ```bash
   npx hardhat verify --network <network_name> <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

3. **Check deployed.json**: Ensure all addresses are recorded:
   ```json
   {
     "assetToken": "0x...",
     "FFactory": "0x...",
     "FRouter": "0x...",
     "agentToken": "0x...",
     "erc6551": "0x...",
     "agentNft": "0x...",
     "agentFactory": "0x...",
     "Bonding": "0x..."
   }
   ```

---

## Testing Deployment

### 1. Mint Test USDT

```bash
npx hardhat run scripts/kex/mintUSDT.ts --network <network_name>
```

Modify the script to mint to your address.

### 2. Approve USDT for Bonding

```bash
npx hardhat run scripts/kex/approveUSDT.ts --network <network_name>
```

### 3. Launch a Test Token

```bash
npx hardhat run scripts/kex/launch.ts --network <network_name>
```

**What it does:**
- Calls `Bonding.launch()` with:
  - Token name and symbol
  - Core values (AI personality cores)
  - Description and image
  - Social links (Twitter, Telegram, YouTube, Website)
  - Purchase amount (must be >= fee)

### 4. Test Buy/Sell

```bash
npx hardhat run scripts/kex/buy.ts --network <network_name>
```

---

## Network-Specific Configurations

### Saga EVM (ChainID: 5464)

**Deployed Addresses** (from `deployedSaga.json`):
```json
{
  "assetToken": "0xBef2b76dE8504BFe26E10a81bB5D132614B4dc8A",
  "FFactory": "0x76C309F0ab02a5b64c868d7037686a25DA5f133d",
  "FRouter": "0x27b0C0833fC880a558bB45Fc32cd74C1019FdC30",
  "Bonding": "0xc91625DD8D1ec2f06188ab04DfeEe0c4176FE3CA"
}
```

**RPC URL**: `https://sagaevm.jsonrpc.sagarpc.io`

**Block Explorer**: `https://sagaevm.sagaexplorer.io:443`

**Gas Configuration**: `gasPrice: 0` (free gas on Saga)

**Uniswap V3 Contracts** (if applicable):
- Factory: Check Saga documentation
- NFT Position Manager: Check Saga documentation

---

### Base Sepolia (Testnet)

**Deployed Addresses** (from `deployedSepolia.json`):
```json
{
  "assetToken": "0x908B64ee2D8764aBD6702a62E6cDe07ACBa1963C",
  "FFactory": "0x81027840a1aE18d83F96A20B09D81Ad970C81DA6",
  "FRouter": "0x106a78559104D0B565956cFd546d12c866A1Bd64",
  "Bonding": "0x53b7Ad2897bBd43B17DAfBf4d1Ffd5E82E213B04"
}
```

**RPC URL**: `https://sepolia.base.org`

**Block Explorer**: `https://api-sepolia.basescan.org`

**Uniswap V3 Contracts**:
- Factory: `0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24`
- NFT Position Manager: `0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2`
- Swap Router: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`

---

### Base Mainnet

**RPC URL**: `https://mainnet.base.org`

**Uniswap V3 Contracts**:
- Factory: `0x33128a8fC17869897dcE68Ed026d694621f6FDfD`
- NFT Position Manager: `0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1`
- Swap Router: `0x2626664c2603336E57B271c5C0b26F421741e481`

---

## Common Parameters Reference

### Bonding Contract Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| K (constant) | 3,000,000,000,000 | Constant product for bonding curve |
| initialSupply | 1,000,000,000 | Initial token supply (1 billion) |
| fee | 100 USDT | Launch fee (100000000000000000000 wei) |
| assetRate | 5000 | 0.5% rate for graduation (5000/10000) |
| maxTx | 100 | Max transaction percentage |
| gradThreshold | 125M tokens | Graduation threshold to Uniswap V3 |

### Agent Factory Parameters

| Parameter | Description |
|-----------|-------------|
| tokenImplementation | Address of AgentToken implementation |
| assetToken | USDT or base currency address |
| tbaRegistry | ERC6551 registry for token-bound accounts |
| nft | AgentNftV2 address |

---

## Deployment Checklist

- [ ] Deploy TestERC20 (USDT) for testnet
- [ ] Deploy FFactory
- [ ] Deploy FRouter
- [ ] Deploy AgentToken implementation
- [ ] Deploy ERC6551Registry
- [ ] Deploy AgentNftV2
- [ ] Deploy AgentFactory (V3 or V3V3)
- [ ] Deploy Bonding
- [ ] Deploy Multicall (optional)
- [ ] Initialize FFactory with tax parameters
- [ ] Set FFactory router
- [ ] Initialize FRouter with factory and asset token
- [ ] Initialize AgentNftV2 with admin
- [ ] Initialize AgentFactory with all parameters
- [ ] Set AgentFactory Uniswap contracts
- [ ] Set AgentFactory token admin
- [ ] Set AgentFactory token tax params
- [ ] Initialize Bonding with all parameters
- [ ] Grant CREATOR_ROLE to Bonding on FFactory
- [ ] Grant ADMIN_ROLE to Bonding on FFactory
- [ ] Grant EXECUTOR_ROLE to Bonding on FRouter
- [ ] Grant BONDING_ROLE to Bonding on AgentFactory
- [ ] Grant MINTER_ROLE to AgentFactory on AgentNftV2
- [ ] Verify all contracts on block explorer
- [ ] Test token launch
- [ ] Test buy/sell operations
- [ ] Test graduation flow (if threshold reached)

---

## Troubleshooting

### Common Issues

1. **"Zero addresses are not allowed"**
   - Ensure all dependencies are deployed before dependent contracts
   - Check that addresses are saved correctly in `deployed.json`

2. **"Only role X can execute"**
   - Verify all roles are granted correctly
   - Check that the calling address has the required role

3. **Initialization fails**
   - Check if contract is already initialized
   - Scripts include checks for zero address on key parameters

4. **Verification fails**
   - Wait longer (scripts wait 30s, may need more)
   - Ensure constructor arguments match exactly
   - Check network configuration in `hardhat.config.js`

5. **Gas price issues on Saga**
   - Use `gasPrice: 0` for Saga network (free gas)
   - Use `gasLimit` if needed (e.g., 5000000)

---

## Security Considerations

1. **Role Management**:
   - Only grant necessary roles
   - Use multi-sig for admin roles in production
   - Document all role assignments

2. **Parameter Configuration**:
   - Review all initialization parameters carefully
   - Test with small values first
   - Ensure fee recipients are correct

3. **Upgradability**:
   - Contracts use `Initializable` pattern
   - Be careful with storage layout changes
   - Test upgrades on testnet first

4. **Testing**:
   - Run full test suite: `npx hardhat test`
   - Test on testnet before mainnet deployment
   - Monitor first transactions closely

---

## Support and Resources

- **Test File**: `test/bonding.test.js` - Shows complete deployment and interaction flow
- **GitHub**: [Repository Issues](https://github.com/Virtual-Protocol/virtual-contracts/issues)
- **Hardhat Docs**: https://hardhat.org/
- **OpenZeppelin**: https://docs.openzeppelin.com/

---

## Appendix: Contract Interactions

### Token Launch Flow

1. User approves USDT to Bonding contract
2. User calls `Bonding.launch()` with token details and purchase amount
3. Bonding creates new token via FERC20
4. Bonding creates pair via FFactory
5. Bonding adds initial liquidity
6. User receives tokens based on bonding curve
7. Token is now tradable

### Graduation Flow

1. When token market cap reaches `gradThreshold` (125M)
2. User calls `Bonding.graduate()` on the token
3. Bonding calls AgentFactory to create agent token
4. AgentFactory creates Uniswap V3 pool
5. Liquidity is migrated to Uniswap V3
6. Agent NFT is minted
7. Trading continues on Uniswap V3

---

**Last Updated**: Based on commit `8f0d726` (fix token order)
