// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockStakingProtocol
 * @dev Mock staking protocol for testing yield generation
 */
contract MockStakingProtocol {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    uint256 public constant APY = 5; // 5% APY
    uint256 public constant PRECISION = 10000; // 100.00%
    
    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public stakedAt;
    mapping(address => uint256) public yieldEarned;

    constructor(address _asset) {
        asset = IERC20(_asset);
    }

    /**
     * @dev Stake tokens in the protocol
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external {
        asset.safeTransferFrom(msg.sender, address(this), amount);
        stakedAmount[msg.sender] += amount;
        stakedAt[msg.sender] = block.timestamp;
    }

    /**
     * @dev Unstake tokens and withdraw yield
     * @param amount Amount of tokens to unstake
     * @return totalAmount Total amount returned (principal + yield)
     */
    function unstake(uint256 amount) external returns (uint256) {
        require(stakedAmount[msg.sender] >= amount, "Insufficient staked balance");
        
        uint256 principal = amount;
        
        // Calculate yield based on time staked (simplified: 5% APY)
        uint256 timeStaked = block.timestamp - stakedAt[msg.sender];
        uint256 secondsPerYear = 365 days;
        uint256 yield = (principal * APY * timeStaked) / (secondsPerYear * 100);
        
        uint256 totalAmount = principal + yield;
        yieldEarned[msg.sender] += yield;
        
        stakedAmount[msg.sender] -= amount;
        
        asset.safeTransfer(msg.sender, totalAmount);
        
        return totalAmount;
    }

    /**
     * @dev Get current yield for a staker
     * @param staker Address of the staker
     * @return yieldAmount Current yield amount
     */
    function getYield(address staker) external view returns (uint256) {
        if (stakedAmount[staker] == 0) return 0;
        
        uint256 timeStaked = block.timestamp - stakedAt[staker];
        uint256 secondsPerYear = 365 days;
        uint256 yield = (stakedAmount[staker] * APY * timeStaked) / (secondsPerYear * 100);
        
        return yield;
    }

    /**
     * @dev Get total value for a staker (principal + yield)
     * @param staker Address of the staker
     * @return totalValue Total value including yield
     */
    function getTotalValue(address staker) external view returns (uint256) {
        return stakedAmount[staker] + this.getYield(staker);
    }
}

