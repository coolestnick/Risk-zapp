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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Token Header */}
      <Card className="mb-8">
        <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Token Image */}
          <div className="w-full md:w-48 flex-shrink-0">
            <img
              src={imageUrl}
              alt={token.name}
              className="w-full h-48 md:h-48 object-cover rounded-lg bg-dark-700"
              onError={(e) => {
                e.target.src = '/api/placeholder/400/400';
              }}
            />
          </div>

          {/* Token Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {token.name}
                </h1>
                <p className="text-xl text-primary-400 font-medium mb-4">
                  ${token.symbol}
                </p>
              </div>
              
              <div className="text-right">
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    token.isListed
                      ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                      : 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                  }`}
                >
                  {token.isListed ? '📈 Listed on DEX' : '🚀 Bonding Curve'}
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
              <div className="mt-4 p-3 bg-primary-600/20 border border-primary-600/30 rounded-lg">
                <p className="text-primary-400 text-sm">Your Balance</p>
                <p className="text-white font-semibold">
                  {formatLargeNumber(userBalance)} {token.symbol}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Trading Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <Card.Header>
            <Card.Title>Buy {token.symbol}</Card.Title>
          </Card.Header>
          <div className="space-y-4">
            <Input
              label="Amount (SHM)"
              placeholder="0.1"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              type="number"
              step="0.001"
              min="0"
            />
            <p className="text-sm text-gray-400">
              Current Price: {parseFloat(price || 0).toFixed(8)} SHM per token
            </p>
            <Button 
              onClick={handleBuy}
              disabled={!buyAmount || !isConnected || tradingLoading || token?.isListed}
              loading={tradingLoading}
              className="w-full"
            >
              {token?.isListed ? 'Listed on DEX' : '🔄 Buy Tokens'}
            </Button>
          </div>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Sell {token.symbol}</Card.Title>
          </Card.Header>
          <div className="space-y-4">
            <Input
              label="Amount (Tokens)"
              placeholder="1000"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              type="number"
              step="1"
              min="0"
            />
            <p className="text-sm text-gray-400">
              Your Balance: {formatLargeNumber(userBalance)} {token.symbol}
            </p>
            <Button 
              onClick={handleSell}
              disabled={!sellAmount || !isConnected || tradingLoading || parseFloat(userBalance) === 0 || token?.isListed}
              loading={tradingLoading}
              className="w-full"
              variant="secondary"
            >
              {token?.isListed ? 'Listed on DEX' : '💸 Sell Tokens'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card className="mb-8">
        <Card.Header>
          <Card.Title>Price Chart</Card.Title>
        </Card.Header>
        <div className="h-64 flex items-center justify-center bg-dark-700/50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-400">Price chart coming soon!</p>
          </div>
        </div>
      </Card>

      {/* Token Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <Card.Header>
            <Card.Title>Token Information</Card.Title>
          </Card.Header>
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
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
          </Card.Header>
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-gray-400">Recent trades coming soon!</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TokenDetail;