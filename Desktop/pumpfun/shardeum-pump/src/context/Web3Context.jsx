import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ethers } from 'ethers';
import { SHARDEUM_CONFIG, CONTRACT_CONFIG } from '../utils/constants';

const Web3Context = createContext();

const initialState = {
  isConnected: false,
  account: null,
  provider: null,
  signer: null,
  balance: '0',
  chainId: null,
  isLoading: false,
  error: null,
  isCorrectNetwork: false,
};

function web3Reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: true,
        account: action.payload.account,
        provider: action.payload.provider,
        signer: action.payload.signer,
        balance: action.payload.balance,
        chainId: action.payload.chainId,
        isCorrectNetwork: action.payload.isCorrectNetwork,
        isLoading: false,
        error: null,
      };
    case 'SET_DISCONNECTED':
      return {
        ...initialState,
      };
    case 'UPDATE_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_CHAIN_ID':
      return { 
        ...state, 
        chainId: action.payload,
        isCorrectNetwork: action.payload === SHARDEUM_CONFIG.chainId,
      };
    default:
      return state;
  }
}

export const Web3Provider = ({ children }) => {
  const [state, dispatch] = useReducer(web3Reducer, initialState);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum?.isMetaMask;
  };

  // Add Shardeum network to MetaMask
  const addShardeumNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: SHARDEUM_CONFIG.chainIdHex,
          chainName: SHARDEUM_CONFIG.name,
          nativeCurrency: SHARDEUM_CONFIG.nativeCurrency,
          rpcUrls: SHARDEUM_CONFIG.rpcUrls,
          blockExplorerUrls: SHARDEUM_CONFIG.blockExplorerUrls,
        }],
      });
      return true;
    } catch (error) {
      console.error('Failed to add Shardeum network:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add Shardeum network to MetaMask' });
      return false;
    }
  };

  // Switch to Shardeum network
  const switchToShardeum = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SHARDEUM_CONFIG.chainIdHex }],
      });
      return true;
    } catch (error) {
      if (error.code === 4902) {
        // Network not added, try to add it
        return await addShardeumNetwork();
      }
      console.error('Failed to switch network:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to switch to Shardeum network' });
      return false;
    }
  };

  // Get user balance
  const updateBalance = async (provider, account) => {
    try {
      const balance = await provider.getBalance(account);
      const formattedBalance = ethers.formatEther(balance);
      dispatch({ type: 'UPDATE_BALANCE', payload: formattedBalance });
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      dispatch({ type: 'SET_ERROR', payload: 'MetaMask is not installed. Please install MetaMask to continue.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'No accounts found. Please make sure MetaMask is unlocked.' });
        return;
      }

      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = accounts[0];

      // Get network info
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const isCorrectNetwork = chainId === SHARDEUM_CONFIG.chainId;

      // Get balance
      const balance = await provider.getBalance(account);
      const formattedBalance = ethers.formatEther(balance);

      dispatch({
        type: 'SET_CONNECTED',
        payload: {
          account,
          provider,
          signer,
          balance: formattedBalance,
          chainId,
          isCorrectNetwork,
        },
      });

      // If not on correct network, prompt to switch
      if (!isCorrectNetwork) {
        const switched = await switchToShardeum();
        if (switched) {
          dispatch({ type: 'SET_CHAIN_ID', payload: SHARDEUM_CONFIG.chainId });
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      let errorMessage = 'Failed to connect wallet';
      
      if (error.code === 4001) {
        errorMessage = 'Connection rejected. Please approve the connection request.';
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending. Please check MetaMask.';
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    dispatch({ type: 'SET_DISCONNECTED' });
  };

  // Initialize connection if already connected
  const checkConnection = async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const account = accounts[0];

        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        const isCorrectNetwork = chainId === SHARDEUM_CONFIG.chainId;

        const balance = await provider.getBalance(account);
        const formattedBalance = ethers.formatEther(balance);

        dispatch({
          type: 'SET_CONNECTED',
          payload: {
            account,
            provider,
            signer,
            balance: formattedBalance,
            chainId,
            isCorrectNetwork,
          },
        });
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  // Set up event listeners
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    // Account changed
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const account = accounts[0];

        const balance = await provider.getBalance(account);
        const formattedBalance = ethers.formatEther(balance);

        dispatch({
          type: 'SET_CONNECTED',
          payload: {
            account,
            provider,
            signer,
            balance: formattedBalance,
            chainId: state.chainId,
            isCorrectNetwork: state.isCorrectNetwork,
          },
        });
      }
    };

    // Chain changed
    const handleChainChanged = (chainId) => {
      const newChainId = parseInt(chainId, 16);
      dispatch({ type: 'SET_CHAIN_ID', payload: newChainId });
      
      // Reload if chain changed to prevent issues
      if (state.isConnected) {
        window.location.reload();
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check initial connection
    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Update balance periodically
  useEffect(() => {
    if (!state.isConnected || !state.provider || !state.account) return;

    const intervalId = setInterval(() => {
      updateBalance(state.provider, state.account);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId);
  }, [state.isConnected, state.provider, state.account]);

  const value = {
    ...state,
    connectWallet,
    disconnectWallet,
    switchToShardeum,
    addShardeumNetwork,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};