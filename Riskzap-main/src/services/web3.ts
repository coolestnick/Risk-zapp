import { ethers, providers, Contract, utils } from 'ethers';
const { parseUnits, formatUnits, parseEther, formatEther } = utils;

// -- Runtime-config keys (localStorage keys)
const LS_TOKEN_KEY = 'RISKZAP_SHM_TOKEN_ADDRESS';
const LS_COMPANY_KEY = 'RISKZAP_COMPANY_WALLET';
const LS_POLICY_KEY = 'RISKZAP_POLICY_CONTRACT';
const shardeumLiberty = {
  chainId: '0x1f90', // 8080 in hex (was incorrectly set to decimal)
  chainName: 'Shardeum Unstablenet',
  rpcUrls: ['https://api-unstable.shardeum.org'],
  nativeCurrency: {
    name: 'SHM',
    symbol: 'SHM',
    decimals: 18,
  },
  blockExplorerUrls: ['https://explorer-unstable.shardeum.org/'],
};

// Policy contract key constant
// const POLICY_KEY = 'RISKZAP_POLICY_CONTRACT'; // removed duplicate

// Demo mode for development when contracts aren't deployed
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Create a robust RPC provider with fallback URLs
 */
async function createRobustProvider(): Promise<providers.JsonRpcProvider> {
  const rpcUrls = [
    'https://api-unstable.shardeum.org',
    'https://rpc-unstable.shardeum.org',
    'https://api.shardeum.org'
  ];
  
  for (const url of rpcUrls) {
    try {
      console.log(`🔄 Trying RPC provider: ${url}`);
      const provider = new providers.JsonRpcProvider(url, {
        chainId: 8080,
        name: 'shardeum-unstablenet'
      });
      
      // Test the provider with a simple call
      await Promise.race([
        provider.getBlockNumber(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Provider test timeout')), 3000)
        )
      ]);
      
      console.log(`✅ RPC provider working: ${url}`);
      return provider;
    } catch (error) {
      console.warn(`❌ RPC provider failed: ${url}`, error);
      continue;
    }
  }
  
  throw new Error('All RPC providers failed. Network may be down.');
}

/**
 * Create a wallet provider with enhanced error handling
 */
async function createWalletProvider(): Promise<providers.Web3Provider> {
  if (!(window as any).ethereum) {
    throw new Error('No web3 wallet found. Please install MetaMask.');
  }
  
  return new providers.Web3Provider((window as any).ethereum);
}

/**
 * Force refresh the MetaMask connection and ensure correct network
 */
export async function refreshWalletConnection(): Promise<{ provider: providers.Web3Provider; signer: ethers.Signer; address: string }> {
  if (!(window as any).ethereum) {
    throw new Error('No web3 wallet found. Please install MetaMask.');
  }

  console.log('🔄 Refreshing wallet connection...');
  
  // Force refresh the connection
  await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
  
  // Ensure we're on the correct network
  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1f90' }], // 8080 in hex
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      // Network doesn't exist, add it
      await (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [shardeumLiberty]
      });
    }
  }
  
  const provider = new providers.Web3Provider((window as any).ethereum);
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  
  console.log('✅ Wallet connection refreshed:', address);
  return { provider, signer, address };
}


const DEFAULT_SHM_TOKEN_ADDRESS = (import.meta as any)?.env?.VITE_SHM_TOKEN_ADDRESS || '';

export const SHM_TOKEN_DECIMALS = import.meta.env.VITE_SHM_TOKEN_DECIMALS
  ? Number(import.meta.env.VITE_SHM_TOKEN_DECIMALS)
  : 18;

export const EXPECTED_CHAIN_ID: number | undefined = import.meta.env
  .VITE_SHM_CHAIN_ID
  ? Number(import.meta.env.VITE_SHM_CHAIN_ID)
  : undefined;

