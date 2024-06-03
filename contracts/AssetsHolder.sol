// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title AssetsHolder
 * @dev This contract is an asset holder that can hold and transfer ERC20, ERC721, and ERC1155 tokens.
 * It also has a mechanism to approve contracts for interacting with it.
 */
contract AssetsHolder is Ownable2Step, IERC721Receiver, IERC1155Receiver {
    
    mapping(address => bool) public isQuestsDappRadarApproved;

    /**
     * @dev Ensures that only approved contracts or the owner can call the function.
     */
    modifier onlyApprovedOrOwner() {
        require(isQuestsDappRadarApproved[msg.sender] || msg.sender == owner(), "Only approved contract or owner can call this function");
        _;
    }

    /**
     * @dev Sets the approval status of a contract.
     * @param _contract The address of the contract.
     * @param _status The new approval status.
     */
    function setQuestsDappRadarApprovalStatus(address _contract, bool _status) external onlyOwner {
        require(_contract != address(0), "Approved contract cannot be zero address");
        uint32 size;
        assembly {
            size := extcodesize(_contract)
        }
        require(size > 0, "Must be a contract address");
        isQuestsDappRadarApproved[_contract] = _status;
        emit QuestsDappRadarApprovalStatusUpdated(_contract, _status);
    }

    /**
     * @dev Transfers ERC1155 tokens from this contract to a recipient.
     * @param tokenAddress The address of the ERC1155 token.
     * @param id The id of the token.
     * @param amount The amount of tokens to transfer.
     * @param recipient The address to receive the tokens.
     * @param data Additional data to send with the transfer.
     */
    function transferERC1155(address tokenAddress, uint256 id, uint256 amount, address recipient, bytes calldata data) external onlyApprovedOrOwner {
        IERC1155(tokenAddress).safeTransferFrom(address(this), recipient, id, amount, data);
    }

    /**
     * @dev Transfers an ERC721 token from this contract to a recipient.
     * @param tokenAddress The address of the ERC721 token.
     * @param tokenId The id of the token.
     * @param recipient The address to receive the token.
     */
    function transferERC721(address tokenAddress, uint256 tokenId, address recipient) external onlyApprovedOrOwner {
        IERC721(tokenAddress).safeTransferFrom(address(this), recipient, tokenId);
    }

    /**
     * @dev Transfers ERC20 tokens from this contract to a recipient.
     * @param tokenAddress The address of the ERC20 token.
     * @param amount The amount of tokens to transfer.
     * @param recipient The address to receive the tokens.
     */
    function transferERC20(address tokenAddress, uint256 amount, address recipient) external onlyApprovedOrOwner {
        IERC20(tokenAddress).transfer(recipient, amount);
    }

    /**
     * @dev Handles the receipt of an ERC721 token.
     * @return bytes4 `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
     */
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
        
    /**
     * @dev Handles the receipt of an ERC1155 token.
     * @return bytes4 `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
     */
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    /**
     * @dev Handles the receipt of multiple ERC1155 tokens.
     * @return bytes4 `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
     */
    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure override returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }

    /**
     * @dev Checks if the contract supports an interface.
     * @param interfaceId The id of the interface.
     * @return bool True if the contract supports the interface, false otherwise.
     */
    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(IERC721Receiver).interfaceId || interfaceId == type(IERC1155Receiver).interfaceId;
    }

    /**
     * @dev Emitted when the approval status of a contract is updated.
     * @param contractAddress The address of the contract.
     * @param status The new approval status.
     */
    event QuestsDappRadarApprovalStatusUpdated(address indexed contractAddress, bool status);
}