import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import './Hero.css';

const Hero = ({ checkAvailability, isLoading, userDomains, account }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const popularDomains = ['defi', 'web3', 'crypto', 'nft', 'dao', 'metaverse'];

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = popularDomains.filter(domain => 
        domain.includes(searchTerm.toLowerCase()) && domain !== searchTerm.toLowerCase()
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm) {
      checkAvailability(searchTerm.toLowerCase());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (domain) => {
    setSearchTerm(domain);
    checkAvailability(domain);
    setShowSuggestions(false);
  };

  const floatingAnimation = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Your Identity on
            <span className="gradient-text"> Shardeum</span>
          </motion.h1>
          
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Secure your unique .shm domain name on the most scalable blockchain
          </motion.p>

          <motion.form 
            className="search-container"
            onSubmit={handleSearch}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search for your perfect domain"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                disabled={isLoading}
              />
              <span className="domain-extension">.shm</span>
              <button 
                type="submit" 
                className="search-button"
                disabled={isLoading || !searchTerm}
              >
                {isLoading ? (
                  <div className="mini-spinner"></div>
                ) : (
                  'Search'
                )}
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                className="suggestions-dropdown glass"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="suggestions-title">Suggestions:</p>
                {suggestions.map((domain, index) => (
                  <motion.div
                    key={domain}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(domain)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 5 }}
                  >
                    {domain}.shm
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.form>

          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {userDomains && userDomains.length > 0 ? (
              <div className="user-actions">
                <p className="user-domains-text">You have {userDomains.length} domain{userDomains.length > 1 ? 's' : ''}:</p>
                <div className="action-buttons">
                  <motion.button
                    className="view-domains-btn"
                    onClick={() => {
                      document.getElementById('my-domains')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View My Domains ({userDomains.length})
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="popular-domains">
                <p className="popular-text">Popular:</p>
                <div className="popular-tags">
                  {popularDomains.slice(0, 4).map((domain, index) => (
                    <motion.button
                      key={domain}
                      className="popular-tag"
                      onClick={() => handleSuggestionClick(domain)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {domain}.shm
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        <motion.div 
          className="hero-visual"
          {...floatingAnimation}
        >
          <div className="floating-card glass-dark">
            <div className="card-glow"></div>
            <div className="domain-preview">
              {userDomains && userDomains.length > 0 ? (
                <>
                  <h3 className="preview-domain">{userDomains[0].name}.shm</h3>
                  <div className="preview-details">
                    <div className="detail-item">
                      <span className="detail-label">Owner</span>
                      <span className="detail-value">
                        {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0x1234...5678'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Expires</span>
                      <span className="detail-value">
                        {userDomains[0].expiry 
                          ? new Date(userDomains[0].expiry * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : 'Dec 2025'
                        }
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="preview-domain">yourname.shm</h3>
                  <div className="preview-details">
                    <div className="detail-item">
                      <span className="detail-label">Owner</span>
                      <span className="detail-value">
                        {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '0x1234...5678'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Expires</span>
                      <span className="detail-value">Dec 2025</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="floating-orbs">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
          </div>
        </motion.div>
      </div>

      <div className="hero-bg-gradient"></div>
    </section>
  );
};

export default Hero;