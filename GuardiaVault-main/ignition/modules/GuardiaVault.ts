import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GuardiaVaultModule", (m) => {
  const guardiaVault = m.contract("GuardiaVault");

  return { guardiaVault };
});
