// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "../interfaces/INFT.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Verifier.sol";

contract RewardMinter is Ownable2Step, Pausable, ReentrancyGuard, Verifier {
    mapping(uint256 questId => mapping(address winnerAddress => bool)) private questWinners;
    mapping(uint256 questId => address nftAddress) private questNFTContracts;
    mapping(uint256 questId => bool isClaimable) questClaimable; 

    event WinnersSet(uint256 indexed questId, address[] winners);
    event WinnerRemoved(uint256 indexed questId, address[] winners);
    event NFTMintedForWinner(uint256 indexed questId, address indexed winner);

    function setWinnerRewards(uint256 questId, address[] calldata winners) public onlyOwner {
        for (uint256 i = 0; i < winners.length; ++i) {
            questWinners[questId][winners[i]] = true;
        }
        emit WinnersSet(questId, winners);
    }

    function removeWinners(uint256 questId, address[] calldata winners) public onlyOwner {
        for (uint256 i = 0; i < winners.length; ++i) {
            questWinners[questId][winners[i]] = false;
        }
        emit WinnerRemoved(questId, winners);
    }

    function isWinner(uint256 questId, address _address) public view returns (bool) {
        return questWinners[questId][_address];
    }

    function setNFTContractAddress(uint256 questId, address nftContractAddress) public onlyOwner {
        require(Address.isContract(nftContractAddress), "NFT contract address must be a contract");
        questNFTContracts[questId] = nftContractAddress;
    }

    function getNFTContractAddress(uint256 questId) public view returns (address) {
        return questNFTContracts[questId];
    }
    
    function setQuestClaimStatus(uint256 questId, bool isClaimable) public onlyOwner {
        questClaimable[questId] = isClaimable;
    }

    function getClaimableStatus(uint256 questId) public view returns (bool) {
        return questClaimable[questId];
    }

    function mintForWinner(uint256 questId) public nonReentrant {
        require(isWinner(questId, msg.sender), "Only a winner can mint");
        require(questClaimable[questId], "Quest is not claimable");
        address nftContractAddress = questNFTContracts[questId];
        require(nftContractAddress != address(0), "No NFT contract set for questId");
        INFT nftContract = INFT(nftContractAddress);
        nftContract.mint(msg.sender);
        emit NFTMintedForWinner(questId, msg.sender);
    }

    function mintForEndlessQuest(uint256 questId, address signAddress, bytes memory signature) public nonReentrant {
        MintNft memory mintNftPayload = MintNft(msg.sender, questId);
        verify(signAddress,  mintNftPayload, signature);
        require(questClaimable[questId], "Quest is not claimable");
        address nftContractAddress = questNFTContracts[questId];
        require(nftContractAddress != address(0), "No NFT contract set for questId");
        INFT nftContract = INFT(nftContractAddress);
        nftContract.mint(msg.sender);
        emit NFTMintedForWinner(questId, msg.sender);
    }

    function safeMintForWinner(uint256 questId) public nonReentrant {
        require(isWinner(questId, msg.sender), "Not a winner");
        require(questClaimable[questId], "Quest is not claimable");
        address nftContractAddress = questNFTContracts[questId];
        require(nftContractAddress != address(0), "Invalid NFT contract address");
        INFT nftContract = INFT(nftContractAddress);
        nftContract.safeMint(msg.sender);
        emit NFTMintedForWinner(questId, msg.sender);
    }
    
}