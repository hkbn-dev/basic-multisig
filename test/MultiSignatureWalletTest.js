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
    let currBalance = await multiSignatureWallet.getBalance();
    expect(currBalance).to.equal(0);

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
    await multiSignatureWallet.proposeTransaction(addr1.address);
    await expect (
       multiSignatureWallet.proposeTransaction(addr2.address)
      ).to.be.revertedWith("Error: A proposal is already contesting approval.");
    
  });

  it("Should not be able to propose transaction if not one of the original owners", async function() {
    const [, , , addr4] = await ethers.getSigners();
    await expect(
      multiSignatureWallet.connect(addr4).proposeTransaction(addr4.address)
    ).to.be.revertedWith("Error: Invalid owner.");
  });

  it("Should be able to approve transaction", async function() {
    await multiSignatureWallet.proposeTransaction(addr1.address);
    await expect(
      multiSignatureWallet.connect(addr2).approveTransaction()
    ).to.emit(multiSignatureWallet, "approveTx")
    .withArgs(addr2.address);
  });

    it("Should be able to disapprove transaction", async function() {
    await multiSignatureWallet.proposeTransaction(addr1.address);
    await expect(
      multiSignatureWallet.connect(addr2).disapproveTransaction()
    ).to.emit(multiSignatureWallet, "disapproveTx")
    .withArgs(addr2.address);
  });

});
