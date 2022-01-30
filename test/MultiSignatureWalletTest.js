const { expect } = require("chai");
const { ethers} = require("hardhat");
const { utils } = require('ethers');

describe("MultiSignatureWallet", () => {
  let addr1,
    addr2,
    addr3,
    multiSignatureWalletFactory,
    multiSignatureWalletContract,
    multiSignatureWallet;

  before(async function() {
    multiSignatureWalletFactory = await ethers.getContractFactory("MultiSignatureWallet");
  });
    
  beforeEach(async function () {
    [addr1, addr2, addr3] = await ethers.getSigners();
    multiSignatureWalletContract = await multiSignatureWalletFactory.deploy(addr1.getAddress(), addr2.getAddress(), addr3.getAddress());
    multiSignatureWallet = await multiSignatureWalletContract.deployed();
    });

  it("Should deposit", async function () {
    let  provider = ethers.provider;
    // const [addr1, addr2, addr3] = await ethers.getSigners();
    // const multiSignatureWalletFactory = await ethers.getContractFactory("MultiSignatureWallet");
    // const multiSignatureWalletContract = await multiSignatureWalletFactory.deploy(addr1.getAddress(), addr2.getAddress(), addr3.getAddress());
    // const multiSignatureWallet = await multiSignatureWalletContract.deployed();

    let currBalance = await multiSignatureWallet.getBalance();
    expect(currBalance).to.equal(0);

    console.log(await provider.getBalance(addr1.getAddress()));

    const tx = await addr1.sendTransaction({
      to: multiSignatureWallet.address,
      value: ethers.utils.parseEther("0.1"),
    });

    currBalance = await multiSignatureWallet.getBalance();
    expect(utils.formatEther(currBalance)).to.equal("0.1");
  });

  it("Should be able to propose transaction", async function() {
    let currentRecipient = await multiSignatureWallet.getCurrentRecipient();
    expect(currentRecipient).to.equal(multiSignatureWallet.address);
    
    await multiSignatureWallet.proposeTransaction(addr1.address);
    currentRecipient = await multiSignatureWallet.getCurrentRecipient();
    expect(currentRecipient).to.equal(addr1.address);
  });

  it("Should not be able to propose transaction if contesting approval", async function() {
    let currentRecipient = await multiSignatureWallet.getCurrentRecipient();
    expect(currentRecipient).to.equal(multiSignatureWallet.address);
    
    await multiSignatureWallet.proposeTransaction(addr1.address);
    currentRecipient = await multiSignatureWallet.getCurrentRecipient();
    expect(currentRecipient).to.equal(addr1.address);
  });

});
