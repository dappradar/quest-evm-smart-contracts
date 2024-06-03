const main = async () => {
  // AdminContract
  const deployAdminContract = await hre.ethers.deployContract("RewardMinter");
  await deployAdminContract.waitForDeployment();
  console.log(
    "RewardMinter deployed to:",
    await deployAdminContract.getAddress(),
  );
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
