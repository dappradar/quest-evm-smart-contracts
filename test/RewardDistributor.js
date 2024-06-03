const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Quests Contract", function () {
  let questsDappRadar,
    assetsHolder,
    erc20Token,
    erc20V2Token,
    erc20TokenV3,
    erc721Token,
    erc721TokenV2,
    erc721TokenV3,
    erc1155Token;
  let owner, admin, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8;

  before(async () => {
    const AssetsHolder = await ethers.getContractFactory("AssetsHolder");
    assetsHolder = await AssetsHolder.deploy();
    await assetsHolder.waitForDeployment();

    const QuestsDappRadar = await ethers.getContractFactory("QuestsDappRadar");
    questsDappRadar = await QuestsDappRadar.deploy(assetsHolder.target);
    questsDappRadarV2 = await QuestsDappRadar.deploy(assetsHolder.target);
    await questsDappRadar.waitForDeployment();
    [owner, admin, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8] =
      await ethers.getSigners();

    await assetsHolder.setQuestsDappRadarApprovalStatus(
      questsDappRadar.target,
      true,
    );
    await questsDappRadar.setNewAdmin(admin.address);
    await questsDappRadarV2.setNewAdmin(admin.address);
    // Deploy ERC20 token
    const ERC20Token = await ethers.getContractFactory("ElonToken");
    erc20Token = await ERC20Token.deploy(
      "ElonToken",
      "TT",
      questsDappRadar.target,
      4000,
    );

    erc20TokenV3 = await ERC20Token.deploy(
      "ElonTokenV3",
      "TTV3",
      questsDappRadarV2.target,
      2000,
    );

    const ERC20TokenV2 = await ethers.getContractFactory("ElonToken");
    erc20TokenV2 = await ERC20TokenV2.deploy(
      "ElonTokenV2",
      "TTV2",
      assetsHolder.target,
      3000,
    );

    // Deploy ERC721 token
    const ERC721Token = await ethers.getContractFactory("ElonNFT");
    erc721Token = await ERC721Token.deploy(addr8.address);
    for (let tokenId = 1; tokenId <= 20; tokenId++) {
      await erc721Token
        .connect(addr8)
        .transferFrom(addr8.address, assetsHolder.target, tokenId);
    }

    const ERC721TokenV2 = await ethers.getContractFactory("ElonNFT");
    erc721TokenV2 = await ERC721TokenV2.deploy(assetsHolder.target);

    const ERC721TokenV3 = await ethers.getContractFactory("ElonNFT");
    erc721TokenV3 = await ERC721TokenV3.deploy(assetsHolder.target);

    // Deploy ERC1155 token
    const ERC1155Token = await ethers.getContractFactory("MyERC1155Token");
    erc1155Token = await ERC1155Token.deploy(assetsHolder.target);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await questsDappRadar.owner()).to.equal(owner.address);
    });
  });

  describe("createQuest", function () {
    it("Should create a new quest", async function () {
      await questsDappRadar
        .connect(admin)
        .createQuest(
          1,
          [erc20Token.target],
          [erc721Token.target],
          [erc1155Token.target],
        );
      const quest = await questsDappRadar.getQuestData(1);
      expect(quest.erc20RewardAddresses[0]).to.equal(erc20Token.target);
      expect(quest.erc721RewardAddresses[0]).to.equal(erc721Token.target);
      expect(quest.erc1155RewardAddresses[0]).to.equal(erc1155Token.target);
    });

    it("Should fail if quest already exists", async function () {
      await expect(
        questsDappRadar
          .connect(admin)
          .createQuest(
            1,
            [erc20Token.target],
            [erc721Token.target],
            [erc1155Token.target],
          ),
      ).to.be.revertedWith(/Quest already exists/);
    });
  });

  describe("setQuestClaimStatus", function () {
    it("Should set the claim status of a quest", async function () {
      await questsDappRadar.connect(admin).setQuestClaimStatus(1, true);
      const questData = await questsDappRadar.getQuestData(1);
      expect(questData.isClaimable).to.equal(true);
    });
  });

  describe("setQuestsDappRadarApprovalStatus", function () {
    it("Should set the approval status of a QuestsDappRadar contract", async function () {
      await assetsHolder.setQuestsDappRadarApprovalStatus(
        questsDappRadar.target,
        true,
      );
      expect(
        await assetsHolder.isQuestsDappRadarApproved(questsDappRadar.target),
      ).to.equal(true);
    });
  });

  describe("setWinnerRewards", function () {
    it("Should set winner rewards", async function () {
      await questsDappRadar
        .connect(admin)
        .addERC20RewardToQuest(1, erc20Token.target, 500);
      const erc20Rewards = [{ tokenAddress: erc20Token.target, amount: 100 }];
      const erc20Rewards2 = [{ tokenAddress: erc20Token.target, amount: 200 }];
      const erc721Rewards = [{ tokenAddress: erc721Token.target, tokenId: 1 }];
      const erc1155Rewards = [
        { tokenAddress: erc1155Token.target, tokenId: 1, amount: 1 },
      ];

      await questsDappRadar
        .connect(admin)
        .setWinnerRewards(
          1,
          [addr1.address, addr2.address],
          [erc20Rewards, erc20Rewards2],
          [erc721Rewards, []],
          [erc1155Rewards, []],
        );
      const [erc20Amount, erc721Id, erc1155Reward] =
        await questsDappRadar.checkWinner(1, addr1.address);
      const [erc20Amount2, erc721Id2, erc1155Reward2] =
        await questsDappRadar.checkWinner(1, addr2.address);

      expect(erc20Amount[0]).to.equal(100);
      expect(erc20Amount2[0]).to.equal(200);
      expect(erc721Id[0]).to.equal(1);
      expect(erc1155Reward[0].tokenId).to.equal(1);
      expect(erc1155Reward[0].amount).to.equal(1);
    });
  });

  describe("claimReward", function () {
    it("Should claim the reward", async function () {
      await questsDappRadar.connect(addr1).claimReward(1);
      await questsDappRadar.connect(addr2).claimReward(1);

      const erc20Balance = await erc20Token.balanceOf(addr1.address);
      const erc721Owner = await erc721Token.ownerOf(1);
      const erc1155Balance = await erc1155Token.balanceOf(addr1.address, 1);

      const erc20Balance2 = await erc20Token.balanceOf(addr2.address);
      const erc721Owner2 = await erc721Token.ownerOf(1);
      const erc1155Balance2 = await erc1155Token.balanceOf(addr2.address, 1);

      expect(erc20Balance).to.equal(100);
      expect(erc721Owner).to.equal(addr1.address);
      expect(erc1155Balance).to.equal(1);
      expect(erc20Balance2).to.equal(200);
    });
  });

  describe("removeWinner", function () {
    it("Should remove a winner from a quest", async function () {
      await questsDappRadar
        .connect(admin)
        .createQuest(
          2,
          [erc20Token.target],
          [erc721Token.target],
          [erc1155Token.target],
        );
      const erc20Rewards = [{ tokenAddress: erc20Token.target, amount: 500 }];
      const erc721Rewards = [{ tokenAddress: erc721Token.target, tokenId: 2 }];
      const erc1155Rewards = [
        { tokenAddress: erc1155Token.target, tokenId: 2, amount: 1 },
      ];
      await questsDappRadar
        .connect(admin)
        .addERC20RewardToQuest(2, erc20Token.target, 500);
      await questsDappRadar
        .connect(admin)
        .setWinnerRewards(
          2,
          [addr2.address],
          [erc20Rewards],
          [erc721Rewards],
          [erc1155Rewards],
        );

      // Remove the winner
      await questsDappRadar.connect(admin).removeWinner(2, addr2.address);
      const amount = await questsDappRadar.getQuestERC20Amount(
        2,
        erc20Token.target,
      );
      // Check that the winner was removed
      const [erc20Amount, erc721Id, erc1155Reward] =
        await questsDappRadar.checkWinner(2, addr2.address);
      expect(amount).to.equal(500);
      expect(erc20Amount.length).to.equal(0);
      expect(erc721Id.length).to.equal(0);
      expect(erc1155Reward.length).to.equal(0);
    });
  });

  describe("createQuest", function () {
    it("Should revert with 'Rewards shouldn't be empty' if no rewards are provided", async function () {
      await expect(
        questsDappRadar.connect(admin).createQuest(3, [], [], []),
      ).to.be.revertedWith("Rewards shouldn't be empty");
    });
  });

  describe("QuestsDappRadar", function () {
    describe("createQuest", function () {
      it("Should revert with 'Quest already exists' if the quest already exists", async function () {
        await questsDappRadar
          .connect(admin)
          .createQuest(
            3,
            [erc20Token.target],
            [erc721Token.target],
            [erc1155Token.target],
          );
        await expect(
          questsDappRadar
            .connect(admin)
            .createQuest(
              3,
              [erc20Token.target],
              [erc721Token.target],
              [erc1155Token.target],
            ),
        ).to.be.revertedWith("Quest already exists");
      });
    });

    describe("Edge Cases", function () {
      it("Should revert with 'Quest does not exist' if the quest does not exist", async function () {
        const erc20Rewards = [{ tokenAddress: erc20Token.target, amount: 100 }];
        const erc721Rewards = [
          { tokenAddress: erc721Token.target, tokenId: 4 },
        ];
        const erc1155Rewards = [
          { tokenAddress: erc1155Token.target, tokenId: 5, amount: 1 },
        ];

        await expect(
          questsDappRadar
            .connect(admin)
            .setWinnerRewards(
              4,
              [addr1.address],
              [erc20Rewards],
              [erc721Rewards],
              [erc1155Rewards],
            ),
        ).to.be.revertedWith("Quest does not exist");
      });

      it("Insufficient Reward", async function () {
        await questsDappRadar
          .connect(admin)
          .createQuest(
            5,
            [erc20Token.target],
            [erc721Token.target],
            [erc1155Token.target],
          );
        await questsDappRadar
          .connect(admin)
          .addERC20RewardToQuest(5, erc20Token.target, 1000);

        const erc20Rewards = [
          [{ tokenAddress: erc20Token.target, amount: 600 }],
          [{ tokenAddress: erc20Token.target, amount: 500 }],
        ];
        await expect(
          questsDappRadar
            .connect(admin)
            .setWinnerRewards(
              5,
              [addr1.address, addr2.address],
              erc20Rewards,
              [[], []],
              [[], []],
            ),
        ).to.be.revertedWith("Insufficient reward");
      });

      it("check getQuestERC20Amount", async function () {
        await questsDappRadar
          .connect(admin)
          .setWinnerRewards(
            5,
            [addr3.address, addr4.address],
            [
              [{ tokenAddress: erc20Token.target, amount: 400 }],
              [{ tokenAddress: erc20Token.target, amount: 500 }],
            ],
            [[], []],
            [[], []],
          );
        await questsDappRadar.connect(admin).setQuestClaimStatus(5, true);
        const remainingReward = await questsDappRadar.getQuestERC20Amount(
          5,
          erc20Token.target,
        );
        expect(remainingReward).to.equal(100);
      });

      it("claim Reward", async function () {
        const [erc20Amount1] = await questsDappRadar.checkWinner(
          5,
          addr3.address,
        );
        expect(erc20Amount1[0]).to.equal(400);
        await questsDappRadar.connect(addr3).claimReward(5);
        const balance1 = await erc20Token.balanceOf(addr3.address);
        expect(balance1).to.equal(400);

        // Check and claim for addr2
        const [erc20Amount2] = await questsDappRadar.checkWinner(
          5,
          addr4.address,
        );
        expect(erc20Amount2[0]).to.equal(500);
        await questsDappRadar.connect(addr4).claimReward(5);
        const balance2 = await erc20Token.balanceOf(addr4.address);
        expect(balance2).to.equal(500);
      });

      it("should add two winners, remove one, claim reward, check remainingERC20Rewards, remove the winner that already claimed, and try to claim again", async () => {
        await questsDappRadar
          .connect(admin)
          .createQuest(6, [erc20Token.target], [], []);
        await questsDappRadar
          .connect(admin)
          .addERC20RewardToQuest(6, erc20Token.target, 1000);
        await questsDappRadar
          .connect(admin)
          .setWinnerRewards(
            6,
            [addr4.address, addr5.address],
            [
              [{ tokenAddress: erc20Token.target, amount: 300 }],
              [{ tokenAddress: erc20Token.target, amount: 700 }],
            ],
            [[], []],
            [[], []],
          );
        await questsDappRadar.connect(admin).setQuestClaimStatus(6, true);
        const maxReward1 = await questsDappRadar.getQuestERC20Amount(
          6,
          erc20Token.target,
        );
        expect(maxReward1).to.equal(0);

        await questsDappRadar.connect(admin).removeWinner(6, addr4.address);
        const maxReward2 = await questsDappRadar.getQuestERC20Amount(
          6,
          erc20Token.target,
        );
        expect(maxReward2).to.equal(300);

        await expect(
          questsDappRadar.connect(addr4).claimReward(6),
        ).to.be.revertedWith("Winner is not defined");

        await questsDappRadar.connect(addr5).claimReward(6);
        const balance1 = await erc20Token.balanceOf(addr5.address);
        expect(balance1).to.equal(700);
        const maxReward3 = await questsDappRadar.getQuestERC20Amount(
          6,
          erc20Token.target,
        );
        expect(maxReward3).to.equal(300);

        await questsDappRadar.connect(admin).removeWinner(6, addr5.address);
        await expect(
          questsDappRadar.connect(addr5).claimReward(6),
        ).to.be.revertedWith("Winner is not defined");

        const maxReward4 = await questsDappRadar.getQuestERC20Amount(
          6,
          erc20Token.target,
        );
        expect(maxReward4).to.equal(300);
      });

      it("Remove winner before setting a winner ", async () => {
        await questsDappRadar
          .connect(admin)
          .createQuest(7, [erc20Token.target], [], []);
        await questsDappRadar
          .connect(admin)
          .addERC20RewardToQuest(7, erc20Token.target, 1000);
        const maxReward1 = await questsDappRadar.getQuestERC20Amount(
          7,
          erc20Token.target,
        );
        expect(maxReward1).to.equal(1000);

        await questsDappRadar.connect(admin).removeWinner(7, addr4.address);
        const maxReward2 = await questsDappRadar.getQuestERC20Amount(
          7,
          erc20Token.target,
        );
        expect(maxReward2).to.equal(1000);
      });

      it("Can the AssetHolder work with 2 Logic Contracts and test setRemainingERC20RewardsForQuest ", async () => {
        await assetsHolder.setQuestsDappRadarApprovalStatus(
          questsDappRadarV2.target,
          true,
        );
        await questsDappRadarV2
          .connect(admin)
          .createQuest(1, [erc20TokenV2.target], [], []);
        await questsDappRadarV2
          .connect(admin)
          .setRemainingERC20RewardsForQuest(1, erc20TokenV2.target, 1000);
        await questsDappRadarV2
          .connect(admin)
          .setWinnerRewards(
            1,
            [addr4.address],
            [[{ tokenAddress: erc20TokenV2.target, amount: 300 }]],
            [[]],
            [[]],
          );
        await questsDappRadarV2.connect(admin).setQuestClaimStatus(1, true);

        const maxReward1 = await questsDappRadarV2.getQuestERC20Amount(
          1,
          erc20TokenV2.target,
        );
        expect(maxReward1).to.equal(700);
        await questsDappRadarV2.connect(addr4).claimReward(1);
        const balance1 = await erc20TokenV2.balanceOf(addr4.address);
        expect(balance1).to.equal(300);
        const maxReward2 = await questsDappRadarV2.getQuestERC20Amount(
          1,
          erc20TokenV2.target,
        );
        expect(maxReward2).to.equal(700);
      });

      it("Test with two winner and two different erc20, and first winner should take two different rewards, second will take only one of them ", async () => {
        await assetsHolder.setQuestsDappRadarApprovalStatus(
          questsDappRadarV2.target,
          true,
        );
        await questsDappRadarV2
          .connect(admin)
          .createQuest(2, [erc20TokenV2.target, erc20TokenV3.target], [], []);
        await questsDappRadarV2
          .connect(admin)
          .setRemainingERC20RewardsForQuest(2, erc20TokenV2.target, 1000);
        await questsDappRadarV2
          .connect(admin)
          .addERC20RewardToQuest(2, erc20TokenV3.target, 500);
        await questsDappRadarV2
          .connect(admin)
          .addERC20RewardToQuest(2, erc20TokenV3.target, 500);

        await questsDappRadarV2.connect(admin).setWinnerRewards(
          2,
          [addr6.address, addr7.address],
          [
            [
              { tokenAddress: erc20TokenV2.target, amount: 700 },
              { tokenAddress: erc20TokenV3.target, amount: 200 },
            ],
            [
              { tokenAddress: erc20TokenV2.target, amount: 0 },
              { tokenAddress: erc20TokenV3.target, amount: 400 },
            ],
          ],
          [[], []],
          [[], []],
        );
        await questsDappRadarV2.connect(admin).setQuestClaimStatus(2, true);

        const maxReward1 = await questsDappRadarV2.getQuestERC20Amount(
          2,
          erc20TokenV2.target,
        );
        expect(maxReward1).to.equal(300);
        const maxReward2 = await questsDappRadarV2.getQuestERC20Amount(
          2,
          erc20TokenV3.target,
        );
        expect(maxReward2).to.equal(400);

        await questsDappRadarV2.connect(addr6).claimReward(2);
        await questsDappRadarV2.connect(addr7).claimReward(2);
        const balance1 = await erc20TokenV2.balanceOf(addr6.address);
        const balance2 = await erc20TokenV3.balanceOf(addr6.address);
        const balance3 = await erc20TokenV2.balanceOf(addr7.address);
        const balance4 = await erc20TokenV3.balanceOf(addr7.address);
        expect(balance1).to.equal(700);
        expect(balance2).to.equal(200);
        expect(balance3).to.equal(0);
        expect(balance4).to.equal(400);

        const maxReward3 = await questsDappRadarV2.getQuestERC20Amount(
          2,
          erc20TokenV2.target,
        );
        expect(maxReward3).to.equal(300);
        const maxReward4 = await questsDappRadarV2.getQuestERC20Amount(
          2,
          erc20TokenV3.target,
        );
        expect(maxReward4).to.equal(400);
      });

      it("Test with two winner, 2 differenct erc20, 2 differenct nft, send 2 erc20, 1 nft to first winner and second take 2 nft and 1 erc20 ", async () => {
        await questsDappRadarV2
          .connect(admin)
          .createQuest(
            3,
            [erc20TokenV2.target, erc20TokenV3.target],
            [erc721TokenV2.target, erc721TokenV3.target],
            [],
          );

        await questsDappRadarV2
          .connect(admin)
          .setRemainingERC20RewardsForQuest(3, erc20TokenV2.target, 500);
        await questsDappRadarV2
          .connect(admin)
          .addERC20RewardToQuest(3, erc20TokenV3.target, 250);
        await questsDappRadarV2
          .connect(admin)
          .addERC20RewardToQuest(3, erc20TokenV3.target, 350);
        await questsDappRadarV2.connect(admin).setWinnerRewards(
          3,
          [addr1.address, addr2.address],
          [
            [
              { tokenAddress: erc20TokenV2.target, amount: 100 },
              { tokenAddress: erc20TokenV3.target, amount: 200 },
            ],
            [
              { tokenAddress: erc20TokenV2.target, amount: 0 },
              { tokenAddress: erc20TokenV3.target, amount: 400 },
            ],
          ],
          [
            [
              { tokenAddress: erc721TokenV2.target, tokenId: 0 },
              { tokenAddress: erc721TokenV3.target, tokenId: 2 },
            ],
            [
              { tokenAddress: erc721TokenV2.target, tokenId: 2 },
              { tokenAddress: erc721TokenV3.target, tokenId: 1 },
            ],
          ],
          [[], []],
        );

        await questsDappRadarV2.connect(admin).setQuestClaimStatus(3, true);

        const maxReward1 = await questsDappRadarV2.getQuestERC20Amount(
          3,
          erc20TokenV2.target,
        );
        expect(maxReward1).to.equal(400);
        const maxReward2 = await questsDappRadarV2.getQuestERC20Amount(
          3,
          erc20TokenV3.target,
        );
        expect(maxReward2).to.equal(0);

        await questsDappRadarV2.connect(addr1).claimReward(3);
        await questsDappRadarV2.connect(addr2).claimReward(3);
        const balance1 = await erc20TokenV2.balanceOf(addr1.address);
        const balance2 = await erc20TokenV3.balanceOf(addr1.address);
        const balance3 = await erc20TokenV2.balanceOf(addr2.address);
        const balance4 = await erc20TokenV3.balanceOf(addr2.address);

        // const ownerOf1 = await erc721TokenV2.ownerOf(1);
        const ownerOf2 = await erc721TokenV2.ownerOf(2);
        const ownerOf3 = await erc721TokenV3.ownerOf(2);
        const ownerOf4 = await erc721TokenV3.ownerOf(1);
        expect(balance1).to.equal(100);
        expect(balance2).to.equal(200);
        expect(balance3).to.equal(0);
        expect(balance4).to.equal(400);

        // expect(ownerOf1).to.equal(addr1.address);
        expect(ownerOf2).to.equal(addr2.address);
        expect(ownerOf3).to.equal(addr1.address);
        expect(ownerOf4).to.equal(addr2.address);
      });

      it("Check all type of Erc20, Erc721, Erc1155", async () => {
        await expect(
          questsDappRadarV2
            .connect(admin)
            .createQuest(
              4,
              [erc1155Token.target],
              [erc721TokenV2.target],
              [erc1155Token.target],
            ),
        ).to.be.revertedWith("That contract does not have ERC20 standards");

        await expect(
          questsDappRadarV2
            .connect(admin)
            .createQuest(
              4,
              [erc721TokenV2.target],
              [erc721TokenV2.target],
              [erc1155Token.target],
            ),
        ).to.be.revertedWith("That contract does not have ERC20 standards");

        await expect(
          questsDappRadarV2
            .connect(admin)
            .createQuest(
              4,
              [erc20Token.target],
              [erc1155Token.target],
              [erc1155Token.target],
            ),
        ).to.be.revertedWith("That contract does not have ERC721 standards");

        await expect(
          questsDappRadarV2
            .connect(admin)
            .createQuest(
              4,
              [erc20Token.target],
              [erc20Token.target],
              [erc1155Token.target],
            ),
        ).to.be.revertedWith("That contract does not have ERC721 standards");

        await expect(
          questsDappRadarV2
            .connect(admin)
            .createQuest(
              4,
              [erc20Token.target],
              [erc721TokenV2.target],
              [erc20Token.target],
            ),
        ).to.be.revertedWith("That contract does not have ERC1155 standards");

        await expect(
          questsDappRadarV2
            .connect(admin)
            .createQuest(
              4,
              [erc20Token.target],
              [erc721TokenV2.target],
              [erc721TokenV2.target],
            ),
        ).to.be.revertedWith("That contract does not have ERC1155 standards");
      });
    });
  });

  describe("AssetsHolder Contract", function () {
    it("Should return true for ERC721 interface", async function () {
      const supportsERC721 = await assetsHolder.supportsInterface("0x150b7a02");
      expect(supportsERC721).to.equal(true);
    });

    it("Should return true for supportsERC1155 interface", async function () {
      const supportsERC1155 =
        await assetsHolder.supportsInterface("0x4e2312e0");
      expect(supportsERC1155).to.equal(true);
    });
  });
});
