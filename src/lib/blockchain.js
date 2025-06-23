import Web3 from 'web3';

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.config = null;
    this.contract = null;
    this.initializeWeb3();
  }

  async initializeWeb3() {
    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && window.ethereum) {
        this.web3 = new Web3(window.ethereum);
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          console.log('Account changed:', accounts[0]);
        });

        // Listen for chain changes
        window.ethereum.on('chainChanged', (chainId) => {
          console.log('Chain changed:', chainId);
          window.location.reload();
        });
      } else {
        console.warn('MetaMask not found. Please install MetaMask to use blockchain features.');
      }
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
    }
  }

  async setConfig(config) {
    this.config = config;
    
    if (this.web3) {
      // Set the correct network
      await this.switchNetwork(config.chainId);
      
      // Load the voting contract ABI and address
      await this.loadContract();
    }
  }

  async switchNetwork(chainId) {
    if (!this.web3 || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (error) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        await this.addNetwork();
      }
    }
  }

  async addNetwork() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: this.config?.chainId,
          chainName: 'E-Voting Network',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: [this.config?.rpcUrl],
          blockExplorerUrls: ['https://explorer.example.com'],
        }],
      });
    } catch (error) {
      console.error('Failed to add network:', error);
    }
  }

  async loadContract() {
    if (!this.web3 || !this.config) return;

    try {
      // Voting contract ABI (simplified)
      const contractABI = [
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_electionId",
              "type": "string"
            },
            {
              "internalType": "bytes",
              "name": "_encryptedVote",
              "type": "bytes"
            }
          ],
          "name": "castVote",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_electionId",
              "type": "string"
            }
          ],
          "name": "getVoteCount",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_electionId",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "_voter",
              "type": "address"
            }
          ],
          "name": "hasVoted",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];

      this.contract = new this.web3.eth.Contract(
        contractABI,
        this.config.contractAddress
      );
    } catch (error) {
      console.error('Failed to load contract:', error);
    }
  }

  async castVote(electionId, encryptedVote) {
    if (!this.web3 || !this.contract) {
      throw new Error('Web3 or contract not initialized');
    }

    try {
      const accounts = await this.web3.eth.getAccounts();
      const account = accounts[0];

      if (!account) {
        throw new Error('No account found. Please connect MetaMask.');
      }

      // Check if user has already voted
      const hasVoted = await this.contract.methods.hasVoted(electionId, account).call();
      if (hasVoted) {
        throw new Error('You have already voted in this election.');
      }

      // Convert encrypted vote to bytes
      const encryptedBytes = this.web3.utils.asciiToHex(encryptedVote);

      // Estimate gas
      const gasEstimate = await this.contract.methods
        .castVote(electionId, encryptedBytes)
        .estimateGas({ from: account });

      // Send transaction
      const transaction = await this.contract.methods
        .castVote(electionId, encryptedBytes)
        .send({
          from: account,
          gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
        });

      return {
        hash: transaction.transactionHash,
        from: transaction.from,
        to: transaction.to,
        value: '0',
        gasUsed: transaction.gasUsed,
        status: 'confirmed',
        blockNumber: transaction.blockNumber,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to cast vote:', error);
      throw error;
    }
  }

  async getVoteCount(electionId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const count = await this.contract.methods.getVoteCount(electionId).call();
      return parseInt(count);
    } catch (error) {
      console.error('Failed to get vote count:', error);
      throw error;
    }
  }

  async hasVoted(electionId, voterAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.methods.hasVoted(electionId, voterAddress).call();
    } catch (error) {
      console.error('Failed to check if user has voted:', error);
      throw error;
    }
  }

  async getTransactionReceipt(txHash) {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    try {
      return await this.web3.eth.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      throw error;
    }
  }

  async getCurrentAccount() {
    if (!this.web3) return null;

    try {
      const accounts = await this.web3.eth.getAccounts();
      return accounts[0] || null;
    } catch (error) {
      console.error('Failed to get current account:', error);
      return null;
    }
  }

  async getNetworkId() {
    if (!this.web3) return null;

    try {
      return await this.web3.eth.net.getId();
    } catch (error) {
      console.error('Failed to get network ID:', error);
      return null;
    }
  }

  // Utility methods
  isConnected() {
    return this.web3 !== null && this.contract !== null;
  }

  getExplorerUrl(txHash) {
    if (!this.config) return '';
    return `https://explorer.example.com/tx/${txHash}`;
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService; 