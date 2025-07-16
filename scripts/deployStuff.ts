// import { parseEther } from "ethers";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { verifyStuff } from "./verifyStuff";
const hre = require("hardhat");
const redeploy = false;
const verify = false;
const address0 = "0x0000000000000000000000000000000000000000";
const wei = "000000000000000000"
const gasPrice = 0;
(async () => {
    try {
        if (!fs.existsSync(path.resolve(__dirname, './deployedUpdated.json'))) {
            fs.writeFileSync(path.resolve(__dirname, './deployedUpdated.json'), JSON.stringify({
                "5464": {
                    ownerAdddress: "0x7db54A526d40e30Df3CbdACb90AdFC4a5359618D"
                }
            }, null, 4));
        }
        let addresse = JSON.parse(fs.readFileSync(path.resolve(__dirname, './deployedUpdated.json')).toString());
        let chainId = await ethers.provider.getNetwork();
        if (!addresse[chainId.chainId]) {
            addresse[chainId.chainId] = {
                ownerAdddress: "0x7db54A526d40e30Df3CbdACb90AdFC4a5359618D"
            }
        }
        let chainAddresses = addresse[chainId.chainId];
        await deployStuff(chainAddresses);
        if (verify) {
            await verifyStuff(chainAddresses);
        }
        fs.writeFileSync(path.resolve(__dirname, './deployedUpdated.json'), JSON.stringify(addresse, null, 4));

    } catch (e) {
        console.log(e);
    }
})();

export async function deployStuff(contracts: any) {
    if (!await deployFfactory(contracts)) return;
    if (!await initializeFfactory(contracts)) return;
    // if (!await deployAssetToken(contracts)) return;
    if (!await deployRouter(contracts)) return;
    if (!await initializeRouter(contracts)) return;
    if (!await deployAgentToken(contracts)) return;
    // if (!await deployERC6551(contracts)) return;
    // if (!await deployAgentNftV2(contracts)) return;
    // if (!await initializeAgentNft(contracts)) return;
    // if (!await deployAgentFactoryV3V3(contracts)) return;
    // if (!await initializeAgentFactory(contracts)) return;
    // if (!await deployBonding(contracts)) return;
    // if (!await initializeBonding(contracts)) return;
    // if (!await agentFactoryConfigurations(contracts)) return;
    // if (!await fFactoryConfigurations(contracts)) return;
    // if (!await launch(contracts)) return;
    // if (!await buy(contracts)) return;
}

export async function buy(contracts: any) {
    try {
        const AssetToken = await ethers.getContractFactory("TestERC20");
        const assetToken = await AssetToken.attach(contracts.assetToken);


        const bonding = await ethers.getContractFactory("Bonding");
        const bondingInstance = await bonding.attach(contracts.Bonding);

        let purchaseAmount = "10000000" + wei;
        // await assetToken.approve(contracts.FRouter, purchaseAmount + "000000000000000000",
        //     {
        //         gasPrice
        //     }
        // );
        // console.log("approved");
        // await new Promise((resolve) => {
        //     setTimeout(resolve, 10000);
        // });

        let balance = await assetToken.balanceOf(contracts.ownerAdddress);
        let approveAmount = await assetToken.allowance(contracts.ownerAdddress, contracts.FRouter);
        // console.log("balance", balance, "amount", purchaseAmount, "approveAmount", approveAmount);
        let tokenAddress = await bondingInstance.tokenInfos(0);
        await bondingInstance.buy(purchaseAmount, tokenAddress, {
            gasPrice
        });


        await new Promise((resolve) => {
            setTimeout(resolve, 5000);
        });

        let data = await bondingInstance.tokenInfo(tokenAddress);
        console.log("data", data);
        console.log("tokenAddress", tokenAddress);

    } catch (e) {
        console.log(e);
    }
    return true;
}

