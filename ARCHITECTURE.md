# KEX System Architecture

## Overview

KEX is a bonding curve-based token launch platform with integrated virtual agent/persona functionality. The system allows users to launch tokens with automatic price discovery through a bonding curve mechanism, and graduate successful tokens to Uniswap V3 with agent NFT integration.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        KEX ECOSYSTEM                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    BONDING CURVE SYSTEM                          │
│                                                                  │
│  ┌──────────────┐                                               │
│  │   Bonding    │  Main contract for token launches             │
│  │   Contract   │  - Creates new tokens                         │
│  └──────┬───────┘  - Manages bonding curve pricing              │
│         │          - Handles buy/sell operations                │
│         │          - Triggers graduation                        │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    │         │                                                  │
│    ▼         ▼                                                  │
│  ┌──────┐ ┌──────┐                                             │
│  │FFactory│ │FRouter│  Trading infrastructure                   │
│  │        │ │       │  - Creates token pairs                    │
│  │        │ │       │  - Routes swaps                           │
│  │        │ │       │  - Manages liquidity                      │
│  └────────┘ └───┬───┘                                           │
│                 │                                                │
│                 ▼                                                │
│            ┌─────────┐                                          │
│            │ FPair   │  Individual trading pairs                │
│            │ (FERC20)│  Token ↔ USDT                           │
│            └─────────┘                                          │
└──────────────────────────────────────────────────────────────────┘

                            │
                            │ Graduation (when threshold reached)
                            ▼

┌──────────────────────────────────────────────────────────────────┐
│                AGENT / VIRTUAL PERSONA SYSTEM                    │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │ AgentFactoryV3V3 │  Creates graduated agents                 │
│  └────────┬─────────┘  - Mints agent tokens                     │
│           │            - Creates Uniswap V3 pools               │
│           │            - Manages liquidity migration            │
│      ┌────┴────┐                                                │
│      │         │                                                │
│      ▼         ▼         ▼                                      │
│  ┌────────┐ ┌────────┐ ┌──────────┐                           │
│  │ Agent  │ │ Agent  │ │ TBA (ERC │                           │
│  │ Token  │ │ NFT V2 │ │  6551)   │                           │
│  │(ERC20) │ │(ERC721)│ │ Registry │                           │
│  └────────┘ └────────┘ └──────────┘                           │
│                                                                  │
│                    ▼                                            │
│            ┌──────────────┐                                     │
│            │  Uniswap V3  │  Graduated token trading            │
│            │     Pool     │  with deep liquidity               │
│            └──────────────┘                                     │
└──────────────────────────────────────────────────────────────────┘
```

## Component Details

### Bonding Curve System

#### Bonding Contract
**Purpose**: Main entry point for token launches and trading

**Key Functions**:
- `launch()` - Create new token with metadata
- `buy()` - Purchase tokens from bonding curve
- `sell()` - Sell tokens back to bonding curve
- `graduate()` - Migrate successful token to Uniswap V3

**Key Parameters**:
- `K = 3,000,000,000,000` - Bonding curve constant product
- `initialSupply = 1,000,000,000` - Initial token supply (1B)
- `fee = 100 USDT` - Launch fee
- `gradThreshold = 125,000,000` - Tokens needed to graduate (125M)
- `assetRate = 5000` - 0.5% liquidity provision rate

**Pricing Formula**: Constant product curve `x * y = K`

#### FFactory
**Purpose**: Factory for creating token trading pairs

**Key Functions**:
- `createPair()` - Create new token/USDT pair
- `getPair()` - Get pair address for tokens
- `setRouter()` - Configure router contract

**Access Control**:
- `CREATOR_ROLE` - Can create pairs (granted to Bonding)
- `ADMIN_ROLE` - Can modify settings

#### FRouter
**Purpose**: Router for swap and liquidity operations

**Key Functions**:
- `addInitialLiquidity()` - Add liquidity to new pair
- `swapExactIn()` - Swap exact input amount
- `swapExactOut()` - Swap for exact output amount
- `getAmountsOut()` - Calculate output amounts

**Access Control**:
- `EXECUTOR_ROLE` - Can execute swaps (granted to Bonding)

#### FPair (FERC20)
**Purpose**: Individual trading pair contract

**Features**:
- Constant product AMM
- Reserves tracking
- K (constant product) enforcement
- Tax support (configurable)

### Agent/Virtual Persona System

#### AgentFactoryV3V3
**Purpose**: Factory for creating graduated agent tokens

**Key Functions**:
- `createPersona()` - Create new agent with token, NFT, and DAO
- `createPersonaWithUniswap()` - Create agent and Uniswap V3 pool
- `setUniswapFactory()` - Configure Uniswap V3 integration
- `setTokenAdmin()` - Set token configuration admin

**Integration Points**:
- Uniswap V3 Factory - Creates trading pools
- Uniswap V3 Position Manager - Manages liquidity positions
- AgentToken - Implementation contract (cloned for each agent)
- AgentNftV2 - Mints NFT for each agent
- ERC6551 Registry - Creates token-bound accounts

**Access Control**:
- `BONDING_ROLE` - Can create personas (granted to Bonding)
- `DEFAULT_ADMIN_ROLE` - Full administrative access

#### AgentNftV2
**Purpose**: NFT representing virtual agents

**Features**:
- ERC721 standard
- Metadata storage (tokenURI)
- Core registry (AI personality cores)
- Validator registry
- Token-bound account support

**Access Control**:
- `MINTER_ROLE` - Can mint NFTs (granted to AgentFactory)
- `ADMIN_ROLE` - Administrative functions

#### AgentToken
**Purpose**: ERC20 implementation for agent tokens

**Features**:
- Standard ERC20 functionality
- Governance integration (votes, delegation)
- Configurable taxation
- Ownership controls

#### ERC6551Registry
**Purpose**: Token-bound account registry

**Features**:
- Creates unique accounts for each NFT
- ERC-6551 standard implementation
- Account address derivation

### Supporting Contracts

#### TestERC20 (USDT)
**Purpose**: Base currency for trading

**Functions**:
- Standard ERC20 operations
- `mint()` - Mint tokens (testnet only)
- `approve()` - Approve spending

#### Multicall
**Purpose**: Batch multiple calls into one transaction

**Usage**: Gas optimization for complex operations

## Data Flow

### Token Launch Flow

```
1. User approves USDT to Bonding contract
   ↓
