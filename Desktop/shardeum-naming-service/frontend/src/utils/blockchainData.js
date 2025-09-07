import { ethers } from 'ethers';

/**
 * Utility class for fetching real blockchain data from smart contracts
 */
export class BlockchainDataService {
  constructor(provider, registryContract, marketplaceContract) {
    this.provider = provider;
    this.registryContract = registryContract;
    this.marketplaceContract = marketplaceContract;
  }

  /**
   * Fetch real recent sales from blockchain events
   */
  async getRecentSales() {
    const sales = [];
    
    try {
      // Get recent blocks to search for events (last 1000 blocks)
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      // Fetch domain sold events from registry contract
      const domainSoldEvents = await this.registryContract.queryFilter(
        this.registryContract.filters.DomainSold(),
        fromBlock,
        currentBlock
      );

      for (const event of domainSoldEvents) {
        const block = await this.provider.getBlock(event.blockNumber);
        sales.push({
          domain: event.args.name,
          price: parseFloat(ethers.utils.formatEther(event.args.price)),
          seller: event.args.from,
          buyer: event.args.to,
          timestamp: block.timestamp * 1000,
          type: 'sale',
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }

      // Fetch auction ended events from marketplace contract
      if (this.marketplaceContract) {
        const auctionEndedEvents = await this.marketplaceContract.queryFilter(
          this.marketplaceContract.filters.AuctionEnded(),
          fromBlock,
          currentBlock
        );

        for (const event of auctionEndedEvents) {
          const block = await this.provider.getBlock(event.blockNumber);
          sales.push({
            domain: event.args.name,
            price: parseFloat(ethers.utils.formatEther(event.args.amount)),
            seller: 'Unknown', // Will be resolved from auction data
            buyer: event.args.winner,
            timestamp: block.timestamp * 1000,
            type: 'auction',
            txHash: event.transactionHash,
            blockNumber: event.blockNumber
          });
        }

        // Fetch offer accepted events
        const offerAcceptedEvents = await this.marketplaceContract.queryFilter(
          this.marketplaceContract.filters.OfferAccepted(),
          fromBlock,
          currentBlock
        );

        for (const event of offerAcceptedEvents) {
          const block = await this.provider.getBlock(event.blockNumber);
          sales.push({
            domain: event.args.name,
            price: parseFloat(ethers.utils.formatEther(event.args.amount)),
            seller: event.args.seller,
            buyer: event.args.buyer,
            timestamp: block.timestamp * 1000,
            type: 'offer',
            txHash: event.transactionHash,
            blockNumber: event.blockNumber
          });
        }
      }

      // Sort by timestamp (most recent first)
      sales.sort((a, b) => b.timestamp - a.timestamp);
      
      return sales.slice(0, 20); // Return last 20 sales
    } catch (error) {
      console.error('Error fetching recent sales:', error);
      return [];
    }
  }

  /**
   * Fetch domain transfer history
   */
  async getDomainTransferHistory(domainName) {
    const transfers = [];
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 5000); // Search more blocks for complete history

      // Fetch domain transferred events
      const transferEvents = await this.registryContract.queryFilter(
        this.registryContract.filters.DomainTransferred(domainName),
        fromBlock,
        currentBlock
      );

      for (const event of transferEvents) {
        const block = await this.provider.getBlock(event.blockNumber);
        const tx = await this.provider.getTransaction(event.transactionHash);
        
        transfers.push({
          domain: event.args.name,
          from: event.args.from,
          to: event.args.to,
          timestamp: block.timestamp * 1000,
          txHash: event.transactionHash,
          gasUsed: tx.gasLimit.toString(),
          blockNumber: event.blockNumber
        });
      }

      // Also fetch domain registered events for this domain
      const registeredEvents = await this.registryContract.queryFilter(
        this.registryContract.filters.DomainRegistered(domainName),
        fromBlock,
        currentBlock
      );

      for (const event of registeredEvents) {
        const block = await this.provider.getBlock(event.blockNumber);
        const tx = await this.provider.getTransaction(event.transactionHash);
        
        transfers.push({
          domain: event.args.name,
          from: ethers.constants.AddressZero,
          to: event.args.owner,
          timestamp: block.timestamp * 1000,
          txHash: event.transactionHash,
          gasUsed: tx.gasLimit.toString(),
          blockNumber: event.blockNumber,
          type: 'registration',
          expiry: event.args.expiry.toNumber() * 1000
        });
      }

      return transfers.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching transfer history:', error);
      return [];
    }
  }

