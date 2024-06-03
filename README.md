# Quests Smart Contracts Evm

## Usage

To use the AssetsHolder contract, you first need to deploy it.

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