/* Simple runtime getters/setters. These prefer localStorage overrides, then env. */
export function getConfiguredTokenAddress(): string {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LS_TOKEN_KEY);
      if (stored) return stored;
    }
  } catch (e) {
    console.debug('getConfiguredTokenAddress read error', e);
  }
  return DEFAULT_SHM_TOKEN_ADDRESS;
}

export function setConfiguredTokenAddress(addr: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LS_TOKEN_KEY, addr);
    } catch (e) {
      console.debug('setConfiguredTokenAddress error', e);
    }
  }
}

export function getConfiguredCompanyWallet(): string | null {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LS_COMPANY_KEY);
      if (stored) {
        // Validate and normalize the address with proper checksum
        try {
          return ethers.getAddress(stored);
        } catch {
          console.warn('Invalid company wallet address in localStorage');
        }
      }
      // fall back to env only if provided
      const env = (import.meta as any)?.env?.VITE_COMPANY_WALLET;
      if (env) {
        // Validate and normalize the address with proper checksum
        try {
          return ethers.getAddress(env);
        } catch {
          console.error('Invalid company wallet address in environment variable');
          return null;
        }
      }
    }
  } catch (e) {
    console.debug('getConfiguredCompanyWallet read error', e);
  }
  return null; // intentionally no hardcoded default
}

export function setConfiguredCompanyWallet(addr: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LS_COMPANY_KEY, addr);
    } catch (e) {
      console.debug('setConfiguredCompanyWallet error', e);
    }
  }
}

export function getConfiguredPolicyContract(): string | null {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LS_POLICY_KEY);
      if (stored) return stored;
    }
  } catch (e) {
    console.debug('getConfiguredPolicyContract read error', e);
  }
  return null;
}

export function setConfiguredPolicyContract(addr: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LS_POLICY_KEY, addr);
    } catch (e) {
      console.debug('setConfiguredPolicyContract error', e);
    }
  }
}

// Minimal ABIs used by the client
const erc20Abi = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const policyAbi = [
  'function purchase(uint256 policyId, uint256 amount, bytes data)',
  'function setToken(address tokenAddr)',
  'function setCompanyWallet(address _companyWallet)'
];

// Fee constants (basis points)
export const PURCHASE_FEE_BP = 500; // 5% platform fee on purchase
export const WITHDRAW_FEE_BP = 20; // 0.2% fee on withdrawal/claim pay

export function calculatePurchaseFee(amountInShm: number) {
  const fee = (amountInShm * PURCHASE_FEE_BP) / 10000;
  return { fee, net: amountInShm - fee };
}

export function calculateWithdrawFee(amountInShm: number) {
  const fee = (amountInShm * WITHDRAW_FEE_BP) / 10000;
  return { fee, net: amountInShm - fee };
}

/**
 * Approve token to the policy contract and call purchase(policyId, amount)
 */
export async function purchaseWithPolicyContract(
  signer: ethers.Signer,
  policyId: number,
  amountInShm: string | number
) { 
  const provider = signer.provider;
  if (!provider) throw new Error('Signer has no provider');

  const tokenAddr = getConfiguredTokenAddress();
  const policyAddr = getConfiguredPolicyContract();
  if (!policyAddr) throw new Error('Policy contract not configured. Set RISKZAP_POLICY_CONTRACT in settings or env.');
  if (!tokenAddr) throw new Error('Token address not configured. Set RISKZAP_SHM_TOKEN_ADDRESS.');

  const tokenContract = new Contract(tokenAddr, erc20Abi, signer);
  const policyContract = new Contract(policyAddr, policyAbi, signer);

  const amount = parseUnits(String(amountInShm), SHM_TOKEN_DECIMALS);

  // Approve then purchase
  const approveTx = await tokenContract.approve(policyAddr, amount);
  await approveTx.wait();

  const tx = await policyContract.purchase(policyId, amount, '0x');
  await tx.wait();
  return tx;
}

/**
 * Connect to wallet (Browser) and ensure correct network
 */
