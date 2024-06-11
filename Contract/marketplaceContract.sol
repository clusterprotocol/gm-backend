// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/access/Ownable.sol";


// Interface for ERC20 (like USDC)
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function decimals() external view returns(uint256);
}


contract GPURentalMarketplace is Ownable {
   
    // Struct for GPU details
    struct GPU {
        string cpuName;
        string gpuName;
        uint256 gpuVRAM;
        uint256 totalRAM;
        uint256 storageAvailable;
        uint256 coreCount;
        string IPAddress;
        uint256[] portsOpen;
        string region;
        uint256 bidPrice; 
        bool isListed;
        bool isRented;
    }


    // Struct for User details
    struct user {
        string name;
        uint UID;
        string organization;
        bool isProvider;
        uint usdBalance;
        string sshPublicKey;
        uint[] providedGpus;
        uint[] orderList;
        uint[] orderReceived;
        uint[] usdAdd;
        uint[] usdSpend;
    }

    // Struct for Order details
    struct Order {
        address renter;
        uint256 machineId;
        uint orderTimestamp;
        uint256 rentalDuration; // in hours
        uint amountToHold;
        bool isPending;
    }

    enum usdOrderType {
        Buy,
        Spend,
        Earn
    }

    constructor() Ownable(msg.sender) {}

    // State variables
    uint public machineId = 10000;
    uint public userIdCount = 100;
    uint public orderId = 0;
    uint internal refIDHandler = 100000;
    uint gPerRefer = 5;  
    address public funds_handler;

    // Mappings
    mapping(uint256 => GPU) public machines;
    mapping(address => user) public users;
    mapping (uint => address) public UIDtoAddress;
    mapping (uint => address) public refCodeToUser;
    mapping(uint256 => Order) public orders;
    mapping(string => bool) public userNameStatus;
    mapping (address => bool) public isRegistered;
    mapping (uint => address) public machineToOwner;
    mapping(address => bool) public isTokenAccepted;
   
    // Events
    // event ProviderRegistered(uint256 providerId, string name);
    event MachineListed(uint256 machineId, string name);
    event MachineRented(uint256 orderId, uint256 machineId, address indexed renter);
    event usdUpdate(address indexed user, uint amount, usdOrderType orderType );
    event userRegistered(address indexed user, string userName);

    address public serverPublicAddress;

    function setKeys(address newSerPub, address _newFundshandler) public onlyOwner  {
        serverPublicAddress = newSerPub;
        funds_handler = _newFundshandler;
    }

    function setAcceptedTokens(address newToken) public onlyOwner {
        isTokenAccepted[newToken] = !isTokenAccepted[newToken];
    }

    modifier onlyFromServer( ) {
        require(msg.sender == serverPublicAddress, "Unauthorized request");
        _;
    }

    function isValidUsernameCharacter(bytes1 char) private pure returns (bool) {
        return (char >= 0x30 && char <= 0x39) || // 0-9
            (char >= 0x61 && char <= 0x7A);   // a-z
    }

    function isValidUsername(string memory username) private pure returns (bool) {
        bytes memory usernameBytes = bytes(username);
        for (uint i = 0; i < usernameBytes.length; i++) {
            if (!isValidUsernameCharacter(usernameBytes[i])) {
                return false;
            }
        }
        return true;
    }

    // Register a new user
    function registerUser(string memory _name, string memory _organization, address userAddress, string memory _sshKey) public returns(uint) {
        require(msg.sender == userAddress || msg.sender == serverPublicAddress, "Unauthorized call");
        require(bytes(_name).length > 4, "User name is too small");
        require(isValidUsername(_name), "Not a valid format");
        require(!isRegistered[userAddress], "Already Registered");
        require(!userNameStatus[_name], "Username Taken");
        userIdCount++;
        users[userAddress] = user(_name, userIdCount, _organization, false, 0, _sshKey, new uint256[](0),  new uint256[](0), new uint256[](0),new uint256[](0),new uint256[](0)  );
        userNameStatus[_name] = true;
        isRegistered[userAddress] = true;
        UIDtoAddress[userIdCount] = userAddress;
        emit userRegistered(userAddress, _name);
        return userIdCount;
    }

    function updateProfile(string memory _name, string memory _organization, string memory _newSSH) public {
        require(isRegistered[msg.sender]);
        require(!userNameStatus[_name]);
        require(isValidUsername(_name));
        require(bytes(_name).length>4);
        users[msg.sender].name = _name;
        users[msg.sender].organization = _organization;
        users[msg.sender].sshPublicKey = _newSSH;
    }

    // Register a new machine/GPU
    function registerMachines(string memory _cpuname, string memory _gpuname, uint _spuVRam, uint _totalRam, uint256 _memorySize, uint256 _coreCount, string memory _ipAddr, uint[] memory _openedPorts, string memory _region, uint _bidprice, address provider) public onlyFromServer returns(uint) {
        require(bytes(_gpuname).length > 3, "Machine name is required");
        require(_memorySize > 0, "Memory size should be greater than 0");
        require(_coreCount > 0, "Core count should be greater than 0");
        require(isRegistered[provider], "Not a user");
       
        if (!users[provider].isProvider) {
            users[provider].isProvider = true;
        }
        machineId++;
        machines[machineId] = GPU(_cpuname, _gpuname , _spuVRam, _totalRam,  _memorySize,  _coreCount, _ipAddr, _openedPorts, _region, _bidprice * 10**6, true, false);
        users[provider].providedGpus.push(machineId);
        machineToOwner[machineId] = provider;
        emit MachineListed(machineId, _gpuname);
        return machineId;
    }

    // Rent a machine/GPU
    function rentMachine(uint256 _machineId, uint256 _rentalDuration, address _userAddress) public onlyFromServer returns(uint) {
        require(isRegistered[_userAddress], "Renter is not registered yet");
        require( machines[_machineId].isListed, "Machine is not available for rent");
        require(!machines[_machineId].isRented, "Machine already in use");
        require(_rentalDuration > 0, "Rental duration should be greater than 0");
        require(users[_userAddress].usdBalance >= machines[_machineId].bidPrice * _rentalDuration, "Not enough Gpoints");
        orderId++;
        uint amountToDeduct = machines[_machineId].bidPrice * _rentalDuration;
        users[_userAddress].usdBalance -=  amountToDeduct;
        orders[orderId] = Order(_userAddress, _machineId, block.timestamp, _rentalDuration, amountToDeduct, true);
        machines[_machineId].isListed = false;
        machines[_machineId].isRented =  true;
        users[_userAddress].orderList.push(orderId);
        users[machineToOwner[_machineId]].orderReceived.push(orderId);
        emit MachineRented(orderId, _machineId, _userAddress);
        return orderId;
    }

    function completeOrder(uint _orderId) public onlyFromServer {
        require(machines[orders[_orderId].machineId].isRented, "Machine is not rented");
        uint rentalDurationInSeconds = orders[_orderId].rentalDuration * 3600;
        require(block.timestamp >= (orders[_orderId].orderTimestamp + rentalDurationInSeconds));
        require(orders[_orderId].isPending, "Order fulfilled already");
        orders[_orderId].isPending = false;
        users[machineToOwner[orders[_orderId].machineId]].usdBalance += orders[_orderId].amountToHold;
        users[machineToOwner[orders[_orderId].machineId]].usdAdd.push(orders[_orderId].amountToHold);
        users[orders[_orderId].renter].usdSpend.push(orders[_orderId].amountToHold);
        machines[orders[_orderId].machineId].isListed = true;
        machines[orders[_orderId].machineId].isRented = false;
        emit usdUpdate(machineToOwner[orders[_orderId].machineId], orders[_orderId].amountToHold, usdOrderType.Earn);
        emit usdUpdate(orders[_orderId].renter, orders[_orderId].amountToHold , usdOrderType.Spend);
    }

    function cancelOrder(uint _orderId) public onlyFromServer {
        require(machines[orders[_orderId].machineId].isRented, "Machine is not rented");
        uint rentalDurationInSeconds = orders[_orderId].rentalDuration * 3600;
        require( (orders[_orderId].orderTimestamp + rentalDurationInSeconds) > block.timestamp);
        require(orders[_orderId].isPending, "Order fulfilled already");
        orders[_orderId].isPending = false;
        users[orders[_orderId].renter].usdBalance += orders[_orderId].amountToHold;
        machines[orders[_orderId].machineId].isListed = true;
        machines[orders[_orderId].machineId].isRented = false;
    }

    function listMachineToggle(uint _machineId) public  {
        require(machineToOwner[_machineId] == msg.sender || msg.sender == serverPublicAddress, "Not authorized");
        require(_machineId > 10000 && _machineId <= machineId);
        require(!machines[_machineId].isRented, "Machine already in use");
        machines[_machineId].isListed = !machines[_machineId].isListed;
    }


    function loadBalance(uint amount, address tokenAddress) public {
        require(isTokenAccepted[tokenAddress], "Token address invalid");
        require(isRegistered[msg.sender], "User not registered yet");
        uint decimal = IERC20(tokenAddress).decimals();
        uint amountInDecimals = amount* 10**decimal;
        require(isAllowedToSpend(msg.sender, tokenAddress, amountInDecimals), "Contract is not allowed to spend user's tokens");
       
        // Transfer stable coins from user to this contract
        require(IERC20(tokenAddress).transferFrom(msg.sender, funds_handler, amountInDecimals), "USDC transfer failed");
        users[msg.sender].usdBalance += amountInDecimals;
        users[msg.sender].usdAdd.push(amountInDecimals);
        emit usdUpdate( msg.sender , amount, usdOrderType.Buy);
    }

    function isAllowedToSpend(address _userAddress, address _tokenAddress, uint _amount) public view returns(bool) {
        return IERC20(_tokenAddress).allowance(_userAddress, address(this)) >= _amount;
    }


    function  setBidPrice(uint _machineId, uint _bidAmount) public {
        require(msg.sender == machineToOwner[_machineId] || msg.sender == serverPublicAddress);
        machines[_machineId].bidPrice = _bidAmount *10**6;
    }

    //viewfunctions
    function getUserBalnce(address toFetch) public view returns(uint) {
        return users[toFetch].usdBalance;
    }

    function isUserProvider(address toFetch) public view returns (bool) {
        return users[toFetch].isProvider;
    }

    function machinesOwned(address toFetch) public view returns(uint[] memory) {
        return users[toFetch].providedGpus;
    }

    function checkAvailability(uint idToFetch) public view returns (bool) {
        return machines[idToFetch].isListed;
    }

    function getUsdAdds(address userToFetch) public view returns(uint[] memory) {
        return users[userToFetch].usdAdd;
    }

    function getUsdSpends(address userToFetch) public view returns(uint[] memory) {
        return users[userToFetch].usdSpend;
    }

    function getOrders(address userToFetch) public view returns(uint[] memory) {
        return users[userToFetch].orderList;
    }

    function getOrderReceived(address userToFetch) public view returns(uint[] memory) {
        return users[userToFetch].orderReceived;
    }


}