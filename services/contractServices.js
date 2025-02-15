const { ClusterContract } = require("../Contract/contract");

class ContractServices {
  constructor() {
    this.clusterContract = new ClusterContract();
  }

  async getUsdAdds(userAddress) {
    const usdAdds = await this.clusterContract.getUsdAdds(userAddress);
    const parsedUsd = usdAdds.map((amount) => parseInt(amount) * 10 ** -6);
    return { success: true, usdAdds: parsedUsd };
  }

  async getUsdSpends(userAddress) {
    const usdSpends = await this.clusterContract.getUsdSpends(userAddress);
    const parsedUsd = usdSpends.map((amount) => parseInt(amount) * 10 ** -6);
    return { success: true, usdSpends: parsedUsd };
  }

  async getOrders(userAddress) {
    const orders = await this.clusterContract.getOrders(userAddress);
    const activeOrders = [];
    const pastOrders = [];

    for (const orderId of orders) {
      const isPending = await this.clusterContract.orders(orderId).isPending;
      if (isPending) activeOrders.push(parseInt(orderId));
      else pastOrders.push(parseInt(orderId));
    }

    return { success: true, activeOrders, pastOrders };
  }
}

module.exports = new ContractServices();
