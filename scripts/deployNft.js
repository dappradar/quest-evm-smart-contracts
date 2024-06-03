const main = async () => {
  // NFT
  const deployNft = await hre.ethers.deployContract("DappRadarNFT", [
    "DappRadarNFT",
    "RADARNFT",
    "https://amethyst-managing-cephalopod-66.mypinata.cloud/ipfs/QmRZT54gQ7eYF7gSU62R7wCy6PiBaSu8zsMEm8494Fj5qP",
  ]);
  await deployNft.waitForDeployment();
  console.log("NFT Contract deployed to:", await deployNft.getAddress());
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
