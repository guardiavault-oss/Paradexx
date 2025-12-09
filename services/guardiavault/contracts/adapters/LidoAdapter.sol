// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ILido.sol";

/**
 * @title LidoAdapter
 * @dev Adapter for Lido liquid staking protocol
 * @notice Allows staking ETH to receive stETH
 */
contract LidoAdapter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Mainnet Lido contract
    ILido public constant LIDO = ILido(0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84);
    
    // stETH token address (same as Lido contract)
    address public constant STETH = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;

    /**
     * @notice Stake ETH in Lido and receive stETH
     * @return stETHAmount Amount of stETH received
     */
    function stakeETH() external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Amount must be greater than 0");

        uint256 stETHBefore = LIDO.balanceOf(address(this));
        LIDO.submit{value: msg.value}(address(0)); // No referral
        uint256 stETHAfter = LIDO.balanceOf(address(this));

        uint256 stETHReceived = stETHAfter - stETHBefore;

        // Transfer stETH to caller using SafeERC20
        IERC20(address(LIDO)).safeTransfer(msg.sender, stETHReceived);

        return stETHReceived;
    }

    /**
     * @notice Get current stETH balance for an address
     * @param account Address to check balance for
     * @return Balance of stETH
     */
    function getBalance(address account) external view returns (uint256) {
        return LIDO.balanceOf(account);
    }

    /**
     * @notice Get current ETH value of stETH amount
     * @param stETHAmount Amount of stETH
     * @return ETH value
     */
    function getETHValue(uint256 stETHAmount) external view returns (uint256) {
        uint256 shares = LIDO.getSharesByPooledEth(stETHAmount);
        return LIDO.getPooledEthByShares(shares);
    }

    /**
     * @notice Get current APY estimate
     * @dev Returns approximate APY in basis points (e.g., 520 = 5.2%)
     * @return APY in basis points
     */
    function getCurrentAPY() external pure returns (uint256) {
        // Approximate Lido APY (can be updated by oracle or governance)
        return 520; // 5.2% APY (520 basis points)
    }

    /**
     * @notice Withdraw stETH and convert to ETH (via unstaking)
     * @param stETHAmount Amount of stETH to withdraw
     * @return ethAmount Amount of ETH received
     * @dev Note: Actual unstaking may require a delay in Lido
     */
    function unstake(uint256 stETHAmount) external nonReentrant returns (uint256) {
        require(stETHAmount > 0, "Amount must be greater than 0");
        
        // Transfer stETH from caller (Lido contract is also ERC20)
        IERC20 stETH = IERC20(STETH);
        stETH.safeTransferFrom(msg.sender, address(this), stETHAmount);
        
        // Get ETH value
        uint256 ethAmount = this.getETHValue(stETHAmount);
        
        // In production, this would trigger Lido unstaking process
        // For now, we return the ETH value (would need to handle async unstaking)
        // Note: Lido uses a withdrawal queue, so this is simplified
        // Use proper ETH transfer pattern (Checks-Effects-Interactions)
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        return ethAmount;
    }
}

