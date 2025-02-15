async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const TaskContract = await ethers.getContractFactory("GPUBilling");
  const taskContract = await TaskContract.deploy();
  console.log("TaskContract deployed to:", taskContract);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
