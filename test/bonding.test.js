const { deploy } = require("@nomicfoundation/ignition-core");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Bonding", function () {
    let deployer;
    let FFactory, fFactory, FRouter, fRouter, AgentFactory, agentFactory, Bonding, bonding, TestERC20, testERC20, swapRouter, AgentNFT, agentNFT, AgentDaoImplementation, agentDaoImplementation, AgentVeToken, agentVeToken, AgentToken, agentToken, TBA, tba;
    let ownerAdddress = "0xA7A6395Cf611D260357b611D91bf702e99d14dD2";
    const maxTx = "100";
    const gradThreshold = "125000000000000000000000000";
    const address0 = "0x0000000000000000000000000000000000000000";

    const wei = "000000000000000000"
    beforeEach(async function () {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xA7A6395Cf611D260357b611D91bf702e99d14dD2"]
        });

        // now get a Signer object for it
        deployer = await ethers.getSigner("0xA7A6395Cf611D260357b611D91bf702e99d14dD2");
        ownerAdddress = deployer.address;

        global.targetSigner = await ethers.getSigner(ownerAdddress);
        await network.provider.send("hardhat_setBalance", [
            ownerAdddress,
            "0x1000000000000000000",
        ]);

        testERC20 = await ethers.getContractAt("TestERC20", "0xBef2b76dE8504BFe26E10a81bB5D132614B4dc8A");
        swapRouter = await ethers.getContractAt("IV3SwapRouter", "0x346239972d1fa486FC4a521031BC81bFB7D6e8a4");

        FFactory = await ethers.getContractFactory("FFactory");
        fFactory = await FFactory.connect(deployer).deploy();
        await fFactory.connect(deployer).initialize(ownerAdddress, 1, 1);

        FRouter = await ethers.getContractFactory("FRouter");
        fRouter = await FRouter.connect(deployer).deploy();
        await fRouter.connect(deployer).initialize(fFactory.target, testERC20.target);

        AgentToken = await ethers.getContractFactory("AgentToken");
        agentToken = await AgentToken.connect(deployer).deploy();

        TBA = await ethers.getContractFactory("ERC6551Registry");
        tba = await TBA.connect(deployer).deploy();
        tba = await TBA.connect(deployer).deploy();
        tba = await TBA.connect(deployer).deploy();
        tba = await TBA.connect(deployer).deploy();
        AgentNFT = await ethers.getContractFactory("AgentNftV2");
        agentNFT = await AgentNFT.connect(deployer).deploy();
        await agentNFT.connect(deployer).initialize(
            ownerAdddress
        );

        AgentFactory = await ethers.getContractFactory("AgentFactoryV3V3");
        agentFactory = await AgentFactory.connect(deployer).deploy();

        await agentFactory.connect(deployer).initialize(
            agentToken.target,
            address0,
            address0,
            tba.target,
            testERC20.target,
            agentNFT.target,
            0,
            ownerAdddress, // agentFactory placeholder
            0
        );


        Bonding = await ethers.getContractFactory("Bonding");
        bonding = await Bonding.connect(deployer).deploy();
        await bonding.connect(deployer).initialize(
            fFactory.target,
            fRouter.target,
            ownerAdddress,
            "100000",
            "1000000000",
            "5000",
            maxTx,
            agentFactory.target, // agentFactory placeholder
            gradThreshold
        );

        await agentFactory.connect(deployer).setTokenAdmin(ownerAdddress);
        await agentFactory.grantRole(await agentFactory.BONDING_ROLE(), bonding.target);
        await agentFactory.setUniswapFactory("0x454050C4c9190390981Ac4b8d5AFcd7aC65eEffa")
        await agentFactory.setUniswapNFTPositionManager("0xdD489C75be1039ec7d843A6aC2Fd658350B067Cf")
        await agentFactory.setTokenTaxParams(0, 0, 0, ownerAdddress)

        await fFactory.grantRole(await fFactory.ADMIN_ROLE(), ownerAdddress);
        await fFactory.grantRole(await fFactory.CREATOR_ROLE(), bonding.target);
        await fRouter.grantRole(await fRouter.EXECUTOR_ROLE(), bonding.target);
        await agentNFT.grantRole(await agentNFT.MINTER_ROLE(), agentFactory.target);
        await fFactory.setRouter(fRouter.target);

    });

    // it("launch() should create a new token and emit Launched", async function () {
    //     expect(await bonding.fee()).to.equal("100000000000000000000");
    //     let amount = "1000000000000000000000";

    //     await testERC20.connect(deployer).mint(ownerAdddress, amount + "0000");
    //     await testERC20.connect(deployer).approve(bonding.target, amount);
    //     let tx = await bonding.connect(deployer).launch("test", "test", [0, 2, 3, 4], "test", "test", ["1", "2", "3", "4"], amount)
    // });

    // it("launch and buy() should create a new token and emit Launched", async function () {
    //     expect(await bonding.fee()).to.equal("100000000000000000000");
    //     let amount = "1000000000000000000000";

    //     await testERC20.connect(deployer).mint(ownerAdddress, amount + "0000");
    //     await testERC20.connect(deployer).approve(bonding.target, amount);
    //     let tx = await bonding.connect(deployer).launch("test", "test", [0, 2, 3, 4], "test", "test", ["1", "2", "3", "4"], amount)
    //     let tokenAddress = await bonding.tokenInfos(0);
    //     console.log("tokenData", tokenAddress);

    //     await testERC20.connect(deployer).approve(fRouter.target, amount);

    //     await bonding.buy("10000000000000000000", tokenAddress);

    //     let token = await ethers.getContractAt("TestERC20", tokenAddress);
    //     await token.connect(deployer).approve(fRouter.target, "10000000000000000000");
    //     await bonding.sell("10000000000000", tokenAddress);
    // });

    it("buy till graduation", async function () {
        let amount = "1000000000000000000000";

        await testERC20.connect(deployer).mint(ownerAdddress, amount + "0000000000");
        await testERC20.connect(deployer).approve(bonding.target, amount);
        let tx = await bonding.connect(deployer).launch("test", "test", [0, 2, 3, 4], "test", "test", ["1", "2", "3", "4"], amount)
        let tokenAddress = await bonding.tokenInfos(0);
        console.log("tokenData", tokenAddress);

        let purchaseAmount = "100000" + wei;

        await testERC20.connect(deployer).approve(fRouter.target, purchaseAmount);

        await bonding.buy(purchaseAmount, tokenAddress);

        let newToken = await bonding.tokenInfo(tokenAddress);
        console.log("newToken", newToken);
        let newTokenAddress = newToken[3];

        let uniswapFactory = await ethers.getContractAt("IUniswapV3Factory", "0x454050C4c9190390981Ac4b8d5AFcd7aC65eEffa");
        let pool = await uniswapFactory.getPool(testERC20.target, newTokenAddress, 100);
        console.log("pool", pool);
        await testERC20.connect(deployer).approve(swapRouter.target, 1);
        await swapRouter.connect(deployer).exactInputSingle([
            testERC20.target,
            newTokenAddress,
            100,
            ownerAdddress,
            1,
            0,
            0
        ]);
    });
});