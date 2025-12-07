// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title ILido
 * @dev Interface for Lido liquid staking protocol
 */
interface ILido {
    function submit(address _referral) external payable returns (uint256);
    function balanceOf(address _account) external view returns (uint256);
    function transfer(address _to, uint256 _value) external returns (bool);
    function getPooledEthByShares(uint256 _sharesAmount) external view returns (uint256);
    function getSharesByPooledEth(uint256 _pooledEthAmount) external view returns (uint256);
}

