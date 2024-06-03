// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyERC1155Token is ERC1155, Ownable {
    uint256 public constant MY_TOKEN = 0;

    constructor(address _contract) ERC1155("https://gateway.pinata.cloud/ipfs/QmZ8oz5KnBxZe77f9TqXKqKdDf9R6uZ89Ve2trz1PABRe8") {
         for (uint i = 1; i < 5; i++) {
            _mint(_contract, i, 3, "");
        }
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data) public onlyOwner {
        _mint(to, id, amount, data);
    }

    function burn(address from, uint256 id, uint256 amount) public onlyOwner {
        _burn(from, id, amount);
    }
}