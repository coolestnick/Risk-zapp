import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiClock, FiDollarSign, FiUsers, FiZap, FiTarget, FiAward, FiHeart, FiLoader, FiAlertCircle, FiExternalLink } from 'react-icons/fi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { createBlockchainDataService, formatTransactionType, getTransactionTypeColor } from '../utils/blockchainData';
import './Marketplace.css';

const Marketplace = ({ 
  account, 
  marketplaceContract,
  contract,
  provider,
  onMakeOffer, 
  onPlaceBid,
  onViewDomainDetails 
}) => {
  const [activeTab, setActiveTab] = useState('auctions');
  const [auctions, setAuctions] = useState([]);
  const [offers, setOffers] = useState([]);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userAuctions, setUserAuctions] = useState([]);
  const [userOffers, setUserOffers] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [auctionData, setAuctionData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [tradingStats, setTradingStats] = useState({
    volume24h: '0',
    avgPrice7d: '0',
    salesCount24h: 0
  });
  const [blockchainService, setBlockchainService] = useState(null);

  // Initialize blockchain service
  useEffect(() => {
    if (provider && contract && marketplaceContract) {
      const service = createBlockchainDataService(provider, contract, marketplaceContract);
      setBlockchainService(service);
      
      // Expose service globally for debugging
      window.debugBlockchainService = service;
      console.log('🔧 Blockchain service available as window.debugBlockchainService');
      console.log('Available debug commands:');
      console.log('🧪 window.debugBlockchainService.testAuction("domainname")');
      console.log('🧪 window.debugBlockchainService.testAllAuctions()');
      console.log('🧪 window.debugBlockchainService.getActiveAuctions()');
    }
  }, [provider, contract, marketplaceContract]);

  // Load real blockchain data
  useEffect(() => {
    if (blockchainService && account) {
      loadMarketplaceData();
    }
  }, [blockchainService, account]);

  const loadMarketplaceData = async () => {
    if (!blockchainService) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        loadActiveAuctions(),
        loadUserAuctions(),
        loadRecentSales(),
        loadTradingStats(),
        loadUserOffers()
      ]);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      toast.error('Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveAuctions = async () => {
    try {
      if (!blockchainService) {
        console.log('Blockchain service not available');
        return;
      }
      
      console.log('Loading active auctions...');
      const activeAuctions = await blockchainService.getActiveAuctions();
      console.log('Loaded auctions:', activeAuctions);
      console.log('Setting auction state with', activeAuctions.length, 'auctions');
      console.log('Raw auction data:', JSON.stringify(activeAuctions, null, 2));
      setAuctions(activeAuctions);
      
      // Debug: Log the state after setting
      setTimeout(() => {
        console.log('State check - auctions in component state:', auctions.length);
      }, 100);
    } catch (error) {
      console.error('Error loading auctions:', error);
      toast.error('Failed to load auctions: ' + error.message);
    }
  };

  const loadUserAuctions = async () => {
    if (!account || !blockchainService) return;
    
    try {
      // Get all active auctions and filter for user's auctions
      const allAuctions = await blockchainService.getActiveAuctions();
      const userAuctionList = allAuctions.filter(
        auction => auction.seller.toLowerCase() === account.toLowerCase()
      );
      setUserAuctions(userAuctionList);
    } catch (error) {
      console.error('Error loading user auctions:', error);
    }
  };

  const loadRecentSales = async () => {
    try {
      if (!blockchainService) return;
      
      const recentSales = await blockchainService.getRecentSales();
      setSales(recentSales);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const loadTradingStats = async () => {
    try {
      if (!blockchainService) return;
      
      const stats = await blockchainService.getTradingStats();
      setTradingStats(stats);
    } catch (error) {
      console.error('Error loading trading stats:', error);
    }
  };

  const loadUserOffers = async () => {
    if (!account) return;
    
    try {
      // Load offers made by the user - would need to implement offer tracking
      const userOffersList = [];
      setUserOffers(userOffersList);
    } catch (error) {
      console.error('Error loading user offers:', error);
    }
  };

  const formatTimeLeft = (endTime, currentBlockchainTime = null) => {
    // Use blockchain time if provided, otherwise fall back to local time
    const now = currentBlockchainTime ? currentBlockchainTime * 1000 : Date.now();
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'Ended';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getUrgencyColor = (endTime) => {
    const timeLeft = endTime - Date.now();
    const hours = timeLeft / (1000 * 60 * 60);
    
    if (hours < 1) return '#ff3366'; // Red
    if (hours < 6) return '#ffaa00'; // Orange
    return '#00ff88'; // Green
  };

  const handlePlaceBid = async (auctionName) => {
    if (!marketplaceContract || !bidAmount) {
      toast.error('Please enter a bid amount');
      return;
    }

    try {
      const bidAmountWei = ethers.utils.parseEther(bidAmount);
      
      console.log('🔄 Placing bid:', {
        auction: auctionName,
        bidAmount: bidAmount,
        bidAmountWei: bidAmountWei.toString(),
        contractAddress: marketplaceContract.address,
        account: account
      });

      // Test if placeBid function exists
      console.log('🔍 Testing contract function availability:', {
        placeBidExists: typeof marketplaceContract.placeBid === 'function',
        auctionsExists: typeof marketplaceContract.auctions === 'function',
        contractInterface: Object.keys(marketplaceContract.interface.functions).includes('placeBid(string)')
      });

      // Get current auction info to validate bid
      try {
        const currentAuction = await marketplaceContract.auctions(auctionName);
        console.log('📊 Current auction state:', {
          active: currentAuction.active,
          currentBid: ethers.utils.formatEther(currentAuction.currentBid),
          startPrice: ethers.utils.formatEther(currentAuction.startPrice),
          endTime: new Date(currentAuction.endTime.toNumber() * 1000).toLocaleString(),
          seller: currentAuction.seller,
          highestBidder: currentAuction.highestBidder
        });

        // Check if bid is higher than current bid OR starting price (whichever is higher)
        const minimumBid = currentAuction.currentBid.gt(currentAuction.startPrice) 
          ? currentAuction.currentBid 
          : currentAuction.startPrice;
        
        if (bidAmountWei.lte(minimumBid)) {
          const minBidFormatted = ethers.utils.formatEther(minimumBid);
          const bidType = currentAuction.currentBid.gt(currentAuction.startPrice) ? 'current bid' : 'starting price';
          toast.error(`Bid must be higher than ${bidType} of ${minBidFormatted} SHM`);
          return;
        }

        // Check if auction is still active
        if (!currentAuction.active) {
          toast.error('Auction is not active');
          return;
        }

        // Check if auction hasn't expired
        const now = Math.floor(Date.now() / 1000);
        if (currentAuction.endTime.toNumber() <= now) {
          toast.error('Auction has expired');
          return;
        }

      } catch (auctionCheckError) {
        console.error('Error checking auction state:', auctionCheckError);
      }

      const loadingToast = toast.loading('Placing bid...');
      
      console.log('💳 About to call placeBid with:', {
        functionName: 'placeBid',
        domain: auctionName,
        value: ethers.utils.formatEther(bidAmountWei),
        contractAddress: marketplaceContract.address
      });
      
      const tx = await marketplaceContract.placeBid(auctionName, {
        value: bidAmountWei
      });

      console.log('📝 Bid transaction sent:', {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.utils.formatEther(tx.value || '0')
      });
      
      const receipt = await tx.wait();
      console.log('✅ Bid transaction confirmed:', {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.events?.length || 0
      });

      // Log events to see if BidPlaced event was emitted
      if (receipt.events && receipt.events.length > 0) {
        console.log('📊 Transaction events:');
        receipt.events.forEach((event, index) => {
          try {
            const parsed = marketplaceContract.interface.parseLog(event);
            console.log(`Event ${index}:`, {
              name: parsed.name,
              args: parsed.args
            });
          } catch (e) {
            console.log(`Event ${index} (unparsed):`, event);
          }
        });
      }
      
      toast.dismiss(loadingToast);
      toast.success(`Bid placed successfully on ${auctionName}.shm!`);
      setBidAmount('');
      setShowBidModal(false);
      
      // Refresh auction data
      await loadActiveAuctions();
      
    } catch (error) {
      console.error('❌ Error placing bid:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        data: error.data,
        reason: error.reason
      });
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else if (error.reason) {
        toast.error(`Transaction failed: ${error.reason}`);
      } else if (error.message.includes('execution reverted')) {
        toast.error('Transaction reverted - check bid amount and auction status');
      } else {
        toast.error('Failed to place bid: ' + error.message);
      }
    }
  };

  const handleEndAuction = async (auctionName) => {
    if (!marketplaceContract) return;

    try {
      const tx = await marketplaceContract.endAuction(auctionName);
      toast.loading('Ending auction...');
      await tx.wait();
      
      toast.success(`Auction ended for ${auctionName}.shm!`);
      
      // Refresh data
      await loadMarketplaceData();
      
    } catch (error) {
      console.error('Error ending auction:', error);
      toast.error('Failed to end auction: ' + error.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMarketplaceData();
    setRefreshing(false);
    toast.success('Marketplace data refreshed!');
  };

  const openBidModal = (auction) => {
    setSelectedAuction(auction);
    setShowBidModal(true);
    setBidAmount('');
  };

  const canEndAuction = (auction) => {
    return auction.endTime <= Date.now() && auction.seller.toLowerCase() === account?.toLowerCase();
  };

  const canPlaceBid = (auction) => {
    return auction.endTime > Date.now() && auction.seller.toLowerCase() !== account?.toLowerCase();
  };

  const handleViewDomainDetails = async (domainName) => {
    if (!onViewDomainDetails || !contract || !account) {
      toast.error('Unable to view domain details');
      return;
    }

    try {
      // Get domain details from contract
      const [owner, expiry, isForSale, price, isPremium] = await contract.getDomain(domainName);
      
      const domainDetails = {
        name: domainName,
        owner,
        expiry: expiry.toNumber(),
        isForSale,
        price: ethers.utils.formatEther(price),
        isPremium
      };

      // Call the parent component's view details handler
      onViewDomainDetails(domainDetails);
      
    } catch (error) {
      console.error('Error fetching domain details:', error);
      toast.error('Failed to load domain details');
    }
  };

  return (
    <div className="marketplace-page">
      {/* Header */}
      <section className="marketplace-header">
        <div className="container">
          <motion.div
            className="header-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="marketplace-title">
              <FiTrendingUp /> Domain <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="marketplace-subtitle">
              Trade, bid, and discover valuable .shm domains in our decentralized marketplace
            </p>

            {/* Stats & Controls */}
            <div className="marketplace-stats">
              <div className="stat-card glass">
                <div className="stat-icon">🔥</div>
                <div className="stat-info">
                  <div className="stat-number">{auctions.length}</div>
                  <div className="stat-label">Active Auctions</div>
                </div>
              </div>
              <div className="stat-card glass">
                <div className="stat-icon">💼</div>
                <div className="stat-info">
                  <div className="stat-number">{userAuctions.length}</div>
                  <div className="stat-label">Your Auctions</div>
                </div>
              </div>
              <div className="stat-card glass">
                <div className="stat-icon">🏆</div>
                <div className="stat-info">
                  <div className="stat-number">{sales.length}</div>
                  <div className="stat-label">Recent Sales</div>
                </div>
              </div>
              <div className="stat-card glass action-card">
                <button 
                  className="refresh-btn"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? <FiLoader className="spinning" /> : '🔄'}
                  <span>Refresh Data</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How Marketplace Works */}
      <section className="how-marketplace-works">
        <div className="container">
          <h2 className="section-title">How Our Marketplace Works</h2>
          <div className="marketplace-features">
            <motion.div 
              className="feature-card glass"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="feature-icon">
                <FiZap />
              </div>
              <div className="feature-content">
                <h3>Instant Auctions</h3>
                <p>Create time-based auctions for your domains. Set starting prices and let the market decide the final value through competitive bidding.</p>
                <ul>
                  <li>✅ Set custom auction duration (1 hour - 1 week)</li>
                  <li>✅ Automatic bid extension (last 5 minutes)</li>
                  <li>✅ Transparent bidding history</li>
                  <li>✅ Instant settlement</li>
                </ul>
              </div>
            </motion.div>

            <motion.div 
              className="feature-card glass"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="feature-icon">
                <FiTarget />
              </div>
              <div className="feature-content">
                <h3>Smart Offers</h3>
                <p>Make offers on any domain, even if it's not for sale. Your funds are held in escrow until the offer is accepted or expires.</p>
                <ul>
                  <li>✅ Offer on any registered domain</li>
                  <li>✅ Set custom expiry dates</li>
                  <li>✅ Funds held safely in smart contract</li>
                  <li>✅ Cancel anytime before acceptance</li>
                </ul>
              </div>
            </motion.div>

            <motion.div 
              className="feature-card glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="feature-icon">
                <FiAward />
              </div>
              <div className="feature-content">
                <h3>Secure Trading</h3>
                <p>All trades are executed through audited smart contracts with built-in escrow and automatic domain transfer.</p>
                <ul>
                  <li>✅ 2.5% marketplace fee</li>
                  <li>✅ Automatic domain transfer</li>
                  <li>✅ No counterparty risk</li>
                  <li>✅ Transparent fee structure</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="marketplace-content">
        <div className="container">
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'auctions' ? 'active' : ''}`}
              onClick={() => setActiveTab('auctions')}
            >
              <FiClock /> Live Auctions ({auctions.length})
            </button>
            {account && (
              <button 
                className={`tab-btn ${activeTab === 'my-auctions' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-auctions')}
              >
                <FiUsers /> My Auctions ({userAuctions.length})
              </button>
            )}
            <button 
              className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveTab('sales')}
            >
              <FiDollarSign /> Recent Sales ({sales.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <FiTrendingUp /> Analytics
            </button>
          </div>

          {/* Auctions Tab */}
          {activeTab === 'auctions' && (
            <motion.div 
              className="tab-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Debug info */}
              <div style={{background: 'rgba(255,255,255,0.1)', padding: '10px', margin: '10px', borderRadius: '5px', fontSize: '12px'}}>
                🐛 DEBUG: auctions.length = {auctions.length}, isLoading = {isLoading ? 'true' : 'false'}
                {auctions.length > 0 && <div>First auction: {auctions[0]?.name}</div>}
              </div>
              
              {(auctions.length === 0 && !isLoading) ? (
                <div className="empty-state glass">
                  <FiAlertCircle size={48} />
                  <h3>No Active Auctions</h3>
                  <p>There are currently no live auctions. Check back later or create your own!</p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button 
                      className="btn-refresh-data"
                      onClick={loadActiveAuctions}
                    >
                      🔄 Refresh Auctions
                    </button>
                    <button 
                      className="btn-refresh-data"
                      onClick={async () => {
                        if (blockchainService && marketplaceContract && provider) {
                          try {
                            console.log('🧪 Running comprehensive auction debug...');
                            
                            // TIME DEBUG: Check blockchain vs local time
                            console.log('\n=== TIME DEBUG ===');
                            const block = await provider.getBlock('latest');
                            console.log('Current blockchain time:', block.timestamp, new Date(block.timestamp * 1000).toLocaleString());
                            console.log('Current local time:', Math.floor(Date.now() / 1000), new Date().toLocaleString());
                            console.log('Time difference (seconds):', Math.floor(Date.now() / 1000) - block.timestamp);
                            
                            // STEP 1: Basic auction loading
                            console.log('\n=== STEP 1: Basic auction loading ===');
                            await blockchainService.getActiveAuctions();
                            
                            // STEP 2: Manual debug of all auctions
                            console.log('\n=== STEP 2: Manual auction analysis ===');
                            
                            // Get current blockchain time
                            const currentBlock = await provider.getBlock('latest');
                            const currentTime = currentBlock.timestamp;
                            console.log('Current blockchain time:', new Date(currentTime * 1000).toLocaleString());
                            
                            // Get all auction creation events
                            const events = await marketplaceContract.queryFilter(
                              marketplaceContract.filters.AuctionCreated()
                            );
                            console.log(`Found ${events.length} auction creation events`);
                            
                            // Test each auction
                            for (let i = 0; i < events.length; i++) {
                              const event = events[i];
                              const domainName = event.args.name;
                              console.log(`\n--- Auction ${i + 1}: ${domainName} ---`);
                              
                              // Get auction state
                              const auction = await marketplaceContract.auctions(domainName);
                              const endTime = auction.endTime.toNumber();
                              const timeLeft = endTime - currentTime;
                              
                              console.log('Auction Details:', {
                                domain: domainName,
                                seller: auction.seller,
                                startPrice: ethers.utils.formatEther(auction.startPrice),
                                currentBid: ethers.utils.formatEther(auction.currentBid),
                                endTime: endTime,
                                endTimeDate: new Date(endTime * 1000).toLocaleString(),
                                active: auction.active,
                                timeLeftSeconds: timeLeft,
                                timeLeftHours: timeLeft / 3600,
                                shouldBeActive: endTime > currentTime,
                                blockNumber: event.blockNumber,
                                transactionHash: event.transactionHash
                              });
                              
                              // Check for ended events
                              const endedEvents = await marketplaceContract.queryFilter(
                                marketplaceContract.filters.AuctionEnded(domainName)
                              );
                              
                              if (auction.active === false && endedEvents.length === 0) {
                                console.log('❌ ISSUE: Auction inactive but no AuctionEnded event!');
                              } else if (auction.active === false && endedEvents.length > 0) {
                                console.log('✅ Auction ended normally');
                              } else if (auction.active === true) {
                                console.log('✅ Auction is active - should appear in UI');
                              }
                            }
                            
                          } catch (error) {
                            console.error('Debug failed:', error);
                          }
                        } else {
                          console.log('Services not ready');
                        }
                      }}
                    >
                      🔍 Debug All Auctions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="auctions-grid">
                  {auctions.map((auction, index) => (
                    <motion.div
                      key={auction.name}
                      className="auction-card glass"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="auction-header">
                        <h3 className="domain-name">
                          {auction.name}<span className="tld">.shm</span>
                        </h3>
                        <div className="auction-status">
                          <span 
                            className="time-left"
                            style={{ color: getUrgencyColor(auction.endTime) }}
                          >
                            <FiClock /> {formatTimeLeft(auction.endTime, auction.currentBlockchainTime)}
                          </span>
                        </div>
                      </div>

                      <div className="auction-details">
                        <div className="price-info">
                          <div className="current-bid">
                            <span className="label">Current Bid</span>
                            <span className="amount">{auction.currentBid} SHM</span>
                          </div>
                          <div className="start-price">
                            <span className="label">Starting Price</span>
                            <span className="amount">{auction.startPrice} SHM</span>
                          </div>
                        </div>

                        <div className="auction-meta">
                          <div className="highest-bidder">
                            {auction.highestBidder !== ethers.constants.AddressZero 
                              ? `Top: ${formatAddress(auction.highestBidder)}`
                              : 'No bids yet'
                            }
                          </div>
                        </div>
                      </div>

                      <div className="auction-actions">
                        {canPlaceBid(auction) ? (
                          <button 
                            className="btn-bid"
                            onClick={() => openBidModal(auction)}
                          >
                            Place Bid
                          </button>
                        ) : canEndAuction(auction) ? (
                          <button 
                            className="btn-end-auction"
                            onClick={() => handleEndAuction(auction.name)}
                          >
                            End Auction
                          </button>
                        ) : auction.seller.toLowerCase() === account?.toLowerCase() ? (
                          <button className="btn-own" disabled>
                            Your Auction
                          </button>
                        ) : (
                          <button className="btn-ended" disabled>
                            {auction.endTime <= Date.now() ? 'Ended' : 'Cannot Bid'}
                          </button>
                        )}
                        <button 
                          className="btn-details"
                          onClick={() => onMakeOffer && onMakeOffer(auction.name)}
                        >
                          Make Offer
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* My Auctions Tab */}
          {activeTab === 'my-auctions' && (
            <motion.div 
              className="tab-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {userAuctions.length === 0 ? (
                <div className="empty-state glass">
                  <FiAlertCircle size={48} />
                  <h3>No Active Auctions</h3>
                  <p>You don't have any active auctions. Create one from your domains!</p>
                </div>
              ) : (
                <div className="auctions-grid">
                  {userAuctions.map((auction, index) => (
                    <motion.div
                      key={auction.name}
                      className="auction-card glass user-auction"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="auction-header">
                        <h3 className="domain-name">
                          {auction.name}<span className="tld">.shm</span>
                        </h3>
                        <div className="auction-status">
                          <span className="owner-badge">Your Auction</span>
                          <span 
                            className="time-left"
                            style={{ color: getUrgencyColor(auction.endTime) }}
                          >
                            <FiClock /> {formatTimeLeft(auction.endTime, auction.currentBlockchainTime)}
                          </span>
                        </div>
                      </div>

                      <div className="auction-details">
                        <div className="price-info">
                          <div className="current-bid">
                            <span className="label">Current Bid</span>
                            <span className="amount">{auction.currentBid} SHM</span>
                          </div>
                          <div className="start-price">
                            <span className="label">Starting Price</span>
                            <span className="amount">{auction.startPrice} SHM</span>
                          </div>
                        </div>

                        <div className="auction-meta">
                          <div className="highest-bidder">
                            {auction.highestBidder !== ethers.constants.AddressZero 
                              ? `Top: ${formatAddress(auction.highestBidder)}`
                              : 'No bids yet'
                            }
                          </div>
                        </div>
                      </div>

                      <div className="auction-actions">
                        {canEndAuction(auction) ? (
                          <button 
                            className="btn-end-auction"
                            onClick={() => handleEndAuction(auction.name)}
                          >
                            End Auction & Claim
                          </button>
                        ) : (
                          <button className="btn-active" disabled>
                            Auction Active
                          </button>
                        )}
                        <button 
                          className="btn-details"
                          onClick={() => handleViewDomainDetails(auction.name)}
                        >
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <motion.div 
              className="tab-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {sales.length === 0 && !isLoading ? (
                <div className="empty-state glass">
                  <FiAlertCircle size={48} />
                  <h3>No Recent Sales</h3>
                  <p>No recent domain transactions found. Sales will appear here as they happen on the blockchain.</p>
                </div>
              ) : (
                <div className="sales-list">
                  {sales.map((sale, index) => (
                    <motion.div
                      key={`${sale.txHash}-${index}`}
                      className="sale-item glass"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="sale-domain">
                        <h4>{sale.domain}<span className="tld">.shm</span></h4>
                        <div className="sale-type-and-tx">
                          <span className={`sale-type ${sale.type}`}>
                            {sale.type === 'auction' ? '🔨' : sale.type === 'offer' ? '💼' : '🏷️'} 
                            {sale.type}
                          </span>
                          {sale.txHash && (
                            <a
                              href={`https://explorer-unstable.shardeum.org/transaction/${sale.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tx-link"
                              title="View on Explorer"
                            >
                              <FiExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div className="sale-details">
                        <div className="sale-price">
                          <FiDollarSign /> {sale.price} SHM
                        </div>
                        <div className="sale-time">
                          {formatTimeAgo(sale.timestamp)}
                        </div>
                        {sale.blockNumber && (
                          <div className="block-number">
                            Block #{sale.blockNumber}
                          </div>
                        )}
                      </div>
                      
                      <div className="sale-parties">
                        <div className="party">
                          <span className="label">From:</span>
                          <span className="address" title={sale.seller}>
                            {formatAddress(sale.seller)}
                          </span>
                        </div>
                        <div className="party">
                          <span className="label">To:</span>
                          <span className="address" title={sale.buyer}>
                            {formatAddress(sale.buyer)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div 
              className="tab-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="analytics-dashboard">
                <div className="analytics-cards">
                  <div className="analytics-card glass">
                    <div className="card-header">
                      <h3>Trading Volume (24h)</h3>
                      <FiTrendingUp className="trend-up" />
                    </div>
                    <div className="card-value">{tradingStats.volume24h} SHM</div>
                    <div className="card-change positive">
                      {tradingStats.salesCount24h} transactions
                    </div>
                  </div>

                  <div className="analytics-card glass">
                    <div className="card-header">
                      <h3>Average Sale Price</h3>
                      <FiDollarSign />
                    </div>
                    <div className="card-value">{tradingStats.avgPrice7d} SHM</div>
                    <div className="card-change positive">7-day average</div>
                  </div>

                  <div className="analytics-card glass">
                    <div className="card-header">
                      <h3>Total Sales</h3>
                      <FiUsers />
                    </div>
                    <div className="card-value">{tradingStats.totalSales}</div>
                    <div className="card-change positive">All time</div>
                  </div>
                </div>

                <div className="real-data-info glass">
                  <h3>📊 Real Blockchain Data</h3>
                  <div className="data-sources">
                    <div className="data-source">
                      <strong>Data Source:</strong> Live blockchain events from Shardeum Unstablenet
                    </div>
                    <div className="data-source">
                      <strong>Registry Contract:</strong> {contract?.address || 'Not connected'}
                    </div>
                    <div className="data-source">
                      <strong>Marketplace Contract:</strong> {marketplaceContract?.address || 'Not connected'}
                    </div>
                    <div className="data-source">
                      <strong>Latest Update:</strong> {new Date().toLocaleString()}
                    </div>
                  </div>
                  
                  {sales.length > 0 && (
                    <div className="recent-activity">
                      <h4>Recent Activity</h4>
                      <div className="activity-list">
                        {sales.slice(0, 5).map((sale, index) => (
                          <div key={index} className="activity-item">
                            <div className="activity-type">
                              {sale.type === 'auction' ? '🔨' : sale.type === 'offer' ? '💼' : '🏷️'}
                            </div>
                            <div className="activity-details">
                              <span className="domain">{sale.domain}.shm</span>
                              <span className="price">{sale.price} SHM</span>
                            </div>
                            <div className="activity-time">
                              {formatTimeAgo(sale.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tradingStats.topSale.domain !== 'none' && (
                    <div className="top-sale-highlight">
                      <h4>🏆 Highest Sale This Week</h4>
                      <div className="top-sale-card">
                        <span className="domain">{tradingStats.topSale.domain}.shm</span>
                        <span className="price">{tradingStats.topSale.price} SHM</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="data-refresh glass">
                  <h4>🔄 Data Freshness</h4>
                  <p>This data is fetched live from the Shardeum blockchain. All transactions, sales, and auctions are real and verifiable on the blockchain explorer.</p>
                  <div className="refresh-controls">
                    <button 
                      className="btn-refresh-data"
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      {refreshing ? <FiLoader className="spinning" /> : '🔄'}
                      Refresh All Data
                    </button>
                    {blockchainService && (
                      <button 
                        className="btn-debug"
                        onClick={() => {
                          console.log('🔍 Debug Time Analysis:');
                          auctions.forEach(auction => {
                            const now = Date.now();
                            const blockchainNow = auction.currentBlockchainTime * 1000;
                            const timeLeftJS = auction.endTime - now;
                            const timeLeftBlockchain = auction.endTime - blockchainNow;
                            console.log(`\n📊 ${auction.name}.shm:`, {
                              endTime: new Date(auction.endTime).toLocaleString(),
                              localTime: new Date(now).toLocaleString(),
                              blockchainTime: new Date(blockchainNow).toLocaleString(),
                              timeLeftJS: formatTimeLeft(auction.endTime),
                              timeLeftBlockchain: formatTimeLeft(auction.endTime, auction.currentBlockchainTime),
                              timeDifference: (now - blockchainNow) / 1000 + ' seconds'
                            });
                          });
                        }}
                      >
                        🔍 Debug Time
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {isLoading && (
            <div className="loading-state">
              <FiLoader className="spinning" size={32} />
              <p>Loading marketplace data...</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="marketplace-cta">
        <div className="container">
          <motion.div
            className="cta-content glass"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2>Start Trading Today</h2>
            <p>Join our thriving marketplace and discover the value of premium .shm domains</p>
            <div className="cta-buttons">
              <button className="btn-primary">
                Browse Auctions
              </button>
              <button className="btn-secondary">
                Create Listing
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bid Modal */}
      {showBidModal && selectedAuction && (
        <div className="modal-overlay" onClick={() => setShowBidModal(false)}>
          <motion.div 
            className="bid-modal glass"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Place Bid on {selectedAuction.name}.shm</h3>
              <button 
                className="close-btn"
                onClick={() => setShowBidModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="auction-info">
                <div className="current-bid">
                  <span>Current Bid:</span>
                  <span className="amount">{selectedAuction.currentBid} SHM</span>
                </div>
                <div className="time-left">
                  <span>Time Left:</span>
                  <span style={{ color: getUrgencyColor(selectedAuction.endTime) }}>
                    {formatTimeLeft(selectedAuction.endTime, selectedAuction.currentBlockchainTime)}
                  </span>
                </div>
              </div>

              <div className="bid-input-group">
                <label>Your Bid Amount (SHM)</label>
                <input
                  type="number"
                  step="0.01"
                  min={selectedAuction.currentBid + 0.01}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Minimum: ${(selectedAuction.currentBid + 0.01).toFixed(2)} SHM`}
                  className="bid-input"
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => setShowBidModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-bid-confirm"
                  onClick={() => handlePlaceBid(selectedAuction.name)}
                  disabled={!bidAmount || parseFloat(bidAmount) <= selectedAuction.currentBid}
                >
                  Place Bid
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;