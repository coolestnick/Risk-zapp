import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContract } from '../hooks/useContract';
import { useWeb3 } from '../context/Web3Context';
import TokenCard from '../components/TokenCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getIPFSUrl } from '../utils/constants';
import { formatLargeNumber } from '../utils/helpers';
import { ethers } from 'ethers';

const Home = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTokens: 0,
    totalVolume: 0,
    totalMarketCap: 0,
  });
  const [filter, setFilter] = useState('trending'); // trending, new, volume
  
  const { getAllTokens, getTokenInfo, getTokenCount } = useContract();
  const { isConnected } = useWeb3();

  // Load tokens
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        
        // Get token count
        const count = await getTokenCount();
        
        // Get all token addresses
        const tokenAddresses = await getAllTokens();
        
        // Get detailed info for each token
        const tokenDetails = await Promise.all(
          tokenAddresses.slice(0, 20).map(async (address) => {
            const info = await getTokenInfo(address);
            console.log(`Token ${address} info:`, info);
            if (info) {
              return {
                ...info,
                // Basic data with minimal contract
                priceChange24h: 0, 
                volume24h: 0, // Not tracked in minimal contract
                holders: parseFloat(ethers.formatEther(info.currentSupply || 0)) > 0 ? 1 : 0,
              };
            }
            return null;
          })
        );

        const validTokens = tokenDetails.filter(Boolean);
        console.log('All tokens:', validTokens);
        
        // Calculate stats from available data
        const totalMarketCap = validTokens.reduce((sum, token) => {
          const mcap = parseFloat(ethers.formatEther(token.marketCap || 0));
          return sum + mcap;
        }, 0);
        
        setStats({
          totalTokens: count,
          totalVolume: 0, // Not tracked in minimal contract
          totalMarketCap,
        });
        
        setTokens(validTokens);
      } catch (error) {
        console.error('Failed to load tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    if (getAllTokens && getTokenInfo) {
      loadTokens();
    }
  }, [getAllTokens, getTokenInfo, getTokenCount]);

  // Filter and sort tokens
  const filteredTokens = tokens.sort((a, b) => {
    switch (filter) {
      case 'trending':
        return b.priceChange24h - a.priceChange24h;
      case 'new':
        return b.createdAt - a.createdAt;
      case 'volume':
        return b.volume24h - a.volume24h;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900/20 via-dark-900 to-purple-900/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Launch Your Token on{' '}
            <span className="text-gradient">Shardeum</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            The easiest way to create, trade, and discover meme tokens on the Shardeum network.
            Join the revolution of fair launches and community-driven tokens.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/create">
              <Button size="lg" className="w-full sm:w-auto">
                🚀 Create Token
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              📚 Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <Card className="text-center bg-glass">
              <div className="text-3xl font-bold text-white">
                {formatLargeNumber(stats.totalTokens)}
              </div>
              <div className="text-gray-400">Tokens Created</div>
            </Card>
            <Card className="text-center bg-glass">
              <div className="text-3xl font-bold text-gray-500">
                0.00 SHM
              </div>
              <div className="text-gray-400">24h Volume</div>
            </Card>
            <Card className="text-center bg-glass">
              <div className="text-3xl font-bold text-white">
                {formatLargeNumber(stats.totalMarketCap)} SHM
              </div>
              <div className="text-gray-400">Total Market Cap</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Token Discovery */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Tabs */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Discover Tokens</h2>
            
            <div className="flex bg-dark-800 rounded-lg p-1">
              {[
                { key: 'trending', label: '🔥 Trending', icon: '📈' },
                { key: 'new', label: '✨ New', icon: '🆕' },
                { key: 'volume', label: '💹 Volume', icon: '📊' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-dark-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" />
              <span className="ml-4 text-gray-400">Loading tokens...</span>
            </div>
          )}

          {/* No Tokens */}
          {!loading && filteredTokens.length === 0 && (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">No tokens yet!</h3>
              <p className="text-gray-400 mb-6">
                Be the first to create a token on ShardeumPump
              </p>
              <Link to="/create">
                <Button>Create First Token</Button>
              </Link>
            </Card>
          )}

          {/* Token Grid */}
          {!loading && filteredTokens.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTokens.map((token) => (
                <TokenCard
                  key={token.tokenAddress}
                  token={token}
                  showStats
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {!loading && filteredTokens.length >= 20 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Tokens
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose ShardeumPump?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built on Shardeum's lightning-fast, low-cost network with fair launch mechanics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '⚡',
                title: 'Lightning Fast',
                description: 'Sub-second transaction finality on Shardeum network',
              },
              {
                icon: '💰',
                title: 'Ultra Low Fees',
                description: 'Trade with minimal gas costs, perfect for small trades',
              },
              {
                icon: '🎯',
                title: 'Fair Launch',
                description: 'Bonding curve ensures fair price discovery for all',
              },
              {
                icon: '🔒',
                title: 'Secure & Audited',
                description: 'Smart contracts audited for maximum security',
              },
            ].map((feature, index) => (
              <Card key={index} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary-900/30 to-purple-900/30 border-primary-500/30">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Launch Your Token?
            </h2>
            <p className="text-gray-300 mb-8">
              Join thousands of creators who have already launched their tokens on ShardeumPump.
              No coding required, just your creativity!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create">
                <Button size="lg" className="w-full sm:w-auto">
                  🚀 Create Your Token
                </Button>
              </Link>
              {!isConnected && (
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  🔗 Connect Wallet First
                </Button>
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;