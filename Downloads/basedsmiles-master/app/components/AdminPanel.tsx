"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Check, X, RefreshCw } from "lucide-react";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fmmiqlflfguqimxejeyf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlxbGZsZmd1cWlteGVqZXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Mjk5OTUsImV4cCI6MjA3MjUwNTk5NX0.LPvZKIv3vPv--x19ybIXEUWHdYs_VDuyAXacZqv3WPg';

const supabase = createClient(supabaseUrl, supabaseKey);

const CONTRACT_ADDRESS = "0x766FCCd9BEA80F35A4aE34913aDd8ee825ECbEeA";
const CONTRACT_ABI = [
  "function scoreSmile(string memory photoUrl, uint8 score) external",
  "function getSmileScore(string memory photoUrl) external view returns (uint8)",
  "function owner() external view returns (address)",
  "event SmileSubmitted(string photoUrl, address indexed submitter)",
  "event SmileScored(string photoUrl, uint8 smileScore, address indexed submitter, bool rewarded)"
];

interface PendingPhoto {
  id: string;
  photoUrl: string;
  submitter: string;
  timestamp: string;
  blockNumber: number;
  currentScore: number;
  isProcessed: boolean;
}

const AdminPanel = () => {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoringPhoto, setScoringPhoto] = useState<string | null>(null);

  // Initialize contract and check ownership
  useEffect(() => {
    const initContract = async () => {
      if (!authenticated || wallets.length === 0) return;
      
      try {
        const wallet = wallets[0];
        const provider = await wallet.getEthersProvider();
        const signer = provider.getSigner();
        
        const smileContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        
        setContract(smileContract);
        
        // Check if current user is owner
        const ownerAddress = await smileContract.owner();
        const userAddress = await signer.getAddress();
        setIsOwner(ownerAddress.toLowerCase() === userAddress.toLowerCase());
        
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };

    initContract();
  }, [authenticated, wallets]);

  // Fetch pending photos from blockchain events
  const fetchPendingPhotos = async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const provider = contract.provider;
      
      // Get SmileSubmitted events
      const filter = contract.filters.SmileSubmitted();
      const events = await contract.queryFilter(filter, -10000); // Last 10k blocks
      
      const photos: PendingPhoto[] = [];
      
      for (const event of events.reverse()) { // Newest first
        if (event.args) {
          const photoUrl = event.args.photoUrl;
          const submitter = event.args.submitter;
          
          // Check if already scored
          const currentScore = await contract.getSmileScore(photoUrl);
          const isProcessed = currentScore > 0;
          
          const block = await provider.getBlock(event.blockNumber);
          
          photos.push({
            id: `${event.transactionHash}-${event.logIndex}`,
            photoUrl,
            submitter,
            timestamp: new Date(block.timestamp * 1000).toLocaleString(),
            blockNumber: event.blockNumber,
            currentScore,
            isProcessed
          });
        }
      }
      
      setPendingPhotos(photos);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Score a photo
  const scorePhoto = async (photoUrl: string, score: number) => {
    if (!contract || !isOwner) return;
    
    setScoringPhoto(photoUrl);
    try {
      const tx = await contract.scoreSmile(photoUrl, score, {
        gasLimit: 300000
      });
      
      await tx.wait();
      
      // Refresh the list
      await fetchPendingPhotos();
      
    } catch (error) {
      console.error('Error scoring photo:', error);
      alert('Failed to score photo. Check console for details.');
    } finally {
      setScoringPhoto(null);
    }
  };

  // Load photos on mount
  useEffect(() => {
    if (contract && isOwner) {
      fetchPendingPhotos();
    }
  }, [contract, isOwner]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
          <p className="mb-4">Please connect your wallet to access the admin panel.</p>
        </Card>
      </div>
    );
  }

  if (!isOwner && !loading) {
    return (
      <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h2>
          <p className="mb-4">You are not the contract owner.</p>
          <p className="text-sm text-gray-600">Only the contract owner can access this admin panel.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="bg-[#FFE5E5] border-[3px] border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black">Admin Panel 👨‍⚖️</h1>
              <p className="text-lg font-semibold">Score submitted smiles manually</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchPendingPhotos}
                disabled={loading}
                className="bg-[#90EE90] hover:bg-[#7CDF7C] text-black font-bold border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-500" />
              <div>
                <p className="font-bold text-lg">{pendingPhotos.filter(p => !p.isProcessed).length}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Check className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-bold text-lg">{pendingPhotos.filter(p => p.isProcessed).length}</p>
                <p className="text-sm text-gray-600">Processed</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="font-bold text-lg">{pendingPhotos.filter(p => p.currentScore > 3).length}</p>
                <p className="text-sm text-gray-600">Winners (Score > 3)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold">Loading photos...</p>
          </div>
        ) : pendingPhotos.length === 0 ? (
          <Card className="p-12 text-center border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xl font-semibold mb-2">No photos submitted yet</p>
            <p className="text-gray-600">Photos will appear here when users submit smiles</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingPhotos.map((photo) => (
              <Card key={photo.id} className="border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                {/* Photo */}
                <div className="aspect-square bg-gray-100">
                  <img 
                    src={photo.photoUrl} 
                    alt="Submitted smile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-smile.png';
                    }}
                  />
                </div>
                
                {/* Photo Info */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant={photo.isProcessed ? "default" : "secondary"}>
                      {photo.isProcessed ? `Scored: ${photo.currentScore}/5` : 'Pending'}
                    </Badge>
                    {photo.currentScore > 3 && (
                      <Badge className="bg-green-100 text-green-800">
                        Winner! 🎉
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">
                    Submitter: {photo.submitter.slice(0, 8)}...{photo.submitter.slice(-6)}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Submitted: {photo.timestamp}
                  </p>
                  
                  {/* Scoring Interface */}
                  {!photo.isProcessed && (
                    <div>
                      <p className="font-semibold mb-2">Score this smile:</p>
                      <div className="flex gap-1 justify-center">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <Button
                            key={score}
                            onClick={() => scorePhoto(photo.photoUrl, score)}
                            disabled={scoringPhoto === photo.photoUrl}
                            className={`
                              w-12 h-12 border-2 border-black font-bold
                              ${score <= 3 
                                ? 'bg-red-200 hover:bg-red-300' 
                                : 'bg-green-200 hover:bg-green-300'
                              }
                              ${scoringPhoto === photo.photoUrl ? 'opacity-50' : ''}
                            `}
                          >
                            {scoringPhoto === photo.photoUrl ? '...' : score}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        1-3: No reward | 4-5: Earns 0.001 SHM
                      </p>
                    </div>
                  )}
                  
                  {/* Already Processed */}
                  {photo.isProcessed && (
                    <div className="text-center">
                      <div className="flex justify-center items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <Star
                            key={score}
                            className={`h-6 w-6 ${
                              score <= photo.currentScore
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <Badge className={photo.currentScore > 3 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {photo.currentScore > 3 ? 'Rewarded with SHM!' : 'No reward'}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;