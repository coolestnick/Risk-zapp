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
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl floating" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl floating" style={{ animationDelay: '4s' }} />
      </div>

      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight">
              Launch Your Token on{' '}
              <span className="text-gradient text-glow">Shardeum</span>
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-cyan-500 to-purple-600 mx-auto mb-8 rounded-full" />
          </div>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-2xl text-slate-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              The <span className="text-gradient-gold">easiest way</span> to create, trade, and discover meme tokens on the Shardeum network.
              Join the <span className="text-cyan-400 font-semibold">revolution</span> of fair launches and community-driven tokens.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-zoom-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/create">
              <button className="btn-primary text-xl px-8 py-4">
                🚀 Create Your Token
              </button>
            </Link>
            <button className="btn-secondary text-xl px-8 py-4">
              📚 Explore Tokens
            </button>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-stagger">
            <div className="stat-card animate-slide-up text-center">
              <div className="text-5xl font-black text-gradient mb-3">
                {formatLargeNumber(stats.totalTokens)}
              </div>
              <div className="text-slate-400 text-lg font-semibold">Tokens Created</div>
              <div className="mt-2 text-cyan-400 text-sm">🎯 Fair Launched</div>
            </div>
            <div className="stat-card animate-slide-up text-center">
              <div className="text-5xl font-black text-slate-500 mb-3">
                0.00
              </div>
              <div className="text-slate-400 text-lg font-semibold">24h Volume (SHM)</div>
              <div className="mt-2 text-purple-400 text-sm">📊 Trading Active</div>
            </div>
            <div className="stat-card animate-slide-up text-center">
              <div className="text-5xl font-black text-gradient mb-3">
                {formatLargeNumber(stats.totalMarketCap)}
              </div>
              <div className="text-slate-400 text-lg font-semibold">Total Market Cap (SHM)</div>
              <div className="mt-2 text-emerald-400 text-sm">💎 Community Driven</div>
            </div>
          </div>
        </div>
      </section>

      {/* Token Discovery */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-5xl font-black text-gradient mb-6">
              🎯 Discover Tokens
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Explore the latest meme tokens launched on Shardeum's lightning-fast network
            </p>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex items-center justify-center mb-12 animate-slide-up">
            <div className="flex bg-glass-strong rounded-2xl p-2 border border-slate-700/50">
              {[
                { key: 'trending', label: '🔥 Trending', icon: '📈', color: 'from-red-500 to-orange-500' },
                { key: 'new', label: '✨ New', icon: '🆕', color: 'from-cyan-500 to-blue-500' },
                { key: 'volume', label: '💹 Volume', icon: '📊', color: 'from-purple-500 to-pink-500' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`relative px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    filter === tab.key
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50 hover:scale-105'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {filter === tab.key && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r opacity-20 blur-sm" style={{
                      background: `linear-gradient(135deg, ${tab.color.includes('red') ? '#ef4444' : tab.color.includes('cyan') ? '#06b6d4' : '#a855f7'}, transparent)`
                    }} />
                  )}
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