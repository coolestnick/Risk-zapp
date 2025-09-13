// Simple mock ERC-20 contract for testing
// This simulates a deployed contract for development purposes

class MockERC20Contract {
  constructor(address) {
    this.address = address;
    this.balances = new Map();
    this.totalSupply = BigInt("1000000000000000000000000"); // 1M tokens with 18 decimals
    
    // Give some initial tokens to test wallets
    this.balances.set("0x8a97f55b6D61faA30fB6b33D602dBB0714822D80", BigInt("100000000000000000000000")); // Company wallet
  }

  async balanceOf(address) {
    return this.balances.get(address) || BigInt(0);
  }

  async transfer(to, amount) {
    // Mock implementation - in real contract this would be handled by blockchain
    const fromBalance = this.balances.get(window.ethereum?.selectedAddress || "") || BigInt(0);
    
    if (fromBalance >= BigInt(amount)) {
      this.balances.set(window.ethereum?.selectedAddress || "", fromBalance - BigInt(amount));
      const toBalance = this.balances.get(to) || BigInt(0);
      this.balances.set(to, toBalance + BigInt(amount));
      return true;
    }
    return false;
  }

  async mint(to, amount) {
    const balance = this.balances.get(to) || BigInt(0);
    this.balances.set(to, balance + BigInt(amount));
    this.totalSupply += BigInt(amount);
  }
}

// Export for testing
window.MockERC20Contract = MockERC20Contract;

console.log('🪙 Mock ERC-20 contract loaded for development testing');
