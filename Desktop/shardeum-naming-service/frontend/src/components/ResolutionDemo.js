import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCopy, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import DomainInput from './DomainInput';
import './ResolutionDemo.css';

const ResolutionDemo = ({ provider, userDomains = [] }) => {
  const [testInput, setTestInput] = useState('');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const sampleDomains = userDomains.length > 0 
    ? userDomains.slice(0, 3)
    : [
        { name: 'crypto-king', address: '0x1234567890123456789012345678901234567890' },
        { name: 'defi-master', address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
        { name: 'web3-pro', address: '0x9876543210987654321098765432109876543210' }
      ];

  return (
    <div className="resolution-demo">
      <div className="container">
        <motion.div
          className="demo-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="demo-title">
            Try <span className="gradient-text">Domain Resolution</span>
          </h2>
          <p className="demo-subtitle">
            Test how .shm domains resolve to wallet addresses and vice versa
          </p>

          {/* Interactive Demo */}
          <div className="demo-section">
            <h3>🔍 Test Resolution</h3>
            <div className="test-input-container">
              <DomainInput
                value={testInput}
                onChange={setTestInput}
                provider={provider}
                placeholder="Enter yourname.shm or 0x address..."
                showResolution={true}
              />
            </div>
          </div>

          {/* How It Works */}
          <div className="demo-section">
            <h3>⚡ How It Works</h3>
            <div className="how-it-works-grid">
              <motion.div 
                className="work-step glass"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Domain to Address</h4>
                  <p>When someone enters <code>yourname.shm</code>, our resolver:</p>
                  <ul>
                    <li>✅ Checks if domain exists & isn't expired</li>
                    <li>✅ Looks for custom address record</li>
                    <li>✅ Falls back to domain owner address</li>
                    <li>✅ Returns resolved wallet address</li>
                  </ul>
                </div>
              </motion.div>

              <motion.div 
                className="work-step glass"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Address to Domain</h4>
                  <p>When someone enters a <code>0x address</code>:</p>
                  <ul>
                    <li>✅ Searches for domains owned by address</li>
                    <li>✅ Returns primary domain if set</li>
                    <li>✅ Falls back to first domain found</li>
                    <li>✅ Shows "No domain registered" if none</li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="demo-section">
            <h3>🎯 Usage Examples</h3>
            <div className="usage-examples">
              <div className="example-category">
                <h4>💰 In DeFi Applications</h4>
                <div className="example-list">
                  <div className="example-item glass">
                    <div className="example-scenario">
                      <strong>Sending Tokens:</strong>
                    </div>
                    <div className="example-flow">
                      <span>Type: <code>alice.shm</code></span>
                      <FiArrowRight />
                      <span>Resolves to: <code>0x1234...5678</code></span>
                      <FiArrowRight />
                      <span>Send tokens to Alice's wallet</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="example-category">
                <h4>🌐 In Web3 Social</h4>
                <div className="example-list">
                  <div className="example-item glass">
                    <div className="example-scenario">
                      <strong>Profile Lookup:</strong>
                    </div>
                    <div className="example-flow">
                      <span>Address: <code>0xabcd...efgh</code></span>
                      <FiArrowRight />
                      <span>Shows: <code>bob.shm</code></span>
                      <FiArrowRight />
                      <span>Display as "@bob" instead of hex</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="example-category">
                <h4>🎮 In Gaming & NFTs</h4>
                <div className="example-list">
                  <div className="example-item glass">
                    <div className="example-scenario">
                      <strong>Player Identity:</strong>
                    </div>
                    <div className="example-flow">
                      <span>Player: <code>gamer.shm</code></span>
                      <FiArrowRight />
                      <span>Links to wallet & NFTs</span>
                      <FiArrowRight />
                      <span>Show achievements & assets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sample Domains */}
          {sampleDomains.length > 0 && (
            <div className="demo-section">
              <h3>🏆 Try These Sample Domains</h3>
              <div className="sample-domains">
                {sampleDomains.map((domain, index) => (
                  <motion.div
                    key={domain.name}
                    className="sample-domain glass"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="sample-info">
                      <h4>{domain.name}.shm</h4>
                      <p>Owner: {domain.address || domain.owner}</p>
                    </div>
                    <div className="sample-actions">
                      <button 
                        className="try-btn"
                        onClick={() => setTestInput(`${domain.name}.shm`)}
                      >
                        Try Resolution
                      </button>
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(domain.address || domain.owner)}
                      >
                        <FiCopy />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Integration Guide */}
          <div className="demo-section">
            <h3>⚙️ Developer Integration</h3>
            <div className="integration-guide glass">
              <h4>Add .shm resolution to your DApp:</h4>
              <div className="code-snippet">
                <pre>
{`import { resolveDomain } from './utils/domainResolver';

// Resolve domain to address
const address = await resolveDomain('alice.shm', provider);

// Use in your DApp
await sendTokens(address, amount);`}
                </pre>
              </div>
              <div className="integration-benefits">
                <p><strong>Benefits:</strong></p>
                <ul>
                  <li>✅ Better UX - users remember names, not hex addresses</li>
                  <li>✅ Reduced errors - no more copy/paste mistakes</li>
                  <li>✅ Brand identity - users can use their domain everywhere</li>
                  <li>✅ Future-proof - works with all Shardeum DApps</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <motion.div
            className="demo-cta"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h3>Ready to Get Your .shm Domain?</h3>
            <p>Join the future of Web3 identity on Shardeum blockchain</p>
            <button 
              className="btn-primary cta-btn"
              onClick={() => {
                // Navigate to registration
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Register Your Domain
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResolutionDemo;