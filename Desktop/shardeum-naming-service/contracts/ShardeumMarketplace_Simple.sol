// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ShardeumMarketplace {
    address public registryContract;
    address public owner;
    uint256 public marketplaceFee = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;

    struct Auction {
        string name;
        address seller;
        uint256 startPrice;
        uint256 currentBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    struct Offer {
        address buyer;
        uint256 amount;
        uint256 expiry;
        bool active;
    }

    mapping(string => Auction) public auctions;
    mapping(string => Offer[]) public offers;
    mapping(address => uint256) public pendingReturns;

    event AuctionCreated(string indexed name, uint256 startPrice, uint256 endTime);
    event BidPlaced(string indexed name, address indexed bidder, uint256 amount);
    event AuctionEnded(string indexed name, address winner, uint256 amount);
    event OfferMade(string indexed name, address indexed buyer, uint256 amount);
    event OfferAccepted(string indexed name, address indexed seller, address indexed buyer, uint256 amount);
    event OfferCancelled(string indexed name, address indexed buyer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _registryContract) {
        registryContract = _registryContract;
        owner = msg.sender;
    }

    // Create auction for a domain
    function createAuction(
        string memory name,
        uint256 startPrice,
        uint256 duration
    ) external {
        require(!auctions[name].active, "Auction already active");
        require(startPrice > 0, "Invalid start price");
        require(duration >= 1 hours && duration <= 30 days, "Invalid duration");

        // Note: In a real implementation, you would verify domain ownership through the registry

        auctions[name] = Auction({
            name: name,
            seller: msg.sender,
            startPrice: startPrice,
            currentBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            active: true
        });

        emit AuctionCreated(name, startPrice, block.timestamp + duration);
    }

    // Place bid on auction
    function placeBid(string memory name) external payable {
        Auction storage auction = auctions[name];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value >= auction.startPrice, "Bid below start price");
        require(msg.value > auction.currentBid, "Bid too low");

        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.currentBid;
        }

        auction.currentBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(name, msg.sender, msg.value);

        // Extend auction if bid placed in last 5 minutes
        if (auction.endTime - block.timestamp < 5 minutes) {
            auction.endTime += 5 minutes;
        }
    }

    // End auction
    function endAuction(string memory name) external {
        Auction storage auction = auctions[name];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // Calculate fees
            uint256 fee = (auction.currentBid * marketplaceFee) / FEE_DENOMINATOR;
            uint256 sellerAmount = auction.currentBid - fee;

            // Transfer funds
            payable(auction.seller).transfer(sellerAmount);
            payable(owner).transfer(fee);

            emit AuctionEnded(name, auction.highestBidder, auction.currentBid);
        } else {
            emit AuctionEnded(name, address(0), 0);
        }
    }

    // Make offer on a domain
    function makeOffer(string memory name, uint256 expiry) external payable {
        require(msg.value > 0, "Offer must be greater than 0");
        require(expiry > block.timestamp, "Invalid expiry");

        offers[name].push(Offer({
            buyer: msg.sender,
            amount: msg.value,
            expiry: expiry,
            active: true
        }));

        emit OfferMade(name, msg.sender, msg.value);
    }

    // Accept an offer (simplified - doesn't check domain ownership)
    function acceptOffer(string memory name, uint256 offerIndex) external {
        require(offerIndex < offers[name].length, "Invalid offer index");
        
        Offer storage offer = offers[name][offerIndex];
        require(offer.active, "Offer not active");
        require(offer.expiry > block.timestamp, "Offer expired");

        offer.active = false;

        // Calculate fees
        uint256 fee = (offer.amount * marketplaceFee) / FEE_DENOMINATOR;
        uint256 sellerAmount = offer.amount - fee;

        // Transfer funds
        payable(msg.sender).transfer(sellerAmount);
        payable(owner).transfer(fee);

        emit OfferAccepted(name, msg.sender, offer.buyer, offer.amount);
    }

    // Cancel offer
    function cancelOffer(string memory name, uint256 offerIndex) external {
        require(offerIndex < offers[name].length, "Invalid offer index");
        
        Offer storage offer = offers[name][offerIndex];
        require(offer.buyer == msg.sender, "Not offer maker");
        require(offer.active, "Offer not active");

        offer.active = false;
        payable(msg.sender).transfer(offer.amount);

        emit OfferCancelled(name, msg.sender);
    }

    // Withdraw pending returns
    function withdraw() external {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // Get all offers for a domain
    function getOffersCount(string memory name) external view returns (uint256) {
        return offers[name].length;
    }

    function getOffer(string memory name, uint256 index) external view returns (address, uint256, uint256, bool) {
        require(index < offers[name].length, "Invalid index");
        Offer memory offer = offers[name][index];
        return (offer.buyer, offer.amount, offer.expiry, offer.active);
    }

    // Admin functions
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = _fee;
    }

    function setRegistryContract(address _registryContract) external onlyOwner {
        registryContract = _registryContract;
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}