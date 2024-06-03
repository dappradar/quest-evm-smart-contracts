const { expect } = require("chai");
const { ethers } = require("hardhat");
const newEth = require("ethers");

describe("NFT and reward minter contract tests", function () {
  let DappRadarNFT, RewardMinter;
  let nftContract, nftContract2, adminContract;
  let owner, addr1, addr2, addr3, winner1, winner2;

  before(async function () {
    DappRadarNFT = await ethers.getContractFactory("DappRadarNFT");
    RewardMinter = await ethers.getContractFactory("RewardMinter");
    [owner, addr1, addr2, addr3, winner1, winner2] = await ethers.getSigners();

    adminContract = await RewardMinter.deploy();
    await adminContract.waitForDeployment();
    nftContract = await DappRadarNFT.deploy(
      "DappRadarNFT",
      "DRNFT",
      "https://amethyst-managing-cephalopod-66.mypinata.cloud/ipfs/QmRZT54gQ7eYF7gSU62R7wCy6PiBaSu8zsMEm8494Fj5qP",
    );
    nftContract2 = await DappRadarNFT.deploy(
      "DappRadarNFT",
      "DRNFT",
      "https://amethyst-managing-cephalopod-66.mypinata.cloud/ipfs/QmRZT54gQ7eYF7gSU62R7wCy6PiBaSu8zsMEm8494Fj5qP",
    );
    await adminContract.waitForDeployment();
    await nftContract.waitForDeployment();
    await nftContract2.waitForDeployment();

    console.log(`adminContract: ${adminContract.target}`);
    console.log(`nftContract: ${nftContract.target}`);

    await nftContract.connect(owner).grantMinterRole(adminContract.target);
    await nftContract2.connect(owner).grantMinterRole(adminContract.target);
    await adminContract
      .connect(owner)
      .setNFTContractAddress(1, nftContract.target);
    await adminContract
      .connect(owner)
      .setNFTContractAddress(2, nftContract.target);
    await adminContract
      .connect(owner)
      .setNFTContractAddress(3, nftContract.target);
    await adminContract
      .connect(owner)
      .setNFTContractAddress(4, nftContract2.target);
    await adminContract.connect(owner).setQuestClaimStatus(1, true);
    await adminContract.connect(owner).setQuestClaimStatus(2, true);
    await adminContract.connect(owner).setQuestClaimStatus(3, true);
    await adminContract.connect(owner).setQuestClaimStatus(4, true);
  });

  describe("RewardMinter", function () {
    it("Should mintForWinner NFT only for winners", async function () {
      const questId = 1;
      await adminContract
        .connect(owner)
        .setWinnerRewards(questId, [winner1.address]);
      await adminContract.connect(winner1).mintForWinner(questId);
      const erc721Owner = await nftContract.ownerOf(1);
      expect(erc721Owner).to.equal(winner1.address);

      const tokenIdOfOwnerByIndexForWinner =
        await nftContract.tokenOfOwnerByIndex(winner1.address, 0);
      expect(tokenIdOfOwnerByIndexForWinner).to.equal(1);
      await expect(
        adminContract.connect(addr3).mintForWinner(questId),
      ).to.be.revertedWith("Only a winner can mint");
    });

    it("Token Uri Check", async function () {
      const erc721Owner = await nftContract.tokenURI(1);
      expect(erc721Owner).to.equal(
        "https://amethyst-managing-cephalopod-66.mypinata.cloud/ipfs/QmRZT54gQ7eYF7gSU62R7wCy6PiBaSu8zsMEm8494Fj5qP",
      );
    });
  });

  describe("DappRadarNFT", function () {
    const questId = 2;
    it("Should mintForWinner NFT by owner or adminContract contract", async function () {
      await nftContract.connect(owner).mint(addr1.address);
      const erc721Owner = await nftContract.ownerOf(2);
      expect(erc721Owner).to.equal(addr1.address);
    });

    it("Should mintForWinner NFT by adminContract contract", async function () {
      // Minting by adminContract contract
      await adminContract
        .connect(owner)
        .setWinnerRewards(questId, [addr1.address]);
      await adminContract.connect(addr1).mintForWinner(questId);
      await nftContract.connect(owner).mint(owner.address);
      const erc721Owner1 = await nftContract.ownerOf(3);
      const erc721Owner2 = await nftContract.ownerOf(4);
      expect(erc721Owner1).to.equal(addr1.address);
      expect(erc721Owner2).to.equal(owner.address);
      const tokenIdOfOwnerByIndex = await nftContract.tokenOfOwnerByIndex(
        addr1.address,
        1,
      );
      expect(tokenIdOfOwnerByIndex).to.equal(3);
    });

    it("Token Uri Changed", async function () {
      const questId = 3;
      await adminContract
        .connect(owner)
        .setWinnerRewards(questId, [addr3.address]);
      await adminContract.connect(addr3).mintForWinner(questId);

      const erc721Owner1 = await nftContract.ownerOf(5);
      expect(erc721Owner1).to.equal(addr3.address);
      const tokenUri = await nftContract.tokenURI(5);
      expect(tokenUri).to.equal(
        "https://amethyst-managing-cephalopod-66.mypinata.cloud/ipfs/QmRZT54gQ7eYF7gSU62R7wCy6PiBaSu8zsMEm8494Fj5qP",
      );

      nftContract.connect(owner).setBaseTokenURI("test");
      await adminContract.connect(addr3).mintForWinner(questId);
      const erc721Owner2 = await nftContract.ownerOf(6);
      expect(erc721Owner2).to.equal(addr3.address);

      const erc721Owner3 = await nftContract.tokenURI(6);
      expect(erc721Owner3).to.equal("test");
    });

   
  });

  describe("New Nft for multiple winner list", function () {
    it("Should mintForWinner NFT only for winners", async function () {
      const questId = 4;
      await adminContract
        .connect(owner)
        .setWinnerRewards(questId, [
          addr1.address,
          addr2.address,
          addr3.address,
        ]);
      await adminContract
        .connect(owner)
        .removeWinners(questId, [addr3.address]);
      await adminContract.connect(addr1).mintForWinner(questId);
      await adminContract.connect(addr2).mintForWinner(questId);
      await expect(
        adminContract.connect(addr3).mintForWinner(questId),
      ).to.be.revertedWith("Only a winner can mint");
      const erc721Owner1 = await nftContract2.ownerOf(1);
      const erc721Owner2 = await nftContract2.ownerOf(2);
      expect(erc721Owner1).to.equal(addr1.address);
      expect(erc721Owner2).to.equal(addr2.address);
    });
  });

  describe("DappRadarNFT Admin Role Management", function () {
    it("Should allow the default admin to grant admin role to another account", async function () {
      await nftContract.connect(owner).grantAdminRole(addr1.address);
      expect(
        await nftContract.hasRole(
          await nftContract.DEFAULT_ADMIN_ROLE(),
          addr1.address,
        ),
      ).to.be.true;
    });

    it("Should allow the default admin to revoke admin role from another account", async function () {
      await nftContract.connect(owner).grantAdminRole(addr1.address);
      await nftContract.connect(owner).revokeAdminRole(addr1.address);
      expect(
        await nftContract.hasRole(
          await nftContract.DEFAULT_ADMIN_ROLE(),
          addr1.address,
        ),
      ).to.be.false;
    });

    it("Should allow an admin to renounce their admin role", async function () {
      await nftContract.connect(owner).grantAdminRole(addr1.address);
      await nftContract.connect(addr1).renounceAdminRole();
      expect(
        await nftContract.hasRole(
          nftContract.DEFAULT_ADMIN_ROLE(),
          addr1.address,
        ),
      ).to.be.false;
    });
  });

  describe("RewardMinter for Endless Quest", function () {
    it("Should verify the signatures and mint the NFT", async function () {
      await adminContract
        .connect(owner)
        .setNFTContractAddress(111, nftContract.target);
      await adminContract.connect(owner).setQuestClaimStatus(111, true);
      const questId = 111;
      const winnerAddress = winner1.address;
      console.log(`winnerAddress: ${winnerAddress}`);
      console.log(`questId: ${questId}`);
      console.log(`owner.address: ${owner.address}`);
      console.log(adminContract.target);

      const domain = {
        name: "DappRadar NFT Minting",
        version: "1",
        chainId: 31337,
        verifyingContract: adminContract.target,
      };
      const types = {
        MintNft: [
          { name: "userAddress", type: "address" },
          { name: "questId", type: "uint256" },
        ],
      };
      const message = {
        userAddress: winner1.address,
        questId: questId,
      };

      const ownerSignature = await owner.signTypedData(domain, types, message);
      console.log(ownerSignature);
      await adminContract
        .connect(winner1)
        .mintForEndlessQuest(questId, owner.address, ownerSignature);
    });
  });
});
