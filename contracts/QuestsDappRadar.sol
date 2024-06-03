// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../interfaces/IAssetsHolder.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract QuestsDappRadar is Ownable2Step, ReentrancyGuard, Pausable {
    IAssetsHolder public assetsHolder;
    address public admin;

    struct ERC20TokenInfo {
        address tokenAddress;
        uint256 amount;
    }

    struct ERC721TokenInfo {
        address tokenAddress;
        uint256 tokenId;
    }

    struct ERC1155TokenInfo {
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
    }

    struct QuestData {
        address[] erc20RewardAddresses;
        address[] erc721RewardAddresses;
        address[] erc1155RewardAddresses;
        bool isClaimable;
    }

    struct ERC1155TokenReward {
        uint256 tokenId;
        uint256 amount;
    }

    mapping(uint256 questId => mapping(address erc20Address => uint256 amount)) private remainingERC20Rewards;
    mapping(uint256 questId => QuestData) private questRewards;
    mapping(uint256 questId => mapping(address winner => uint256[] amounts)) private erc20Winner;
    mapping(uint256 questId => mapping(address winner => uint256[] nftId)) private erc721Winner;
    mapping(uint256 questId => mapping(address winner => ERC1155TokenReward[] erc1155RewardDetail)) private erc1155Winner;

    constructor(IAssetsHolder _assetsHolder) {
        assetsHolder = _assetsHolder;
    }
    
    /// @dev Modifier to make a function callable only by the admin.
    modifier onlyAdmin() {
        require(msg.sender == admin, "This function can only be called by admin");
        _;
    }

    /// @notice Sets a new admin for the contract.
    /// @dev This function can only be called by the current admin.
    /// @param newAdmin The address of the new admin.
    function setNewAdmin(address newAdmin) external onlyOwner {
        admin = newAdmin;
    }

    /// @notice Creates a new quest with the provided reward tokens.
    /// @dev This function can only be called by the owner of the contract.
    /// @param questId The unique identifier for the new quest.
    /// @param erc20RewardAddresses An array of addresses for the ERC20 reward tokens.
    /// @param erc721RewardAddresses An array of addresses for the ERC721 reward tokens.
    /// @param erc1155RewardAddresses An array of addresses for the ERC1155 reward tokens.
    function createQuest(
        uint256 questId,
        address[] memory erc20RewardAddresses,
        address[] memory erc721RewardAddresses,
        address[] memory erc1155RewardAddresses
    ) external onlyAdmin {
        require(erc20RewardAddresses.length > 0 || erc721RewardAddresses.length > 0 || erc1155RewardAddresses.length > 0, "Rewards shouldn't be empty");
        require(questRewards[questId].erc20RewardAddresses.length == 0 && questRewards[questId].erc721RewardAddresses.length == 0 && questRewards[questId].erc1155RewardAddresses.length == 0, "Quest already exists");

        uint256 erc20RewardAddressesLength = erc20RewardAddresses.length;
        for (uint256 i = 0; i < erc20RewardAddressesLength; ++i) {
            require(isLikelyERC20(erc20RewardAddresses[i]), "That contract does not have ERC20 standards");
        }

        uint256 erc721RewardAddressesLength = erc721RewardAddresses.length;
        for (uint256 j = 0; j < erc721RewardAddressesLength; ++j) {
            require(isLikelyERC721(erc721RewardAddresses[j]), "That contract does not have ERC721 standards");
        }

        uint256 erc1155RewardAddressesLength = erc1155RewardAddresses.length;
        for (uint256 k = 0; k < erc1155RewardAddressesLength; ++k) {
            require(isLikelyERC1155(erc1155RewardAddresses[k]), "That contract does not have ERC1155 standards");
        }

        QuestData storage reward = questRewards[questId];
        reward.erc20RewardAddresses = erc20RewardAddresses;
        reward.erc721RewardAddresses = erc721RewardAddresses;
        reward.erc1155RewardAddresses = erc1155RewardAddresses;
        emit QuestCreated(questId);
    }

    /// @notice Sets the rewards for multiple winners of a quest.
    /// @dev This function can only be called by the owner of the contract.
    /// @param questId The unique identifier for the quest.
    /// @param winners An array of addresses of the winners.
    /// @param erc20Rewards An array of arrays of ERC20TokenInfo structs for the ERC20 reward tokens for each winner.
    /// @param erc721Rewards An array of arrays of ERC721TokenInfo structs for the ERC721 reward tokens for each winner.
    /// @param erc1155Rewards An array of arrays of ERC1155TokenInfo structs for the ERC1155 reward tokens for each winner.
    function setWinnerRewards(
        uint256 questId,
        address[] memory winners,
        ERC20TokenInfo[][] memory erc20Rewards,
        ERC721TokenInfo[][] memory erc721Rewards,
        ERC1155TokenInfo[][] memory erc1155Rewards
    ) external onlyAdmin {
        require(
            winners.length == erc20Rewards.length &&
            winners.length == erc721Rewards.length &&
            winners.length == erc1155Rewards.length,
            "Input lengths do not match"
        );
        QuestData memory reward = questRewards[questId];
        require(reward.erc20RewardAddresses.length > 0 || reward.erc721RewardAddresses.length > 0 || reward.erc1155RewardAddresses.length > 0, "Quest does not exist");

        for (uint256 i = 0; i < winners.length; ++i) {
            for (uint256 l = 0; l < erc20Rewards[i].length; ++l) {
                require(reward.erc20RewardAddresses[l] == erc20Rewards[i][l].tokenAddress, "You should follow order");
                uint256 currentReward = remainingERC20Rewards[questId][erc20Rewards[i][l].tokenAddress];
                require(currentReward >= erc20Rewards[i][l].amount, "Insufficient reward");
                remainingERC20Rewards[questId][erc20Rewards[i][l].tokenAddress] = currentReward - erc20Rewards[i][l].amount;
                erc20Winner[questId][winners[i]].push(erc20Rewards[i][l].amount);
            }

            for (uint256 j = 0; j < erc721Rewards[i].length; ++j) {
                require(reward.erc721RewardAddresses[j] == erc721Rewards[i][j].tokenAddress, "You should follow order");
                erc721Winner[questId][winners[i]].push(erc721Rewards[i][j].tokenId);
            }

            for (uint256 k = 0; k < erc1155Rewards[i].length; ++k) {
                require(reward.erc1155RewardAddresses[k] == erc1155Rewards[i][k].tokenAddress, "You should follow order");
                erc1155Winner[questId][winners[i]].push(ERC1155TokenReward(erc1155Rewards[i][k].tokenId, erc1155Rewards[i][k].amount));
            }
            emit WinnerSet(questId, winners[i]);
        }
    }

    /// @notice Sets the claim status of a quest.
    /// @dev This function can only be called by the owner of the contract.
    /// @param questId The unique identifier for the quest.
    /// @param availability The new claim status for the quest.
    function setQuestClaimStatus(uint256 questId, bool availability) external onlyAdmin {
        questRewards[questId].isClaimable = availability;
    }

    /// @notice Sets the ERC20 amount for a specific quest without transferring any tokens.
    /// @dev This function can only be called by the owner of the contract.
    /// @param questId The unique identifier for the quest whose ERC20 amount is to be set.
    /// @param token The address of the ERC20 token.
    /// @param amount The new amount of the ERC20 token for the quest.
    function setRemainingERC20RewardsForQuest(uint256 questId, address token, uint256 amount) external onlyAdmin {
        remainingERC20Rewards[questId][token] = amount;
    }

    /// @notice Transfers ERC20 tokens from the contract owner to the assetsHolder and updates the ERC20 amount for a specific quest.
    /// @dev This function can only be called by the owner of the contract.
    /// @param token The address of the ERC20 token to be transferred.
    /// @param amount The amount of the ERC20 token to be transferred.
    /// @param questId The unique identifier for the quest whose ERC20 amount is to be updated.
    function addERC20RewardToQuest(uint256 questId, address token, uint256 amount) external onlyAdmin {
        require(IERC20(token).transfer(address(assetsHolder), amount), "Transfer failed");
        remainingERC20Rewards[questId][token] += amount;
    }

    /// @notice Retrieves the total ERC20 amount associated with a specific quest.
    /// @param questId The unique identifier for the quest.
    /// @return The total ERC20 amount associated with the quest.
    function getQuestERC20Amount(uint256 questId,address token) public view returns (uint256) {
        return remainingERC20Rewards[questId][token];
    }

    /// @notice Allows a user to claim the reward for a quest.
    /// @dev This function can only be called when the contract is not paused.
    /// @param questId The unique identifier for the quest.
    function claimReward(uint256 questId) external nonReentrant whenNotPaused {
        require(questRewards[questId].isClaimable, "Can not yet claim rewards");
        QuestData memory reward = questRewards[questId];
        uint256[] memory erc20tokensAmount = erc20Winner[questId][msg.sender];
        uint256[] memory erc721tokensId = erc721Winner[questId][msg.sender];
        ERC1155TokenReward[] memory erc1155Details = erc1155Winner[questId][msg.sender];

        require(erc20tokensAmount.length > 0 || erc721tokensId.length > 0 || erc1155Details.length > 0, "Winner is not defined");
        delete erc20Winner[questId][msg.sender];
        delete erc721Winner[questId][msg.sender];
        delete erc1155Winner[questId][msg.sender];

        for (uint256 i = 0; i < erc20tokensAmount.length; ++i) {
            if(erc20tokensAmount[i] > 0){
                assetsHolder.transferERC20(reward.erc20RewardAddresses[i], erc20tokensAmount[i], msg.sender);
            }
        }

        for (uint256 j = 0; j < erc721tokensId.length; ++j) {
            if(erc721tokensId[j] > 0){
                assetsHolder.transferERC721(reward.erc721RewardAddresses[j], erc721tokensId[j], msg.sender);
            }
        }

        for (uint256 k = 0; k < erc1155Details.length; ++k) {
            if(erc1155Details[k].amount > 0){
                assetsHolder.transferERC1155(reward.erc1155RewardAddresses[k], erc1155Details[k].tokenId, erc1155Details[k].amount, msg.sender, "");
            }
        }

        emit RewardClaimed(questId, msg.sender, erc20tokensAmount, erc721tokensId, erc1155Details);
    }

    /// @notice Checks the rewards for a winner of a quest.
    /// @param questId The unique identifier for the quest.
    /// @param winner The address of the winner.
    function checkWinner(uint256 questId, address winner) external view returns (uint256[] memory, uint256[] memory,  ERC1155TokenReward[] memory) {
        uint256[] memory erc20Amount = erc20Winner[questId][winner];
        uint256[] memory erc721Id = erc721Winner[questId][winner];
        ERC1155TokenReward[] memory erc1155IdAmount = erc1155Winner[questId][winner];
        return (erc20Amount, erc721Id, erc1155IdAmount);
    }

    /// @notice Gets the data for a quest.
    /// @param questId The unique identifier for the quest.
    function getQuestData(uint256 questId) external view returns (QuestData memory) {
        return questRewards[questId];
    }

    /// @notice Removes a winner from a quest.
    /// @dev This function can only be called by the owner of the contract.
    /// @param questId The unique identifier for the quest.
    /// @param winner The address of the winner.
    function removeWinner(uint256 questId, address winner) external onlyAdmin {
        uint256[] memory erc20tokensAmount = erc20Winner[questId][winner];
        for (uint256 i = 0; i < erc20tokensAmount.length; ++i) {
            remainingERC20Rewards[questId][questRewards[questId].erc20RewardAddresses[i]] += erc20tokensAmount[i];
        }
        delete erc20Winner[questId][winner];
        delete erc721Winner[questId][winner];
        delete erc1155Winner[questId][winner];
    }

    /// @notice Checks if a contract is likely an ERC20 contract.
    /// @param _token The address of the contract.
    function isLikelyERC20(address _token) internal view returns (bool) {
        try IERC20(_token).allowance(address(this), msg.sender) returns (uint256) {
            return true;
        } catch {
            return false;
        }
    }

    /// @notice Checks if a contract is likely an ERC721 contract.
    /// @param _token The address of the contract.
    function isLikelyERC721(address _token) internal view returns (bool) {
         bytes4 erc721InterfaceID = 0x80ac58cd;
        try IERC165(_token).supportsInterface(erc721InterfaceID) returns (bool result) {
            return result;
        } catch {
            return false;
        }
    }

    /// @notice Checks if a contract is likely an ERC1155 contract.
    /// @param _token The address of the contract.
    function isLikelyERC1155(address _token) internal view returns (bool) {
        bytes4 erc1155InterfaceID = 0xd9b67a26;
        try IERC165(_token).supportsInterface(erc1155InterfaceID) returns (bool supportsERC1155) {
            return supportsERC1155;
        } catch {
            return false;
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    event QuestCreated(uint256 questId);
    event WinnerSet(uint256 questId, address winner);
    event RewardClaimed(
        uint256 questId,
        address claimer,
        uint256[] erc20tokensAmount,
        uint256[] erc721tokensId,
        ERC1155TokenReward[] erc1155Details
    );
}
