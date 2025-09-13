import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_CONFIG, TOKEN_FACTORY_ABI, MEME_TOKEN_ABI } from '../utils/constants';

export const useContract = () => {
  const { provider, signer, isConnected, isCorrectNetwork } = useWeb3();
  const [contracts, setContracts] = useState({});

  // Initialize contracts
  useEffect(() => {
    if (!provider || !CONTRACT_CONFIG.FACTORY_ADDRESS || !isCorrectNetwork) {
      setContracts({});
      return;
    }

    try {
      const factoryContract = new ethers.Contract(
        CONTRACT_CONFIG.FACTORY_ADDRESS,
        TOKEN_FACTORY_ABI,
        provider
      );

      setContracts({
        factory: factoryContract,
        factoryWithSigner: signer ? factoryContract.connect(signer) : null,
      });
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
      setContracts({});
    }
  }, [provider, signer, isCorrectNetwork]);

  // Get token contract instance
  const getTokenContract = useCallback((tokenAddress, needSigner = false) => {
    if (!provider || !tokenAddress) return null;

    try {
      const tokenContract = new ethers.Contract(tokenAddress, MEME_TOKEN_ABI, provider);
      return needSigner && signer ? tokenContract.connect(signer) : tokenContract;
    } catch (error) {
      console.error('Failed to get token contract:', error);
      return null;
    }
  }, [provider, signer]);

  // Create new token
  const createToken = useCallback(async (tokenData, ethAmount = '0') => {
    if (!contracts.factoryWithSigner || !isConnected) {
      throw new Error('Wallet not connected or contract not available');
    }

    try {
      console.log('=== CREATE TOKEN DEBUG ===');
      const { name, symbol, description, imageHash } = tokenData;
      console.log('Token Data:', { name, symbol, description, imageHash });
      console.log('ETH Amount:', ethAmount);

      // Validate contract is available
      console.log('Factory contract address:', contracts.factoryWithSigner.target || contracts.factoryWithSigner.address);
      
      // Test contract connection
      try {
        const contractCode = await provider.getCode(contracts.factoryWithSigner.target || contracts.factoryWithSigner.address);
        console.log('Contract code length:', contractCode.length);
        if (contractCode === '0x') {
          throw new Error('Contract not deployed at this address');
        }
      } catch (contractError) {
        console.error('Contract validation failed:', contractError);
        throw new Error('Unable to connect to token factory contract');
      }

      // Validate inputs
      if (!name || !symbol) {
        throw new Error('Token name and symbol are required');
      }

      if (name.length < 1 || name.length > 50) {
        throw new Error('Token name must be between 1 and 50 characters');
      }

      if (symbol.length < 1 || symbol.length > 10) {
        throw new Error('Token symbol must be between 1 and 10 characters');
      }

      const value = ethAmount && ethAmount !== '0' ? ethers.parseEther(ethAmount.toString()) : 0n;
      console.log('Value in wei:', value.toString());

      // Get signer info
      const signerAddress = await contracts.factoryWithSigner.runner.getAddress();
      console.log('Signer address:', signerAddress);

      // Check balance if sending ETH
      if (value > 0) {
        const balance = await provider.getBalance(signerAddress);
        console.log('Current balance:', ethers.formatEther(balance), 'SHM');
        
        if (balance < value) {
          throw new Error('Insufficient balance for initial purchase');
        }
      }

      // Estimate gas first
      console.log('Estimating gas for token creation...');
      let gasEstimate;
      try {
        gasEstimate = await contracts.factoryWithSigner.createToken.estimateGas(
          name,
          symbol,
          description || '', // desc in minimal ABI
          imageHash || '',   // img in minimal ABI
          { value }
        );
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        // Use a higher fixed gas limit for token creation
        gasEstimate = 800000n;
      }

      // Send transaction with estimated gas + 20% buffer
      const gasLimit = gasEstimate + (gasEstimate * 20n / 100n);
      console.log('Using gas limit:', gasLimit.toString());

      console.log('Sending create token transaction...');
      const tx = await contracts.factoryWithSigner.createToken(
        name,
        symbol,
        description || '', // desc in minimal ABI
        imageHash || '',   // img in minimal ABI
        { 
          value, 
          gasLimit: gasLimit
        }
      );

      console.log('Token creation transaction sent:', tx.hash);
      return tx;
    } catch (error) {
      console.error('=== CREATE TOKEN ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      } else if (error.message?.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new Error('Transaction would likely fail - check your inputs and balance');
      } else if (error.message?.includes('Token name') || error.message?.includes('Token symbol')) {
        throw error; // Re-throw validation errors as-is
      } else {
        throw new Error(`Token creation failed: ${error.message || 'Unknown error'}`);
      }
    }
  }, [contracts.factoryWithSigner, provider, isConnected]);

  // Buy tokens
  const buyTokens = useCallback(async (tokenAddress, ethAmount) => {
    if (!contracts.factoryWithSigner || !isConnected) {
      throw new Error('Wallet not connected or contract not available');
    }

    try {
      console.log('=== BUY TOKENS DEBUG ===');
      console.log('Token address:', tokenAddress);
      console.log('ETH amount:', ethAmount);
      
      // Validate address format
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error('Invalid token address format');
      }
      
      // Check if token exists in contract
      console.log('Checking if token exists...');
      const tokenInfo = await contracts.factory.getToken(tokenAddress);
      console.log('Token info from contract:', tokenInfo);
      
      if (!tokenInfo.addr || tokenInfo.addr === '0x0000000000000000000000000000000000000000') {
        throw new Error('Token not found in contract');
      }
      
      const value = ethers.parseEther(ethAmount.toString());
      console.log('Value in wei:', value.toString());
      
      // Get signer info
      const signerAddress = await contracts.factoryWithSigner.runner.getAddress();
      console.log('Signer address:', signerAddress);
      
      // Get current balance
      const balance = await provider.getBalance(signerAddress);
      console.log('Current balance:', ethers.formatEther(balance), 'SHM');
      
      if (balance < value) {
        throw new Error('Insufficient balance');
      }
      
      // Estimate gas first
      console.log('Estimating gas...');
      let gasEstimate;
      try {
        gasEstimate = await contracts.factoryWithSigner.buy.estimateGas(tokenAddress, { value });
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        // Use a fixed gas limit if estimation fails
        gasEstimate = 300000n;
      }
      
      // Send transaction with estimated gas + 20% buffer
      const gasLimit = gasEstimate + (gasEstimate * 20n / 100n);
      console.log('Using gas limit:', gasLimit.toString());
      
      console.log('Sending buy transaction...');
      const tx = await contracts.factoryWithSigner.buy(tokenAddress, {
        value: value,
        gasLimit: gasLimit,
      });

      console.log('Transaction sent successfully:', tx.hash);
      return tx;
    } catch (error) {
      console.error('=== BUY TOKENS ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      } else if (error.message?.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      } else if (error.message?.includes('Token not found')) {
        throw new Error('Token not found in contract');
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new Error('Transaction would likely fail - check token address and amount');
      } else {
        throw new Error(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
    }
  }, [contracts.factoryWithSigner, contracts.factory, provider, isConnected]);

  // Sell tokens
  const sellTokens = useCallback(async (tokenAddress, tokenAmount) => {
    if (!contracts.factoryWithSigner || !isConnected) {
      throw new Error('Wallet not connected or contract not available');
    }

    try {
      console.log('=== SELL TOKENS DEBUG ===');
      console.log('Token address:', tokenAddress);
      console.log('Token amount to sell:', tokenAmount);
      
      // First approve the factory to spend tokens
      const tokenContract = getTokenContract(tokenAddress, true);
      if (!tokenContract) throw new Error('Failed to get token contract');

      const amount = ethers.parseEther(tokenAmount.toString());
      console.log('Amount in wei:', amount.toString());
      
      // Get user's token balance
      const userAddress = await signer.getAddress();
      const tokenBalance = await tokenContract.balanceOf(userAddress);
      console.log('User token balance:', ethers.formatEther(tokenBalance));
      
      if (tokenBalance < amount) {
        throw new Error('Insufficient token balance');
      }
      
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(
        userAddress,
        CONTRACT_CONFIG.FACTORY_ADDRESS
      );
      console.log('Current allowance:', ethers.formatEther(currentAllowance));

      if (currentAllowance < amount) {
        console.log('Approving tokens for factory...');
        const approveTx = await tokenContract.approve(
          CONTRACT_CONFIG.FACTORY_ADDRESS,
          amount,
          { gasLimit: 100000 }
        );
        console.log('Approval tx sent:', approveTx.hash);
        const approvalReceipt = await approveTx.wait();
        console.log('Approval confirmed:', approvalReceipt);
      }

      // Now sell tokens
      console.log('Sending sell transaction...');
      const tx = await contracts.factoryWithSigner.sell(tokenAddress, amount, {
        gasLimit: 300000,
      });
      console.log('Sell transaction sent:', tx.hash);

      return tx;
    } catch (error) {
      console.error('=== SELL TOKENS ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('Insufficient token balance')) {
        throw new Error('Insufficient token balance to sell');
      } else if (error.message?.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new Error('Transaction would likely fail - check token amount');
      } else {
        throw new Error(`Sell failed: ${error.message || 'Unknown error'}`);
      }
    }
  }, [contracts.factoryWithSigner, isConnected, signer, getTokenContract]);

  const getTokenInfo = useCallback(async (tokenAddress) => {
    console.log('getTokenInfo called with address:', tokenAddress);
    console.log('contracts.factory available:', !!contracts.factory);
    
    if (!contracts.factory) {
      console.log('No factory contract available');
      return null;
    }

    try {
      // Get minimal token info from factory (back to original)
      console.log('Calling getToken on factory contract...');
      const tokenInfo = await contracts.factory.getToken(tokenAddress);
      console.log('Raw token info from contract:', tokenInfo);
      
      // Check if token exists in contract
      if (!tokenInfo || !tokenInfo.addr || tokenInfo.addr === '0x0000000000000000000000000000000000000000') {
        console.log('Token not found in contract');
        return null;
      }
      
      // Get additional token details from the token contract
      const tokenContract = getTokenContract(tokenAddress);
      if (!tokenContract) {
        console.log('Could not get token contract instance');
        return null;
      }

      console.log('Fetching token metadata...');
      const [name, symbol, description, imageHash] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.description(),
        tokenContract.imageHash(),
      ]);

      const result = {
        tokenAddress: tokenInfo.addr,
        creator: tokenInfo.creator,
        currentSupply: tokenInfo.supply,
        marketCap: tokenInfo.mcap,
        isListed: tokenInfo.listed,
        name,
        symbol,
        description,
        imageHash,
      };
      
      console.log('Returning token info:', result);
      return result;
    } catch (error) {
      console.error('Failed to get token info:', error);
      console.error('Error details:', error.message);
      return null;
    }
  }, [contracts.factory, getTokenContract]);

  // Get all tokens
  const getAllTokens = useCallback(async () => {
    if (!contracts.factory) return [];

    try {
      const count = await contracts.factory.getCount();
      const tokenAddresses = [];
      
      for (let i = 0; i < Number(count); i++) {
        const tokenAddress = await contracts.factory.allTokens(i);
        tokenAddresses.push(tokenAddress);
      }
      
      return tokenAddresses;
    } catch (error) {
      console.error('Failed to get all tokens:', error);
      return [];
    }
  }, [contracts.factory]);

  // Get token count
  const getTokenCount = useCallback(async () => {
    if (!contracts.factory) return 0;

    try {
      const count = await contracts.factory.getCount();
      return Number(count);
    } catch (error) {
      console.error('Failed to get token count:', error);
      return 0;
    }
  }, [contracts.factory]);

  // Get current price
  const getCurrentPrice = useCallback(async (tokenAddress) => {
    if (!contracts.factory) return '0';

    try {
      const price = await contracts.factory.getPrice(tokenAddress);
      return ethers.formatEther(price);
    } catch (error) {
      console.error('Failed to get current price:', error);
      return '0';
    }
  }, [contracts.factory]);

  // Get token balance
  const getTokenBalance = useCallback(async (tokenAddress, userAddress) => {
    const tokenContract = getTokenContract(tokenAddress);
    if (!tokenContract || !userAddress) return '0';

    try {
      const balance = await tokenContract.balanceOf(userAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }, [getTokenContract]);

  // Listen to contract events
  const listenToEvents = useCallback((eventName, callback, tokenAddress = null) => {
    if (!contracts.factory) return null;

    try {
      const contract = tokenAddress ? getTokenContract(tokenAddress) : contracts.factory;
      if (!contract) return null;

      const filter = contract.filters[eventName]();
      contract.on(filter, callback);

      return () => {
        contract.off(filter, callback);
      };
    } catch (error) {
      console.error('Failed to set up event listener:', error);
      return null;
    }
  }, [contracts.factory, getTokenContract]);

  return {
    contracts,
    getTokenContract,
    createToken,
    buyTokens,
    sellTokens,
    getTokenInfo,
    getAllTokens,
    getTokenCount,
    getCurrentPrice,
    getTokenBalance,
    listenToEvents,
    isReady: !!contracts.factory && isConnected && isCorrectNetwork,
  };
};