export async function launch(contracts: any) {
    try {
        const amount = "1000000000000000000000";
        const AssetToken = await ethers.getContractFactory("TestERC20");
        const assetToken = await AssetToken.attach(contracts.assetToken);

        // await assetToken.mint(contracts.ownerAdddress, amount, {
        //     gasPrice
        // });
        let allowance = await assetToken.allowance(contracts.ownerAdddress, contracts.Bonding);
        console.log("allowance", allowance);
        await assetToken.approve(contracts.Bonding, amount,
            {
                gasPrice
            }
        );
        console.log("approved");

        await new Promise((resolve) => {
            setTimeout(resolve, 10000);
        });

        console.log("launching");



        const bonding = await ethers.getContractFactory("Bonding");
        const bondingInstance = await bonding.attach(contracts.Bonding);
        await bondingInstance.launch("hako", "hako", [0, 2, 3, 4], "hako", "hako", ["1", "2", "3", "4"], amount,
            {
                gasPrice
            }
        )

        console.log("launched");
        await new Promise((resolve) => {
            setTimeout(resolve, 10000);
        });
    } catch (e) {
        console.log(e);
    }
    return true;
}

export async function fFactoryConfigurations(contracts: any) {
    try {
        if (!contracts.FFactory) {
            console.log("FFactory not deployed");
            return false;
        }
        const fFactory = await ethers.getContractFactory("FFactory");
        const fFactoryInstance = await fFactory.attach(contracts.FFactory);
        let adminRoleAccess = await fFactoryInstance.hasRole(await fFactoryInstance.ADMIN_ROLE(), contracts.ownerAdddress);
        if (adminRoleAccess === false) {
            await fFactoryInstance.grantRole(await fFactoryInstance.ADMIN_ROLE(), contracts.ownerAdddress, {
                gasPrice
            });
        }
        let creatorRoleAccess = await fFactoryInstance.hasRole(await fFactoryInstance.CREATOR_ROLE(), contracts.Bonding);
        if (creatorRoleAccess === false) {
            await fFactoryInstance.grantRole(await fFactoryInstance.CREATOR_ROLE(), contracts.Bonding, {
                gasPrice
            });
        }
        let router = await fFactoryInstance.router();
        if (router === address0) {
            await fFactoryInstance.setRouter(contracts.FRouter, {
                gasPrice
            });
        }
        const fRouter = await ethers.getContractFactory("FRouter");
        const fRouterInstance = await fRouter.attach(contracts.FRouter);
        let executorRoleAccess = await fRouterInstance.hasRole(await fRouterInstance.EXECUTOR_ROLE(), contracts.Bonding);
        if (executorRoleAccess === false) {
            await fRouterInstance.grantRole(await fRouterInstance.EXECUTOR_ROLE(), contracts.Bonding, {
                gasPrice
            });
        }
        const AgentNft = await ethers.getContractFactory("AgentNftV2");
        const agentNftInstance = await AgentNft.attach(contracts.agentNft);
        let agentNftRoleAccess = await agentNftInstance.hasRole(await agentNftInstance.MINTER_ROLE(), contracts.agentFactory);
        if (agentNftRoleAccess === false) {
            await agentNftInstance.grantRole(await agentNftInstance.MINTER_ROLE(), contracts.agentFactory, {
                gasPrice
            });
        }
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}


export async function agentFactoryConfigurations(contracts: any) {
    try {
        if (!contracts.agentFactory) {
            console.log("AgentFactory not deployed");
            return false;
        }
        const agentFactory = await ethers.getContractFactory("AgentFactoryV3V3");
        const agentFactoryInstance = await agentFactory.attach(contracts.agentFactory);
        let bondingAccess = await agentFactoryInstance.hasRole(await agentFactoryInstance.BONDING_ROLE(), contracts.Bonding);
        console.log("bondingAccess", bondingAccess);
        if (bondingAccess === false) {
            await agentFactoryInstance.grantRole(await agentFactoryInstance.BONDING_ROLE(), contracts.Bonding, {
                gasPrice
            });
        }
        let tokenAdmin = await agentFactoryInstance.tokenAdmin();
        console.log("tokenAdmin", tokenAdmin);
        if (tokenAdmin === address0) {
            await agentFactoryInstance.setTokenAdmin(contracts.ownerAdddress, {
                gasPrice
            });
        }

        let uniswapFactory = await agentFactoryInstance._uniswapFactory();
        console.log("uniswapFactory", uniswapFactory);
        if (uniswapFactory === address0) {
            await agentFactoryInstance.setUniswapFactory(contracts.uniswapFactory, {
                gasPrice
            });
        }

        let _nftPositionManager = await agentFactoryInstance._nftPositionManager();
        console.log("_nftPositionManager", _nftPositionManager);
        if (_nftPositionManager === address0) {
            await agentFactoryInstance.setUniswapNFTPositionManager(contracts.uniswapNFTPositionManager, {
                gasPrice
            });
        }

        let taxParams = await agentFactoryInstance._tokenTaxParams();
        console.log("taxParams", taxParams);
        if (taxParams === "0x") {
            await agentFactoryInstance.setTokenTaxParams(
                0, 0, 0, contracts.ownerAdddress,
                {
                    gasPrice
                }
            )
        }
        const Bonding = await ethers.getContractFactory("Bonding");
        const bondingInstance = await Bonding.attach(contracts.Bonding);
        let ag = await bondingInstance.agentFactory();
        console.log("ag", ag);
        if (ag === address0 || ag !== contracts.agentFactory) {
            await bondingInstance.setAgentFactory(contracts.agentFactory, {
                gasPrice
            });
        }

    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

export async function deployBonding(contracts: any) {
    try {
        if (contracts.Bonding != undefined && redeploy === false) {
            return true;
        }
        const Bonding = await ethers.getContractFactory("Bonding");
        const bonding = await Bonding.deploy(
            {
                gasPrice
            }
        );
        contracts.Bonding = await bonding.getAddress()
        await new Promise((resolve) => {
            console.log("Bonding initialized, waiting for 10s", contracts.Bonding);
            setTimeout(resolve, 10000);
        });
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}
export async function initializeBonding(contracts: any) {
    try {
        if (!contracts.Bonding) {
            console.log("Bonding not deployed");
            return false;
        }
        const bonding = await ethers.getContractFactory("Bonding");
        const bondingInstance = await bonding.attach(contracts.Bonding);
        let owner = await bondingInstance.factory();
        if (owner === address0) {
            await bondingInstance.initialize(
                contracts.FFactory,
                contracts.FRouter,
                contracts.ownerAdddress,
                "100000",
                "1000000000",
                "5000",
                "100",
                contracts.agentFactory, // agentFactory placeholder
                "125000000000000000000000000",
                {
                    gasPrice
                }
            );
        }
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}


export async function initializeAgentFactory(contracts: any) {
    try {
        if (!contracts.agentFactory) {
            console.log("AgentFactory not deployed");
            return false;
        }
        const agentFactory = await ethers.getContractFactory("AgentFactoryV3V3");
        const agentFactoryInstance = await agentFactory.attach(contracts.agentFactory);
        let nft = await agentFactoryInstance.nft()
        // console.log("nft", nft);
        if (nft === address0) {
            await agentFactoryInstance.initialize(
                contracts.agentToken,
                address0,
                address0,
                contracts.erc6551,
                contracts.assetToken,
                contracts.agentNft,
                0,
                contracts.ownerAdddress, // agentFactory placeholder
                0,
                {
                    gasPrice
                }
            );
        }
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

export async function deployAgentFactoryV3V3(contracts: any) {
    try {
        if (contracts.agentFactory != undefined && redeploy === false) {
            return true;
        }
        const AgentFactory = await ethers.getContractFactory("AgentFactoryV3V3");
        const agentFactory = await AgentFactory.deploy(

            {
                gasPrice
            }
        );
        contracts.agentFactory = await agentFactory.getAddress()
        await new Promise((resolve) => {
            console.log("agentFactory initialized, waiting for 10s", contracts.Bonding);
            setTimeout(resolve, 10000);
        });
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function initializeAgentNft(contracts: any) {
    try {
        if (!contracts.agentNft) {
            console.log("AgentNft not deployed");
            return false;
        }
        const agentNft = await ethers.getContractFactory("AgentNftV2");
        const agentNftInstance = await agentNft.attach(contracts.agentNft);
        let owner = await agentNftInstance.hasRole(await agentNftInstance.DEFAULT_ADMIN_ROLE(), contracts.ownerAdddress);
        if (owner === false) {
            await agentNftInstance.initialize(
                contracts.ownerAdddress,
                {
                    gasPrice
                }
            );
        }
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

export async function deployAgentNftV2(contracts: any) {
    try {
        if (contracts.agentNft != undefined && redeploy === false) {
            return true;
        }
        const AgentNft = await ethers.getContractFactory("AgentNftV2");
        const agentNft = await AgentNft.deploy(
            {
                gasPrice
            }
        );
        contracts.agentNft = await agentNft.getAddress()
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function deployERC6551(contracts: any) {
    try {
        if (contracts.erc6551 != undefined && redeploy === false) {
            return true;
        }
        const ERC6551 = await ethers.getContractFactory("ERC6551Registry");
        const erc6551 = await ERC6551.deploy(
            {
                gasPrice
            }
        );
        contracts.erc6551 = await erc6551.getAddress()
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}


// deploy AgentToken
export async function deployAgentToken(contracts: any) {
    try {
        if (contracts.agentToken != undefined && redeploy === false) {
            return true;
        }
        const AgentToken = await ethers.getContractFactory("AgentToken");
        const agentToken = await AgentToken.deploy(
            {
                gasPrice
            }
        );
        contracts.agentToken = await agentToken.getAddress()
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function initializeRouter(contracts: any) {
    try {
        if (!contracts.FRouter) {
            console.log("Router not deployed");
            return false;
        }
        const router = await ethers.getContractFactory("FRouter");
        const routerInstance = await router.attach(contracts.FRouter);
        let owner = await routerInstance.assetToken()
        if (owner === address0) {
            await routerInstance.initialize(
                contracts.FFactory,
                contracts.assetToken,
                {
                    gasPrice
                }
            );
        }
    }
    catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

export async function deployRouter(contracts: any) {
    try {
        if (contracts.FRouter != undefined && redeploy === false) {
            return true;
        }
        const Router = await ethers.getContractFactory("FRouter");
        const router = await Router.deploy(
            {
                gasPrice
            }
        );
        contracts.FRouter = await router.getAddress()
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function deployAssetToken(contracts: any) {
    try {
        if (contracts.assetToken != undefined && redeploy === false) {
            return true;
        }
        const AssetToken = await ethers.getContractFactory("TestERC20");
        const assetToken = await AssetToken.deploy(
            "USDT-Kex Test",
            "KEX_USDT",
            {
                gasPrice
            }
        );
        contracts.assetToken = await assetToken.getAddress()
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function deployFfactory(contracts: any) {
    try {
        console.log("Deploying FFactory", contracts.FFactory, contracts.FFactory != undefined);
        if (contracts.FFactory != undefined && redeploy === false) {
            console.log("FFactory already deployed");
            return true;
        }
        const FFactory = await ethers.getContractFactory("FFactory");
        const fFactory = await FFactory.deploy({
            gasPrice
        });
        contracts.FFactory = await fFactory.getAddress()
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function initializeFfactory(contracts: any) {
    try {
        if (!contracts.FFactory) {
            console.log("FFactory not deployed");
            return false;
        }
        console.log("Initializing FFactory", contracts.FFactory, contracts.feeReciever);
        const fFactory = await ethers.getContractFactory("FFactory");
        const fFactoryInstance = await fFactory.attach(contracts.FFactory);
        let taxValut = await fFactoryInstance.taxVault()
        if (taxValut === address0) {
            await fFactoryInstance.initialize(
                contracts.feeReciever,
                1,
                1,
                {
                    gasPrice
                }
            );
        }
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

