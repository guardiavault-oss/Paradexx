import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying LifetimeAccess with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  console.log("Treasury address:", treasury);

  const LifetimeAccess = await hre.ethers.getContractFactory("LifetimeAccess");
  console.log("Deploying...");
  const lifetimeAccess = await LifetimeAccess.deploy(treasury);

  await lifetimeAccess.waitForDeployment();
  const address = await lifetimeAccess.getAddress();

  console.log("\n✅ LifetimeAccess deployed to:", address);
  console.log("\n📝 Add to your .env files:");
  console.log("client/.env -> VITE_LIFETIME_ADDRESS=" + address);
  console.log("server/.env -> LIFETIME_ADDRESS=" + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



