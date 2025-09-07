// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

contract ShardeumRegistry {
    // Domain structure
    struct Domain {
        address owner;
        uint256 expiry;
        address resolver;
        uint256 price;
        bool isForSale;
        bool isPremium;
    }

    // Record types
    struct Records {
        string avatar;
        string website;
        string email;
        string description;
        string twitter;
        string discord;
        string github;
        mapping(string => string) customRecords;
    }

    // Events
    event DomainRegistered(string indexed name, address indexed owner, uint256 expiry);
    event DomainTransferred(string indexed name, address indexed from, address indexed to);
    event DomainRenewed(string indexed name, uint256 newExpiry);
    event RecordUpdated(string indexed name, string key, string value);
    event DomainListedForSale(string indexed name, uint256 price);
    event DomainSold(string indexed name, address indexed from, address indexed to, uint256 price);
    event SubdomainCreated(string indexed parent, string indexed subdomain, address owner);

    // State variables
    mapping(string => Domain) public domains;
    mapping(string => Records) public records;
    mapping(address => string[]) public userDomains;
    mapping(address => string) public primaryDomain;
    mapping(string => mapping(string => address)) public subdomains;
    
    address public owner;
    uint256 public basePrice = 0.1 ether;
    uint256 public premiumMultiplier = 10;
    uint256 public registrationDuration = 365 days;
    uint256 public renewalGracePeriod = 30 days;
    
    mapping(string => bool) public premiumNames;
    mapping(string => uint256) public customPrices;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyDomainOwner(string memory name) {
        require(domains[name].owner == msg.sender, "Not domain owner");
        require(domains[name].expiry > block.timestamp, "Domain expired");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Set some premium names
        premiumNames["shm"] = true;
        premiumNames["shardeum"] = true;
        premiumNames["defi"] = true;
        premiumNames["nft"] = true;
        premiumNames["web3"] = true;
        premiumNames["crypto"] = true;
        premiumNames["blockchain"] = true;
    }

    // Calculate price based on name length and premium status
    function calculatePrice(string memory name) public view returns (uint256) {
        uint256 len = bytes(name).length;
        uint256 price;

        if (customPrices[name] > 0) {
            return customPrices[name];
        }

        if (len == 1) {
            price = basePrice * 1000;
        } else if (len == 2) {
            price = basePrice * 500;
        } else if (len == 3) {
            price = basePrice * 100;
        } else if (len == 4) {
            price = basePrice * 50;
        } else {
            price = basePrice;
        }

        if (premiumNames[name]) {
            price = price * premiumMultiplier;
        }

        return price;
    }

    // Register a new domain
    function register(string memory name, uint256 duration) public payable {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(isValidName(name), "Invalid name");
        require(domains[name].expiry < block.timestamp, "Domain already registered");
        require(duration >= 365 days && duration <= 3650 days, "Duration must be 1-10 years");

        uint256 price = calculatePrice(name);
        require(msg.value >= price, "Insufficient payment");

        domains[name] = Domain({
            owner: msg.sender,
            expiry: block.timestamp + duration,
            resolver: address(this),
            price: 0,
            isForSale: false,
            isPremium: premiumNames[name]
        });

        userDomains[msg.sender].push(name);

        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit DomainRegistered(name, msg.sender, domains[name].expiry);
    }

    // Renew a domain
    function renew(string memory name, uint256 additionalDuration) public payable onlyDomainOwner(name) {
        require(additionalDuration >= 365 days && additionalDuration <= 3650 days, "Duration must be 1-10 years");
        
        uint256 price = calculatePrice(name);
        require(msg.value >= price, "Insufficient payment");

        domains[name].expiry += additionalDuration;

        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit DomainRenewed(name, domains[name].expiry);
    }

    // Transfer domain ownership
    function transfer(string memory name, address to) public onlyDomainOwner(name) {
        require(to != address(0), "Invalid address");
        require(!domains[name].isForSale, "Domain is listed for sale");

        address from = domains[name].owner;
        domains[name].owner = to;

        // Update user domains
        removeDomainFromUser(from, name);
        userDomains[to].push(name);

        emit DomainTransferred(name, from, to);
    }

    // Set primary domain for reverse resolution
    function setPrimaryDomain(string memory name) public onlyDomainOwner(name) {
        primaryDomain[msg.sender] = name;
    }

    // Update records
    function setRecord(string memory name, string memory key, string memory value) public onlyDomainOwner(name) {
        if (keccak256(bytes(key)) == keccak256(bytes("avatar"))) {
            records[name].avatar = value;
        } else if (keccak256(bytes(key)) == keccak256(bytes("website"))) {
            records[name].website = value;
        } else if (keccak256(bytes(key)) == keccak256(bytes("email"))) {
            records[name].email = value;
        } else if (keccak256(bytes(key)) == keccak256(bytes("description"))) {
            records[name].description = value;
        } else if (keccak256(bytes(key)) == keccak256(bytes("twitter"))) {
            records[name].twitter = value;
        } else if (keccak256(bytes(key)) == keccak256(bytes("discord"))) {
            records[name].discord = value;
        } else if (keccak256(bytes(key)) == keccak256(bytes("github"))) {
            records[name].github = value;
        } else {
            records[name].customRecords[key] = value;
        }

        emit RecordUpdated(name, key, value);
    }

    // List domain for sale
    function listForSale(string memory name, uint256 price) public onlyDomainOwner(name) {
        require(price > 0, "Price must be greater than 0");
        
        domains[name].isForSale = true;
        domains[name].price = price;

        emit DomainListedForSale(name, price);
    }

    // Cancel listing
    function cancelListing(string memory name) public onlyDomainOwner(name) {
        domains[name].isForSale = false;
        domains[name].price = 0;
    }

    // Buy listed domain
    function buyDomain(string memory name) public payable {
        require(domains[name].isForSale, "Domain not for sale");
        require(msg.value >= domains[name].price, "Insufficient payment");
        require(domains[name].expiry > block.timestamp, "Domain expired");

        address seller = domains[name].owner;
        uint256 salePrice = domains[name].price;

        // Transfer domain
        domains[name].owner = msg.sender;
        domains[name].isForSale = false;
        domains[name].price = 0;

        // Update user domains
        removeDomainFromUser(seller, name);
        userDomains[msg.sender].push(name);

        // Transfer payment to seller
        payable(seller).transfer(salePrice);

        // Refund excess
        if (msg.value > salePrice) {
            payable(msg.sender).transfer(msg.value - salePrice);
        }

        emit DomainSold(name, seller, msg.sender, salePrice);
    }

    // Create subdomain
    function createSubdomain(string memory parent, string memory sub, address subOwner) public onlyDomainOwner(parent) {
        require(bytes(sub).length > 0, "Subdomain cannot be empty");
        require(isValidName(sub), "Invalid subdomain");
        require(subOwner != address(0), "Invalid owner address");

        string memory fullSub = string(abi.encodePacked(sub, ".", parent));
        subdomains[parent][sub] = subOwner;

        emit SubdomainCreated(parent, sub, subOwner);
    }

    // Helper functions
    function isValidName(string memory name) internal pure returns (bool) {
        bytes memory b = bytes(name);
        if (b.length == 0) return false;

        for (uint i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            if (!(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x61 && char <= 0x7A) || // a-z
                char == 0x2D // -
            )) {
                return false;
            }
        }
        return true;
    }

    function removeDomainFromUser(address user, string memory name) internal {
        string[] storage userDoms = userDomains[user];
        for (uint i = 0; i < userDoms.length; i++) {
            if (keccak256(bytes(userDoms[i])) == keccak256(bytes(name))) {
                userDoms[i] = userDoms[userDoms.length - 1];
                userDoms.pop();
                break;
            }
        }
    }

    // View functions
    function getDomain(string memory name) public view returns (address, uint256, bool, uint256, bool) {
        Domain memory domain = domains[name];
        return (domain.owner, domain.expiry, domain.isForSale, domain.price, domain.isPremium);
    }

    function getRecord(string memory name, string memory key) public view returns (string memory) {
        if (keccak256(bytes(key)) == keccak256(bytes("avatar"))) {
            return records[name].avatar;
        } else if (keccak256(bytes(key)) == keccak256(bytes("website"))) {
            return records[name].website;
        } else if (keccak256(bytes(key)) == keccak256(bytes("email"))) {
            return records[name].email;
        } else if (keccak256(bytes(key)) == keccak256(bytes("description"))) {
            return records[name].description;
        } else if (keccak256(bytes(key)) == keccak256(bytes("twitter"))) {
            return records[name].twitter;
        } else if (keccak256(bytes(key)) == keccak256(bytes("discord"))) {
            return records[name].discord;
        } else if (keccak256(bytes(key)) == keccak256(bytes("github"))) {
            return records[name].github;
        } else {
            return records[name].customRecords[key];
        }
    }

    function getUserDomains(address user) public view returns (string[] memory) {
        return userDomains[user];
    }

    function isAvailable(string memory name) public view returns (bool) {
        return domains[name].expiry < block.timestamp;
    }

    // Owner functions
    function setBasePrice(uint256 _price) public onlyOwner {
        basePrice = _price;
    }

    function setPremiumName(string memory name, bool isPremium) public onlyOwner {
        premiumNames[name] = isPremium;
    }

    function setCustomPrice(string memory name, uint256 price) public onlyOwner {
        customPrices[name] = price;
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}