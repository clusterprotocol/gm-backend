// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract GPUBilling {
    address public owner;
    uint256 private transactionCounter;

    struct TokenInfo {
        bool allowed;
        string name;
        string symbol;
        string imageURL;
    }

    mapping(address => TokenInfo) public allowedTokens;
    address[] public tokenList;

    enum TransactionType {
        CREDIT,
        DEBIT,
        REFUND,
        WITHDRAW
    }

    struct Transaction {
        string id;
        uint256 amount;
        uint256 timestamp;
        TransactionType transactionType;
        address token;
    }

    mapping(address => mapping(address => uint256)) public balances;
    mapping(address => Transaction[]) private transactions;

    event Deposited(
        address indexed user,
        uint256 amount,
        string transactionId,
        address token
    );
    event Withdrawn(
        address indexed user,
        uint256 amount,
        string transactionId,
        address token
    );
    event OwnerWithdrawn(address indexed owner, uint256 amount);
    event TokenAdded(
        address token,
        string name,
        string symbol,
        string imageURL
    );
    event TokenRemoved(address token);

    event BalanceSubtracted(
        address indexed user,
        uint256 amount,
        string transactionId,
        address token
    );

    event BalanceAdded(
        address indexed user,
        uint256 amount,
        string transactionId,
        address token
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        transactionCounter = 1;
    }

    function addAllowedToken(
        address token,
        string memory name,
        string memory symbol,
        string memory imageURL
    ) external onlyOwner {
        allowedTokens[token] = TokenInfo(true, name, symbol, imageURL);
        tokenList.push(token);
        emit TokenAdded(token, name, symbol, imageURL);
    }

    function removeAllowedToken(address token) external onlyOwner {
        delete allowedTokens[token];

        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == token) {
                tokenList[i] = tokenList[tokenList.length - 1]; // Swap with last element
                tokenList.pop(); // Remove last element
                break;
            }
        }

        emit TokenRemoved(token);
    }

    function generateTransactionId() private returns (string memory) {
        string memory transactionId = string(
            abi.encodePacked("Cluster-GPU-", uintToString(transactionCounter))
        );
        transactionCounter++;
        return transactionId;
    }

    function uintToString(uint256 v) private pure returns (string memory) {
        if (v == 0) {
            return "0";
        }
        uint256 j = v;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (v != 0) {
            k = k - 1;
            bstr[k] = bytes1(uint8(48 + (v % 10)));
            v /= 10;
        }
        return string(bstr);
    }

    function deposit(address token, uint256 amount) external {
        require(allowedTokens[token].allowed, "Token not allowed");
        require(amount > 0, "Deposit amount must be greater than zero");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        balances[msg.sender][token] += amount;

        // IERC20(token).transferFrom(msg.sender, address(this), amount);
        string memory transactionId = generateTransactionId();

        transactions[msg.sender].push(
            Transaction(
                transactionId,
                amount,
                block.timestamp,
                TransactionType.CREDIT,
                token
            )
        );

        emit Deposited(msg.sender, amount, transactionId, token);
    }

    function withdraw(address token, uint256 amount) external {
        require(allowedTokens[token].allowed, "Token not allowed");
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(balances[msg.sender][token] >= amount, "Insufficient balance");

        string memory transactionId = generateTransactionId();
        balances[msg.sender][token] -= amount;
        IERC20(token).transferFrom(address(this), msg.sender, amount);
        transactions[msg.sender].push(
            Transaction(
                transactionId,
                amount,
                block.timestamp,
                TransactionType.DEBIT,
                token
            )
        );

        emit Withdrawn(msg.sender, amount, transactionId, token);
    }

    function getTransactions(
        address user
    ) external view returns (Transaction[] memory) {
        return transactions[user];
    }

    function ownerWithdraw(address token, uint256 amount) external onlyOwner {
        require(allowedTokens[token].allowed, "Token not allowed");
        require(
            amount > 0 && IERC20(token).balanceOf(address(this)) >= amount,
            "Invalid amount"
        );
        // IERC20(token).transferFrom(address(this), owner, amount);

        bool success = IERC20(token).transfer(owner, amount);
        require(success, "Transfer failed");
        emit OwnerWithdrawn(owner, amount);
    }

    function getOwnerBalance(
        address token
    ) external view onlyOwner returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getUserBalances(
        address user
    ) external view returns (address[] memory, uint256[] memory) {
        uint256 length = tokenList.length;
        uint256[] memory userBalances = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            userBalances[i] = balances[user][tokenList[i]];
        }

        return (tokenList, userBalances);
    }

    function getAllTokens()
        external
        view
        returns (address[] memory, TokenInfo[] memory)
    {
        uint256 length = tokenList.length;
        TokenInfo[] memory tokens = new TokenInfo[](length);

        for (uint256 i = 0; i < length; i++) {
            tokens[i] = allowedTokens[tokenList[i]];
        }

        return (tokenList, tokens);
    }

    function subtractUserBalance(
        address user,
        address token,
        uint256 amount
    ) external onlyOwner {
        require(allowedTokens[token].allowed, "Token not allowed");
        require(amount > 0, "Amount must be greater than zero");
        require(balances[user][token] >= amount, "Insufficient balance");

        balances[user][token] -= amount;

        string memory transactionId = generateTransactionId();
        transactions[user].push(
            Transaction(
                transactionId,
                amount,
                block.timestamp,
                TransactionType.DEBIT,
                token
            )
        );

        emit BalanceSubtracted(user, amount, transactionId, token);
    }

    function addUserBalance(
        address user,
        address token,
        uint256 amount
    ) external onlyOwner {
        require(allowedTokens[token].allowed, "Token not allowed");
        require(amount > 0, "Amount must be greater than zero");

        balances[user][token] += amount;

        string memory transactionId = generateTransactionId();
        transactions[user].push(
            Transaction(
                transactionId,
                amount,
                block.timestamp,
                TransactionType.CREDIT,
                token
            )
        );

        emit BalanceAdded(user, amount, transactionId, token);
    }
}