  /**
   * Get all domains owned by an address
   */
  async getDomainsByOwner(ownerAddress) {
    try {
      const domains = await this.registryContract.getUserDomains(ownerAddress);
      const domainDetails = [];

      for (const domainName of domains) {
        try {
          const [owner, expiry, isForSale, price, isPremium] = await this.registryContract.getDomain(domainName);
          
          // Check if domain is expired
          const now = Math.floor(Date.now() / 1000);
          const isExpired = expiry.toNumber() < now;
          
          if (!isExpired && owner.toLowerCase() === ownerAddress.toLowerCase()) {
            domainDetails.push({
              name: domainName,
              owner,
              expiry: expiry.toNumber() * 1000,
              isForSale,
              price: parseFloat(ethers.utils.formatEther(price)),
              isPremium,
              isExpired
            });
          }
        } catch (err) {
          console.log(`Error fetching details for domain ${domainName}:`, err);
          continue;
        }
      }

      return domainDetails;
    } catch (error) {
      console.error('Error fetching domains by owner:', error);
      return [];
    }
  }

  /**
   * Get active auctions with real data
   */
  async getActiveAuctions() {
    const auctions = [];
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      console.log(`Current block: ${currentBlock}`);
      
      // Try multiple approaches to find events
      let auctionCreatedEvents = [];
      
      // Approach 1: Try very recent blocks first (last 5000 blocks - expanded)
      console.log(`🔍 Approach 1: Searching recent blocks (${Math.max(0, currentBlock - 5000)} to ${currentBlock})`);
      try {
        auctionCreatedEvents = await this.marketplaceContract.queryFilter(
          this.marketplaceContract.filters.AuctionCreated(),
          Math.max(0, currentBlock - 5000),
          currentBlock
        );
        console.log(`Found ${auctionCreatedEvents.length} events in recent blocks`);
      } catch (error) {
        console.log('Recent blocks search failed:', error.message);
      }
      
      // Approach 2: If not many events, try wider range (expand to 50k blocks)
      if (auctionCreatedEvents.length < 5) {
        console.log(`🔍 Approach 2: Searching wider range (${Math.max(0, currentBlock - 50000)} to ${currentBlock})`);
        try {
          const widerEvents = await this.marketplaceContract.queryFilter(
            this.marketplaceContract.filters.AuctionCreated(),
            Math.max(0, currentBlock - 50000),
            currentBlock
          );
          console.log(`Found ${widerEvents.length} events in wider range`);
          if (widerEvents.length > auctionCreatedEvents.length) {
            auctionCreatedEvents = widerEvents;
          }
        } catch (error) {
          console.log('Wider range search failed:', error.message);
        }
      }
      
      // Approach 3: If still no events, try from genesis (full search)
      if (auctionCreatedEvents.length === 0) {
        console.log(`🔍 Approach 3: Searching from genesis (full blockchain)`);
        try {
          auctionCreatedEvents = await this.marketplaceContract.queryFilter(
            this.marketplaceContract.filters.AuctionCreated()
          );
          console.log(`Found ${auctionCreatedEvents.length} events from genesis`);
        } catch (error) {
          console.log('Full search failed:', error.message);
        }
      }
      
      // Approach 4: If still no events, try using direct contract calls to check for auctions
      if (auctionCreatedEvents.length === 0) {
        console.log(`🔍 Approach 4: Checking contracts directly for common domain names`);
        const commonDomains = [
          'test', 'demo', 'hello', 'world', 'name', 'domain', 
          'nick', 'nikhil', 'nikkhil', 'example', 'sample', 'cool', 'awesome', 
          'best', 'top', 'great', 'super'
        ];
        
        for (const domainName of commonDomains) {
          try {
            const auctionData = await this.marketplaceContract.auctions(domainName);
            console.log(`Checking domain ${domainName}:`, {
              active: auctionData.active,
              seller: auctionData.seller,
              name: auctionData.name
            });
            
            if (auctionData.active) {
              console.log(`✅ Found active auction via direct call: ${domainName}`);
              // Create a mock event for this auction
              auctions.push({
                name: domainName,
                seller: auctionData.seller,
                startPrice: parseFloat(ethers.utils.formatEther(auctionData.startPrice)),
                currentBid: parseFloat(ethers.utils.formatEther(auctionData.currentBid)),
                highestBidder: auctionData.highestBidder,
                endTime: auctionData.endTime.toNumber() * 1000,
                active: auctionData.active,
                createdAt: Date.now() - 60000, // Assume created 1 minute ago
                txHash: 'direct-call'
              });
            }
          } catch (error) {
            // Domain doesn't have an auction, continue
            console.log(`No auction for ${domainName}`);
          }
        }
        
        if (auctions.length > 0) {
          console.log(`✅ Found ${auctions.length} auctions via direct contract calls`);
          return auctions;
        }
      }

      console.log(`Found ${auctionCreatedEvents.length} auction creation events`);
      
      // Log all events for debugging
      auctionCreatedEvents.forEach((event, index) => {
        console.log(`Event ${index + 1}:`, {
          domain: event.args.name,
          startPrice: ethers.utils.formatEther(event.args.startPrice),
          endTime: new Date(event.args.endTime.toNumber() * 1000).toLocaleString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      });

      const now = Math.floor(Date.now() / 1000);
      const processedAuctions = new Set(); // To avoid duplicates

      for (const event of auctionCreatedEvents) {
        // Handle indexed parameters - they come as hash objects, need to decode properly
        let domainName;
        try {
          // Since the domain name is indexed, we need to get it from transaction data
          const tx = await this.provider.getTransaction(event.transactionHash);
          const receipt = await this.provider.getTransactionReceipt(event.transactionHash);
          
          // Parse the transaction input to get the domain name
          const iface = this.marketplaceContract.interface;
          const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
          
          if (decoded && decoded.args) {
            domainName = decoded.args[0]; // First argument is the domain name
            console.log(`✅ Decoded domain name: ${domainName} from tx ${event.transactionHash}`);
          } else {
            console.warn(`❌ Could not decode domain name from tx ${event.transactionHash}`);
            continue;
          }
        } catch (decodeError) {
          console.error('Error decoding domain name:', decodeError);
          continue;
        }
        
        // Skip if we already processed this auction
        if (processedAuctions.has(domainName)) {
          continue;
        }
        
        try {
          // Get current auction state from contract
          const auction = await this.marketplaceContract.auctions(domainName);
          
          console.log(`Auction state for ${domainName}:`, {
            name: auction.name,
            seller: auction.seller,
            startPrice: ethers.utils.formatEther(auction.startPrice),
            currentBid: ethers.utils.formatEther(auction.currentBid),
            highestBidder: auction.highestBidder,
            endTime: auction.endTime.toNumber(),
            endTimeDate: new Date(auction.endTime.toNumber() * 1000).toLocaleString(),
            active: auction.active,
            currentTime: now,
            currentTimeDate: new Date(now * 1000).toLocaleString(),
            isStillActive: auction.endTime.toNumber() > now
          });
          
          // Only include active auctions that haven't ended
          if (auction.active && auction.endTime.toNumber() > now) {
            const block = await this.provider.getBlock(event.blockNumber);
            
            auctions.push({
              name: domainName,
              seller: auction.seller,
              startPrice: parseFloat(ethers.utils.formatEther(auction.startPrice)),
              currentBid: parseFloat(ethers.utils.formatEther(auction.currentBid)),
              highestBidder: auction.highestBidder,
              endTime: auction.endTime.toNumber() * 1000,
              active: auction.active,
              createdAt: block.timestamp * 1000,
              txHash: event.transactionHash
            });
            
            processedAuctions.add(domainName);
            console.log(`✅ Added active auction: ${domainName}`);
          } else if (!auction.active) {
            console.log(`❌ Auction ${domainName} is not active (active=${auction.active})`);
          } else if (auction.endTime.toNumber() <= now) {
            console.log(`❌ Auction ${domainName} has ended (endTime: ${auction.endTime.toNumber()}, now: ${now})`);
          } else {
            console.log(`❌ Auction ${domainName} failed other checks`);
          }
        } catch (err) {
          console.error(`Error fetching auction data for ${domainName}:`, err);
          continue;
        }
      }

      console.log(`🎯 Total active auctions found: ${auctions.length}`);
      
      // Get current blockchain time for accurate time calculations
      const latestBlock = await this.provider.getBlock('latest');
      const currentBlockchainTime = latestBlock.timestamp;
      
      console.log('⏰ Time debugging:');
      console.log('- Blockchain time (seconds):', currentBlockchainTime);
      console.log('- Blockchain time (date):', new Date(currentBlockchainTime * 1000).toLocaleString());
      console.log('- JavaScript time (ms):', Date.now());
      console.log('- JavaScript time (date):', new Date().toLocaleString());
      
      // Add blockchain time to each auction for accurate time display
      const auctionsWithBlockchainTime = auctions.map(auction => {
        const timeLeft = auction.endTime - (currentBlockchainTime * 1000);
        console.log(`⏰ Auction ${auction.name}:`, {
          endTime: auction.endTime,
          endTimeDate: new Date(auction.endTime).toLocaleString(),
          blockchainTime: currentBlockchainTime * 1000,
          blockchainTimeDate: new Date(currentBlockchainTime * 1000).toLocaleString(),
          timeLeftMs: timeLeft,
          timeLeftHours: timeLeft / (1000 * 60 * 60)
        });
        return {
          ...auction,
          currentBlockchainTime
        };
      });
      
      // Always return what we found, don't use fallback unless we have an error
      return auctionsWithBlockchainTime.sort((a, b) => a.endTime - b.endTime); // Sort by ending soonest first
    } catch (error) {
      console.error('Error fetching active auctions:', error);
      // Try fallback approach if main method fails
      try {
        console.log('Main method failed, trying fallback...');
        return await this.getActiveAuctionsFallback();
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Test function to directly check a specific auction
   */
  async testAuction(domainName) {
    try {
      console.log(`🧪 Testing auction for domain: ${domainName}`);
      
      // Get current blockchain time
      const currentBlock = await this.provider.getBlock('latest');
      const currentTime = currentBlock.timestamp;
      console.log('Current blockchain time:', {
        timestamp: currentTime,
        date: new Date(currentTime * 1000).toLocaleString()
      });
      
      // Check if auction exists in contract
      const auction = await this.marketplaceContract.auctions(domainName);
      const endTime = auction.endTime.toNumber();
      const timeUntilEnd = endTime - currentTime;
      
      console.log('Direct auction query result:', {
        name: auction.name,
        seller: auction.seller,
        startPrice: ethers.utils.formatEther(auction.startPrice),
        currentBid: ethers.utils.formatEther(auction.currentBid),
        highestBidder: auction.highestBidder,
        endTime: endTime,
        endTimeDate: new Date(endTime * 1000).toLocaleString(),
        active: auction.active,
        currentTime: currentTime,
        timeUntilEnd: timeUntilEnd,
        timeUntilEndHours: timeUntilEnd / 3600,
        hasEnded: endTime <= currentTime,
        shouldBeActive: endTime > currentTime
      });
      
      // Search for creation event
      const creationEvents = await this.marketplaceContract.queryFilter(
        this.marketplaceContract.filters.AuctionCreated(domainName)
      );
      console.log(`Found ${creationEvents.length} creation events for ${domainName}`);
      creationEvents.forEach((event, i) => {
        console.log(`Creation Event ${i + 1}:`, {
          domain: event.args.name,
          startPrice: ethers.utils.formatEther(event.args.startPrice),
          endTime: event.args.endTime.toNumber(),
          endTimeDate: new Date(event.args.endTime.toNumber() * 1000).toLocaleString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      });

      // Search for auction ended events
      const endedEvents = await this.marketplaceContract.queryFilter(
        this.marketplaceContract.filters.AuctionEnded(domainName)
      );
      console.log(`Found ${endedEvents.length} auction ended events for ${domainName}`);
      endedEvents.forEach((event, i) => {
        console.log(`Ended Event ${i + 1}:`, {
          domain: event.args.name,
          winner: event.args.winner,
          amount: ethers.utils.formatEther(event.args.amount),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      });

      // Analyze the issue
      console.log('\n🔍 ANALYSIS:');
      if (auction.active === false && endedEvents.length === 0) {
        console.log('❌ ISSUE FOUND: Auction is inactive but no AuctionEnded event found!');
        console.log('This suggests the auction was never properly activated or there\'s a smart contract issue.');
      } else if (auction.active === false && endedEvents.length > 0) {
        console.log('✅ Auction ended normally via endAuction() function');
      } else if (auction.active === true) {
        console.log('✅ Auction is active and should appear in the UI');
      }
      
      return { auction, creationEvents, endedEvents };
    } catch (error) {
      console.error(`Error testing auction for ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Test all found auction creation events
   */
  async testAllAuctions() {
    try {
      console.log('🧪 Testing all auction creation events...');
      
      // Get all auction creation events
      const events = await this.marketplaceContract.queryFilter(
        this.marketplaceContract.filters.AuctionCreated()
      );
      
      console.log(`Found ${events.length} auction creation events total`);
      
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const domainName = event.args.name;
        console.log(`\n--- Testing Auction ${i + 1}: ${domainName} ---`);
        await this.testAuction(domainName);
      }
      
      return events;
    } catch (error) {
      console.error('Error testing all auctions:', error);
      throw error;
    }
  }

  /**
   * Fallback method to get active auctions by searching from genesis block
   */
  async getActiveAuctionsFallback() {
    const auctions = [];
    
    try {
      console.log('Using fallback method to search for auctions...');
      
      // Search from genesis block (block 0) for all auction events
      const auctionCreatedEvents = await this.marketplaceContract.queryFilter(
        this.marketplaceContract.filters.AuctionCreated()
        // No fromBlock/toBlock parameters = search all blocks
      );

      console.log(`Fallback: Found ${auctionCreatedEvents.length} total auction creation events`);

      const now = Math.floor(Date.now() / 1000);
      const processedAuctions = new Set();

      for (const event of auctionCreatedEvents) {
        // Handle indexed parameters - decode from transaction data
        let domainName;
        try {
          const tx = await this.provider.getTransaction(event.transactionHash);
          const iface = this.marketplaceContract.interface;
          const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
          
          if (decoded && decoded.args && decoded.args.name) {
            domainName = decoded.args.name;
            console.log(`Fallback: ✅ Decoded domain name: ${domainName}`);
          } else {
            console.warn(`Fallback: ❌ Could not decode domain name from tx ${event.transactionHash}`);
            continue;
          }
        } catch (decodeError) {
          console.error('Fallback: Error decoding domain name:', decodeError);
          continue;
        }
        
        if (processedAuctions.has(domainName)) {
          continue;
        }
        
        try {
          const auction = await this.marketplaceContract.auctions(domainName);
          
          if (auction.active && auction.endTime.toNumber() > now) {
            const block = await this.provider.getBlock(event.blockNumber);
            
            auctions.push({
              name: domainName,
              seller: auction.seller,
              startPrice: parseFloat(ethers.utils.formatEther(auction.startPrice)),
              currentBid: parseFloat(ethers.utils.formatEther(auction.currentBid)),
              highestBidder: auction.highestBidder,
              endTime: auction.endTime.toNumber() * 1000,
              active: auction.active,
              createdAt: block.timestamp * 1000,
              txHash: event.transactionHash
            });
            
            processedAuctions.add(domainName);
            console.log(`Fallback: Added active auction: ${domainName}`);
          }
        } catch (err) {
          console.error(`Fallback: Error fetching auction data for ${domainName}:`, err);
          continue;
        }
      }

      console.log(`Fallback: Total active auctions found: ${auctions.length}`);
      
      // Get current blockchain time for accurate time calculations
      const latestBlock = await this.provider.getBlock('latest');
      const currentBlockchainTime = latestBlock.timestamp;
      
      // Add blockchain time to each auction for accurate time display
      const auctionsWithBlockchainTime = auctions.map(auction => ({
        ...auction,
        currentBlockchainTime
      }));
      
      return auctionsWithBlockchainTime.sort((a, b) => a.endTime - b.endTime);
    } catch (error) {
      console.error('Fallback method failed:', error);
      return [];
    }
  }

  /**
   * Get trading statistics from blockchain data
   */
  async getTradingStats() {
    try {
      const recentSales = await this.getRecentSales();
      const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
      const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);

      const salesLast24h = recentSales.filter(sale => sale.timestamp > last24Hours);
      const salesLast7Days = recentSales.filter(sale => sale.timestamp > last7Days);

      const volume24h = salesLast24h.reduce((total, sale) => total + sale.price, 0);
      const volume7d = salesLast7Days.reduce((total, sale) => total + sale.price, 0);
      
      const avgPrice24h = salesLast24h.length > 0 ? volume24h / salesLast24h.length : 0;
      const avgPrice7d = salesLast7Days.length > 0 ? volume7d / salesLast7Days.length : 0;

      // Find highest sale in last 7 days
      const topSale = salesLast7Days.reduce((max, sale) => 
        sale.price > max.price ? sale : max, 
        { price: 0, domain: 'none' }
      );

      return {
        volume24h: volume24h.toFixed(2),
        volume7d: volume7d.toFixed(2),
        avgPrice24h: avgPrice24h.toFixed(2),
        avgPrice7d: avgPrice7d.toFixed(2),
        salesCount24h: salesLast24h.length,
        salesCount7d: salesLast7Days.length,
        topSale: {
          domain: topSale.domain,
          price: topSale.price.toFixed(2)
        },
        totalSales: recentSales.length
      };
    } catch (error) {
      console.error('Error calculating trading stats:', error);
      return {
        volume24h: '0',
        volume7d: '0',
        avgPrice24h: '0',
        avgPrice7d: '0',
        salesCount24h: 0,
        salesCount7d: 0,
        topSale: { domain: 'none', price: '0' },
        totalSales: 0
      };
    }
  }

  /**
   * Get all offers for a specific domain
   */
  async getOffersForDomain(domainName) {
    try {
      console.log(`📋 Fetching offers for domain: ${domainName}`);
      
      // Try to get offers from contract if the function exists
      try {
        const offers = await this.marketplaceContract.getOffers(domainName);
        console.log(`Found ${offers.length} total offers from contract for ${domainName}`);
        
        // Filter active offers and add additional info
        const activeOffers = [];
        const now = Math.floor(Date.now() / 1000);
        
        for (let i = 0; i < offers.length; i++) {
          const offer = offers[i];
          
          if (offer.active && offer.expiry.toNumber() > now) {
            activeOffers.push({
              index: i,
              buyer: offer.buyer,
              amount: parseFloat(ethers.utils.formatEther(offer.amount)),
              expiry: offer.expiry.toNumber() * 1000,
              active: offer.active,
              timeLeft: offer.expiry.toNumber() - now
            });
          }
        }
        
        console.log(`✅ Found ${activeOffers.length} active offers for ${domainName}`);
        return activeOffers.sort((a, b) => b.amount - a.amount);
        
      } catch (contractError) {
        console.log('getOffers function not available, falling back to events:', contractError.message);
        
        // Fallback: Use events to reconstruct offers
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000); // Look back 10000 blocks
        
        // Get all OfferMade events for this domain
        // Since domain name is indexed, we'll get ALL events and filter manually
        const offerMadeFilter = {
          address: this.marketplaceContract.address,
          topics: [
            ethers.utils.id("OfferMade(string,address,uint256,uint256)"),
            // Remove domain-specific filtering to get all events
          ]
        };
        
        const allOfferMadeEvents = await this.provider.getLogs({
          ...offerMadeFilter,
          fromBlock,
          toBlock: currentBlock
        });
        
        console.log(`📋 Found ${allOfferMadeEvents.length} total OfferMade events`);
        
        // Filter events for this specific domain by parsing each one
        const offerMadeEvents = [];
        for (const log of allOfferMadeEvents) {
          try {
            const parsed = this.marketplaceContract.interface.parseLog(log);
            console.log('🔍 Checking OfferMade event:', {
              domain: parsed.args[0] || parsed.args.name,
              buyer: parsed.args[1] || parsed.args.buyer,
              amount: parsed.args[2] ? ethers.utils.formatEther(parsed.args[2]) : 'unknown',
              targetDomain: domainName
            });
            
            // Check if this event is for our target domain
            const eventDomain = parsed.args[0] || parsed.args.name;
            if (eventDomain === domainName) {
              offerMadeEvents.push({
                ...log,
                parsed
              });
              console.log('✅ Found matching offer event for domain:', domainName);
            }
          } catch (parseError) {
            console.log('Could not parse OfferMade event:', parseError);
          }
        }
        
        console.log(`Found ${offerMadeEvents.length} OfferMade events for ${domainName}`);
        
        // Events are already parsed, just format them
        const parsedOfferMadeEvents = offerMadeEvents.map(eventData => ({
          ...eventData.parsed,
          blockNumber: eventData.blockNumber,
          transactionHash: eventData.transactionHash
        }));
        
        // Get all OfferAccepted and OfferCancelled events (filter manually like OfferMade)
        const offerAcceptedFilter = {
          address: this.marketplaceContract.address,
          topics: [ethers.utils.id("OfferAccepted(string,address,address,uint256)")]
        };
        
        const allAcceptedLogs = await this.provider.getLogs({
          ...offerAcceptedFilter,
          fromBlock,
          toBlock: currentBlock
        });
        
        const offerAcceptedEvents = [];
        for (const log of allAcceptedLogs) {
          try {
            const parsed = this.marketplaceContract.interface.parseLog(log);
            if ((parsed.args[0] || parsed.args.name) === domainName) {
              offerAcceptedEvents.push(parsed);
            }
          } catch (e) {
            console.log('Could not parse OfferAccepted event:', e);
          }
        }
        
        const offerCancelledFilter = {
          address: this.marketplaceContract.address,
          topics: [ethers.utils.id("OfferCancelled(string,address)")]
        };
        
        const allCancelledLogs = await this.provider.getLogs({
          ...offerCancelledFilter,
          fromBlock,
          toBlock: currentBlock
        });
        
        const offerCancelledEvents = [];
        for (const log of allCancelledLogs) {
          try {
            const parsed = this.marketplaceContract.interface.parseLog(log);
            if ((parsed.args[0] || parsed.args.name) === domainName) {
              offerCancelledEvents.push(parsed);
            }
          } catch (e) {
            console.log('Could not parse OfferCancelled event:', e);
          }
        }
        
        // Build a map of offers by buyer
        const offersByBuyer = new Map();
        
        // Add all made offers
        for (const event of parsedOfferMadeEvents) {
          const block = await this.provider.getBlock(event.blockNumber);
          const buyer = event.args.buyer;
          const amount = event.args.amount;
          const expiry = event.args.expiry;
          
          offersByBuyer.set(buyer, {
            buyer,
            amount: parseFloat(ethers.utils.formatEther(amount)),
            expiry: expiry.toNumber() * 1000,
            timestamp: block.timestamp * 1000,
            transactionHash: event.transactionHash,
            active: true
          });
        }
        
        // Remove accepted offers
        for (const event of offerAcceptedEvents) {
          const buyer = event.args.buyer;
          offersByBuyer.delete(buyer);
        }
        
        // Remove cancelled offers
        for (const event of offerCancelledEvents) {
          const buyer = event.args.buyer;
          offersByBuyer.delete(buyer);
        }
        
        // Filter out expired offers
        const now = Date.now();
        const activeOffers = Array.from(offersByBuyer.values())
          .filter(offer => offer.expiry > now)
          .map((offer, index) => ({
            ...offer,
            index,
            timeLeft: Math.floor((offer.expiry - now) / 1000)
          }))
          .sort((a, b) => b.amount - a.amount);
        
        console.log(`✅ Reconstructed ${activeOffers.length} active offers from events`);
        return activeOffers;
      }
      
    } catch (error) {
      console.error('Error fetching offers for domain:', error);
      return [];
    }
  }

  /**
   * Get all offers made by a user
   */
  async getUserOffers(userAddress) {
    try {
      console.log(`📋 Fetching offers made by user: ${userAddress}`);
      
      // Get all OfferMade events from this user
      const offerMadeEvents = await this.marketplaceContract.queryFilter(
        this.marketplaceContract.filters.OfferMade(null, userAddress)
      );
      
      console.log(`Found ${offerMadeEvents.length} offer events from user`);
      
      const userOffers = [];
      const now = Math.floor(Date.now() / 1000);
      
      for (const event of offerMadeEvents) {
        try {
          const domainName = event.args.name;
          
          // Get current offers for this domain to find the user's active offer
          const domainOffers = await this.marketplaceContract.getOffers(domainName);
          
          // Find the user's offer in the current offers
          let userOffer = null;
          let offerIndex = -1;
          
          for (let i = 0; i < domainOffers.length; i++) {
            const offer = domainOffers[i];
            if (offer.buyer.toLowerCase() === userAddress.toLowerCase() && offer.active) {
              userOffer = offer;
              offerIndex = i;
              break;
            }
          }
          
          if (userOffer) {
            const block = await this.provider.getBlock(event.blockNumber);
            
            userOffers.push({
              domain: domainName,
              index: offerIndex,
              amount: parseFloat(ethers.utils.formatEther(userOffer.amount)),
              expiry: userOffer.expiry.toNumber() * 1000,
              active: userOffer.active,
              timeLeft: userOffer.expiry.toNumber() - now,
              timestamp: block.timestamp * 1000,
              transactionHash: event.transactionHash,
              status: userOffer.expiry.toNumber() > now ? 'active' : 'expired'
            });
          }
        } catch (err) {
          console.log('Error processing user offer event:', err);
          continue;
        }
      }
      
      console.log(`✅ Found ${userOffers.length} active offers from user`);
      return userOffers.sort((a, b) => b.timestamp - a.timestamp);
      
    } catch (error) {
      console.error('Error fetching user offers:', error);
      return [];
    }
  }

  /**
   * Search for specific domain transactions
   */
  async searchDomainTransactions(domainName) {
    const transactions = [];
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 2000);

      // Search for all events related to this domain
      const events = [];

      // Registry events
      const registeredEvents = await this.registryContract.queryFilter(
        this.registryContract.filters.DomainRegistered(domainName),
        fromBlock
      );
      events.push(...registeredEvents.map(e => ({ ...e, eventType: 'DomainRegistered' })));

      const transferredEvents = await this.registryContract.queryFilter(
        this.registryContract.filters.DomainTransferred(domainName),
        fromBlock
      );
      events.push(...transferredEvents.map(e => ({ ...e, eventType: 'DomainTransferred' })));

      const soldEvents = await this.registryContract.queryFilter(
        this.registryContract.filters.DomainSold(domainName),
        fromBlock
      );
      events.push(...soldEvents.map(e => ({ ...e, eventType: 'DomainSold' })));

      // Marketplace events if available
      if (this.marketplaceContract) {
        const auctionCreatedEvents = await this.marketplaceContract.queryFilter(
          this.marketplaceContract.filters.AuctionCreated(domainName),
          fromBlock
        );
        events.push(...auctionCreatedEvents.map(e => ({ ...e, eventType: 'AuctionCreated' })));

        const auctionEndedEvents = await this.marketplaceContract.queryFilter(
          this.marketplaceContract.filters.AuctionEnded(domainName),
          fromBlock
        );
        events.push(...auctionEndedEvents.map(e => ({ ...e, eventType: 'AuctionEnded' })));

        const bidPlacedEvents = await this.marketplaceContract.queryFilter(
          this.marketplaceContract.filters.BidPlaced(domainName),
          fromBlock
        );
        events.push(...bidPlacedEvents.map(e => ({ ...e, eventType: 'BidPlaced' })));
      }

      // Process all events
      for (const event of events) {
        const block = await this.provider.getBlock(event.blockNumber);
        const tx = await this.provider.getTransaction(event.transactionHash);
        
        transactions.push({
          domain: domainName,
          type: event.eventType,
          args: event.args,
          timestamp: block.timestamp * 1000,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          gasUsed: tx.gasLimit.toString(),
          from: tx.from,
          to: tx.to,
          value: ethers.utils.formatEther(tx.value || '0')
        });
      }

      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error searching domain transactions:', error);
      return [];
    }
  }
}

// Helper functions for components
export const createBlockchainDataService = (provider, registryContract, marketplaceContract) => {
  return new BlockchainDataService(provider, registryContract, marketplaceContract);
};

export const formatTransactionType = (type) => {
  const typeMap = {
    'DomainRegistered': '📝 Registration',
    'DomainTransferred': '🔄 Transfer',
    'DomainSold': '💰 Sale',
    'AuctionCreated': '🔨 Auction Started',
    'AuctionEnded': '🏆 Auction Won',
    'BidPlaced': '💵 Bid Placed',
    'OfferMade': '📧 Offer Made',
    'OfferAccepted': '✅ Offer Accepted'
  };
  
  return typeMap[type] || type;
};

export const getTransactionTypeColor = (type) => {
  const colorMap = {
    'DomainRegistered': '#00ff88',
    'DomainTransferred': '#0099ff',
    'DomainSold': '#ff6b35',
    'AuctionCreated': '#9945ff',
    'AuctionEnded': '#ffd700',
    'BidPlaced': '#ff4757',
    'OfferMade': '#5f57ff',
    'OfferAccepted': '#26a69a'
  };
  
  return colorMap[type] || '#ffffff';
};