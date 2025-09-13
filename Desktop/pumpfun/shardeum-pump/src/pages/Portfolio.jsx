import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatAddress, getIPFSUrl } from '../utils/constants';
import { formatLargeNumber } from '../utils/helpers';
import { ethers } from 'ethers';

const Portfolio = () => {
  const { account, isConnected, balance } = useWeb3();
  const { getAllTokens, getTokenInfo, getTokenBalance } = useContract();
  
  const [holdings, setHoldings] = useState([]);
  const [createdTokens, setCreatedTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('holdings'); // holdings, created

  useEffect(() => {
    const loadPortfolioData = async () => {
      if (!account || !isConnected) return;

      setLoading(true);
      try {
        // Get all tokens
        const tokenAddresses = await getAllTokens();
        
        // Get token info and user balances
        const tokenData = await Promise.all(
          tokenAddresses.map(async (address) => {
            const info = await getTokenInfo(address);
            console.log(`Portfolio - Token ${address} info:`, info);
            if (info) {
              const balance = await getTokenBalance(address, account);
              console.log(`Portfolio - Token ${info.name} balance for ${account}:`, balance);
              console.log(`Portfolio - Token ${info.name} market cap (raw):`, info.marketCap);
              console.log(`Portfolio - Token ${info.name} market cap (formatted):`, ethers.formatEther(info.marketCap || 0));
              return {
                ...info,
                userBalance: balance,
                isHolding: parseFloat(balance) > 0,
                isCreator: info.creator.toLowerCase() === account.toLowerCase(),
              };
            }
            return null;
          })
        );

        const validTokens = tokenData.filter(Boolean);
        
        // Separate holdings and created tokens
        const userHoldings = validTokens.filter(token => token.isHolding);
        const userCreatedTokens = validTokens.filter(token => token.isCreator);
        
        setHoldings(userHoldings);
        setCreatedTokens(userCreatedTokens);
      } catch (error) {
        console.error('Failed to load portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolioData();
  }, [account, isConnected, getAllTokens, getTokenInfo, getTokenBalance]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">👛</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to view your portfolio
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Portfolio 💼
        </h1>
        <div className="flex items-center space-x-4 text-gray-400">
          <span>Connected: {formatAddress(account)}</span>
          <span>•</span>
          <span>Balance: {formatLargeNumber(balance)} SHM</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-dark-800 rounded-lg p-1 mb-8 w-fit">
        {[
          { key: 'holdings', label: '💎 Holdings', count: holdings.length },
          { key: 'created', label: '🚀 Created', count: createdTokens.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            <span>{tab.label}</span>
            <span className="bg-dark-600 px-2 py-0.5 rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
          <span className="ml-4 text-gray-400">Loading portfolio...</span>
        </div>
      )}

      {/* Holdings Tab */}
      {!loading && activeTab === 'holdings' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Your Token Holdings
            </h2>
          </div>

          {holdings.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">💎</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Token Holdings
              </h3>
              <p className="text-gray-400 mb-6">
                You don't own any tokens yet. Start trading to build your portfolio!
              </p>
              <Link to="/">
                <Button>Explore Tokens</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {holdings.map((token) => (
                <TokenPortfolioCard key={token.tokenAddress} token={token} type="holding" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Created Tab */}
      {!loading && activeTab === 'created' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Tokens You Created
            </h2>
            <Link to="/create">
              <Button>Create New Token</Button>
            </Link>
          </div>

          {createdTokens.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Tokens Created
              </h3>
              <p className="text-gray-400 mb-6">
                You haven't created any tokens yet. Launch your first token now!
              </p>
              <Link to="/create">
                <Button>Create Your First Token</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdTokens.map((token) => (
                <TokenPortfolioCard key={token.tokenAddress} token={token} type="created" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Portfolio Summary */}
      {!loading && (holdings.length > 0 || createdTokens.length > 0) && (
        <Card className="mt-8">
          <Card.Header>
            <Card.Title>Portfolio Summary</Card.Title>
          </Card.Header>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {holdings.length}
              </div>
              <div className="text-gray-400 text-sm">Tokens Held</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {createdTokens.length}
              </div>
              <div className="text-gray-400 text-sm">Tokens Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatLargeNumber(
                  [...holdings, ...createdTokens]
                    .reduce((sum, token) => sum + parseFloat(ethers.formatEther(token.marketCap || 0)), 0)
                )} SHM
              </div>
              <div className="text-gray-400 text-sm">Total Market Cap</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatLargeNumber(balance)} SHM
              </div>
              <div className="text-gray-400 text-sm">Wallet Balance</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

const TokenPortfolioCard = ({ token, type }) => {
  const imageUrl = token.imageHash ? getIPFSUrl(token.imageHash) : '/api/placeholder/200/200';
  
  return (
    <Link to={`/token/${token.tokenAddress}`}>
      <Card className="hover:scale-105 transition-transform cursor-pointer group">
        {/* Token Image */}
        <div className="relative mb-4">
          <img
            src={imageUrl}
            alt={token.name}
            className="w-full h-32 object-cover rounded-lg bg-dark-700"
            onError={(e) => {
              e.target.src = '/api/placeholder/200/200';
            }}
          />
          
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                type === 'created'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                  : 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
              }`}
            >
              {type === 'created' ? '🚀 Created' : '💎 Holding'}
            </span>
          </div>
        </div>

        {/* Token Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">
              {token.name}
            </h3>
            <p className="text-primary-400 font-medium">${token.symbol}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Market Cap</span>
              <span className="text-white font-medium">
                {formatLargeNumber(parseFloat(ethers.formatEther(token.marketCap || 0)))} SHM
              </span>
            </div>
            
            {type === 'holding' && (
              <div className="flex justify-between">
                <span className="text-gray-400">Your Balance</span>
                <span className="text-white font-medium">
                  {formatLargeNumber(token.userBalance)} {token.symbol}
                </span>
              </div>
            )}
            
            {type === 'created' && (
              <div className="flex justify-between">
                <span className="text-gray-400">Total Raised</span>
                <span className="text-white font-medium">
                  {formatLargeNumber(parseFloat(ethers.formatEther(token.marketCap || 0)))} SHM
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-dark-700">
            <span className="text-xs text-gray-500">
              {token.isListed ? '📈 Listed on DEX' : '🚀 Bonding Curve'}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default Portfolio;