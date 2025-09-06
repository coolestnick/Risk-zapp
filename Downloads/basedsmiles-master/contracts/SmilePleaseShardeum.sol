// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SmilePleaseShardeum
 * @dev Rewards users with SHM tokens for genuine smiles on Shardeum testnet
 */
contract SmilePleaseShardeum {
    // State variables
    address public owner;
    address public rewardToken; // Address of SHM token (or wrapped SHM)
    uint256 public rewardAmount;
    
    // Mappings
    mapping(string => uint8) public smileScores;
    mapping(string => address) public photoSubmitters;
    mapping(address => uint256) public userRewards;
    mapping(string => bool) public photoProcessed;
    
    // Events
    event SmileSubmitted(string photoUrl, address indexed submitter);
    event SmileScored(string photoUrl, uint8 smileScore, address indexed submitter, bool rewarded);
    event RewardPaid(address indexed recipient, uint256 amount);
    event RewardAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    /**
     * @dev Constructor to initialize the contract
     * @param _rewardAmount Amount of tokens to reward for genuine smiles
     */
    constructor(uint256 _rewardAmount) {
        owner = msg.sender;
        rewardAmount = _rewardAmount;
        // Note: For native SHM rewards, we don't need a token address
        // The contract will use msg.value for native token transfers
    }
    
    /**
     * @dev Submit a photo for smile analysis
     * @param photoUrl URL of the photo to analyze
     */
    function submitSmilePhoto(string memory photoUrl) external {
        require(bytes(photoUrl).length > 0, "Photo URL required");
        require(photoSubmitters[photoUrl] == address(0), "Photo already submitted");
        
        photoSubmitters[photoUrl] = msg.sender;
        emit SmileSubmitted(photoUrl, msg.sender);
    }
    
    /**
     * @dev Score a smile and distribute rewards (owner only)
     * @param photoUrl URL of the photo to score
     * @param score Smile score between 1-5
     */
    function scoreSmile(string memory photoUrl, uint8 score) external onlyOwner {
        require(score >= 1 && score <= 5, "Score must be between 1-5");
        require(photoSubmitters[photoUrl] != address(0), "Photo not found");
        require(!photoProcessed[photoUrl], "Photo already processed");
        
        photoProcessed[photoUrl] = true;
        smileScores[photoUrl] = score;
        address submitter = photoSubmitters[photoUrl];
        bool rewarded = false;
        
        // Reward if score > 3
        if (score > 3) {
            require(address(this).balance >= rewardAmount, "Insufficient contract balance");
            
            // Transfer native SHM tokens
            (bool success, ) = payable(submitter).call{value: rewardAmount}("");
            require(success, "Transfer failed");
            
            userRewards[submitter] += rewardAmount;
            rewarded = true;
            
            emit RewardPaid(submitter, rewardAmount);
        }
        
        emit SmileScored(photoUrl, score, submitter, rewarded);
    }
    
    /**
     * @dev Check if a smile is genuine (score >= 4)
     * @param photoUrl URL of the photo to check
     */
    function isGenuineSmile(string memory photoUrl) external view returns (bool) {
        return smileScores[photoUrl] >= 4;
    }
    
    /**
     * @dev Get smile score for a photo
     * @param photoUrl URL of the photo
     */
    function getSmileScore(string memory photoUrl) external view returns (uint8) {
        return smileScores[photoUrl];
    }
    
    /**
     * @dev Get total rewards earned by a user
     * @param user Address of the user
     */
    function getUserRewards(address user) external view returns (uint256) {
        return userRewards[user];
    }
    
    /**
     * @dev Update reward amount (owner only)
     * @param _newRewardAmount New reward amount
     */
    function setRewardAmount(uint256 _newRewardAmount) external onlyOwner {
        uint256 oldAmount = rewardAmount;
        rewardAmount = _newRewardAmount;
        emit RewardAmountUpdated(oldAmount, _newRewardAmount);
    }
    
    /**
     * @dev Fund the contract with SHM tokens
     */
    function fundContract() external payable {
        require(msg.value > 0, "Must send SHM");
    }
    
    /**
     * @dev Withdraw funds (owner only)
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Transfer ownership
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Receive function to accept SHM
     */
    receive() external payable {}
}