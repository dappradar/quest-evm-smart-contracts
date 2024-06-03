# Quests Smart Contracts Evm

# Adding a New Chain to Quest Service

To add a new chain to the Quest Service, you need to update the `hardhat.config.js` file with new network and Etherscan configuration details. Below is an example of how to configure a new chain, specifically for the Polygon network.

## Configuration

Update your `hardhat.config.js` with the following network configuration for Polygon:

```javascript
module.exports = {
  networks: {
    polygon: {
      url: "https://polygon.meowrpc.com",
      accounts: ["<Private key>"],
    }
  },
  etherscan: {
    apiKey: {
      polygon: "<Api Key>",
    }
  }
};
```

## Deployment

Use the following commands to deploy and manage contracts on the Polygon network:

1. **Deploy the TokenHolder contract:**
   ```shell
   npx hardhat run scripts/deployTokenHolder.js --network polygon

2. **Verify the TokenHolder contract:**
   ```shell
   npx hardhat verify --network polygon <contractAddress>

3. **Before running the deployment, ensure to update this line in the deploy.js script as specified:**
Update this [line](https://github.com/dappradar/quests-smart-contracts-evm/blob/802006fbaf2021a3b4d2253668dc97232890defa/scripts/deploy.js#L3) with token holder before deploy.js.

4. **Deploy the quest service contract:**
   ```shell
   npx hardhat run scripts/deploy.js --network polygon

5. **Verify the quest service contract:**
   ```shell
   npx hardhat verify --network polygon <contractAddress> <tokenHolderAddress>

6. **setQuestsDappRadarApprovalStatus:**
   ```shell
   setQuestsDappRadarApprovalStatus <QuestsDappRadar Address> in TokenHolder

7. **setNewAdmin:**
   ```shell
   setNewAdmin <Our signer wallet> in QuestsDappRadar

8. **Transfer ownerships if needed**

9. **If you wish to deploy ERC20, update this line with your wallet address:**
Update this [line](https://github.com/dappradar/quests-smart-contracts-evm/blob/802006fbaf2021a3b4d2253668dc97232890defa/scripts/deployErc20.js#L6)

9. **Deploy the ERC20 contract:**
   ```shell
   npx hardhat run scripts/deployErc20.js --network polygon

9. **Verify the ERC20:**
   ```shell
   npx hardhat verify --network polygon <contract address> Test TEST <mint tokens to this address> <mint token amount with decimals>

## Usage

To use the AssetsHolder contract, you first need to deploy it. You can use the provided deployment script deployTokenHolder.js to do this.

After deployment, you can call the following functions:

- transferERC20(address tokenAddress, uint256 amount, address recipient): Transfers the specified amount of an ERC20 token to the recipient.
- transferERC721(address tokenAddress, uint256 tokenId, address recipient): Transfers an ERC721 token with the specified ID to the recipient.
- transferERC1155(address tokenAddress, uint256 id, uint256 amount, address recipient, bytes calldata data): Transfers the specified amount of an ERC1155 token with the given ID to the recipient.
  QuestsDappRadar

The QuestsDappRadar contract is used to manage quests and rewards. It interacts with the AssetsHolder contract to distribute rewards.

To use the QuestsDappRadar contract, you first need to deploy it. During deployment, you need to pass the address of the AssetsHolder contract to the constructor.

After deployment, you can call the following functions:

- createQuest(uint256 questId, address[] memory erc20Rewards, address[] memory erc721Rewards, address[] memory erc1155Rewards): Creates a new quest with the specified rewards.
- setWinnerReward(uint256 questId, address winner, ERC20TokenInfo[] memory erc20Rewards, ERC721TokenInfo[] memory erc721Rewards, ERC1155TokenInfo[] memory erc1155Rewards): Sets the rewards for a winner of a quest.
- claimReward(uint256 questId): Allows a winner to claim their rewards.

Please note that the claimReward function should be called by the winner of the quest.

## Contracts
