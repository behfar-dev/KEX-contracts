# KEX Deployment Scripts

This directory contains deployment and interaction scripts for the KEX bonding curve system.

## Quick Start

### 1. Complete Deployment (Recommended)

Deploy the entire system including bonding curve and agent functionality:

```bash
npx hardhat run scripts/kex/deployComplete.ts --network saga
```

This will:
- Deploy all contracts (USDT, FFactory, FRouter, AgentFactory, Bonding, etc.)
- Initialize all contracts
- Configure roles and permissions
- Save addresses to `deployed.json`

### 2. Minimal Deployment (Bonding Only)

Deploy just the core bonding curve without agent graduation:

```bash
npx hardhat run scripts/kex/deployMinimal.ts --network saga
```

This deploys:
- TestERC20 (USDT)
- FFactory
- FRouter
- Bonding

## Script Overview

### Deployment Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `deployComplete.ts` | Full system deployment | Main deployment script |
| `deployMinimal.ts` | Bonding-only deployment | Simplified deployment |
| `deployFakeUSDT.ts` | Deploy test USDT token | Testnet only |
| `deployFactory.ts` | Deploy FFactory | Individual component |
| `deployRouter.ts` | Deploy FRouter | Individual component |
| `deployAgentFactory.ts` | Deploy AgentFactory | Individual component |
| `deployBonding.ts` | Deploy Bonding contract | Individual component |
| `deployMulticall.ts` | Deploy Multicall utility | Optional |

### Initialization Scripts

| Script | Description | When to Use |
|--------|-------------|-------------|
| `initializeFactory.ts` | Initialize FFactory | After deployment |
| `initializeRouter.ts` | Initialize FRouter | After deployment |
| `initializeAgentFactory.ts` | Initialize AgentFactory | After deployment |
| `initializeBonding.ts` | Initialize Bonding | After deployment |

### Configuration Scripts

| Script | Description |
|--------|-------------|
| `addCreatorToFactory.ts` | Grant roles to Bonding on FFactory |
| `addCreatorToRouter.ts` | Grant roles to Bonding on FRouter |

### Testing/Interaction Scripts

| Script | Description | Prerequisites |
|--------|-------------|---------------|
| `mintUSDT.ts` | Mint test USDT | Deployed USDT |
| `approveUSDT.ts` | Approve USDT for Bonding | Minted USDT |
| `launch.ts` | Launch a test token | Approved USDT |
| `buy.ts` | Buy tokens from bonding curve | Launched token |

## Deployment Files

### `deployed.json`

Stores deployed contract addresses for the current network. Format:

```json
{
  "ownerAddress": "0x...",
  "assetToken": "0x...",
  "FFactory": "0x...",
  "FRouter": "0x...",
  "agentToken": "0x...",
  "erc6551": "0x...",
  "agentNft": "0x...",
  "agentFactory": "0x...",
  "Bonding": "0x...",
  "multicall": "0x...",
  "uniswapFactory": "0x...",
  "uniswapNFTPositionManager": "0x..."
}
```

### Network-Specific Files

- `deployedSaga.json` - Saga EVM deployment
- `deployedSepolia.json` - Base Sepolia deployment

## Typical Deployment Flow

### Method 1: Automated (Recommended)

```bash
# Deploy everything
npx hardhat run scripts/kex/deployComplete.ts --network saga

# Test the deployment
npx hardhat run scripts/kex/mintUSDT.ts --network saga
npx hardhat run scripts/kex/approveUSDT.ts --network saga
npx hardhat run scripts/kex/launch.ts --network saga
```

### Method 2: Manual Step-by-Step

```bash
# 1. Deploy core contracts
npx hardhat run scripts/kex/deployFakeUSDT.ts --network saga
npx hardhat run scripts/kex/deployFactory.ts --network saga
npx hardhat run scripts/kex/deployRouter.ts --network saga
npx hardhat run scripts/kex/deployBonding.ts --network saga

# 2. Initialize contracts
npx hardhat run scripts/kex/initializeFactory.ts --network saga
npx hardhat run scripts/kex/initializeRouter.ts --network saga
npx hardhat run scripts/kex/initializeBonding.ts --network saga

# 3. Configure roles
npx hardhat run scripts/kex/addCreatorToFactory.ts --network saga
npx hardhat run scripts/kex/addCreatorToRouter.ts --network saga

# 4. Test
npx hardhat run scripts/kex/mintUSDT.ts --network saga
npx hardhat run scripts/kex/approveUSDT.ts --network saga
npx hardhat run scripts/kex/launch.ts --network saga
```

## Networks

Configure networks in `hardhat.config.js`. Available networks:

- `saga` - Saga EVM mainnet (free gas)
- `base_sepolia` - Base testnet
- `base` - Base mainnet
- `sepolia` - Ethereum testnet

## Environment Variables

Create `.env` file in project root:

```env
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Common Tasks

### Deploy to a new network

1. Update `hardhat.config.js` with network config
2. Add network to `NETWORK_CONFIG` in `deployComplete.ts`
3. Run deployment: `npx hardhat run scripts/kex/deployComplete.ts --network <network>`

### Update a single contract

1. Deploy new version: `npx hardhat run scripts/kex/deploy<Contract>.ts --network <network>`
2. Initialize if needed: `npx hardhat run scripts/kex/initialize<Contract>.ts --network <network>`
3. Update roles if needed
4. Update `deployed.json` manually or let scripts handle it

### Verify contracts manually

```bash
npx hardhat verify --network <network> <address> <constructor_args>
```

Example:
```bash
npx hardhat verify --network saga 0x123... "USDT-Kex Test" "KEX_USDT"
```

## Deployment Parameters

Key parameters configured in deployment scripts:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Launch Fee | 100 USDT | Fee to launch a token |
| Initial Supply | 1,000,000,000 | 1 billion tokens |
| Asset Rate | 5000 (0.5%) | Graduation liquidity rate |
| Max Tx | 100 | Max transaction size |
| Grad Threshold | 125,000,000 | 125M tokens to graduate |
| K (Bonding) | 3,000,000,000,000 | Bonding curve constant |

## Troubleshooting

### "Zero addresses are not allowed"

Make sure all dependencies are deployed before running initialization scripts.

### "Only role X can execute"

Run the role configuration scripts (`addCreatorToFactory.ts`, etc.)

### Contract already initialized

Scripts check initialization status. If already initialized, they skip that step.

### Verification fails

- Wait longer (increase `verificationDelay` in scripts)
- Verify manually with exact constructor args
- Some networks may not support verification

### Gas price errors on Saga

Use `gasPrice: 0` for Saga network (free gas)

## Support

See the main [DEPLOYMENT_GUIDE.md](../../DEPLOYMENT_GUIDE.md) for comprehensive documentation.
