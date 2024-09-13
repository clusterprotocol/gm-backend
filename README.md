# **Cluster Protocol Backend**

The **Cluster Protocol Backend** is the core API server that powers the Cluster Protocol platform, offering various endpoints for managing users, machines, and API keys. The backend is built with Node.js, Express.js, and MongoDB, and is designed to integrate with the Cluster Protocol frontend and blockchain network.

## **Table of Contents**
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [User Management](#user-management)
  - [Machine Management](#machine-management)
- [Error Handling](#error-handling)
- [Contribution Guidelines](#contribution-guidelines)
- [License](#license)

---

## **Features**
- User registration, login, and balance retrieval.
- Machine management and cluster registration.
- API key generation and validation for secure access to protected routes.
- Integrated with MongoDB for data persistence.
- Integration with blockchain using the Ethereum network (via Infura and Alchemy).

---

## **Technologies Used**
- **Node.js**: JavaScript runtime for server-side development.
- **Express.js**: Web framework for creating the API server.
- **MongoDB**: NoSQL database for storing user and machine data.
- **Ethers.js**: Ethereum library for interacting with smart contracts.
- **dotenv**: Environment variable management.
- **Crypto**: Library for secure API key generation.

---

## **Installation**

### **1. Clone the repository**
```bash
git clone git@github.com:clusterprotocol/gm-backend.git
cd gm-backend

2. Install dependencies

    npm install

3. Set up environment variables

    Create a .env file in the project root and populate it with the following keys:

            SERVER_PRIVATE_KEY=your_private_key_here
            INFURA_KEY=your_infura_key_here
            MONGO_URL=your_mongo_url_here
            ALCHEMY_KEY=your_alchemy_key_here
            ALCHEMY_WEBSOCKET_KEY=your_alchemy_websocket_key_here
            CONTRACT_ADDRESS=your_contract_address_here

Running the Server

    1. Start the server

            npm start
    The server will run on http://localhost:3000. Ensure that MongoDB is up and running and accessible.

2. Verify the API

    You can verify the API is running by hitting the status endpoint:

    curl -X GET http://localhost:3000/api/status -H "x-api-key: your_generated_api_key"

    If everything is working, you should receive:

        {
            "message": "API is working"
        }

API Endpoints : 
    1. Authentication

        Generate API Key: POST /api/keys/generate

            Request:

                {
                    "userAddress": "0xYourUserAddress"
                }

    Response:

            {
                "apiKey": "your_generated_api_key"
            }

    Revoke API Key: POST /api/keys/revoke

    Request:

            {
                "apiKey": "your_api_key_to_revoke"
            }

    Response:

            {
                "message": "API key revoked"
            }

2. User Management

        Register User: POST /api/user/register

            Request:

                {
                    "userAddress": "0xYourUserAddress",
                    "name": "JohnDoe",
                    "sshKey": "ssh-rsa your_ssh_key_here"
                }

            Response:

                {
                    "success": true,
                    "message": "User registered successfully"
                }

    Get User Balance: POST /api/user/getUsdBalance

        Request:

                {
                    "userAddress": "0xYourUserAddress"
                }

        Response:

                {
                    "usdBalance": 1000
                }

3. Machine Management

    Get Machine Availability: GET /api/machine/available

        Returns a list of available machines for rent.

## **Error Handling**
The API returns standard HTTP status codes to indicate the success or failure of requests:

- **200 OK**: The request was successful.
- **400 Bad Request**: The request was malformed or missing required fields.
- **401 Unauthorized**: The request lacked a valid API key or authentication token.
- **404 Not Found**: The requested resource could not be found.
- **500 Internal Server Error**: An unexpected error occurred on the server.

---

## **Contribution Guidelines**

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Open a pull request for review.

## **License**
This project is licensed under the GNU General Public License v3.0. See the [LICENSE](./LICENSE) file for more details.

---

## **Contact Information**
For any queries or issues, please contact the development team at `support@clusterprotocol.io`.
