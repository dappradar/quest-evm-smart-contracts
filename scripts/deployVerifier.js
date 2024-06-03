const main = async () => {
  const deployVerifierContract = await hre.ethers.deployContract("Verifier");
  await deployVerifierContract.waitForDeployment();
  console.log(
    "RewardMinter deployed to:",
    await deployVerifierContract.getAddress(),
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
