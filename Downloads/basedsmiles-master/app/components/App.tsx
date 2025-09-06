"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Smile, Share, Trash2, LogOut } from "lucide-react";
import { createClient } from '@supabase/supabase-js'
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { ImageGrid } from './ImageGrid';
import { initCamera, uploadImage, compressImage, loadExistingPhotos, handleSmileBack, deletePhoto } from '../utils/camera';
import GoFundSmiles from './GoFundSmiles';
import { NOUNS_SVG } from '../constants/nouns';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fmmiqlflfguqimxejeyf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlxbGZsZmd1cWlteGVqZXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Mjk5OTUsImV4cCI6MjA3MjUwNTk5NX0.LPvZKIv3vPv--x19ybIXEUWHdYs_VDuyAXacZqv3WPg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Add your contract ABI and address
const CONTRACT_ADDRESS = "0x766FCCd9BEA80F35A4aE34913aDd8ee825ECbEeA";
const CONTRACT_ABI = [
  "function submitSmilePhoto(string memory photoUrl) external",
  "function scoreSmile(string memory photoUrl, uint8 score) external",
  "function getSmileScore(string memory photoUrl) external view returns (uint8)",
  "function isGenuineSmile(string memory photoUrl) external view returns (bool)",
  "function getUserRewards(address user) external view returns (uint256)",
  "function getContractBalance() external view returns (uint256)",
  "function fundContract() external payable",
  "event SmileSubmitted(string photoUrl, address indexed submitter)",
  "event SmileScored(string photoUrl, uint8 smileScore, address indexed submitter, bool rewarded)"
];

// Add Shardeum Unstablenet network configuration
const SHARDEUM_CHAIN_ID = 8080; // Shardeum Unstablenet
const SHARDEUM_CONFIG = {
  chainId: SHARDEUM_CHAIN_ID,
  name: 'Shardeum Unstablenet',
  network: 'shardeum-unstable',
  rpcUrls: {
    default: 'https://api-unstable.shardeum.org',
    public: 'https://api-unstable.shardeum.org',
  },
  blockExplorers: {
    default: { name: 'Shardeum Unstable Explorer', url: 'https://explorer-unstable.shardeum.org' },
  },
  nativeCurrency: {
    name: 'Shardeum',
    symbol: 'SHM',
    decimals: 18,
  },
};

interface Image {
  url: string;
  timestamp: string;
  isLoading: boolean;
  smileCount: number;
  smileScore: number | undefined;
  hasWon: boolean | undefined;
  isNounish: boolean;
}

const App = () => {
  const { login, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | React.ReactNode>('');
  const [processedImages] = useState(new Set<string>());
  const [nounsFilterEnabled, setNounsFilterEnabled] = useState(false);

  useEffect(() => {
    const savedValue = localStorage.getItem('nounsFilterEnabled') === 'true';
    setNounsFilterEnabled(savedValue);
  }, []);

  useEffect(() => {
    loadExistingPhotos().then(setImages);
    initCamera(videoRef);
    
    const initContract = async () => {
      if (!authenticated || wallets.length === 0) return;
      
      try {
        const wallet = wallets[0];
        const provider = await wallet.getEthersProvider();
        
        if (!provider) {
          throw new Error('Failed to get provider');
        }

        const network = await provider.getNetwork();
        
        if (network.chainId !== SHARDEUM_CHAIN_ID) {
          setUploadStatus('Switching to Shardeum network...');
          try {
            await wallet.switchChain(SHARDEUM_CHAIN_ID);
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              try {
                await provider.send('wallet_addEthereumChain', [{
                  chainId: `0x${SHARDEUM_CHAIN_ID.toString(16)}`,
                  chainName: SHARDEUM_CONFIG.name,
                  nativeCurrency: SHARDEUM_CONFIG.nativeCurrency,
                  rpcUrls: [SHARDEUM_CONFIG.rpcUrls.default, SHARDEUM_CONFIG.rpcUrls.public],
                  blockExplorerUrls: [SHARDEUM_CONFIG.blockExplorers.default.url],
                }]);
                await wallet.switchChain(SHARDEUM_CHAIN_ID);
              } catch (addError) {
                console.error('Error adding Shardeum chain:', addError);
                throw new Error('Failed to add Shardeum network to wallet');
              }
            } else {
              throw switchError;
            }
          }
        }

        const updatedProvider = await wallet.getEthersProvider();
        const currentNetwork = await updatedProvider.getNetwork();
        if (currentNetwork.chainId !== SHARDEUM_CHAIN_ID) {
          throw new Error('Failed to switch to Shardeum network');
        }

        const signer = updatedProvider.getSigner();
        const smilePleaseContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        
        try {
          await smilePleaseContract.getContractBalance();
          setContract(smilePleaseContract);
        } catch (error) {
          console.error('Contract verification failed:', error);
          throw new Error('Failed to connect to contract on Shardeum');
        }

        // Add event listener after contract is initialized
        if (smilePleaseContract) {
          smilePleaseContract.on("SmileScored", 
            async (photoUrl: string, smileScore: number, submitter: string, rewarded: boolean) => {
              // Check if we've already processed this image
              if (processedImages.has(photoUrl)) {
                console.log('Already processed this image, skipping:', photoUrl);
                return;
              }
              processedImages.add(photoUrl);

              const hasWon = rewarded;
              console.log('Smile scored:', { photoUrl, smileScore, submitter, hasWon });

              if (hasWon) {
                // Check if image already exists in Supabase
                const { data: existingPhoto } = await supabase
                  .from('photos')
                  .select()
                  .eq('image_url', photoUrl)
                  .single();

                if (!existingPhoto) {
                  // Only insert if photo doesn't exist
                  const isNounish = localStorage.getItem('nounsFilterEnabled') === 'true';
                  const { error } = await supabase
                    .from('photos')
                    .insert({
                      user_id: user!.id,
                      image_url: photoUrl,
                      timestamp: new Date().toISOString(),
                      smile_score: smileScore,
                      is_nounish: isNounish,
                      smile_count: 0
                    });

                  if (error) {
                    console.error('Error saving to Supabase:', error);
                    setUploadStatus('Won tokens but failed to save photo');
                    setTimeout(() => setUploadStatus(''), 3000);
                  }
                }
              }

              setImages(prev => prev.map(img => {
                if (img.url === photoUrl) {
                  return {
                    ...img,
                    isLoading: false,
                    smileScore,
                    hasWon: hasWon,
                    isNounish: nounsFilterEnabled
                  };
                }
                return img;
              }));

              // If not a winning smile, remove it from the array after showing feedback
              if (!hasWon) {
                setTimeout(() => {
                  setImages(prev => prev.filter(img => img.url !== photoUrl));
                }, 3000);
              }

              // Updated feedback messages
              if (hasWon) {
                setUploadStatus(`🎉 Amazing smile! Score: ${smileScore}/5 - You won 0.001 SHM 🎊`);
              } else {
                let message;
                switch(smileScore) {
                  case 1:
                    message = `Come on, show us your teeth! Your smile score: ${smileScore}/5`;
                    break;
                  case 2:
                    message = `Almost there! Give us a bigger smile! Score: ${smileScore}/5`;
                    break;
                  case 3:
                    message = `So close! Just smile a bit more genuinely! Score: ${smileScore}/5`;
                    break;
                  default:
                    message = `Try again with a bigger smile! Score: ${smileScore}/5`;
                }
                setUploadStatus(`${message} `);
              }
              
              setTimeout(() => {
                setUploadStatus('');
                setLoading(false);
              }, 3000);
            }
          );
        }
      } catch (error) {
        console.error('Error initializing contract:', error);
        setUploadStatus('Failed to connect to Shardeum network');
        setTimeout(() => setUploadStatus(''), 3000);
      }
    };

    initContract();

    return () => {
      // Cleanup event listener
      if (contract) {
        contract.removeAllListeners("SmileScored");
      }
    };
  }, [authenticated, wallets]);

  useEffect(() => {
    if (nounsFilterEnabled && videoRef.current) {
      const video = videoRef.current;
      const overlay = document.createElement('div');
      overlay.id = 'nouns-overlay';
      overlay.innerHTML = NOUNS_SVG;
      overlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 10;
        width: 75%;
        height: 75%;
      `;

      // Add these styles to make the SVG more visible
      const svg = overlay.querySelector('svg');
      if (svg) {
        svg.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          height: auto;
        `;
      }
      
      video.parentElement?.appendChild(overlay);
      
      return () => {
        document.getElementById('nouns-overlay')?.remove();
      };
    }
  }, [nounsFilterEnabled]);

  const capturePhoto = async () => {
    setLoading(true);
    setUploadStatus('Capturing smile...');
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      setUploadStatus('Processing image...');
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.8);
      });
      
      const compressedBlob = await compressImage(blob);
      setUploadStatus('Keep smiling...');
      const uploadResult = await uploadImage(compressedBlob, user!.id, nounsFilterEnabled);
      
      if (!contract) {
        throw new Error('Smart contract not initialized');
      }

      // Verify network
      const provider = await wallets[0].getEthersProvider();
      const network = await provider.getNetwork();
      if (network.chainId !== SHARDEUM_CHAIN_ID) {
        throw new Error('Please switch to Shardeum network');
      }

      // Create new image object with loading state and isNounish
      const newImage: Image = {
        url: uploadResult.url,
        timestamp: new Date().toISOString(),
        isLoading: true,
        smileCount: 0,
        smileScore: undefined,
        hasWon: false,
        isNounish: nounsFilterEnabled
      };
      setImages(prev => [newImage, ...prev]);

      // Submit photo to contract for manual scoring
      const tx = await contract.submitSmilePhoto(uploadResult.url, {
        gasLimit: 300000
      });

      setUploadStatus('Your smile is being submitted on-chain... 😊');
      await tx.wait(1);
      
      setUploadStatus('Smile submitted! Waiting for manual review... 😊');
    } catch (error) {
      console.error('Error processing photo:', error);
      setUploadStatus(error.message || 'Failed to process photo');
      setTimeout(() => setUploadStatus(''), 3000);
      setLoading(false);
    }
  };

  const handleSmileBackLocal = async (imageUrl: string) => {
    try {
      await handleSmileBack(imageUrl);
      // Update the local state after successful smile back
      setImages(prev => prev.map(img => {
        if (img.url === imageUrl) {
          return {
            ...img,
            smileCount: img.smileCount + 1
          };
        }
        return img;
      }));
    } catch (error) {
      console.error('Error handling smile back:', error);
    }
  };

  const handleDeleteLocal = async (imageUrl: string, userId: string) => {
    try {
      await deletePhoto(imageUrl, userId);
      // Update the local state after successful deletion
      setImages(prev => prev.filter(img => img.url !== imageUrl));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const shimmerStyle = `
    relative
    overflow-hidden
    before:absolute
    before:inset-0
    before:-translate-x-full
    before:animate-[shimmer_2s_infinite]
    before:bg-gradient-to-r
    before:from-transparent
    before:via-white/60
    before:to-transparent
  `;

  const toggleNounsFilter = () => {
    const newValue = !nounsFilterEnabled;
    setNounsFilterEnabled(newValue);
    localStorage.setItem('nounsFilterEnabled', String(newValue));
  };

  return (
    <div className="bg-yellow-100 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-[1200px]">
        <div className="bg-[#FFE5E5] border-[3px] border-black rounded-lg p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 max-w-2xl mx-auto">
          <h1 className="text-4xl font-black text-center mb-6 transform -rotate-2">
            Hi, I'm Mr. Based Smiles 😁
          </h1>
          <h2 className="text-2xl font-bold text-center mb-6 transform rotate-1">
             Smile and I will give you 0.001 SHM on Shardeum!
          </h2>
          <p className="text-lg font-semibold text-center bg-[#90EE90] border-[3px] border-black rounded-md p-3 transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Immutable smile agent living on Shardeum, who loves big smiles!
          </p>
        </div>

        <div className="relative mb-6 max-w-[480px] mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-[360px] object-cover border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <Button
            onClick={toggleNounsFilter}
            className={`absolute top-4 right-4 bg-white hover:bg-gray-100 text-black font-bold px-4 py-2 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              nounsFilterEnabled ? 'bg-[#90EE90]' : ''
            }`}
          >
            {nounsFilterEnabled ? 'Feeling Nounish 🤓' : 'Feel Nounish?'}
          </Button>
        </div>
        <div className="text-center mb-8 flex justify-center gap-4">
          {authenticated && (
            <div className="text-center mb-8">
              <Button
                onClick={capturePhoto}
                disabled={loading}
                className="bg-[#90EE90] hover:bg-[#7CDF7C] text-black font-bold px-6 py-3 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Camera className="mr-2" />
                Capture Smile!
              </Button>
            </div>
          )}
          {authenticated ? (
            <div className="text-center mb-4">
              <Button
                onClick={logout}
                className="bg-[#FFB6C1] hover:bg-[#FF9CAE] text-black font-bold px-4 py-2 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <LogOut />
              </Button>
            </div>
          ) : (
            <div className="text-center mb-4">
              <Button
                onClick={login}
                className="bg-[#90EE90] hover:bg-[#7CDF7C] text-black font-bold px-6 py-3 border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Connect Wallet to Smile
              </Button>
            </div>
          )}
        </div>

        {authenticated && (
          <GoFundSmiles wallet={wallets[0]} />
        )}

        <ImageGrid 
          images={images}
          authenticated={authenticated}
          userId={user?.id}
          onSmileBack={handleSmileBackLocal}
          onDelete={handleDeleteLocal}
          shimmerStyle={shimmerStyle}
        />
      </div>

      {loading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-loading-overlay z-50">
          <Card className="p-8 bg-white">
            <div className="animate-bounce text-4xl mb-4">📸</div>
            <p className="font-bold">{uploadStatus}</p>
          </Card>
        </div>
      )}
    </div>
  );
};
export default App;
