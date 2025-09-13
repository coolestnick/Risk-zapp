// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PolicyManager
 * @dev Manages insurance policy purchases and withdrawals with fee structure
 */
contract PolicyManager is Ownable {
    IERC20 public token;
    address public companyWallet;
    uint256 public constant PURCHASE_FEE_BP = 200; // 2.00% in basis points
    uint256 public constant WITHDRAW_FEE_BP = 50;  // 0.50% in basis points

    event PolicyPurchased(address indexed buyer, uint256 indexed policyId, uint256 amount, bytes data);
    event TokenUpdated(address indexed token);
    event CompanyUpdated(address indexed company);
    event Withdrawn(address indexed to, uint256 amount, uint256 fee);

    /**
     * @dev Constructor sets the token and company wallet addresses
     * @param tokenAddr Address of the ERC20 token to be used
     * @param _companyWallet Address where company fees will be sent
     */
    constructor(address tokenAddr, address _companyWallet) Ownable(msg.sender) {
        token = IERC20(tokenAddr);
        companyWallet = _companyWallet;
    }

    function setToken(address tokenAddr) external onlyOwner {
        token = IERC20(tokenAddr);
        emit TokenUpdated(tokenAddr);
    }

    function setCompanyWallet(address _companyWallet) external onlyOwner {
        companyWallet = _companyWallet;
        emit CompanyUpdated(_companyWallet);
    }

    // Buyer must first approve this contract for `amount` tokens.
    // The contract collects a purchase fee (2%) which is forwarded to the company wallet.
    function purchase(uint256 policyId, uint256 amount, bytes calldata data) external {
        require(amount > 0, "amount=0");

        // calculate fee and net amount
        uint256 fee = (amount * PURCHASE_FEE_BP) / 10000;
        uint256 net = amount - fee;

        // transfer fee -> company wallet
        bool feeOk = token.transferFrom(msg.sender, companyWallet, fee);
        require(feeOk, "fee transfer failed");

        // transfer net -> this contract (held until owner withdraws)
        bool netOk = token.transferFrom(msg.sender, address(this), net);
        require(netOk, "net transfer failed");

        emit PolicyPurchased(msg.sender, policyId, amount, data);
    }

    // Owner can withdraw accumulated token balance; a small withdraw fee (0.5%) is forwarded to company wallet.
    function withdraw(uint256 amount, address to) external onlyOwner {
        require(amount > 0, "amount=0");
        uint256 balance = token.balanceOf(address(this));
        require(amount <= balance, "insufficient balance");

        uint256 fee = (amount * WITHDRAW_FEE_BP) / 10000;
        uint256 net = amount - fee;

        if (fee > 0) {
            bool f = token.transfer(companyWallet, fee);
            require(f, "withdraw fee failed");
        }

        bool sent = token.transfer(to, net);
        require(sent, "withdraw transfer failed");

    emit Withdrawn(to, net, fee);
    }
}
