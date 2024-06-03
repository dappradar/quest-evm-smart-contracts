// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

interface INFT {
    function mint(address to) external;
    function safeMint(address to) external;
    // Add other functions that the AdminContract should interact with
}