import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LifetimeAccess", (m) => {
  const treasury = m.getParameter("treasury", process.env.TREASURY_ADDRESS || "0x0000000000000000000000000000000000000001");
  const lifetime = m.contract("LifetimeAccess", [treasury]);
  return { lifetime };
});



