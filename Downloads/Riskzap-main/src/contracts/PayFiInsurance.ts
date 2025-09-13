// This would be deployed on Shardeum Liberty 1.X

export const PAYFI_INSURANCE_ABI = [
  {
    "inputs": [],
    "name": "createPolicy",
    "outputs": [{"internalType": "uint256", "name": "policyId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "policyId", "type": "uint256"}],
    "name": "claimPolicy",
    "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserPolicies",
    "outputs": [{"internalType": "uint256[]", "name": "policyIds", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "policyId", "type": "uint256"}],
    "name": "getPolicyDetails",
    "outputs": [
      {"internalType": "address", "name": "policyholder", "type": "address"},
      {"internalType": "uint256", "name": "premium", "type": "uint256"},
      {"internalType": "uint256", "name": "coverage", "type": "uint256"},
      {"internalType": "uint256", "name": "expiry", "type": "uint256"},
      {"internalType": "bool", "name": "active", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Shardeum Liberty 1.X configuration
export const SHARDEUM_CONFIG = {
  chainId: 8080, // Shardeum Unstablenet Chain ID
  rpcUrl: "https://api-unstable.shardeum.org",
  blockExplorer: "https://explorer-unstable.shardeum.org/",
  currency: {
    name: "Shardeum",
    symbol: "SHM",
    decimals: 18
  }
};

// Contract address (would be set after deployment)
export const PAYFI_CONTRACT_ADDRESS = "0x..." // To be updated after deployment

export interface PolicyType {
  DEVICE_PROTECTION: number;
  EVENT_COVERAGE: number;
  TRAVEL_INSURANCE: number;
  EQUIPMENT_RENTAL: number;
}

export const POLICY_TYPES: PolicyType = {
  DEVICE_PROTECTION: 0,
  EVENT_COVERAGE: 1,
  TRAVEL_INSURANCE: 2,
  EQUIPMENT_RENTAL: 3
};

export interface PolicyDetails {
  policyholder: string;
  premium: string;
  coverage: string;
  expiry: number;
  active: boolean;
  policyType: number;
}

// Smart contract interaction utilities
export class PayFiContract {
  private web3: any;
  private contract: any;
  private account: string;

  constructor(web3: any, account: string) {
    this.web3 = web3;
    this.account = account;
    this.contract = new web3.eth.Contract(PAYFI_INSURANCE_ABI, PAYFI_CONTRACT_ADDRESS);
  }

  async createMicroPolicy(policyType: number, premium: string, coverage: string, duration: number) {
    try {
      const premiumWei = this.web3.utils.toWei(premium, 'ether');
      
      const result = await this.contract.methods.createPolicy(
        policyType,
        coverage,
        duration
      ).send({
        from: this.account,
        value: premiumWei,
        gas: 300000
      });

      return {
        success: true,
        transactionHash: result.transactionHash,
        policyId: result.events.PolicyCreated?.returnValues?.policyId
      };
    } catch (error) {
      console.error('Error creating policy:', error);
      return { success: false, error: error.message };
    }
  }

  async claimPolicy(policyId: number) {
    try {
      const result = await this.contract.methods.claimPolicy(policyId).send({
        from: this.account,
        gas: 200000
      });

      return {
        success: true,
        transactionHash: result.transactionHash
      };
    } catch (error) {
      console.error('Error claiming policy:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserPolicies(): Promise<number[]> {
    try {
      const policyIds = await this.contract.methods.getUserPolicies(this.account).call();
      return policyIds.map((id: string) => parseInt(id));
    } catch (error) {
      console.error('Error fetching user policies:', error);
      return [];
    }
  }

  async getPolicyDetails(policyId: number): Promise<PolicyDetails | null> {
    try {
      const details = await this.contract.methods.getPolicyDetails(policyId).call();
      
      return {
        policyholder: details.policyholder,
        premium: this.web3.utils.fromWei(details.premium, 'ether'),
        coverage: this.web3.utils.fromWei(details.coverage, 'ether'),
        expiry: parseInt(details.expiry),
        active: details.active,
        policyType: parseInt(details.policyType)
      };
    } catch (error) {
      console.error('Error fetching policy details:', error);
      return null;
    }
  }
}

// Utility function to add Shardeum network to MetaMask
export const addShardeumNetwork = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${SHARDEUM_CONFIG.chainId.toString(16)}`,
          chainName: 'Shardeum Liberty 1.X',
          nativeCurrency: SHARDEUM_CONFIG.currency,
          rpcUrls: [SHARDEUM_CONFIG.rpcUrl],
          blockExplorerUrls: [SHARDEUM_CONFIG.blockExplorer]
        }]
      });
      return true;
    } catch (error) {
      console.error('Error adding Shardeum network:', error);
      return false;
    }
  }
  return false;
};