// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface IAssetsHolder {
    function transferERC721(address tokenAddress, uint256 tokenId, address recipient) external;
    function transferERC20(address tokenAddress, uint256 amount, address recipient) external;
    function transferERC1155(address tokenAddress, uint256 id, uint256 amount, address recipient, bytes calldata data) external;
}