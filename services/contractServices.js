const { clusterContractInstance } = require("../Contract/contract.js");
const { clusterContract } = clusterContractInstance();

const getUsdBalanceService = async (userAddress) => {
  // Replace with actual contract logic if needed
  // const usdBal = parseInt(await clusterContract.getUserBalnce(req.body.userAddress)) * (10**-6);
  return { success: true, usdBalance: 0 };
};

const getUsdAddsService = async (userAddress) => {
  const usdAdds = await clusterContract.getUsdAdds(userAddress);
  const parsedUsd = usdAdds.map((amount) => parseInt(amount) * 10 ** -6);
  return { success: true, usdAdds: parsedUsd };
};

const getUsdSpendsService = async (userAddress) => {
  const usdSpends = await clusterContract.getUsdSpends(userAddress);
  const parsedUsd = usdSpends.map((amount) => parseInt(amount) * 10 ** -6);
  return { success: true, usdSpends: parsedUsd };
};

const getOrdersService = async (userAddress) => {
  const orders = await clusterContract.getOrders(userAddress);
  const activeOrders = [];
  const pastOrders = [];

  for (const orderId of orders) {
    const isPending = await clusterContract.orders(orderId).isPending;
    if (isPending) activeOrders.push(parseInt(orderId));
    else pastOrders.push(parseInt(orderId));
  }

  return { success: true, activeOrders, pastOrders };
};

module.exports = {
  getUsdBalanceService,
  getUsdAddsService,
  getUsdSpendsService,
  getOrdersService,
};
