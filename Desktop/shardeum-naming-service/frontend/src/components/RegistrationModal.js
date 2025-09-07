import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import './RegistrationModal.css';

const RegistrationModal = ({ isOpen, onClose, domain, onRegister, price }) => {
  const [duration, setDuration] = useState(1); // years
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await onRegister(domain, duration);
    } finally {
      setIsRegistering(false);
    }
  };

  const totalPrice = price * duration;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-container glass-dark"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 className="modal-title">Register Domain</h2>
            <button className="modal-close" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <div className="modal-body">
            <div className="domain-preview-large">
              <h3 className="preview-name">
                {domain}<span className="tld">.shm</span>
              </h3>
              <div className="availability-badge">
                <FiCheck /> Available
              </div>
            </div>

            <div className="registration-details">
              <div className="detail-section">
                <h4>Registration Period</h4>
                <div className="duration-selector">
                  {[1, 2, 3, 5, 10].map((year) => (
                    <button
                      key={year}
                      className={`duration-option ${duration === year ? 'active' : ''}`}
                      onClick={() => setDuration(year)}
                    >
                      {year} {year === 1 ? 'Year' : 'Years'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>Registration Cost</h4>
                <div className="cost-breakdown">
                  <div className="cost-item">
                    <span className="cost-label">Base Price ({duration} year{duration > 1 ? 's' : ''})</span>
                    <span className="cost-value">{totalPrice.toFixed(2)} SHM</span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">Gas Fee (estimated)</span>
                    <span className="cost-value">~0.01 SHM</span>
                  </div>
                  <div className="cost-divider"></div>
                  <div className="cost-item total">
                    <span className="cost-label">Total</span>
                    <span className="cost-value">{(totalPrice + 0.01).toFixed(2)} SHM</span>
                  </div>
                </div>
              </div>

              <div className="info-box">
                <FiAlertCircle className="info-icon" />
                <p>
                  Once registered, this domain will be yours for {duration} year{duration > 1 ? 's' : ''}. 
                  You can set records, transfer ownership, or list it for sale.
                </p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn-register"
              onClick={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <div className="mini-spinner"></div>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Register for {totalPrice.toFixed(2)} SHM</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrationModal;