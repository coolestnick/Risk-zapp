import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContract } from '../hooks/useContract';
import { useWeb3 } from '../context/Web3Context';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatAddress, getIPFSUrl, getTimeAgo } from '../utils/constants';
import { formatLargeNumber } from '../utils/helpers';
import { ethers } from 'ethers';

const TokenDetail = () => {
  const { address } = useParams();
  const { getTokenInfo, getCurrentPrice, getTokenBalance, buyTokens, sellTokens } = useContract();
  const { account, isConnected } = useWeb3();
  
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState('0');
  const [userBalance, setUserBalance] = useState('0');
  const [holders, setHolders] = useState('0');
  const [volume24h, setVolume24h] = useState('0');
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [tradingLoading, setTradingLoading] = useState(false);

  const [notFound, setNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadTokenData = async () => {
      console.log('Loading token data for address:', address);
      console.log('getTokenInfo available:', !!getTokenInfo);
      console.log('Retry count:', retryCount);
      
      if (!address) {
        console.log('No address provided');
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      if (!getTokenInfo) {
        console.log('Contracts not ready, waiting...');
        // Wait for contracts to be ready
        if (retryCount < 5) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000);
        } else {
          console.log('Contracts failed to load after 5 attempts');
          setNotFound(true);
          setLoading(false);
        }
        return;
      }
      
      try {
        // Get token info
        const tokenInfo = await getTokenInfo(address);
        console.log('=== RAW CONTRACT DATA ===');
        console.log('Requested Address:', address);
        console.log('Token Info:', tokenInfo);
        console.log('Market Cap (raw):', tokenInfo?.marketCap);
        console.log('Market Cap (formatted):', tokenInfo?.marketCap ? ethers.formatEther(tokenInfo.marketCap) : 'N/A');
        console.log('Current Supply (raw):', tokenInfo?.currentSupply);
        console.log('Current Supply (formatted):', tokenInfo?.currentSupply ? ethers.formatEther(tokenInfo.currentSupply) : 'N/A');
        console.log('Is Listed:', tokenInfo?.isListed);
        
        if (tokenInfo) {
          setToken(tokenInfo);
          setLoading(false);
          setNotFound(false);
          
          // Get current price
          const currentPrice = await getCurrentPrice(address);
          console.log('Current Price (already formatted):', currentPrice);
          setPrice(currentPrice);
          
          // Get user balance if connected
          if (account && getTokenBalance) {
            const balance = await getTokenBalance(address, account);
            setUserBalance(balance);
          }
        } else {
          console.log('Token not found for address:', address);
          // Try again a few times before giving up
          if (retryCount < 3) {
            console.log(`Retrying... (attempt ${retryCount + 1}/3)`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000);
          } else {
            console.log('Token not found after 3 attempts');
            setNotFound(true);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to load token:', error);
        if (retryCount < 3) {
          console.log(`Error loading token, retrying... (attempt ${retryCount + 1}/3)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        } else {
          setNotFound(true);
          setLoading(false);
        }
      }
    };

    loadTokenData();
  }, [address, getTokenInfo, getCurrentPrice, getTokenBalance, account, retryCount]);

  // Handle buy tokens
  const handleBuy = async () => {
    if (!buyAmount || !isConnected || !token) return;
    
    setTradingLoading(true);
    try {
      const tx = await buyTokens(token.tokenAddress, buyAmount);
      console.log('Transaction sent, waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Clear the input immediately after successful transaction
      setBuyAmount('');
      
      // Show success message
      alert('Tokens purchased successfully!');
      
      // Refresh all data after successful purchase
      console.log('Refreshing token data...');
      
      // Get updated token info
      const updatedInfo = await getTokenInfo(token.tokenAddress);
      if (updatedInfo) {
        setToken(updatedInfo);
        
        // Get updated price
        const newPrice = await getCurrentPrice(token.tokenAddress);
        setPrice(newPrice);
      }
      
      // Get updated user balance
      if (account && getTokenBalance) {
        const balance = await getTokenBalance(token.tokenAddress, account);
        console.log('Updated user balance:', balance);
        setUserBalance(balance);
      }
      
    } catch (error) {
      console.error('Failed to buy tokens:', error);
      let errorMessage = 'Failed to buy tokens: ';
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage += 'Insufficient funds in your wallet';
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage += 'Transaction may fail. Check your input amount.';
      } else if (error.message?.includes('user rejected')) {
        errorMessage += 'Transaction rejected by user';
      } else if (error.message?.includes('Insufficient balance')) {
        errorMessage += 'Insufficient balance for transaction';
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }
      
      alert(errorMessage);
    } finally {
      // Always reset loading state
      setTradingLoading(false);
      console.log('Trading loading state reset');
    }
  };

  // Handle sell tokens
  const handleSell = async () => {
    if (!sellAmount || !isConnected || !token) return;
    
    setTradingLoading(true);
    try {
      const tx = await sellTokens(token.tokenAddress, sellAmount);
      console.log('Sell transaction sent, waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Sell transaction confirmed:', receipt);
      
      // Clear the input immediately after successful transaction
      setSellAmount('');
      
      // Show success message
      alert('Tokens sold successfully!');
      
      // Refresh all data after successful sale
      console.log('Refreshing token data after sell...');
      
      // Get updated token info
      const updatedInfo = await getTokenInfo(token.tokenAddress);
      if (updatedInfo) {
        setToken(updatedInfo);
        
        // Get updated price
        const newPrice = await getCurrentPrice(token.tokenAddress);
        setPrice(newPrice);
      }
      
      // Get updated user balance
      if (account && getTokenBalance) {
        const balance = await getTokenBalance(token.tokenAddress, account);
        console.log('Updated user balance after sell:', balance);
        setUserBalance(balance);
      }
      
    } catch (error) {
      console.error('Failed to sell tokens:', error);
      alert('Failed to sell tokens: ' + (error.message || 'Unknown error'));
    } finally {
      // Always reset loading state
      setTradingLoading(false);
      console.log('Trading loading state reset after sell');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex justify-center items-center">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-gray-400">Loading token...</span>
        </div>
      </div>
    );
  }

  if (notFound || (!loading && !token)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Token Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            The token you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/">
            <Button>
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const imageUrl = token.imageHash ? getIPFSUrl(token.imageHash) : '/api/placeholder/400/400';

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl floating" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl floating" style={{ animationDelay: '3s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 relative">
        {/* Token Header */}
        <div className="card mb-12 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start space-y-8 lg:space-y-0 lg:space-x-12">
            {/* Token Image */}
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-2xl blur-sm opacity-30 group-hover:opacity-60 transition-opacity duration-300" />
                <img
                  src={imageUrl}
                  alt={token.name}
                  className="relative w-full h-64 object-cover rounded-2xl bg-slate-800 border-2 border-slate-700/50"
                  onError={(e) => {
                    e.target.src = '/api/placeholder/400/400';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl" />
              </div>
            </div>

            {/* Token Info */}
            <div className="flex-1 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-5xl font-black text-gradient mb-3 leading-tight">
                    {token.name}
                  </h1>
                  <p className="text-2xl text-cyan-400 font-bold mb-6">
                    ${token.symbol}
                  </p>
                </div>
                
                <div className="text-right">
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border backdrop-blur-sm ${
                      token.isListed
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 pulse-glow'
                        : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    }`}
                  >
                    {token.isListed ? '📈 LISTED ON DEX' : '🚀 BONDING CURVE'}
                  </div>
                </div>
              </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {token.description}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Market Cap</p>
                <p className="text-white font-semibold">
                  {formatLargeNumber(parseFloat(ethers.formatEther(token.marketCap || 0)))} SHM
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Current Price</p>
                <p className="text-white font-semibold">
                  {parseFloat(price || 0).toFixed(8)} SHM
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Circulating Supply</p>
                <p className="text-white font-semibold">
                  {formatLargeNumber(parseFloat(ethers.formatEther(token.currentSupply || 0)))} {token.symbol}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Creator</p>
                <p className="text-white font-semibold">
                  {formatAddress(token.creator)}
                </p>
              </div>
            </div>
            
            {/* Additional Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-gray-400 text-sm">Total Raised</p>
                <p className="text-white font-semibold">
                  {formatLargeNumber(parseFloat(ethers.formatEther(token.marketCap || 0)))} SHM
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">24H Volume</p>
                <p className="text-gray-500 font-semibold">
                  0.00 SHM
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Holders</p>
                <p className="text-white font-semibold">
                  {parseFloat(ethers.formatEther(token.currentSupply || 0)) > 0 ? '1+' : '0'}
                </p>
              </div>
            </div>

            {/* User Balance */}
            {isConnected && parseFloat(userBalance) > 0 && (
              <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl backdrop-blur-sm">
                <p className="text-cyan-400 text-sm font-bold mb-1">Your Balance</p>
                <p className="text-white font-black text-lg">
                  {formatLargeNumber(userBalance)} {token.symbol}
                </p>
              </div>
            )}
            </div>
          </div>
        </div>

      {/* Trading Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Buy Section */}
        <div className="trading-card">
          <div className="mb-6">
            <h3 className="text-2xl font-black text-gradient mb-2">
              🚀 Buy {token.symbol}
            </h3>
            <p className="text-slate-400">Enter your position to join the rocket!</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-3">
                Amount (SHM)
              </label>
              <input
                type="number"
                placeholder="0.1"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                step="0.001"
                min="0"
                className="input-field w-full text-lg"
              />
            </div>
            
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Current Price:</span>
                <span className="text-cyan-400 font-bold font-mono">
                  {parseFloat(price || 0).toFixed(8)} SHM
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleBuy}
              disabled={!buyAmount || !isConnected || tradingLoading || token?.isListed}
              className={`btn-primary w-full text-lg py-4 ${
                tradingLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {tradingLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : token?.isListed ? (
                'Listed on DEX'
              ) : (
                '🔄 Buy Tokens'
              )}
            </button>
          </div>
        </div>

        {/* Sell Section */}
        <div className="trading-card">
          <div className="mb-6">
            <h3 className="text-2xl font-black text-gradient mb-2">
              💸 Sell {token.symbol}
            </h3>
            <p className="text-slate-400">Take profits when you're ready!</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-3">
                Amount (Tokens)
              </label>
              <input
                type="number"
                placeholder="1000"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                step="1"
                min="0"
                className="input-field w-full text-lg"
              />
            </div>
            
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Your Balance:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {formatLargeNumber(userBalance)} {token.symbol}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleSell}
              disabled={!sellAmount || !isConnected || tradingLoading || parseFloat(userBalance) === 0 || token?.isListed}
              className={`btn-secondary w-full text-lg py-4 ${
                tradingLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {tradingLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : token?.isListed ? (
                'Listed on DEX'
              ) : (
                '💸 Sell Tokens'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="card mb-12">
        <div className="mb-6">
          <h3 className="text-2xl font-black text-gradient mb-2">
            📊 Price Chart
          </h3>
          <p className="text-slate-400">Real-time price movements and trends</p>
        </div>
        <div className="h-64 flex items-center justify-center bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="text-center">
            <div className="text-6xl mb-4 floating">📊</div>
            <p className="text-slate-400 text-lg">Price chart coming soon!</p>
            <p className="text-slate-500 text-sm mt-2">Advanced charting features in development</p>
          </div>
        </div>
      </div>

      {/* Token Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="mb-6">
            <h3 className="text-2xl font-black text-gradient mb-2">
              📋 Token Information
            </h3>
            <p className="text-slate-400">Smart contract details and metadata</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Contract Address</span>
              <span className="text-white font-mono">
                {formatAddress(token.tokenAddress)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Supply</span>
              <span className="text-white">1,000,000,000 {token.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Circulating Supply</span>
              <span className="text-white">
                {formatLargeNumber(parseFloat(ethers.formatEther(token.currentSupply || 0)))} {token.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className={`font-medium ${token.isListed ? 'text-green-400' : 'text-primary-400'}`}>
                {token.isListed ? 'Listed on DEX' : 'Bonding Curve'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span className="text-white">
                Shardeum Unstable
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-6">
            <h3 className="text-2xl font-black text-gradient mb-2">
              📈 Recent Activity
            </h3>
            <p className="text-slate-400">Latest trades and transactions</p>
          </div>
          <div className="text-center py-12">
            <div className="text-6xl mb-4 floating">📈</div>
            <p className="text-slate-400 text-lg">Recent trades coming soon!</p>
            <p className="text-slate-500 text-sm mt-2">Transaction history will appear here</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default TokenDetail;