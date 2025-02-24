const axios = require("axios");

class ContainerService {
  generateBaseUrl(publicIp) {
    return `http://${publicIp}:6666`;
  }

  formatData(data) {
    const env = data.env?.flatMap((env) =>
      Object.entries(env)?.map(([key, value]) => `${key}=${value}`)
    );
    const ports = {};
    data.openedPorts.forEach((x) => {
      Object.entries(x).forEach(([key, value]) => {
        ports[key] = value;
      });
    });
    const formattedData = {
      docker_image: data.dockerImage,
      order_id: data.deploymentId,
      username: data.name,
      public_key: data.publicKey || "",
      provide_pubkey: !!data.publicKey,
      order_duration: `${data.duration}h`,
      timestamp: new Date(data.createdAt).getTime() / 1000,
      ports: ports,
      env,
    };

    return formattedData;
  }

  async initSSH(publicIp, data) {
    try {
      const baseURL = this.generateBaseUrl(publicIp);
      const formattedData = this.formatData(data);

      console.log("formattedData ", formattedData, `${baseURL}/init_ssh`);

      const response = await axios.post(`${baseURL}/init_ssh`, formattedData);
      return { ...response.data, params: formattedData };
    } catch (error) {
      return { error: error.response ? error.response.data : error.message };
    }
  }

  async containerAPI(publicIp, container_id, api) {
    const baseURL = this.generateBaseUrl(publicIp);
    try {
      const response = await axios.get(`${baseURL}/container_api`, {
        params: { container_id, api },
      });
      return response.data;
    } catch (error) {
      return { error: error.response ? error.response.data : error.message };
    }
  }

  async getBandwidth(publicIp, container_id) {
    const baseURL = this.generateBaseUrl(publicIp);
    try {
      const response = await axios.get(`${baseURL}/bandwidth`, {
        data: { container_id },
      });
      return response.data;
    } catch (error) {
      return { error: error.response ? error.response.data : error.message };
    }
  }

  async getContainerLogs(publicIp, container_id) {
    try {
      const baseURL = this.generateBaseUrl(publicIp);
      const response = await axios.get(`${baseURL}/container_logs`, {
        data: { container_id },
      });
      return response.data;
    } catch (error) {
      return { error: error.response ? error.response.data : error.message };
    }
  }

  async getContainerMetrics(publicIp, container_id) {
    const baseURL = this.generateBaseUrl(publicIp);
    try {
      const response = await axios.get(`${baseURL}/container_metrics`, {
        data: { container_id },
      });
      return response.data;
    } catch (error) {
      return { error: error.response ? error.response.data : error.message };
    }
  }
}

module.exports = ContainerService;
