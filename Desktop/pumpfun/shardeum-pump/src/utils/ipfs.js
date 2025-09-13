import axios from 'axios';

// IPFS Configuration
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

// Alternative public IPFS gateways
const PUBLIC_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
];

class IPFSService {
  constructor() {
    this.gateway = IPFS_GATEWAY;
    this.hasCredentials = !!(PINATA_JWT || (PINATA_API_KEY && PINATA_SECRET_KEY));
  }

  // Upload file to IPFS using Pinata
  async uploadFile(file) {
    if (!this.hasCredentials) {
      throw new Error('IPFS credentials not configured. Please set up Pinata API keys.');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const metadata = JSON.stringify({
        name: `token-image-${Date.now()}`,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          type: 'token-image',
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      const headers = PINATA_JWT 
        ? { 'Authorization': `Bearer ${PINATA_JWT}` }
        : {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY,
          };

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return {
        hash: response.data.IpfsHash,
        url: `${this.gateway}${response.data.IpfsHash}`,
        size: response.data.PinSize,
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  // Upload JSON metadata to IPFS
  async uploadJSON(data) {
    if (!this.hasCredentials) {
      throw new Error('IPFS credentials not configured. Please set up Pinata API keys.');
    }

    try {
      const headers = PINATA_JWT 
        ? { 'Authorization': `Bearer ${PINATA_JWT}` }
        : {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_KEY,
          };

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: data,
          pinataMetadata: {
            name: `token-metadata-${Date.now()}`,
            keyvalues: {
              uploadedAt: new Date().toISOString(),
              type: 'token-metadata',
            }
          },
          pinataOptions: {
            cidVersion: 0,
          }
        },
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        hash: response.data.IpfsHash,
        url: `${this.gateway}${response.data.IpfsHash}`,
      };
    } catch (error) {
      console.error('IPFS JSON upload failed:', error);
      throw new Error('Failed to upload JSON to IPFS');
    }
  }

  // Get file from IPFS with fallback gateways
  async getFile(hash) {
    const urls = [this.gateway, ...PUBLIC_GATEWAYS].map(gateway => `${gateway}${hash}`);
    
    for (const url of urls) {
      try {
        const response = await axios.get(url, { timeout: 10000 });
        return response.data;
      } catch (error) {
        console.warn(`Failed to fetch from ${url}:`, error.message);
        continue;
      }
    }
    
    throw new Error(`Failed to fetch file with hash ${hash} from all gateways`);
  }

  // Get file URL with fallback
  getFileUrl(hash, preferredGateway = null) {
    const gateway = preferredGateway || this.gateway;
    return `${gateway}${hash}`;
  }

  // Validate file before upload
  validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File must be an image (JPEG, PNG, GIF, or WebP)');
    }
    
    return true;
  }

  // Compress image before upload
  async compressImage(file, quality = 0.8, maxWidth = 512, maxHeight = 512) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Create token metadata
  createTokenMetadata(tokenData, imageHash) {
    return {
      name: tokenData.name,
      symbol: tokenData.symbol,
      description: tokenData.description,
      image: `ipfs://${imageHash}`,
      external_url: `${window.location.origin}/token/${tokenData.address}`,
      attributes: [
        {
          trait_type: 'Creator',
          value: tokenData.creator,
        },
        {
          trait_type: 'Created At',
          value: new Date().toISOString(),
        },
        {
          trait_type: 'Network',
          value: 'Shardeum',
        },
      ],
    };
  }

  // Check if IPFS is available
  async checkAvailability() {
    try {
      // Test with a known IPFS hash
      const testHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'; // "hello world"
      await this.getFile(testHash);
      return true;
    } catch (error) {
      console.warn('IPFS not available:', error);
      return false;
    }
  }

  // Get service status
  getStatus() {
    return {
      hasCredentials: this.hasCredentials,
      gateway: this.gateway,
      canUpload: this.hasCredentials,
      canRead: true,
    };
  }
}

// Create singleton instance
const ipfsService = new IPFSService();

// Export utility functions
export const uploadToIPFS = (file) => ipfsService.uploadFile(file);
export const uploadJSONToIPFS = (data) => ipfsService.uploadJSON(data);
export const getFromIPFS = (hash) => ipfsService.getFile(hash);
export const getIPFSUrl = (hash, gateway) => ipfsService.getFileUrl(hash, gateway);
export const validateImageFile = (file) => ipfsService.validateFile(file);
export const compressImage = (file, quality, maxWidth, maxHeight) => 
  ipfsService.compressImage(file, quality, maxWidth, maxHeight);
export const createTokenMetadata = (tokenData, imageHash) => 
  ipfsService.createTokenMetadata(tokenData, imageHash);
export const checkIPFSAvailability = () => ipfsService.checkAvailability();
export const getIPFSStatus = () => ipfsService.getStatus();

export default ipfsService;