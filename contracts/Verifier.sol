// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract Verifier is EIP712 {
    constructor() EIP712("DappRadar NFT Minting", "1") {}

    struct MintNft {
        address userAddress;
        uint256 questId;
    }

    bytes32 private constant MINT_DATA_TYPEHASH = keccak256("MintNft(address userAddress,uint256 questId)");
    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version)");
    bytes32 private constant DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            keccak256("DappRadar NFT Minting"),
            keccak256("1")
    ));

    function hashActionData(MintNft memory rawMessage) private pure returns (bytes32) {
        return keccak256(abi.encode(
                MINT_DATA_TYPEHASH,
                rawMessage.userAddress,
                rawMessage.questId
            ));
    }

    function verify(address user, MintNft memory rawMessage, bytes memory signature) public virtual {
        bytes32 digest = _hashTypedDataV4(hashActionData(rawMessage));
        _verify(user, digest, signature);
    }

    function _verify(address user, bytes32 digest, bytes memory signature) internal view virtual {
        (address recovered, ECDSA.RecoverError error) = ECDSA.tryRecover(digest, signature);
        require(error == ECDSA.RecoverError.NoError && recovered == user, "Sign: Invalid signature");
    }
}