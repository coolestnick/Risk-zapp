// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IShardeumRegistry {
    function getDomain(string memory name) external view returns (
        address owner,
        uint256 expiry,
        bool isForSale,
        uint256 price,
        bool isPremium
    );
    function transferDomain(string memory name, address to) external;
    function setDomainForSale(string memory name, uint256 price) external;
    function removeDomainFromSale(string memory name) external;
}

contract ShardeumMarketplaceAdvanced {
    IShardeumRegistry public registryContract;
    
    // Marketplace fee (in basis points, e.g., 250 = 2.5%)
    uint256 public marketplaceFee = 250;
    address public feeRecipient;
    
    // Auction structure
    struct Auction {
        string name;
        address seller;
        uint256 startPrice;
        uint256 currentBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }
    
    // Offer structure
    struct Offer {
        address buyer;
        uint256 amount;
        uint256 expiry;
        bool active;
    }
    
    // Fixed price listing structure
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }
    
    // Storage
    mapping(string => Auction) public auctions;
    mapping(string => Offer[]) public offers;
    mapping(string => Listing) public listings;
    mapping(address => uint256) public pendingWithdrawals;
    
    // Events
    event AuctionCreated(string indexed name, address indexed seller, uint256 startPrice, uint256 endTime);
    event BidPlaced(string indexed name, address indexed bidder, uint256 amount);
    event AuctionEnded(string indexed name, address indexed winner, uint256 amount);
    event OfferMade(string indexed name, address indexed buyer, uint256 amount, uint256 expiry);
    event OfferAccepted(string indexed name, address indexed seller, address indexed buyer, uint256 amount);
    event OfferCancelled(string indexed name, address indexed buyer);
    event ListingCreated(string indexed name, address indexed seller, uint256 price);
    event DomainSold(string indexed name, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(string indexed name, address indexed seller);
    
    modifier onlyDomainOwner(string memory name) {
        (address owner,,,, ) = registryContract.getDomain(name);
        require(owner == msg.sender, "Not domain owner");
        _;
    }
    
    modifier validDomain(string memory name) {
        require(bytes(name).length > 0, "Invalid domain name");
        _;
    }
    
    constructor(address _registryContract) {
        registryContract = IShardeumRegistry(_registryContract);
        feeRecipient = msg.sender;
    }
    
    // ============== AUCTION FUNCTIONS ==============
    
    function createAuction(
        string memory name,
        uint256 startPrice,
        uint256 duration
    ) external onlyDomainOwner(name) validDomain(name) {
        require(startPrice > 0, "Invalid start price");
        require(duration >= 3600 && duration <= 2592000, "Invalid duration"); // 1 hour to 30 days
        require(!auctions[name].active, "Auction already active");
        require(!listings[name].active, "Domain is listed for sale");
        
        uint256 endTime = block.timestamp + duration;
        
        auctions[name] = Auction({
            name: name,
            seller: msg.sender,
            startPrice: startPrice,
            currentBid: 0,
            highestBidder: address(0),
            endTime: endTime,
            active: true
        });
        
        emit AuctionCreated(name, msg.sender, startPrice, endTime);
    }
    
    function placeBid(string memory name) external payable validDomain(name) {
        Auction storage auction = auctions[name];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Cannot bid on own auction");
        
        uint256 minimumBid = auction.currentBid > auction.startPrice ? auction.currentBid : auction.startPrice;
        require(msg.value > minimumBid, "Bid too low");
        
        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            pendingWithdrawals[auction.highestBidder] += auction.currentBid;
        }
        
        auction.currentBid = msg.value;
        auction.highestBidder = msg.sender;
        
        emit BidPlaced(name, msg.sender, msg.value);
    }
    
    function endAuction(string memory name) external validDomain(name) {
        Auction storage auction = auctions[name];
        require(auction.active, "Auction not active");
        require(
            block.timestamp >= auction.endTime || msg.sender == auction.seller,
            "Auction not ended"
        );
        
        auction.active = false;
        
        if (auction.highestBidder != address(0)) {
            // Transfer domain to winner
            registryContract.transferDomain(name, auction.highestBidder);
            
            // Calculate fee and transfer to seller
            uint256 fee = (auction.currentBid * marketplaceFee) / 10000;
            uint256 sellerAmount = auction.currentBid - fee;
            
            pendingWithdrawals[auction.seller] += sellerAmount;
            pendingWithdrawals[feeRecipient] += fee;
            
            emit AuctionEnded(name, auction.highestBidder, auction.currentBid);
        } else {
            emit AuctionEnded(name, address(0), 0);
        }
    }
    
    // ============== OFFER FUNCTIONS ==============
    
    function makeOffer(string memory name, uint256 expiry) external payable validDomain(name) {
        require(msg.value > 0, "Offer must be greater than 0");
        require(expiry > block.timestamp, "Invalid expiry time");
        require(expiry <= block.timestamp + 2592000, "Expiry too far in future"); // Max 30 days
        
        (address owner,,,, ) = registryContract.getDomain(name);
        require(owner != msg.sender, "Cannot offer on own domain");
        require(owner != address(0), "Domain not registered");
        
        // Cancel any existing offer from this buyer
        cancelOffer(name);
        
        offers[name].push(Offer({
            buyer: msg.sender,
            amount: msg.value,
            expiry: expiry,
            active: true
        }));
        
        emit OfferMade(name, msg.sender, msg.value, expiry);
    }
    
    function acceptOffer(string memory name, uint256 offerIndex) external onlyDomainOwner(name) validDomain(name) {
        require(offerIndex < offers[name].length, "Invalid offer index");
        
        Offer storage offer = offers[name][offerIndex];
        require(offer.active, "Offer not active");
        require(offer.expiry > block.timestamp, "Offer expired");
        require(!auctions[name].active, "Cannot accept during active auction");
        
        // Mark offer as inactive
        offer.active = false;
        
        // Transfer domain to buyer
        registryContract.transferDomain(name, offer.buyer);
        
        // Calculate fee and transfer to seller
        uint256 fee = (offer.amount * marketplaceFee) / 10000;
        uint256 sellerAmount = offer.amount - fee;
        
        pendingWithdrawals[msg.sender] += sellerAmount;
        pendingWithdrawals[feeRecipient] += fee;
        
        emit OfferAccepted(name, msg.sender, offer.buyer, offer.amount);
        
        // Cancel all other offers for this domain
        for (uint256 i = 0; i < offers[name].length; i++) {
            if (i != offerIndex && offers[name][i].active) {
                offers[name][i].active = false;
                pendingWithdrawals[offers[name][i].buyer] += offers[name][i].amount;
            }
        }
    }
    
    function cancelOffer(string memory name) public validDomain(name) {
        for (uint256 i = 0; i < offers[name].length; i++) {
            if (offers[name][i].buyer == msg.sender && offers[name][i].active) {
                offers[name][i].active = false;
                pendingWithdrawals[msg.sender] += offers[name][i].amount;
                emit OfferCancelled(name, msg.sender);
                return;
            }
        }
        revert("No active offer found");
    }
    
    function getOffers(string memory name) external view returns (Offer[] memory) {
        return offers[name];
    }
    
    function getActiveOffers(string memory name) external view returns (Offer[] memory) {
        uint256 activeCount = 0;
        
        // Count active offers
        for (uint256 i = 0; i < offers[name].length; i++) {
            if (offers[name][i].active && offers[name][i].expiry > block.timestamp) {
                activeCount++;
            }
        }
        
        // Create array of active offers
        Offer[] memory activeOffers = new Offer[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < offers[name].length; i++) {
            if (offers[name][i].active && offers[name][i].expiry > block.timestamp) {
                activeOffers[index] = offers[name][i];
                index++;
            }
        }
        
        return activeOffers;
    }
    
    // ============== FIXED PRICE LISTING FUNCTIONS ==============
    
    function createListing(string memory name, uint256 price) external onlyDomainOwner(name) validDomain(name) {
        require(price > 0, "Invalid price");
        require(!auctions[name].active, "Auction is active");
        require(!listings[name].active, "Listing already exists");
        
        listings[name] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });
        
        // Also set domain for sale in registry
        registryContract.setDomainForSale(name, price);
        
        emit ListingCreated(name, msg.sender, price);
    }
    
    function buyDomain(string memory name) external payable validDomain(name) {
        Listing storage listing = listings[name];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own domain");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Mark listing as inactive
        listing.active = false;
        
        // Transfer domain to buyer
        registryContract.transferDomain(name, msg.sender);
        registryContract.removeDomainFromSale(name);
        
        // Calculate fee and transfer to seller
        uint256 fee = (price * marketplaceFee) / 10000;
        uint256 sellerAmount = price - fee;
        
        pendingWithdrawals[seller] += sellerAmount;
        pendingWithdrawals[feeRecipient] += fee;
        
        // Refund excess payment
        if (msg.value > price) {
            pendingWithdrawals[msg.sender] += (msg.value - price);
        }
        
        emit DomainSold(name, seller, msg.sender, price);
    }
    
    function cancelListing(string memory name) external onlyDomainOwner(name) validDomain(name) {
        require(listings[name].active, "No active listing");
        
        listings[name].active = false;
        registryContract.removeDomainFromSale(name);
        
        emit ListingCancelled(name, msg.sender);
    }
    
    // ============== UTILITY FUNCTIONS ==============
    
    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
    
    function getAuction(string memory name) external view returns (
        string memory,
        address,
        uint256,
        uint256,
        address,
        uint256,
        bool
    ) {
        Auction memory auction = auctions[name];
        return (
            auction.name,
            auction.seller,
            auction.startPrice,
            auction.currentBid,
            auction.highestBidder,
            auction.endTime,
            auction.active
        );
    }
    
    function getListing(string memory name) external view returns (
        address,
        uint256,
        bool
    ) {
        Listing memory listing = listings[name];
        return (listing.seller, listing.price, listing.active);
    }
    
    // ============== ADMIN FUNCTIONS ==============
    
    function setMarketplaceFee(uint256 _fee) external {
        require(msg.sender == feeRecipient, "Only fee recipient");
        require(_fee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = _fee;
    }
    
    function setFeeRecipient(address _feeRecipient) external {
        require(msg.sender == feeRecipient, "Only fee recipient");
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }
    
    // Emergency function to clean up expired offers
    function cleanupExpiredOffers(string memory name) external {
        for (uint256 i = 0; i < offers[name].length; i++) {
            if (offers[name][i].active && offers[name][i].expiry <= block.timestamp) {
                offers[name][i].active = false;
                pendingWithdrawals[offers[name][i].buyer] += offers[name][i].amount;
            }
        }
    }
}