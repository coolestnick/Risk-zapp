import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast, Toaster } from 'react-hot-toast';
import './App.css';

// Components
import ParticleBackground from './components/ParticleBackground';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DomainCard from './components/DomainCard';
import RegistrationModal from './components/RegistrationModal';
import AuctionModal from './components/AuctionModal';
import DomainManagement from './components/DomainManagement';
import Explore from './components/Explore';
import Marketplace from './components/Marketplace';
import ResolutionDemo from './components/ResolutionDemo';

// Contract configuration
import { CONTRACT_ADDRESS, CONTRACT_ABI, MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from './config';
import { resolveDomain, reverseResolve } from './utils/domainResolver';
import { createBlockchainDataService } from './utils/blockchainData';

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [marketplaceContract, setMarketplaceContract] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userDomains, setUserDomains] = useState([]);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [auctionModalMode, setAuctionModalMode] = useState('auction');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domainPrice, setDomainPrice] = useState(0);
  const [currentPage, setCurrentPage] = useState('home');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolvedDomain, setResolvedDomain] = useState('');
  const [showDomainManagement, setShowDomainManagement] = useState(false);
  const [selectedDomainForManagement, setSelectedDomainForManagement] = useState(null);
  const [blockchainService, setBlockchainService] = useState(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          connectWallet();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);

        // Setup provider and contract
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== 8080) {
          toast.error('Please connect to Shardeum Unstablenet');
          await switchToShardeum();
          return;
        }

        // Initialize contracts
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const marketplaceInstance = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
        
        setContract(contractInstance);
        setMarketplaceContract(marketplaceInstance);
        
        // Initialize blockchain service
        const service = createBlockchainDataService(provider, contractInstance, marketplaceInstance);
        setBlockchainService(service);
        
        // Load user's domains
        await loadUserDomains(contractInstance, accounts[0]);

        toast.success('Wallet connected!');

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());

      } catch (error) {
        console.error('Error connecting wallet:', error);
        toast.error('Failed to connect wallet');
      }
    } else {
      toast.error('Please install MetaMask!');
    }
  };

  const switchToShardeum = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1F90' }], // 8080 in hex
      });
    } catch (switchError) {
      // Chain not added, let's add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x1F90',
              chainName: 'Shardeum Unstablenet',
              nativeCurrency: {
                name: 'SHM',
                symbol: 'SHM',
                decimals: 18
              },
              rpcUrls: ['https://api-unstable.shardeum.org'],
              blockExplorerUrls: ['https://explorer-unstable.shardeum.org/']
            }],
          });
        } catch (addError) {
          console.error('Error adding Shardeum network:', addError);
          toast.error('Failed to add Shardeum network');
        }
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setContract(null);
      setUserDomains([]);
    } else {
      setAccount(accounts[0]);
      if (contract) {
        loadUserDomains(contract, accounts[0]);
      }
    }
  };

  const loadUserDomains = async (contractInstance, userAddress) => {
    try {
      const domains = await contractInstance.getUserDomains(userAddress);
      const domainDetails = await Promise.all(
        domains.map(async (name) => {
          const [owner, expiry, isForSale, price, isPremium] = await contractInstance.getDomain(name);
          
          // Load offer count if blockchain service is available
          let offerCount = 0;
          if (blockchainService) {
            try {
              const offers = await blockchainService.getOffersForDomain(name);
              offerCount = offers.length;
            } catch (offerError) {
              console.log(`Could not load offers for ${name}:`, offerError);
            }
          }
          
          return {
            name,
            owner,
            expiry: expiry.toNumber(),
            isForSale,
            price: ethers.utils.formatEther(price),
            isPremium,
            offerCount
          };
        })
      );
      setUserDomains(domainDetails);
    } catch (error) {
      console.error('Error loading user domains:', error);
    }
  };

  const checkAvailability = async (domainName) => {
    if (!contract) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const isAvailable = await contract.isAvailable(domainName);
      const price = await contract.calculatePrice(domainName);
      
      setSearchResult({
        name: domainName,
        available: isAvailable,
        price: ethers.utils.formatEther(price)
      });

      if (isAvailable) {
        setSelectedDomain(domainName);
        setDomainPrice(parseFloat(ethers.utils.formatEther(price)));
        setShowRegistrationModal(true);
      } else {
        toast.error(`${domainName}.shm is not available`);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Error checking domain availability');
    } finally {
      setIsLoading(false);
    }
  };

  const registerDomain = async (domainName, years) => {
    if (!contract) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const price = await contract.calculatePrice(domainName);
      const duration = years * 365 * 24 * 60 * 60; // Convert years to seconds
      
      const tx = await contract.register(domainName, duration, {
        value: price
      });

      toast.loading('Registering domain...');
      await tx.wait();
      
      toast.success(`Successfully registered ${domainName}.shm!`);
      setShowRegistrationModal(false);
      
      // Reload user domains
      await loadUserDomains(contract, account);
      
    } catch (error) {
      console.error('Error registering domain:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Failed to register domain');
      }
    }
  };

  const createAuction = async (domainName, startPrice, durationHours) => {
    if (!marketplaceContract || !contract) {
      toast.error('Contracts not initialized');
      return;
    }

    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      // Validate inputs
      if (!domainName || !startPrice || !durationHours) {
        toast.error('Please fill in all fields');
        return;
      }

      const startPriceNum = parseFloat(startPrice);
      const durationNum = parseFloat(durationHours);

      if (startPriceNum <= 0) {
        toast.error('Start price must be greater than 0');
        return;
      }

      if (durationNum < 1 || durationNum > 24 * 30) { // 1 hour to 30 days
        toast.error('Duration must be between 1 hour and 30 days (720 hours)');
        return;
      }

      // Check if user owns the domain
      console.log('Checking domain ownership for:', domainName);
      console.log('Registry contract address:', contract.address);
      console.log('Marketplace contract address:', marketplaceContract.address);
      console.log('User account:', account);
      
      // Verify marketplace is pointing to correct registry
      const registryFromMarketplace = await marketplaceContract.registryContract();
      console.log('Registry address from marketplace:', registryFromMarketplace);
      if (registryFromMarketplace.toLowerCase() !== contract.address.toLowerCase()) {
        toast.error('Marketplace contract is not connected to the correct registry');
        return;
      }
      
      const [domainOwner, expiry, isForSale, price, isPremium] = await contract.getDomain(domainName);
      console.log('Domain info:', {
        domainOwner,
        expiry: expiry.toNumber(),
        isForSale,
        price: ethers.utils.formatEther(price),
        isPremium
      });
      
      if (domainOwner.toLowerCase() !== account.toLowerCase()) {
        toast.error(`You don't own the domain ${domainName}.shm`);
        return;
      }

      // Check if domain is not expired
      const now = Math.floor(Date.now() / 1000);
      const expiryTime = expiry.toNumber();
      if (expiryTime < now) {
        toast.error('Cannot create auction for expired domain');
        return;
      }

      // Check if auction already exists
      console.log('Checking existing auction for:', domainName);
      try {
        const existingAuction = await marketplaceContract.auctions(domainName);
        if (existingAuction.active) {
          toast.error('An active auction already exists for this domain');
          return;
        }
      } catch (err) {
        console.log('No existing auction found, proceeding...');
      }

      const startPriceWei = ethers.utils.parseEther(startPrice.toString());
      const durationSeconds = Math.floor(durationHours * 3600);

      console.log('Creating auction with params:', {
        domainName,
        startPriceWei: startPriceWei.toString(),
        durationSeconds
      });

      // Check network and balance first
      const network = await provider.getNetwork();
      console.log('Current network:', network);
      
      const balance = await provider.getBalance(account);
      console.log('Account balance:', ethers.utils.formatEther(balance), 'SHM');
      
      if (balance.lt(ethers.utils.parseEther('0.001'))) {
        toast.error('Insufficient balance for gas fees');
        return;
      }

      // Estimate gas first
      let gasEstimate;
      try {
        console.log('Estimating gas for createAuction...');
        gasEstimate = await marketplaceContract.estimateGas.createAuction(
          domainName,
          startPriceWei,
          durationSeconds
        );
        console.log('Gas estimate successful:', gasEstimate.toString());
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        console.error('Full gas error:', JSON.stringify(gasError, null, 2));
        
        let errorMsg = 'Transaction would fail. ';
        if (gasError.reason) {
          errorMsg += gasError.reason;
        } else if (gasError.message) {
          errorMsg += gasError.message;
        } else {
          errorMsg += 'Please check domain ownership and auction requirements.';
        }
        toast.error(errorMsg);
        return;
      }

      const loadingToast = toast.loading('Creating auction...');
      
      const tx = await marketplaceContract.createAuction(
        domainName,
        startPriceWei,
        durationSeconds,
        {
          gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
        }
      );

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      
      toast.dismiss(loadingToast);
      toast.success(`Auction created for ${domainName}.shm!`);
      
      // Reload marketplace data
      if (marketplaceContract && contract && provider) {
        const blockchainService = createBlockchainDataService(provider, contract, marketplaceContract);
        setTimeout(() => {
          loadUserDomains(contract, account);
        }, 2000); // Wait 2 seconds for blockchain to update
      }
      
    } catch (error) {
      console.error('Error creating auction:', error);
      
      let errorMessage = 'Failed to create auction';
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.reason) {
        errorMessage = `Transaction failed: ${error.reason}`;
      } else if (error.message) {
        if (error.message.includes('Not domain owner')) {
          errorMessage = 'You do not own this domain';
        } else if (error.message.includes('Auction already active')) {
          errorMessage = 'An auction is already active for this domain';
        } else if (error.message.includes('Invalid start price')) {
          errorMessage = 'Invalid start price (must be > 0)';
        } else if (error.message.includes('Invalid duration')) {
          errorMessage = 'Invalid duration (must be 1 hour to 30 days)';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas fees';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const makeOffer = async (domainName, offerAmount, expiryDays) => {
    if (!marketplaceContract) {
      toast.error('Marketplace contract not initialized');
      return;
    }

    try {
      const offerAmountWei = ethers.utils.parseEther(offerAmount);
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 3600);
      
      console.log('🔄 Making offer:', {
        domain: domainName,
        amount: offerAmount,
        amountWei: offerAmountWei.toString(),
        expiryDays,
        expiryTimestamp,
        expiryDate: new Date(expiryTimestamp * 1000).toLocaleString(),
        contractAddress: marketplaceContract.address,
        fromAddress: account
      });
      
      const loadingToast = toast.loading('Making offer...');
      
      const tx = await marketplaceContract.makeOffer(
        domainName,
        expiryTimestamp,
        {
          value: offerAmountWei
        }
      );

      console.log('📝 Offer transaction sent:', {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.utils.formatEther(tx.value || '0')
      });
      
      const receipt = await tx.wait();
      console.log('✅ Offer transaction confirmed:', {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.events?.length || 0
      });
      
      // Log events to see if OfferMade event was emitted
      if (receipt.events && receipt.events.length > 0) {
        console.log('📊 Transaction events:');
        receipt.events.forEach((event, index) => {
          try {
            const parsed = marketplaceContract.interface.parseLog(event);
            console.log(`Event ${index}:`, {
              name: parsed.name,
              args: parsed.args
            });
            
            // Log detailed OfferMade event info
            if (parsed.name === 'OfferMade') {
              console.log('🎯 OfferMade event details:', {
                domainName: parsed.args[0] || parsed.args.name,
                buyer: parsed.args[1] || parsed.args.buyer,
                amount: parsed.args[2] ? ethers.utils.formatEther(parsed.args[2]) : 'N/A',
                expiry: parsed.args[3] ? new Date(parsed.args[3] * 1000).toLocaleString() : 'N/A'
              });
            }
          } catch (e) {
            console.log(`Event ${index} (unparsed):`, event);
          }
        });
      }
      
      toast.dismiss(loadingToast);
      toast.success(`Offer made for ${domainName}.shm! Amount: ${offerAmount} SHM`);
      
    } catch (error) {
      console.error('❌ Error making offer:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        data: error.data,
        reason: error.reason
      });
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction cancelled');
      } else if (error.reason) {
        toast.error(`Transaction failed: ${error.reason}`);
      } else {
        toast.error(`Failed to make offer: ${error.message}`);
      }
    }
  };

  const handleCreateAuction = (domainName) => {
    setSelectedDomain(domainName);
    setAuctionModalMode('auction');
    setShowAuctionModal(true);
  };

  const handleMakeOffer = (domainName) => {
    setSelectedDomain(domainName);
    setAuctionModalMode('offer');
    setShowAuctionModal(true);
  };

  const handleManageDomain = (domain) => {
    setSelectedDomainForManagement(domain);
    setShowDomainManagement(true);
  };

  const handleOfferAccepted = async (domain, offer) => {
    // Refresh user domains after an offer is accepted
    if (contract && account) {
      await loadUserDomains(contract, account);
    }
    toast.success(`Domain ${domain.name}.shm sold for ${offer.amount} SHM!`);
  };

  // Domain resolution utilities
  const handleDomainResolution = async (input) => {
    if (!provider || !input.trim()) {
      setResolvedAddress('');
      setResolvedDomain('');
      return;
    }

    try {
      if (ethers.utils.isAddress(input)) {
        // Reverse resolution: address to domain
        const domain = await reverseResolve(input, provider);
        setResolvedDomain(domain || '');
        setResolvedAddress(input);
      } else if (input.endsWith('.shm') || (!input.startsWith('0x') && input.length > 0)) {
        // Forward resolution: domain to address
        const address = await resolveDomain(input, provider);
        setResolvedAddress(address);
        setResolvedDomain(input.endsWith('.shm') ? input : `${input}.shm`);
      }
    } catch (error) {
      console.error('Resolution error:', error);
      setResolvedAddress('');
      setResolvedDomain('');
      toast.error('Failed to resolve domain/address');
    }
  };

  // Utility function to resolve input for transactions
  const resolveInputToAddress = async (input) => {
    if (!input) return null;
    
    // If it's already an address, return it
    if (ethers.utils.isAddress(input)) {
      return input;
    }
    
    // If it's a domain, resolve it
    try {
      const address = await resolveDomain(input, provider);
      return address;
    } catch (error) {
      console.error('Failed to resolve domain to address:', error);
      throw new Error(`Could not resolve ${input} to an address`);
    }
  };

  return (
    <div className="App">
      <ParticleBackground />
      <Navbar 
        account={account} 
        connectWallet={connectWallet} 
        userDomains={userDomains}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      
      <main>
        {currentPage === 'home' && (
          <>
            <Hero 
              checkAvailability={checkAvailability}
              isLoading={isLoading}
              userDomains={userDomains}
              account={account}
            />

            {/* User Domains Section */}
            {userDomains.length > 0 && (
              <section id="my-domains" className="user-domains-section">
                <div className="container">
                  <h2 className="section-title">My Domains</h2>
                  <div className="domains-grid">
                    {userDomains.map((domain) => (
                      <DomainCard
                        key={domain.name}
                        domain={domain}
                        isOwned={true}
                        onClick={() => handleManageDomain(domain)}
                        onCreateAuction={handleCreateAuction}
                        offerCount={domain.offerCount || 0}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {currentPage === 'explore' && (
          <Explore
            account={account}
            contract={contract}
            checkAvailability={checkAvailability}
            onRegister={(domain) => {
              setSelectedDomain(domain);
              checkAvailability(domain);
            }}
            onMakeOffer={handleMakeOffer}
          />
        )}

        {currentPage === 'marketplace' && (
          <Marketplace
            account={account}
            marketplaceContract={marketplaceContract}
            contract={contract}
            provider={provider}
            onMakeOffer={handleMakeOffer}
            onPlaceBid={(domain) => {
              toast(`Bidding on ${domain}.shm coming soon!`, {
                icon: '🔨',
              });
            }}
            onViewDomainDetails={handleManageDomain}
          />
        )}

        {currentPage === 'resolution' && (
          <ResolutionDemo
            provider={provider}
            userDomains={userDomains}
          />
        )}
      </main>

      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        domain={selectedDomain}
        price={domainPrice}
        onRegister={registerDomain}
      />

      <AuctionModal
        isOpen={showAuctionModal}
        onClose={() => setShowAuctionModal(false)}
        domain={selectedDomain}
        mode={auctionModalMode}
        onCreateAuction={createAuction}
        onMakeOffer={makeOffer}
      />

      <DomainManagement
        isOpen={showDomainManagement}
        onClose={() => setShowDomainManagement(false)}
        domain={selectedDomainForManagement}
        account={account}
        marketplaceContract={marketplaceContract}
        blockchainService={blockchainService}
        onOfferAccepted={handleOfferAccepted}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1f',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
    </div>
  );
}

export default App;