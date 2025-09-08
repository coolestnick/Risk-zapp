import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiClock, FiDollarSign, FiUser, FiCheck, FiAlertCircle, FiExternalLink } from 'react-icons/fi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import './DomainManagement.css';

const DomainManagement = ({ 
  isOpen, 
  onClose, 
  domain, 
  account, 
  marketplaceContract, 
  blockchainService,
  onOfferAccepted 
}) => {
  const [offers, setOffers] = useState([]);
  const [auctionInfo, setAuctionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acceptingOffer, setAcceptingOffer] = useState(null);
  const [listingInfo, setListingInfo] = useState(null);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [listingPrice, setListingPrice] = useState('');
  const [creatingListing, setCreatingListing] = useState(false);

  useEffect(() => {
    if (isOpen && domain && blockchainService) {
      loadOffers();
      loadAuctionInfo();
      loadListingInfo();
    }
  }, [isOpen, domain, blockchainService]);

  const loadOffers = async () => {
    if (!blockchainService || !domain) return;
    
    setLoading(true);
    try {
      console.log('Loading offers for domain:', domain.name);
      
      // Debug: Check if marketplace contract is available
      console.log('Marketplace contract available:', !!marketplaceContract);
      console.log('Blockchain service available:', !!blockchainService);
      
      const domainOffers = await blockchainService.getOffersForDomain(domain.name);
      console.log('Loaded offers:', domainOffers);
      console.log('Number of offers:', domainOffers.length);
      
      // Debug: Also try to fetch directly from contract
      if (marketplaceContract) {
        try {
          console.log('Trying to call getOffers with domain:', domain.name);
          console.log('Marketplace contract address:', marketplaceContract.address);
          
          // First, let's check if the contract has basic functions
          try {
            console.log('Testing basic contract functions...');
            const fee = await marketplaceContract.marketplaceFee();
            console.log('Marketplace fee:', fee.toString());
            
            // Try to check if an auction exists
            const auction = await marketplaceContract.auctions(domain.name);
            console.log('Auction data exists:', !!auction);
          } catch (basicErr) {
            console.log('Error with basic functions:', basicErr);
          }
          
          // Now try the getOffers function
          console.log('Attempting to call getOffers...');
          const rawOffers = await marketplaceContract.getOffers(domain.name);
          console.log('Raw offers from contract:', rawOffers);
          console.log('Raw offers length:', rawOffers.length);
          
          // Log each offer's details
          for (let i = 0; i < rawOffers.length; i++) {
            console.log(`Offer ${i}:`, {
              buyer: rawOffers[i].buyer,
              amount: ethers.utils.formatEther(rawOffers[i].amount),
              expiry: rawOffers[i].expiry.toString(),
              active: rawOffers[i].active
            });
          }
        } catch (err) {
          console.error('Error fetching raw offers:', err);
          console.error('Error details:', {
            message: err.message,
            code: err.code,
            data: err.data
          });
        }
      }
      
      setOffers(domainOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const loadAuctionInfo = async () => {
    if (!marketplaceContract || !domain) return;
    
    try {
      console.log('Loading auction info for domain:', domain.name);
      const auction = await marketplaceContract.auctions(domain.name);
      
      if (auction.active || auction.currentBid > 0) {
        const auctionData = {
          name: auction.name,
          seller: auction.seller,
          startPrice: parseFloat(ethers.utils.formatEther(auction.startPrice)),
          currentBid: parseFloat(ethers.utils.formatEther(auction.currentBid)),
          highestBidder: auction.highestBidder,
          endTime: auction.endTime.toNumber() * 1000,
          active: auction.active
        };
        
        setAuctionInfo(auctionData);
        console.log('Loaded auction info:', auctionData);
      } else {
        setAuctionInfo(null);
      }
    } catch (error) {
      console.error('Error loading auction info:', error);
      setAuctionInfo(null);
    }
  };

  const loadListingInfo = async () => {
    if (!marketplaceContract || !domain) return;
    
    try {
      console.log('Loading listing info for domain:', domain.name);
      const listing = await marketplaceContract.getListing(domain.name);
      
      if (listing[2]) { // active
        const listingData = {
          seller: listing[0],
          price: parseFloat(ethers.utils.formatEther(listing[1])),
          active: listing[2]
        };
        
        setListingInfo(listingData);
        console.log('Loaded listing info:', listingData);
      } else {
        setListingInfo(null);
      }
    } catch (error) {
      console.error('Error loading listing info:', error);
      setListingInfo(null);
    }
  };

  const handleCreateListing = async () => {
    if (!marketplaceContract || !listingPrice || !domain) return;

    setCreatingListing(true);
    try {
      console.log('Creating listing for domain:', domain.name, 'Price:', listingPrice);

      const priceWei = ethers.utils.parseEther(listingPrice);
      
      const tx = await marketplaceContract.createListing(domain.name, priceWei);
      toast.loading(`Creating listing for ${domain.name}.shm...`);
      
      await tx.wait();
      
      toast.success(`${domain.name}.shm is now listed for ${listingPrice} SHM!`);
      
      // Reload listing info
      await loadListingInfo();
      setShowCreateListing(false);
      setListingPrice('');
      
    } catch (error) {
      console.error('Error creating listing:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else if (error.reason) {
        toast.error(`Failed to create listing: ${error.reason}`);
      } else {
        toast.error('Failed to create listing: ' + error.message);
      }
    } finally {
      setCreatingListing(false);
    }
  };

  const handleCancelListing = async () => {
    if (!marketplaceContract || !domain) return;

    try {
      console.log('Cancelling listing for domain:', domain.name);

      const tx = await marketplaceContract.cancelListing(domain.name);
      toast.loading(`Cancelling listing for ${domain.name}.shm...`);
      
      await tx.wait();
      
      toast.success(`Listing cancelled for ${domain.name}.shm`);
      
      // Reload listing info
      await loadListingInfo();
      
    } catch (error) {
      console.error('Error cancelling listing:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Failed to cancel listing: ' + error.message);
      }
    }
  };

  const handleAcceptOffer = async (offer) => {
    if (!marketplaceContract || !offer) return;

    setAcceptingOffer(offer.index);
    try {
      console.log('Accepting offer:', {
        domain: domain.name,
        index: offer.index,
        amount: offer.amount,
        buyer: offer.buyer
      });

      const tx = await marketplaceContract.acceptOffer(domain.name, offer.index);
      toast.loading(`Accepting offer for ${offer.amount} SHM...`);
      
      await tx.wait();
      
      toast.success(`Offer accepted! Sold ${domain.name}.shm for ${offer.amount} SHM`);
      
      // Reload offers and notify parent
      await loadOffers();
      if (onOfferAccepted) {
        onOfferAccepted(domain, offer);
      }
      
    } catch (error) {
      console.error('Error accepting offer:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Failed to accept offer: ' + error.message);
      }
    } finally {
      setAcceptingOffer(null);
    }
  };

  const formatTimeLeft = (expiry) => {
    const now = Date.now();
    const timeLeft = expiry - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getOfferStatus = (offer) => {
    const now = Date.now();
    if (offer.expiry <= now) return 'expired';
    if (offer.timeLeft < 3600) return 'urgent'; // Less than 1 hour
    if (offer.timeLeft < 86400) return 'soon'; // Less than 24 hours
    return 'active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'expired': return '#ff4757';
      case 'urgent': return '#ff6348';
      case 'soon': return '#ffa502';
      default: return '#2ed573';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="domain-management-modal glass"
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="domain-info">
              <h2>{domain?.name}.shm</h2>
              <div className="domain-meta">
                <span className="owner-badge">Your Domain</span>
                <span className="expiry-info">
                  <FiClock />
                  Expires: {new Date(domain?.expiry * 1000).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          {/* Content */}
          <div className="modal-content">
            {/* Auction Information */}
            {auctionInfo && (
              <div className="auction-section">
                <div className="section-header">
                  <h3>
                    <FiClock />
                    Active Auction
                  </h3>
                  <span className={`auction-status ${auctionInfo.active ? 'active' : 'ended'}`}>
                    {auctionInfo.active ? 'Live' : 'Ended'}
                  </span>
                </div>

                <div className="auction-card">
                  <div className="auction-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Starting Price</span>
                      <span className="detail-value">{auctionInfo.startPrice} SHM</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Current Bid</span>
                      <span className="detail-value highlight">{auctionInfo.currentBid} SHM</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Highest Bidder</span>
                      <span className="detail-value">
                        {auctionInfo.highestBidder !== ethers.constants.AddressZero 
                          ? formatAddress(auctionInfo.highestBidder)
                          : 'No bids yet'
                        }
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">End Time</span>
                      <span className="detail-value">
                        {new Date(auctionInfo.endTime).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {auctionInfo.currentBid > 0 && (
                    <div className="bid-info">
                      <FiUser />
                      <span>
                        Current leader: <strong>{formatAddress(auctionInfo.highestBidder)}</strong> 
                        with <strong>{auctionInfo.currentBid} SHM</strong>
                      </span>
                      <a
                        href={`https://explorer-unstablenet.shardeum.org/address/${auctionInfo.highestBidder}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="explorer-link"
                      >
                        <FiExternalLink />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="offers-section">
              <div className="section-header">
                <h3>
                  <FiDollarSign />
                  Incoming Offers ({offers.length})
                </h3>
                <button 
                  className="refresh-btn"
                  onClick={async () => {
                    console.log('=== Manual Refresh Clicked ===');
                    console.log('Domain name:', domain?.name);
                    console.log('Contract addresses:', {
                      marketplace: marketplaceContract?.address,
                      blockchainService: !!blockchainService
                    });
                    
                    // Debug: Check for any offer-related transactions
                    try {
                      console.log('Checking for offer transactions...');
                      const currentBlock = await blockchainService.provider.getBlockNumber();
                      const fromBlock = Math.max(0, currentBlock - 50000); // Look back more blocks
                      
                      // Get ALL events from the marketplace contract
                      const allLogs = await blockchainService.provider.getLogs({
                        address: marketplaceContract.address,
                        fromBlock,
                        toBlock: currentBlock
                      });
                      
                      console.log(`Found ${allLogs.length} total events from marketplace`);
                      
                      // Parse and filter for offer events
                      const offerEvents = allLogs.filter(log => {
                        try {
                          const parsed = marketplaceContract.interface.parseLog(log);
                          return parsed.name === 'OfferMade' || parsed.name === 'OfferAccepted' || parsed.name === 'OfferCancelled';
                        } catch (e) {
                          return false;
                        }
                      });
                      
                      console.log(`Found ${offerEvents.length} offer-related events`);
                      
                      // Show details of each offer event
                      for (const log of offerEvents) {
                        const parsed = marketplaceContract.interface.parseLog(log);
                        console.log('Offer event:', {
                          type: parsed.name,
                          domain: parsed.args.name || 'N/A',
                          buyer: parsed.args.buyer,
                          amount: parsed.args.amount ? ethers.utils.formatEther(parsed.args.amount) : 'N/A',
                          block: log.blockNumber
                        });
                      }
                    } catch (debugErr) {
                      console.error('Debug error:', debugErr);
                    }
                    
                    await loadOffers();
                    console.log('=== Refresh Complete ===');
                  }}
                  disabled={loading}
                >
                  🔄 Refresh
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="loader"></div>
                  <p>Loading offers...</p>
                </div>
              ) : offers.length === 0 ? (
                <div className="empty-state">
                  <FiAlertCircle size={48} />
                  <h4>No Active Offers</h4>
                  <p>You haven't received any offers for this domain yet.</p>
                </div>
              ) : (
                <div className="offers-list">
                  {offers.map((offer, index) => {
                    const status = getOfferStatus(offer);
                    const isAccepting = acceptingOffer === offer.index;
                    
                    return (
                      <motion.div
                        key={`${offer.buyer}-${offer.index}`}
                        className={`offer-card ${status}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="offer-header">
                          <div className="offer-amount">
                            <span className="amount">{offer.amount} SHM</span>
                            <span className="usd-estimate">
                              ≈ ${(offer.amount * 0.02).toFixed(2)} USD
                            </span>
                          </div>
                          <div 
                            className="offer-status"
                            style={{ color: getStatusColor(status) }}
                          >
                            <FiClock />
                            {formatTimeLeft(offer.expiry)}
                          </div>
                        </div>

                        <div className="offer-details">
                          <div className="buyer-info">
                            <FiUser />
                            <span>From: {formatAddress(offer.buyer)}</span>
                            <a
                              href={`https://explorer-unstablenet.shardeum.org/address/${offer.buyer}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="explorer-link"
                            >
                              <FiExternalLink />
                            </a>
                          </div>
                          
                          {offer.timestamp && (
                            <div className="offer-time">
                              Made: {new Date(offer.timestamp).toLocaleString()}
                            </div>
                          )}
                        </div>

                        <div className="offer-actions">
                          {status === 'expired' ? (
                            <span className="expired-badge">Expired</span>
                          ) : (
                            <button
                              className="accept-btn"
                              onClick={() => handleAcceptOffer(offer)}
                              disabled={isAccepting || status === 'expired'}
                            >
                              {isAccepting ? (
                                <>
                                  <div className="spinner"></div>
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <FiCheck />
                                  Accept Offer
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Listing Management */}
            <div className="listing-section">
              <div className="section-header">
                <h3>
                  <FiDollarSign />
                  Domain Listing
                </h3>
              </div>

              {listingInfo ? (
                <div className="listing-card active-listing">
                  <div className="listing-header">
                    <div className="listing-status">
                      <span className="status-badge active">Listed for Sale</span>
                      <span className="listing-price">{listingInfo.price} SHM</span>
                    </div>
                    <button
                      className="cancel-listing-btn"
                      onClick={handleCancelListing}
                    >
                      Cancel Listing
                    </button>
                  </div>
                  <div className="listing-info">
                    <p>Your domain is currently listed for sale at <strong>{listingInfo.price} SHM</strong></p>
                    <p>Buyers can purchase it instantly from the marketplace.</p>
                  </div>
                </div>
              ) : (
                <div className="listing-card no-listing">
                  {showCreateListing ? (
                    <div className="create-listing-form">
                      <h4>List Domain for Sale</h4>
                      <div className="form-group">
                        <label htmlFor="listing-price">Price (SHM)</label>
                        <input
                          id="listing-price"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="e.g., 5.0"
                          value={listingPrice}
                          onChange={(e) => setListingPrice(e.target.value)}
                          disabled={creatingListing}
                        />
                      </div>
                      <div className="form-actions">
                        <button
                          className="btn-create-listing"
                          onClick={handleCreateListing}
                          disabled={creatingListing || !listingPrice || parseFloat(listingPrice) <= 0}
                        >
                          {creatingListing ? (
                            <>
                              <div className="spinner"></div>
                              Creating...
                            </>
                          ) : (
                            'Create Listing'
                          )}
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => {
                            setShowCreateListing(false);
                            setListingPrice('');
                          }}
                          disabled={creatingListing}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="no-listing-state">
                      <div className="no-listing-icon">
                        <FiDollarSign size={32} />
                      </div>
                      <h4>Domain Not Listed</h4>
                      <p>List your domain for sale to allow others to buy it instantly.</p>
                      <button
                        className="btn-list-domain"
                        onClick={() => setShowCreateListing(true)}
                        disabled={!!auctionInfo?.active}
                      >
                        {auctionInfo?.active ? 'Cannot list during auction' : 'List for Sale'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Domain Stats */}
            <div className="domain-stats">
              <h4>Domain Statistics</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="label">Total Offers</span>
                  <span className="value">{offers.length}</span>
                </div>
                <div className="stat-item">
                  <span className="label">Highest Offer</span>
                  <span className="value">
                    {offers.length > 0 ? `${Math.max(...offers.map(o => o.amount))} SHM` : '0 SHM'}
                  </span>
                </div>
                {auctionInfo && (
                  <div className="stat-item">
                    <span className="label">Current Bid</span>
                    <span className="value">{auctionInfo.currentBid} SHM</span>
                  </div>
                )}
                <div className="stat-item">
                  <span className="label">Registration</span>
                  <span className="value">
                    {domain?.expiry ? new Date(domain.expiry * 1000).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DomainManagement;