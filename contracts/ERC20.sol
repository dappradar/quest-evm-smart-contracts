// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(string memory name, string memory symbol, address questAddress, uint256 initialSupply) ERC20(name, symbol) {
        _mint(questAddress, initialSupply);
    }
}