const main = async () => {
  // ERC20,
  const deployErc20 = await hre.ethers.deployContract("TestToken", [
    "Test",
    "TEST",
    "TOKEN_HOLDER_ADDRESS",
    "1000000000000000000000"
  ]);
  await deployErc20.waitForDeployment();
  console.log("ERC20 Contract deployed to:", await deployErc20.getAddress());
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
