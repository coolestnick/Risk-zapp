import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { formatAddress } from '../utils/constants';
import { formatLargeNumber } from '../utils/helpers';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const {
    isConnected,
    account,
    balance,
    isLoading,
    error,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToShardeum,
    isMetaMaskInstalled,
  } = useWeb3();

  const navItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Create Token', path: '/create', icon: '➕' },
    { name: 'Portfolio', path: '/portfolio', icon: '💼' },
  ];

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleWalletAction = () => {
    if (!isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    if (isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const getWalletButtonText = () => {
    if (!isMetaMaskInstalled) return 'Install MetaMask';
    if (isLoading) return 'Connecting...';
    if (isConnected && !isCorrectNetwork) return 'Switch Network';
    if (isConnected) return formatAddress(account);
    return 'Connect Wallet';
  };

  const getWalletButtonAction = () => {
    if (isConnected && !isCorrectNetwork) return switchToShardeum;
    return handleWalletAction;
  };

  return (
    <nav className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-gradient">
              🚀 ShardeumPump
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActivePath(item.path)
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-dark-700'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            {isConnected && (
              <div className="hidden sm:flex items-center space-x-2">
                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isCorrectNetwork
                      ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                      : 'bg-red-600/20 text-red-400 border border-red-600/30'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCorrectNetwork ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  <span>
                    {isCorrectNetwork ? 'Shardeum' : 'Wrong Network'}
                  </span>
                </div>
                
                {isCorrectNetwork && (
                  <div className="text-sm text-gray-300">
                    {formatLargeNumber(balance)} SHM
                  </div>
                )}
              </div>
            )}

            {/* Wallet Button */}
            <Button
              onClick={getWalletButtonAction()}
              variant={
                isConnected
                  ? isCorrectNetwork
                    ? 'outline'
                    : 'danger'
                  : 'primary'
              }
              size="md"
              loading={isLoading}
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                getWalletButtonText()
              )}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-dark-700 bg-dark-900">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActivePath(item.path)
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-dark-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            
            {/* Mobile Network Status */}
            {isConnected && (
              <div className="px-3 py-2 space-y-2">
                <div
                  className={`flex items-center space-x-2 text-sm font-medium ${
                    isCorrectNetwork ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCorrectNetwork ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  <span>
                    {isCorrectNetwork ? 'Shardeum Network' : 'Wrong Network'}
                  </span>
                </div>
                
                {isCorrectNetwork && (
                  <div className="text-sm text-gray-300 pl-4">
                    Balance: {formatLargeNumber(balance)} SHM
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-600/20 border-l-4 border-red-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-red-400 text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearError()}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;