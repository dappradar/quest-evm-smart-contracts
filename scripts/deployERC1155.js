const main = async () => {
    const deployERC1155 = await hre.ethers.deployContract("MyERC1155Token", [
      "TOKEN_HOLDER_ADDRESS",
    ]);
    await deployERC1155.waitForDeployment();
    console.log("deployERC1155 Contract deployed to:", await deployERC1155.getAddress());
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
  