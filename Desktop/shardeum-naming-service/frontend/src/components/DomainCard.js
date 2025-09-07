import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiTag, FiArrowRight, FiMail } from 'react-icons/fi';
import './DomainCard.css';

const DomainCard = ({ domain, onClick, isOwned = false, price = null, onCreateAuction, onMakeOffer, offerCount = 0 }) => {
  const formatExpiry = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getDaysUntilExpiry = (timestamp) => {
    if (!timestamp) return null;
    const now = Date.now() / 1000;
    const days = Math.floor((timestamp - now) / 86400);
    return days;
  };

  const getExpiryColor = (days) => {
    if (days === null) return 'var(--text-secondary)';
    if (days < 30) return 'var(--error)';
    if (days < 90) return 'var(--warning)';
    return 'var(--success)';
  };

  const daysLeft = getDaysUntilExpiry(domain.expiry);

  return (
    <motion.div
      className={`domain-card glass ${isOwned ? 'owned' : ''} ${offerCount > 0 ? 'has-offers' : ''}`}
      onClick={onClick}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="domain-card-header">
        <h3 className="domain-name">
          {domain.name}
          <span className="domain-tld">.shm</span>
        </h3>
        {domain.isPremium && (
          <span className="premium-badge">Premium</span>
        )}
      </div>

      <div className="domain-card-body">
        {isOwned ? (
          <>
            <div className="domain-info">
              <FiClock className="info-icon" />
              <div className="info-content">
                <span className="info-label">Expires</span>
                <span 
                  className="info-value" 
                  style={{ color: getExpiryColor(daysLeft) }}
                >
                  {formatExpiry(domain.expiry)}
                  {daysLeft !== null && daysLeft < 90 && (
                    <span className="days-left"> ({daysLeft} days)</span>
                  )}
                </span>
              </div>
            </div>

            {domain.isForSale && (
              <div className="domain-info">
                <FiTag className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Listed for</span>
                  <span className="info-value price">{domain.price} SHM</span>
                </div>
              </div>
            )}

            {offerCount > 0 && (
              <div className="domain-info offers-info">
                <FiMail className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Offers</span>
                  <span className="info-value offers-count">{offerCount}</span>
                </div>
                <div className="offer-indicator"></div>
              </div>
            )}
          </>
        ) : (
          <>
            {price !== null && (
              <div className="domain-info">
                <FiTag className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Price</span>
                  <span className="info-value price">{price} SHM</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="domain-card-footer">
        {isOwned ? (
          <div className="owner-actions">
            <button className="domain-action-btn primary" onClick={onClick}>
              <span>Manage</span>
              <FiArrowRight className="action-icon" />
            </button>
            {onCreateAuction && (
              <button 
                className="domain-action-btn secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateAuction(domain.name);
                }}
              >
                Create Auction
              </button>
            )}
          </div>
        ) : (
          <div className="visitor-actions">
            <button className="domain-action-btn primary" onClick={onClick}>
              <span>Register</span>
              <FiArrowRight className="action-icon" />
            </button>
            {onMakeOffer && (
              <button 
                className="domain-action-btn secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onMakeOffer(domain.name);
                }}
              >
                Make Offer
              </button>
            )}
          </div>
        )}
      </div>

      <div className="domain-card-glow"></div>
    </motion.div>
  );
};

export default DomainCard;