import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

// Domain resolution utility
class DomainResolver {
  constructor(provider) {
    this.provider = provider;
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }

  // Resolve .shm domain to address
  async resolveToAddress(domain) {
    try {
      // Remove .shm extension if present
      const cleanDomain = domain.replace('.shm', '');
      
      // Get domain info from contract
      const [owner, expiry, isForSale, price, isPremium] = await this.contract.getDomain(cleanDomain);
      
      // Check if domain exists and is not expired
      const now = Math.floor(Date.now() / 1000);
      if (expiry.toNumber() > now && owner !== ethers.constants.AddressZero) {
        // First check if there's a custom address record
        const customAddress = await this.contract.getRecord(cleanDomain);
        if (customAddress && ethers.utils.isAddress(customAddress)) {
          return customAddress;
        }
        
        // Fall back to owner address
        return owner;
      }
      
      throw new Error('Domain not found or expired');
    } catch (error) {
      console.error('Error resolving domain:', error);
      throw error;
    }
  }

  // Reverse resolve address to .shm domain
  async reverseResolve(address) {
    try {
      const domains = await this.contract.getUserDomains(address);
      if (domains.length > 0) {
        return `${domains[0]}.shm`;
      }
      return null;
    } catch (error) {
      console.error('Error reverse resolving:', error);
      return null;
    }
  }

  // Check if a string is a .shm domain
  static isDomain(input) {
    return typeof input === 'string' && 
           (input.endsWith('.shm') || 
            (input.length > 0 && !input.startsWith('0x') && input.length < 64));
  }

  // Check if a string is an Ethereum address
  static isAddress(input) {
    return ethers.utils.isAddress(input);
  }
}

// Utility functions for easy use
export const createResolver = (provider) => new DomainResolver(provider);

export const resolveDomain = async (domain, provider) => {
  const resolver = new DomainResolver(provider);
  return await resolver.resolveToAddress(domain);
};

export const reverseResolve = async (address, provider) => {
  const resolver = new DomainResolver(provider);
  return await resolver.reverseResolve(address);
};

export { DomainResolver };
export default DomainResolver;