2. User calls Bonding.launch() with:
   - Token name, symbol
   - AI cores (personality)
   - Metadata (description, image, social links)
   - Initial purchase amount
   ↓
3. Bonding creates new FERC20 token
   ↓
4. Bonding calls FFactory.createPair()
   ↓
5. FFactory creates FPair contract
   ↓
6. Bonding adds initial liquidity via FRouter
   ↓
7. User receives tokens based on bonding curve
   ↓
8. Token is now tradable on bonding curve
```

### Buy/Sell Flow

```
BUY:
1. User approves USDT
   ↓
2. User calls Bonding.buy(token, amount)
   ↓
3. Bonding calculates output via bonding curve
   ↓
4. USDT transferred from user
   ↓
5. Tokens minted/transferred to user
   ↓
6. Reserves updated
   ↓
7. Check if graduation threshold reached

SELL:
1. User approves tokens
   ↓
2. User calls Bonding.sell(token, amount)
   ↓
3. Bonding calculates USDT output
   ↓
4. Tokens burned/transferred to pair
   ↓
5. USDT transferred to user
   ↓
6. Reserves updated
```

### Graduation Flow

```
1. Token reaches gradThreshold (125M tokens traded)
   ↓
2. User calls Bonding.graduate(tokenAddress)
   ↓
3. Bonding calls AgentFactory.createPersonaWithUniswap()
   ↓
4. AgentFactory:
   a. Clones AgentToken implementation
   b. Calls AgentNft.mint() for NFT
   c. Creates Uniswap V3 pool
   d. Adds liquidity to V3 pool
   e. Creates token-bound account via ERC6551
   ↓
5. Original bonding curve trading disabled
   ↓
6. Token now trades on Uniswap V3
   ↓
7. Agent NFT minted to creator
   ↓
8. Graduation event emitted
```

## Access Control Matrix

| Contract | Role | Granted To | Purpose |
|----------|------|------------|---------|
| FFactory | CREATOR_ROLE | Bonding | Create trading pairs |
| FFactory | ADMIN_ROLE | Bonding, Owner | Modify settings |
| FRouter | EXECUTOR_ROLE | Bonding | Execute swaps/liquidity |
| AgentFactory | BONDING_ROLE | Bonding | Create agents |
| AgentFactory | DEFAULT_ADMIN_ROLE | Owner | Full admin access |
| AgentNft | MINTER_ROLE | AgentFactory | Mint NFTs |
| AgentNft | ADMIN_ROLE | Owner | Admin functions |

## State Management

### Bonding Contract State

```solidity
struct Token {
    address creator;        // Token creator
    address token;         // Token address
    address pair;          // Pair address
    address agentToken;    // Graduated agent token
    Data data;            // Market data
    string description;   // Token description
    uint8[] cores;        // AI personality cores
    string image;         // Token image URI
    string[4] socials;    // Twitter, Telegram, YouTube, Website
    bool trading;         // Trading enabled on bonding curve
    bool tradingOnUniswap; // Graduated to Uniswap
}

struct Data {
    string name;
    string ticker;
    uint256 supply;
    uint256 price;
    uint256 marketCap;
    uint256 liquidity;
    uint256 volume;
    uint256 volume24H;
    uint256 prevPrice;
    uint256 lastUpdated;
}
```

### Storage Patterns

- **Bonding**: Tracks all launched tokens, user profiles
- **FFactory**: Mapping of token pairs, array of all pairs
- **FRouter**: Factory and asset token references
- **AgentFactory**: Application system, token/DAO arrays
- **AgentNft**: Virtual info, LP info, cores, validators

## Security Considerations

### Reentrancy Protection

- `ReentrancyGuard` on all state-changing functions
- Custom `noReentrant` modifier in AgentFactory
- SafeERC20 for token transfers

### Access Controls

- Role-based access control (OpenZeppelin AccessControl)
- Multi-level permissions (ADMIN, CREATOR, EXECUTOR, etc.)
- Owner-only functions for critical operations

### Initialization

- `Initializable` pattern (no constructor calls)
- One-time initialization enforced
- Storage layout preservation for upgrades

### Token Safety

- SafeERC20 usage throughout
- Approval checks before transfers
- Balance validation

## Deployment Considerations

### Dependencies

External contracts needed:
- Uniswap V3 Factory (network-specific)
- Uniswap V3 NFT Position Manager (network-specific)

### Initialization Order

1. Deploy all implementation contracts
2. Deploy factory contracts
3. Initialize factories
4. Deploy main contracts (Bonding, AgentFactory)
5. Initialize main contracts
6. Grant roles
7. Configure external integrations

### Network-Specific Settings

Different networks require:
- Different Uniswap V3 addresses
- Different gas price strategies
- Different verification delays

### Upgradeability

Current contracts use:
- Initializable pattern (not fully upgradeable)
- Storage gaps for future versions
- Proxy-compatible design in some contracts

## Gas Optimization

### Strategies Used

- Storage packing (use of uint8, uint32 where possible)
- Batch operations via Multicall
- View functions for calculations
- Role-based access (cheaper than ownership checks)

### High Gas Operations

- Token launch (creates multiple contracts)
- Graduation (creates V3 pool, migrates liquidity)
- First buy/sell on new pair

## Testing Strategy

### Unit Tests

Test individual contract functions in isolation

### Integration Tests

Test complete flows:
- Launch → Buy → Sell
- Launch → Buy until graduation → Graduate
- Role assignments and permissions

### Fork Tests

Test against real Uniswap V3 deployments on mainnet forks

## Monitoring & Events

### Key Events

```solidity
// Bonding
event Launched(address indexed token, address indexed pair, uint);
event Deployed(address indexed token, uint256 amount0, uint256 amount1);
event Graduated(address indexed token, address agentToken);

// AgentFactory
event NewPersona(uint256 virtualId, address token, address dao,
                 address tba, address veToken, address lp);

// FFactory
event PairCreated(address indexed tokenA, address indexed tokenB,
                  address pair, uint);
```

### Monitoring Points

- Token launches (Launched event)
- Graduations (Graduated event)
- Pair creations (PairCreated event)
- Large trades (monitor reserves)
- Role changes (RoleGranted/RoleRevoked)

## Future Enhancements

Potential improvements:
- Full upgradeability with UUPS proxy pattern
- Dynamic bonding curve parameters
- Multi-asset trading pairs
- Advanced governance integration
- Automated market making improvements
- Cross-chain bridges

---

**Version**: Based on commit `8f0d726` (fix token order)

**Last Updated**: 2025-10-21
