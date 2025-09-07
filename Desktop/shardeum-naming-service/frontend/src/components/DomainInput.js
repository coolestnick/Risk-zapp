import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { ethers } from 'ethers';
import { resolveDomain, reverseResolve } from '../utils/domainResolver';
import './DomainInput.css';

const DomainInput = ({ 
  value, 
  onChange, 
  provider,
  placeholder = "Enter .shm domain or 0x address",
  showResolution = true 
}) => {
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolvedDomain, setResolvedDomain] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState('');
  const [inputType, setInputType] = useState(''); // 'domain', 'address', or 'invalid'

  useEffect(() => {
    if (value && provider) {
      handleResolution(value);
    } else {
      resetResolution();
    }
  }, [value, provider]);

  const resetResolution = () => {
    setResolvedAddress('');
    setResolvedDomain('');
    setResolutionError('');
    setInputType('');
  };

  const handleResolution = async (input) => {
    setIsResolving(true);
    setResolutionError('');
    
    try {
      if (ethers.utils.isAddress(input)) {
        // Input is an address, try reverse resolution
        setInputType('address');
        setResolvedAddress(input);
        
        if (showResolution) {
          const domain = await reverseResolve(input, provider);
          setResolvedDomain(domain || '');
        }
      } else if (input.endsWith('.shm') || (input.length > 0 && !input.startsWith('0x'))) {
        // Input might be a domain
        setInputType('domain');
        
        try {
          const address = await resolveDomain(input, provider);
          setResolvedAddress(address);
          setResolvedDomain(input.endsWith('.shm') ? input : `${input}.shm`);
        } catch (error) {
          setResolutionError('Domain not found or expired');
          setInputType('invalid');
        }
      } else {
        setInputType('invalid');
        setResolutionError('Invalid domain or address format');
      }
    } catch (error) {
      console.error('Resolution error:', error);
      setResolutionError(error.message || 'Resolution failed');
      setInputType('invalid');
    } finally {
      setIsResolving(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusIcon = () => {
    if (isResolving) {
      return <FiLoader className="status-icon resolving" />;
    }
    
    switch (inputType) {
      case 'domain':
      case 'address':
        return <FiCheckCircle className="status-icon success" />;
      case 'invalid':
        return <FiAlertCircle className="status-icon error" />;
      default:
        return <FiUser className="status-icon default" />;
    }
  };

  return (
    <div className="domain-input-container">
      <div className={`input-wrapper glass ${inputType}`}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="domain-input"
        />
        <div className="input-status">
          {getStatusIcon()}
        </div>
      </div>

      {showResolution && (value || resolvedAddress || resolvedDomain || resolutionError) && (
        <motion.div
          className="resolution-info"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {resolutionError ? (
            <div className="resolution-error">
              <FiAlertCircle />
              <span>{resolutionError}</span>
            </div>
          ) : (
            <div className="resolution-success">
              {inputType === 'domain' && resolvedAddress && (
                <div className="resolution-item">
                  <span className="resolution-label">Resolves to:</span>
                  <span className="resolution-value address">
                    {formatAddress(resolvedAddress)}
                  </span>
                  <span className="resolution-full">{resolvedAddress}</span>
                </div>
              )}
              
              {inputType === 'address' && resolvedDomain && (
                <div className="resolution-item">
                  <span className="resolution-label">Domain:</span>
                  <span className="resolution-value domain">
                    {resolvedDomain}
                  </span>
                </div>
              )}
              
              {inputType === 'address' && !resolvedDomain && !isResolving && (
                <div className="resolution-item">
                  <span className="resolution-label">No domain registered</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DomainInput;