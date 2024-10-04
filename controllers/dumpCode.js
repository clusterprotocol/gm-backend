// try {
//     // const maxMachineId = parseInt(await clusterContract.machineId());
//     // let allMachines = [];
//     // const result = await spheronContract.methods.getAllProviders().call();
//     const provider = new ethers.providers.JsonRpcProvider("https://spheron-devnet-eth.rpc.caldera.xyz/http");

//     const contract = new ethers.Contract(
//       contractAddress,
//       spheronABI,
//       provider
//     );
//     const responses = await contract.getAllProviders();
//     // console.log(responses)
 
    
// // Filter out providers with localhost hostUri or no name
// const filteredResponses = responses.filter((response) =>
//   // response[6] !== "localhost" && response[1] && response[1].trim() !== ""
//   {
//     if (response.hostUri !== "localhost") return true;
//   }
// );

// // Apply search filter
// // const searchFilteredResponses = filteredResponses.filter(response =>
// //   response[1].toLowerCase().includes(searchTerm.toLowerCase()) || // name
// //   response[3].toLowerCase().includes(searchTerm.toLowerCase())    // address
// // );

// // Process all providers to get their details including total rewards
// const allProviderDetails = await Promise.all(
//   filteredResponses.map(async (response) => {
//     let name, region;
//     try {
//       const { Name, Region } = JSON.parse(response.spec);
//       name = Name;
//       region = Region;
//     } catch (error) {
//       name = "";
//       region = "";
//     }
//     let specs = {
//       totalCPUs: 0,
//       totalMemory: 0,
//       totalStorage: 0,
//       gpuInfos: [],
//     };
//     let version = "-";
//     const getAllocatableGPUs = (data) => {
//       const nodes = data.cluster.inventory.available.nodes;
//       let gpuMap = new Map();
    
//       nodes.forEach((node) => {
//         const gpuInfos = node.allocatable.gpu_infos;
    
//         if (gpuInfos && gpuInfos.length > 0) {
//           const availableGPUPerType = node.available.gpu / gpuInfos.length;
    
//           gpuInfos.forEach((gpu) => {
//             const key = `${gpu.vendor}|${gpu.name}`;
    
//             if (gpuMap && gpuMap.has(key)) {
//               const existingGPUInfo = gpuMap.get(key);
//               existingGPUInfo.num++;
//               existingGPUInfo.availableNum += availableGPUPerType;
//             } else {
//               gpuMap.set(key, {
//                 vendor: gpu.vendor,
//                 name: gpu.name,
//                 num: 1,
//                 availableNum: availableGPUPerType,
//               });
//             }
//           });
//         }
//       });
    
//       return Array.from(gpuMap.values()).map((gpuInfo) => ({
//         ...gpuInfo,
//         availableNum: Math.floor(gpuInfo.availableNum), // Ensure availableNum is an integer
//       }));
//     };
    
//     const getProviderStatus = async (hostUri) => {
//       try {
//         const statusResponse = await fetch(
//           `https://provider.spheron.network/api/status?hostUri=${encodeURIComponent(hostUri)}`,
//           { method: "GET", cache: "no-store", signal: AbortSignal.timeout(10000) }
//         );
//         const statusResponseJson = await statusResponse.json();
    
//         // console.log(
//         //   "status response -> ",
//         //   JSON.stringify(statusResponseJson, null, 2)
//         // );
    
//         let totalMilliCPUs = 0; // in millicores
//         let totalMemoryBytes = 0; // in bytes
//         let totalStorageBytes = 0; // in bytes
//         let totalCPUs = 0;
//         let totalMemory = 0;
//         let totalStorage = 0;
//         let totalGpus = 0;
//         let availableMilliCPUs = 0; // in millicores
//         let availableMemoryBytes = 0; // in bytes
//         let availableStorageBytes = 0; // in bytes
//         let availableCPUs = 0;
//         let availableMemory = 0;
//         let availableStorage = 0;
//         let availableGpus = 0;
//         let gpuInfos = [];
    
//         if (!statusResponseJson.error) {
//           const nodes = statusResponseJson.cluster.inventory.available.nodes;
//           nodes.forEach((node) => {
//             totalMilliCPUs += node.allocatable.cpu;
//             totalMemoryBytes += node.allocatable.memory;
//             totalStorageBytes += node.allocatable.storage_ephemeral;
//             totalGpus += node.allocatable.gpu;
//             availableMilliCPUs += node.available.cpu;
//             availableMemoryBytes += node.available.memory;
//             availableStorageBytes += node.available.storage_ephemeral;
//             availableGpus += node.available.gpu;
//           });
//           totalCPUs = totalMilliCPUs / 1000;
//           totalMemory = Number((totalMemoryBytes / 10 ** 9).toFixed(2));
//           totalStorage = Number((totalStorageBytes / 10 ** 9).toFixed(2));
//           availableCPUs = Number((availableMilliCPUs / 1000).toFixed(2));
//           availableMemory = Number((availableMemoryBytes / 10 ** 9).toFixed(2));
//           availableStorage = Number((availableStorageBytes / 10 ** 9).toFixed(2));
    
//           gpuInfos = getAllocatableGPUs(statusResponseJson);
//         }
//         const result = {
//           totalCPUs,
//           totalMemory,
//           totalStorage,
//           totalGpus,
//           availableCPUs,
//           availableMemory,
//           availableStorage,
//           availableGpus,
//           gpuInfos,
//         };
    
//         console.log("Total Resources -> ", result);
    
//         return result;
//       } catch (error) {
//         console.log("error in get provider status -> ", error);
//         return {
//           totalCPUs: 0,
//           totalMemory: 0,
//           totalStorage: 0,
//           totalGpus: 0,
//           availableCPUs: 0,
//           availableMemory: 0,
//           availableStorage: 0,
//           availableGpus: 0,
//           gpuInfos: [],
//         };
//       }
//     };
    
//     if (response.status.toString() === "2") {
//       specs = await getProviderStatus(response.hostUri);
//       // version = await getProviderVersion(response.hostUri);
//     }
//     const isRegistered = Number(response.status) === 1;

//     const perEraRewardData = 1
//     const totalRewardsData = 1;
//     return {
//       id: response.providerId.toString(),
//       name,
//       region,
//       address: response.walletAddress,
//       hostUri: response.hostUri,
//       status: response.status.toString(),
//       trust: Number(response.tier.toString()) + 1,
//       specs,
//       perEraRewardData,
//       // totalRewardsData,
//       timestamp: Number(response.joinTimestamp.toString()),
//       // version,
//     };
//   })
// );

// const filteredProviders = [...allProviderDetails].filter(
//   (provider) => provider.name.trim() !== ""
// );

// // Sort providers by status, total rewards (assuming totalRewardsData is a number)
// const sortedProviders = [...filteredProviders].sort((a, b) => {
//   if (a.status === "3" && b.status !== "3") return 1;
//   if (a.status !== "3" && b.status === "3") return -1;

//   // const totalRewardsDataDiff =
//   //   Number(b.totalRewardsData.toString()) -
//   //   Number(a.totalRewardsData.toString());

//   // // If totalRewardsData is the same, compare by perEraRewards
//   // if (totalRewardsDataDiff === 0) {
//   //   return (
//   //     Number(b.perEraRewardData.toString()) -
//   //     Number(a.perEraRewardData.toString())
//   //   );
//   // }

//   return '1';
// });

// const sortedProvidersWithRank = [...sortedProviders].map((item, index) => ({
//   ...item,
//   rank: index + 1,
// }));

// // Calculate total pages after filtering and sorting
// const totalFilteredCount = sortedProviders.length;
// // const totalPages = Math.ceil(totalFilteredCount / pageSize);

// // Calculate start and end indices for pagination
// // const startIndex = (pageNumber - 1) * pageSize;
// // const endIndex = startIndex + pageSize;

// // Slice the sorted providers array to get the current page's data
// // const paginatedProviders = sortedProviders.slice(startIndex, endIndex);

// // return {
// //   providers: sortedProvidersWithRank,
// //   totalCount: totalFilteredCount,
// //   // pageSize,
// //   // pageNumber,
// //   // totalPages,
// // };

//   const providersFiltered= sortedProvidersWithRank.map((provider) => {
//     const availableGpus = provider.specs.availableGpus;
//     const availableStorage = provider.specs.availableStorage;
//     const region = provider.region;

//     // Extract all GPU vendor and names
//     const gpuDetails = provider.specs.gpuInfos.map(gpu => ({
//       vendor: gpu.vendor,
//       name: gpu.name,
//       availableNum: gpu.availableNum
//     }));

//     // Placeholder for costing logic. Adjust based on actual costing logic later
//     const gpuCost = availableGpus > 0 ? availableGpus * 10 : 0;  // Example: 10 units per GPU
//     const storageCost = availableStorage > 0 ? availableStorage * 0.05 : 0;  // Example: 0.05 units per GB of storage

//     return {
//       providerName: provider.name,
//       gpuDetails: gpuDetails.length > 0 ? gpuDetails : null,  // If no GPUs, return null
//       availableStorage,
//       region,
//       gpuCost, // Placeholder, adjust based on real costing logic
//       storageCost, // Placeholder, adjust based on real costing logic
//     };
//   }).filter(provider => provider.gpuDetails || provider.availableStorage > 0); 

//   res.json({
//         success: true,
//         // message: machines,
//         providers: providersFiltered,
//   totalCount: totalFilteredCount,
//       });
//     // }
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }