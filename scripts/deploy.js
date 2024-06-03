const main = async () => {
  const QuestsDappRadar = await hre.ethers.deployContract("contracts/QuestsDappRadar.sol:QuestsDappRadar", [
    "TOKEN_HOLDER_ADDRESS",
  ]);
  await QuestsDappRadar.waitForDeployment();
  console.log("QuestsDappRadar Contract deployed to:", await QuestsDappRadar.getAddress());
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
