import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * YieldVault Deployment Module
 * Deploys YieldVault contract with adapters for Lido and Aave
 * 
 * Note: LidoAdapter and AaveAdapter are deployed in the YieldVault constructor,
 * so we only need to deploy YieldVault. The adapters will be accessible via
 * yieldVault.lidoAdapter() and yieldVault.aaveAdapter().
 */
export default buildModule("YieldVaultModule", (m) => {
  // Treasury address - required for fee collection
  // In production, use a multisig wallet address
  const treasury = m.getParameter("treasury", "0x0000000000000000000000000000000000000000");

  // Deploy YieldVault - adapters are deployed in constructor
  const yieldVault = m.contract("YieldVault", [treasury], {
    id: "YieldVault",
  });

  return { 
    yieldVault,
  };
});

