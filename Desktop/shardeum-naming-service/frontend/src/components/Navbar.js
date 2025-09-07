import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = ({ account, connectWallet, userDomains, currentPage, setCurrentPage }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="navbar-container">
        <div className="navbar-left">
          <motion.div 
            className="logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="logo-text">.shm</span>
            <span className="logo-subtitle">domains</span>
          </motion.div>
        </div>

        <div className="navbar-center">
          <ul className="nav-links">
            <li>
              <motion.button 
                onClick={() => setCurrentPage('home')}
                whileHover={{ y: -2 }}
                className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              >
                Home
              </motion.button>
            </li>
            <li>
              <motion.button 
                onClick={() => setCurrentPage('explore')}
                whileHover={{ y: -2 }}
                className={`nav-link ${currentPage === 'explore' ? 'active' : ''}`}
              >
                Explore
              </motion.button>
            </li>
            <li>
              <motion.button 
                onClick={() => setCurrentPage('marketplace')}
                whileHover={{ y: -2 }}
                className={`nav-link ${currentPage === 'marketplace' ? 'active' : ''}`}
              >
                Marketplace
              </motion.button>
            </li>
            <li>
              <motion.button 
                onClick={() => setCurrentPage('resolution')}
                whileHover={{ y: -2 }}
                className={`nav-link ${currentPage === 'resolution' ? 'active' : ''}`}
              >
                Resolution
              </motion.button>
            </li>
            <li>
              <motion.button 
                onClick={(e) => {
                  if (userDomains && userDomains.length > 0) {
                    if (currentPage !== 'home') {
                      setCurrentPage('home');
                      setTimeout(() => {
                        document.getElementById('my-domains')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    } else {
                      document.getElementById('my-domains')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                whileHover={{ y: -2 }}
                className={`nav-link ${userDomains && userDomains.length > 0 ? 'has-domains' : ''}`}
              >
                My Domains {userDomains && userDomains.length > 0 && `(${userDomains.length})`}
              </motion.button>
            </li>
          </ul>
        </div>

        <div className="navbar-right">
          {account ? (
            <motion.div 
              className="wallet-connected"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="wallet-address glass">
                <div className="wallet-indicator"></div>
                <span>{formatAddress(account)}</span>
              </div>
            </motion.div>
          ) : (
            <motion.button
              className="connect-wallet-btn"
              onClick={connectWallet}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span>Connect Wallet</span>
              <div className="btn-glow"></div>
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;