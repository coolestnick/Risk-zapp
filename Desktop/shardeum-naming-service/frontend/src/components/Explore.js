import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiTrendingUp, FiClock, FiUsers, FiZap, FiShield, FiGlobe } from 'react-icons/fi';
import DomainCard from './DomainCard';
import './Explore.css';

const Explore = ({ 
  account, 
  contract, 
  checkAvailability, 
  onRegister, 
  onCreateAuction, 
  onMakeOffer 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [availableDomains, setAvailableDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sample trending domains and categories
  const trendingDomains = [
    'defi', 'nft', 'web3', 'dao', 'crypto', 'blockchain', 'metaverse', 'gaming'
  ];

  const categories = [
    { name: 'DeFi', icon: '💰', count: 245 },
    { name: 'NFT', icon: '🎨', count: 189 },
    { name: 'Gaming', icon: '🎮', count: 156 },
    { name: 'Web3', icon: '🌐', count: 298 },
    { name: 'DAO', icon: '🏛️', count: 87 },
    { name: 'Metaverse', icon: '🌌', count: 134 }
  ];

  const features = [
    {
      icon: <FiZap />,
      title: 'Lightning Fast',
      description: 'Register domains instantly on Shardeum\'s high-performance blockchain'
    },
    {
      icon: <FiShield />,
      title: 'Secure & Decentralized',
      description: 'Your domains are protected by cryptographic security and decentralized ownership'
    },
    {
      icon: <FiGlobe />,
      title: 'Universal Identity',
      description: 'One domain for all your Web3 needs - wallets, DApps, and social profiles'
    },
    {
      icon: <FiUsers />,
      title: 'Community Driven',
      description: 'Join thousands of users building the future of decentralized identity'
    }
  ];

  useEffect(() => {
    generateSampleDomains();
  }, []);

  const generateSampleDomains = () => {
    const sampleDomains = [
      { name: 'crypto-king', price: 0.5, category: 'crypto', trending: true },
      { name: 'nft-master', price: 0.3, category: 'nft', trending: true },
      { name: 'defi-pro', price: 0.8, category: 'defi', trending: true },
      { name: 'web3-dev', price: 0.4, category: 'web3', trending: false },
      { name: 'dao-builder', price: 0.6, category: 'dao', trending: false },
      { name: 'meta-world', price: 1.2, category: 'metaverse', trending: true },
      { name: 'game-master', price: 0.7, category: 'gaming', trending: false },
      { name: 'block-chain', price: 2.0, category: 'blockchain', trending: true }
    ];

    setAvailableDomains(sampleDomains);
  };

  const filteredDomains = availableDomains.filter(domain => {
    const matchesSearch = domain.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || domain.category === filterType || 
                         (filterType === 'trending' && domain.trending);
    return matchesSearch && matchesFilter;
  });

  const sortedDomains = [...filteredDomains].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'trending':
      default:
        return b.trending - a.trending;
    }
  });

  return (
    <div className="explore-page">
      {/* Hero Section */}
      <section className="explore-hero">
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="explore-title">
              Explore the <span className="gradient-text">.shm</span> Universe
            </h1>
            <p className="explore-subtitle">
              Discover, register, and trade unique domain names on the Shardeum blockchain
            </p>

            {/* Search Bar */}
            <div className="explore-search">
              <div className="search-wrapper glass">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search for available domains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <button className="search-btn btn-primary">
                  Search
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat-item glass">
                <div className="stat-number">1,247</div>
                <div className="stat-label">Domains Registered</div>
              </div>
              <div className="stat-item glass">
                <div className="stat-number">89</div>
                <div className="stat-label">Active Auctions</div>
              </div>
              <div className="stat-item glass">
                <div className="stat-number">234</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How .shm Domains Work</h2>
          <div className="steps-grid">
            <motion.div 
              className="step-card glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="step-number">1</div>
              <h3>Search & Discover</h3>
              <p>Find the perfect domain name that represents your identity in Web3. Use our powerful search to check availability instantly.</p>
            </motion.div>

            <motion.div 
              className="step-card glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="step-number">2</div>
              <h3>Register & Own</h3>
              <p>Register your domain for 1-10 years with just a few clicks. Pay once and own your digital identity on Shardeum blockchain.</p>
            </motion.div>

            <motion.div 
              className="step-card glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="step-number">3</div>
              <h3>Use Everywhere</h3>
              <p>Connect your domain to wallets, DApps, social profiles, and websites. One domain for your entire Web3 presence.</p>
            </motion.div>

            <motion.div 
              className="step-card glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="step-number">4</div>
              <h3>Trade & Profit</h3>
              <p>List your domains for sale, create auctions, or accept offers. Build a portfolio of valuable digital assets.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose .shm Domains?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card glass"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Popular Categories</h2>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                className="category-card glass"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setFilterType(category.name.toLowerCase())}
              >
                <div className="category-icon">{category.icon}</div>
                <h3>{category.name}</h3>
                <p>{category.count} domains</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Domains */}
      <section className="trending-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <FiTrendingUp /> Trending Domains
            </h2>
            <div className="filters">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select glass"
              >
                <option value="all">All Categories</option>
                <option value="trending">Trending</option>
                <option value="defi">DeFi</option>
                <option value="nft">NFT</option>
                <option value="gaming">Gaming</option>
                <option value="web3">Web3</option>
              </select>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select glass"
              >
                <option value="trending">Trending</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          <div className="domains-grid">
            {sortedDomains.map((domain, index) => (
              <motion.div
                key={domain.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <DomainCard
                  domain={{
                    name: domain.name,
                    isPremium: domain.price > 1,
                    expiry: null
                  }}
                  price={domain.price}
                  onClick={() => onRegister && onRegister(domain.name)}
                  onMakeOffer={onMakeOffer}
                />
              </motion.div>
            ))}
          </div>

          {sortedDomains.length === 0 && (
            <div className="no-results">
              <p>No domains found matching your criteria.</p>
              <button 
                className="btn-primary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-content glass"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2>Ready to Claim Your .shm Domain?</h2>
            <p>Join thousands of users who have already secured their Web3 identity</p>
            <button 
              className="btn-primary cta-btn"
              onClick={() => {
                const heroSection = document.querySelector('.explore-hero');
                heroSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Start Exploring
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Explore;