export async function connectWallet() {
  if (!(window as any).ethereum) {
    throw new Error('No web3 wallet found. Please install MetaMask or another provider.');
  }

  console.log('🔌 Connecting to wallet...');
  console.log('🔍 Expected Chain ID:', EXPECTED_CHAIN_ID);

  // Request account access
  await (window as any).ethereum.request({ method: 'eth_requestAccounts' });

  // Create provider with explicit network to avoid issues
  const provider = new providers.Web3Provider((window as any).ethereum);
  
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  console.log('👤 Connected address:', address);

  // Check if we're on the correct network with better error handling
  try {
    const network = await Promise.race([
      provider.getNetwork(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Network check timeout')), 8000)
      )
    ]);
    
    const chainIdNum = Number(network.chainId);
    
    console.log('🌐 Current network:', network);
    console.log('🔗 Current Chain ID:', chainIdNum);
    
    // If we have an expected chain ID and we're not on it, try to switch
    if (EXPECTED_CHAIN_ID && chainIdNum !== EXPECTED_CHAIN_ID) {
      console.log('⚠️ Wrong network detected. Switching to Shardeum...');
      
      try {
        // Try to switch to the correct network
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${EXPECTED_CHAIN_ID.toString(16)}` }],
        });
        console.log('✅ Successfully switched network');
      } catch (switchError: any) {
        console.log('🔧 Network switch failed, trying to add network:', switchError);
        
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [shardeumLiberty]
          });
          console.log('✅ Successfully added and switched to Shardeum network');
        } else {
          console.warn('Could not switch network automatically:', switchError);
        }
      }
      
      // Recreate provider after network switch
      const newProvider = new providers.Web3Provider((window as any).ethereum);
      const newSigner = newProvider.getSigner();
      
      try {
        const finalNetwork = await newProvider.getNetwork();
        console.log('🔄 Final network after switch:', finalNetwork);
      } catch (finalNetworkError) {
        console.warn('Could not verify final network, but continuing:', finalNetworkError);
      }
      
      return { provider: newProvider, signer: newSigner, address };
    }
  } catch (networkError) {
    console.warn('Network check failed, but continuing with connection:', networkError);
    // Continue with the original provider even if network check fails
  }

  return { provider, signer, address };
}

/**
 * Ensure correct chain (if EXPECTED_CHAIN_ID is set)
 */
async function assertExpectedNetwork(signer: ethers.Signer) {
  if (EXPECTED_CHAIN_ID === undefined) return;
  const provider = signer.provider;
  if (!provider) throw new Error('Signer has no provider attached.');

  const network = await provider.getNetwork();
  const chainIdNum = Number(network.chainId as any);
  if (chainIdNum !== EXPECTED_CHAIN_ID) {
    throw new Error(`Connected chainId=${chainIdNum} does not match expected=${EXPECTED_CHAIN_ID}`);
  }
}

/**
 * Get SHM token balance of a given address (using native SHM)
 */
export async function getShmBalance(provider: providers.Provider, address: string) {
  if (!provider) {
    throw new Error('Provider is required to check SHM balance.');
  }

  console.log('🔍 Checking SHM balance for address:', address);
  console.log('🔍 Demo mode?', DEMO_MODE);

  // In demo mode, return a mock balance
  if (DEMO_MODE) {
    console.log('🎭 Demo mode: returning mock SHM balance of 1000');
    return "1000.0";
  }

  // For native SHM tokens, just get the native balance
  try {
    // First check if we can get network info
    let network;
    try {
      network = await provider.getNetwork();
      console.log('🌐 Provider network:', network);
    } catch (networkError) {
      console.warn('⚠️ Could not get network info:', networkError);
    }

    // Try to get balance with timeout and retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        const balance = await Promise.race([
          provider.getBalance(address),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Balance fetch timeout')), 8000)
          )
        ]);

        const formattedBalance = formatEther(balance);
        console.log('💰 Raw balance (wei):', balance.toString());
        console.log('💰 Formatted balance (SHM):', formattedBalance);
        return formattedBalance;
      } catch (retryError) {
        retries--;
        console.warn(`⚠️ Balance fetch attempt failed, ${retries} retries left:`, retryError);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw new Error('Failed to get balance after retries');
  } catch (error) {
    console.error('❌ Error getting SHM balance:', error);
    
    // Try with multiple fallback RPC providers
    const fallbackUrls = [
      'https://api-unstable.shardeum.org',
      'https://rpc-unstable.shardeum.org',
      'https://api.shardeum.org'
    ];
    
    for (const url of fallbackUrls) {
      try {
        console.log(`🔄 Trying fallback RPC provider: ${url}`);
        const fallbackProvider = new providers.JsonRpcProvider(url, {
          chainId: 8080,
          name: 'shardeum-unstablenet'
        });
        
        const fallbackBalance = await Promise.race([
          fallbackProvider.getBalance(address),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Fallback timeout')), 5000)
          )
        ]);
        
        const formattedFallbackBalance = formatEther(fallbackBalance);
        console.log(`💰 Fallback balance (SHM) from ${url}:`, formattedFallbackBalance);
        return formattedFallbackBalance;
      } catch (fallbackError) {
        console.error(`❌ Fallback provider ${url} failed:`, fallbackError);
        continue;
      }
    }
    
    // If all providers fail, return 0 instead of throwing
    console.warn('⚠️ All providers failed, returning 0 balance');
    return "0.0";
  }
}

/**
 * Send SHM token to the configured company wallet.
 * Company wallet must be configured via env or settings; there is no hardcoded fallback.
 */
export async function sendShmToken(signer: ethers.Signer, amountInShm: string | number) {
  const provider = signer.provider;
  if (!provider) throw new Error('No provider found for signer.');

  const from = await signer.getAddress();

  // resolve configured company wallet
  const company = getConfiguredCompanyWallet();
  if (!company) {
    throw new Error('Company wallet not configured. Set VITE_COMPANY_WALLET or use AdminSettings to provide a company wallet address.');
  }

  // Skip network assertion to avoid circuit breaker issues
  try {
    console.log('🔍 Checking network compatibility...');
    await assertExpectedNetwork(signer);
  } catch (networkError) {
    console.warn('⚠️ Network check failed, continuing anyway:', networkError);
    // Continue with transaction anyway - MetaMask will handle network switching
  }

  const balance = await getShmBalance(provider, from);
  if (parseFloat(balance) < parseFloat(String(amountInShm))) {
    throw new Error(`Insufficient SHM balance. You have ${balance}, trying to send ${amountInShm}.`);
  }

  // In demo mode, simulate the transaction
  if (DEMO_MODE) {
    console.log(`🎭 Demo mode: simulating transfer of ${amountInShm} SHM to company wallet ${company}`);
    // Simulate a delay like a real transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      wait: async () => ({ status: 1 })
    };
  }

  // Send native SHM tokens directly
  const amount = parseEther(String(amountInShm));
  
  // Prepare transaction parameters
  let gasPrice;
  let gasLimit = 21000n; // Use BigInt for gas limit
  
  try {
    // Get current gas price from network with better error handling
    try {
      const feeData = await Promise.race([
        provider.getFeeData(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Fee data timeout')), 5000)
        )
      ]);
      gasPrice = feeData.gasPrice || parseUnits("20", "gwei");
      console.log('⛽ Current gas price:', formatUnits(gasPrice, 'gwei'), 'gwei');
    } catch (gasPriceError) {
      console.warn('⚠️ Could not get gas price, using fallback');
      gasPrice = parseUnits("20", "gwei");
    }

    // Estimate gas limit with fallback
    try {
      const estimatedGas = await provider.estimateGas({
        to: company,
        value: amount,
        from: from
      });
      gasLimit = estimatedGas + (estimatedGas / 10n); // Add 10% buffer
      console.log('⛽ Estimated gas limit:', gasLimit.toString());
    } catch (gasEstimateError) {
      console.warn('⚠️ Could not estimate gas, using standard limit');
    }

    const txParams = {
      to: company,
      value: amount,
      gasLimit: gasLimit,
      gasPrice: gasPrice
    };

    console.log('📤 Sending transaction with params:', {
      to: txParams.to,
      value: formatEther(txParams.value),
      gasLimit: txParams.gasLimit.toString(),
      gasPrice: formatUnits(txParams.gasPrice, 'gwei') + ' gwei'
    });

    const tx = await signer.sendTransaction(txParams);
    console.log('📤 Transaction sent:', tx.hash);
    
    // Wait for confirmation with timeout
    const receipt = await Promise.race([
      tx.wait(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Transaction confirmation timeout')), 60000)
      )
    ]);
    
    console.log('✅ Transaction confirmed:', tx.hash);
    return tx;
  } catch (txError: any) {
    console.error('❌ Transaction failed:', txError);
    
    // Handle specific RPC error codes
    if (txError.code === -32603 || txError.message?.includes('Internal JSON-RPC error')) {
      // Try to switch to a fallback RPC or retry
      console.log('🔄 Detected RPC error, attempting fallback solution...');
      
      // If we have MetaMask, try to refresh the provider connection
      if ((window as any).ethereum) {
        try {
          // Request a fresh connection
          await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          
          // Create a new provider and retry once
          const freshProvider = new providers.Web3Provider((window as any).ethereum);
          const freshSigner = freshProvider.getSigner();
          
          // Prepare fresh transaction parameters
          const freshTxParams = {
            to: company,
            value: amount,
            gasLimit: gasLimit,
            gasPrice: gasPrice
          };
          
          console.log('🔄 Retrying transaction with fresh provider...');
          const retryTx = await freshSigner.sendTransaction(freshTxParams);
          console.log('📤 Retry transaction sent:', retryTx.hash);
          
          const retryReceipt = await retryTx.wait();
          console.log('✅ Retry transaction confirmed:', retryTx.hash);
          return retryTx;
        } catch (retryError) {
          console.error('❌ Retry also failed:', retryError);
          throw new Error(`Network connectivity issue. Please check your internet connection and try again. Original error: ${txError.message}`);
        }
      }
      
      throw new Error(`Network error: Shardeum RPC is experiencing issues. Please try again in a few minutes. Error code: ${txError.code}`);
    }
    
    // Provide more specific error messages for other errors
    if (txError.message?.includes('insufficient funds')) {
      throw new Error(`Insufficient funds for transaction. Check your SHM balance and gas fees.`);
    } else if (txError.message?.includes('user rejected')) {
      throw new Error(`Transaction was cancelled by user.`);
    } else if (txError.message?.includes('timeout')) {
      throw new Error(`Transaction timed out. Please try again.`);
    } else if (txError.message?.includes('JSON-RPC')) {
      throw new Error(`Network error: ${txError.message}. Please check your connection and try again.`);
    } else {
      throw new Error(`Transaction failed: ${txError.message || 'Unknown error'}`);
    }
  }
}

/**
 * Send SHM token payout from company wallet to user (for claims)
 * This would typically be called by the company/admin, not the user
 */
export async function sendClaimPayout(companySigner: ethers.Signer, userAddress: string, amountInShm: string | number) {
  await assertExpectedNetwork(companySigner);

  const provider = companySigner.provider;
  if (!provider) throw new Error('No provider found for signer.');

  // In demo mode, simulate the claim payout
  if (DEMO_MODE) {
    console.log(`🎭 Demo mode: simulating claim payout of ${amountInShm} SHM to user ${userAddress}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      wait: async () => ({ status: 1 })
    };
  }

  // Send native SHM tokens directly
  const amount = parseEther(String(amountInShm));
  
  const tx = await companySigner.sendTransaction({
    to: userAddress,
    value: amount,
    gasLimit: 21000,
    gasPrice: parseUnits("20", "gwei")
  });

  await tx.wait();
  return tx;
}

