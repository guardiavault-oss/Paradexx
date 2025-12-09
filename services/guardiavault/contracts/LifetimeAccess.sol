// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LifetimeAccess is ReentrancyGuard {
    enum Plan { SoloGuardian, FamilyVault, LegacyPro }

    struct Entitlement {
        bool active;
        Plan plan;
        uint256 purchasedAt;
        uint256 amountPaid;
    }

    address public immutable treasury;
    mapping(address => Entitlement) public entitlements;

    event LifetimePurchased(address indexed user, Plan plan, uint256 amountPaid, uint256 timestamp);
    error AlreadyHasLifetime();

    constructor(address _treasury) {
        require(_treasury != address(0), "invalid treasury");
        treasury = _treasury;
    }

    function buyLifetime(Plan plan) external payable nonReentrant {
        if (entitlements[msg.sender].active) revert AlreadyHasLifetime();

        // Checks-Effects-Interactions pattern: Update state first
        entitlements[msg.sender] = Entitlement({
            active: true,
            plan: plan,
            purchasedAt: block.timestamp,
            amountPaid: msg.value
        });

        emit LifetimePurchased(msg.sender, plan, msg.value, block.timestamp);

        // External call last (after state update)
        (bool ok, ) = treasury.call{value: msg.value}("");
        require(ok, "treasury transfer failed");
    }
}



