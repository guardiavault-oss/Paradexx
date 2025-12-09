// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IAave.sol";

/**
 * @title AaveAdapter
 * @dev Adapter for Aave V3 lending protocol
 * @notice Allows supplying tokens to earn lending yield
 */
contract AaveAdapter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Mainnet Aave Pool address
    IAavePool public constant AAVE_POOL = IAavePool(0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2);

    // Common token addresses (Mainnet)
    address public constant USDC = 0xA0b86A33e6441B8435b662303c4B5C5B7B8e4E8a;
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    /**
     * @notice Supply tokens to Aave
     * @param asset Token address to supply
     * @param amount Amount to supply
     * @return aTokenAmount Amount of aTokens received
     */
    function supply(address asset, uint256 amount) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer tokens from caller
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Get aToken address
        ReserveData memory reserveData = AAVE_POOL.getReserveData(asset);
        IAToken aToken = IAToken(reserveData.aTokenAddress);

        uint256 aTokenBefore = aToken.balanceOf(address(this));

        // Approve and supply to Aave
        IERC20(asset).safeIncreaseAllowance(address(AAVE_POOL), amount);
        AAVE_POOL.supply(asset, amount, address(this), 0); // referral code 0

        uint256 aTokenAfter = aToken.balanceOf(address(this));
        uint256 aTokenReceived = aTokenAfter - aTokenBefore;

        // Transfer aTokens to caller using SafeERC20
        IERC20(address(aToken)).safeTransfer(msg.sender, aTokenReceived);

        return aTokenReceived;
    }

    /**
     * @notice Withdraw tokens from Aave
     * @param asset Token address to withdraw
     * @param amount Amount to withdraw (use type(uint256).max for all)
     * @param to Address to receive tokens
     * @return Amount withdrawn
     */
    function withdraw(address asset, uint256 amount, address to) external nonReentrant returns (uint256) {
        require(to != address(0), "Invalid recipient");

        // Get aToken address
        ReserveData memory reserveData = AAVE_POOL.getReserveData(asset);
        IAToken aToken = IAToken(reserveData.aTokenAddress);

        // Determine amount to withdraw
        if (amount == type(uint256).max) {
            amount = aToken.balanceOf(msg.sender);
        }

        // Transfer aTokens from caller using SafeERC20
        IERC20(address(aToken)).safeTransferFrom(msg.sender, address(this), amount);

        // Withdraw from Aave
        uint256 withdrawn = AAVE_POOL.withdraw(asset, amount, to);

        return withdrawn;
    }

    /**
     * @notice Get aToken balance for an address
     * @param asset Token address
     * @param account Account to check
     * @return Balance of aTokens
     */
    function getBalance(address asset, address account) external view returns (uint256) {
        ReserveData memory reserveData = AAVE_POOL.getReserveData(asset);
        return IAToken(reserveData.aTokenAddress).balanceOf(account);
    }

    /**
     * @notice Get current supply APY for an asset
     * @param asset Token address
     * @return APY in basis points (approximate)
     */
    function getCurrentAPY(address asset) external view returns (uint256) {
        ReserveData memory reserveData = AAVE_POOL.getReserveData(asset);
        // Convert from ray (27 decimals) to basis points (approximate)
        // liquidityIndex increases over time, representing yield
        return (reserveData.currentLiquidityRate / 1e23); // Simplified conversion
    }

    /**
     * @notice Get aToken address for an asset
     * @param asset Token address
     * @return aToken address
     */
    function getAToken(address asset) external view returns (address) {
        ReserveData memory reserveData = AAVE_POOL.getReserveData(asset);
        return reserveData.aTokenAddress;
    }
}

