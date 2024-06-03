const main = async () => {
    const assetsHolder = await hre.ethers.deployContract("contracts/AssetsHolder.sol:AssetsHolder");
    await assetsHolder.waitForDeployment();
    console.log("assetsHolder Contract deployed to:", await assetsHolder.getAddress());
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
  