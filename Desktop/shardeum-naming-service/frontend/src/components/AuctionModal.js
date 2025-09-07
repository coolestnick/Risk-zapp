import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiClock, FiDollarSign } from 'react-icons/fi';
import './AuctionModal.css';

const AuctionModal = ({ isOpen, onClose, domain, onCreateAuction, onMakeOffer, mode = 'auction' }) => {
  const [startPrice, setStartPrice] = useState('');
  const [duration, setDuration] = useState(24); // hours
  const [offerAmount, setOfferAmount] = useState('');
  const [offerExpiry, setOfferExpiry] = useState(7); // days
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      if (mode === 'auction') {
        await onCreateAuction(domain, startPrice, duration);
      } else {
        await onMakeOffer(domain, offerAmount, offerExpiry);
      }
      onClose();
    } catch (error) {
      console.error(`Error ${mode === 'auction' ? 'creating auction' : 'making offer'}:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setStartPrice('');
    setDuration(24);
    setOfferAmount('');
    setOfferExpiry(7);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="auction-modal-container glass-dark"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 className="modal-title">
              {mode === 'auction' ? 'Create Auction' : 'Make Offer'}
            </h2>
            <button className="modal-close" onClick={handleClose}>
              <FiX />
            </button>
          </div>

          <div className="modal-body">
            <div className="domain-info">
              <h3 className="domain-name-large">
                {domain}<span className="tld">.shm</span>
              </h3>
            </div>

            {mode === 'auction' ? (
              <div className="auction-form">
                <div className="form-group">
                  <label className="form-label">
                    <FiDollarSign /> Starting Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.1"
                    value={startPrice}
                    onChange={(e) => setStartPrice(e.target.value)}
                    className="form-input"
                  />
                  <span className="input-suffix">SHM</span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FiClock /> Duration
                  </label>
                  <select 
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="form-select"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={6}>6 Hours</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>1 Day</option>
                    <option value={72}>3 Days</option>
                    <option value={168}>1 Week</option>
                  </select>
                </div>

                <div className="auction-summary">
                  <h4>Auction Summary</h4>
                  <div className="summary-item">
                    <span>Starting Price:</span>
                    <span>{startPrice || '0'} SHM</span>
                  </div>
                  <div className="summary-item">
                    <span>Duration:</span>
                    <span>{duration} hour{duration !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="summary-item">
                    <span>Marketplace Fee:</span>
                    <span>2.5%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="offer-form">
                <div className="form-group">
                  <label className="form-label">
                    <FiDollarSign /> Offer Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.5"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="form-input"
                  />
                  <span className="input-suffix">SHM</span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FiClock /> Offer Valid For
                  </label>
                  <select 
                    value={offerExpiry} 
                    onChange={(e) => setOfferExpiry(parseInt(e.target.value))}
                    className="form-select"
                  >
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>1 Week</option>
                    <option value={30}>1 Month</option>
                  </select>
                </div>

                <div className="offer-summary">
                  <h4>Offer Summary</h4>
                  <div className="summary-item">
                    <span>Your Offer:</span>
                    <span>{offerAmount || '0'} SHM</span>
                  </div>
                  <div className="summary-item">
                    <span>Valid Until:</span>
                    <span>{offerExpiry} day{offerExpiry !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="summary-item">
                    <span>Marketplace Fee:</span>
                    <span>2.5% (if accepted)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button 
              className="btn-submit"
              onClick={handleSubmit}
              disabled={
                isProcessing || 
                (mode === 'auction' ? !startPrice : !offerAmount)
              }
            >
              {isProcessing ? (
                <>
                  <div className="mini-spinner"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {mode === 'auction' ? 'Create Auction' : 'Make Offer'}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuctionModal;