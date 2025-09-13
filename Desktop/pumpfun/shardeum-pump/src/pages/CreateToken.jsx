import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { uploadToIPFS, validateImageFile, compressImage } from '../utils/ipfs';

const CreateToken = () => {
  const navigate = useNavigate();
  const { isConnected, isCorrectNetwork, account } = useWeb3();
  const { createToken, isReady, contracts } = useContract();

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    initialBuy: '0',
  });
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Preview, 3: Deploy

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle image selection
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateImageFile(file);
      
      // Compress image
      const compressedFile = await compressImage(file, 0.8, 400, 400);
      setImage(compressedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(compressedFile);
      
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: null }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, image: error.message }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Token name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Token name must be less than 50 characters';
    }
    
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Token symbol is required';
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = 'Token symbol must be less than 10 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.symbol.toUpperCase())) {
      newErrors.symbol = 'Token symbol must contain only letters and numbers';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Token description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (!image) {
      newErrors.image = 'Token image is required';
    }
    
    if (formData.initialBuy && (isNaN(formData.initialBuy) || parseFloat(formData.initialBuy) < 0)) {
      newErrors.initialBuy = 'Initial buy amount must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected || !isCorrectNetwork) {
      alert('Please connect your wallet to Shardeum network');
      return;
    }

    if (step === 1) {
      if (validateForm()) {
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      setLoading(true);
      
      try {
        let imageHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'; // Default placeholder
        
        try {
          // Try to upload image to IPFS
          const imageResult = await uploadToIPFS(image);
          imageHash = imageResult.hash;
        } catch (ipfsError) {
          console.warn('IPFS upload failed, using placeholder:', ipfsError.message);
          alert('Image upload failed, using placeholder. Please configure Pinata API keys in .env file for image uploads.');
        }
        
        // Create token
        const tx = await createToken({
          name: formData.name.trim(),
          symbol: formData.symbol.trim().toUpperCase(),
          description: formData.description.trim(),
          imageHash: imageHash,
        }, formData.initialBuy || '0');
        
        setStep(3);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);
        console.log('Receipt logs:', receipt.logs);
        
        // Extract token address from events (ethers v6)
        let tokenAddress = null;
        
        // Try to find TokenCreated event
        if (contracts.factory && contracts.factory.interface) {
          for (const log of receipt.logs || []) {
            try {
              const parsed = contracts.factory.interface.parseLog(log);
              console.log('Parsed log:', parsed);
              
              if (parsed && parsed.name === 'TokenCreated') {
                tokenAddress = parsed.args.token || parsed.args[0];
                console.log('Found token address from event:', tokenAddress);
                break;
              }
            } catch (e) {
              console.log('Could not parse log:', e);
            }
          }
        } else {
          console.log('Factory interface not available for parsing');
        }
        
        if (tokenAddress) {
          console.log('Navigating to token page:', `/token/${tokenAddress}`);
          // Add a small delay to ensure everything is ready
          setTimeout(() => {
            navigate(`/token/${tokenAddress}`);
          }, 1000);
        } else {
          // Alternative method: get the latest token
          console.log('No event found, trying alternative method...');
          const tokenCount = await contracts.factory.getCount();
          const latestTokenAddress = await contracts.factory.allTokens(Number(tokenCount) - 1);
          console.log('Latest token address:', latestTokenAddress);
          
          if (latestTokenAddress) {
            // Add a small delay to ensure everything is ready
            setTimeout(() => {
              console.log('Navigating to token:', latestTokenAddress);
              navigate(`/token/${latestTokenAddress}`);
            }, 1000);
          } else {
            alert('Token created successfully! Please find it on the home page.');
            setTimeout(() => navigate('/'), 1000);
          }
        }
      } catch (error) {
        console.error('Failed to create token:', error);
        alert('Failed to create token: ' + error.message);
        setStep(2);
      } finally {
        setLoading(false);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      symbol: '',
      description: '',
      initialBuy: '0',
    });
    setImage(null);
    setImagePreview(null);
    setErrors({});
    setStep(1);
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to create a token on ShardeumPump
          </p>
        </Card>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Wrong Network
          </h2>
          <p className="text-gray-400 mb-6">
            Please switch to the Shardeum Unstable network to create tokens
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Create Your Token 🚀
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Launch your meme token on Shardeum with just a few clicks. 
          Fair launch mechanics ensure everyone gets a fair chance.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[
            { step: 1, label: 'Token Details', icon: '📝' },
            { step: 2, label: 'Review & Deploy', icon: '👀' },
            { step: 3, label: 'Success', icon: '🎉' },
          ].map(({ step: s, label, icon }) => (
            <div key={s} className="flex items-center space-x-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-400'
                }`}
              >
                {step > s ? '✓' : icon}
              </div>
              <span
                className={`text-sm ${
                  step >= s ? 'text-white' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
              {s < 3 && (
                <div
                  className={`w-8 h-0.5 ${
                    step > s ? 'bg-primary-600' : 'bg-dark-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <Card>
            <Card.Header>
              <Card.Title>Token Details</Card.Title>
            </Card.Header>
            
            <div className="space-y-6">
              {/* Token Name */}
              <Input
                label="Token Name"
                placeholder="My Awesome Token"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                required
              />

              {/* Token Symbol */}
              <Input
                label="Token Symbol"
                placeholder="MAT"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                error={errors.symbol}
                required
              />

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  className="input-field w-full h-24 resize-none"
                  placeholder="Tell the world about your token..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  maxLength={500}
                />
                <div className="flex justify-between text-xs">
                  <span className="text-red-400">{errors.description}</span>
                  <span className="text-gray-500">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* Token Image */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">
                  Token Image <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 rounded-lg bg-dark-700 border-2 border-dashed border-dark-600 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-gray-500 text-xs text-center">
                        Upload<br />Image
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="token-image"
                    />
                    <label
                      htmlFor="token-image"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-base rounded-lg font-semibold transition-all duration-200 border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white cursor-pointer focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 focus-within:ring-offset-dark-900"
                    >
                      Choose Image
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB. Recommended: 400x400px
                    </p>
                  </div>
                </div>
                {errors.image && (
                  <p className="text-sm text-red-400">{errors.image}</p>
                )}
              </div>

              {/* Initial Buy */}
              <Input
                label="Initial Buy (Optional)"
                placeholder="0"
                type="number"
                step="0.001"
                min="0"
                value={formData.initialBuy}
                onChange={(e) => handleInputChange('initialBuy', e.target.value)}
                error={errors.initialBuy}
              />
              <p className="text-xs text-gray-500">
                Amount of SHM to buy immediately after token creation
              </p>
            </div>

            <div className="flex justify-end mt-8">
              <Button type="submit" size="lg">
                Next: Review & Deploy
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <Card.Header>
              <Card.Title>Review & Deploy</Card.Title>
            </Card.Header>
            
            <div className="space-y-6">
              {/* Token Preview */}
              <div className="flex items-center space-x-4 p-4 bg-dark-700 rounded-lg">
                <img
                  src={imagePreview}
                  alt="Token"
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {formData.name}
                  </h3>
                  <p className="text-primary-400 font-medium">
                    ${formData.symbol}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {formData.description}
                  </p>
                </div>
              </div>

              {/* Deployment Info */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Network</span>
                  <span className="text-white">Shardeum Unstable</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Supply</span>
                  <span className="text-white">1,000,000,000 tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Initial Buy</span>
                  <span className="text-white">
                    {formData.initialBuy || '0'} SHM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform Fee</span>
                  <span className="text-white">1%</span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-400 text-lg">⚠️</span>
                  <div>
                    <h4 className="text-yellow-400 font-medium">
                      Important Notice
                    </h4>
                    <p className="text-yellow-200 text-sm mt-1">
                      Once deployed, token details cannot be changed. Please review everything carefully.
                      Ensure you have enough SHM for gas fees and initial purchase.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back to Edit
              </Button>
              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={!isReady}
              >
                {loading ? 'Deploying...' : 'Deploy Token 🚀'}
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Token Created Successfully!
            </h2>
            <p className="text-gray-400 mb-8">
              Your token is being deployed to the Shardeum network. 
              You'll be redirected to the token page once it's ready.
            </p>
            
            <LoadingSpinner size="lg" />
            
            <div className="mt-8 flex justify-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                Back to Home
              </Button>
              <Button onClick={resetForm}>
                Create Another Token
              </Button>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
};

export default CreateToken;