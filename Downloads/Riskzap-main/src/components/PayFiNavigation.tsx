import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import WalletConnector from './WalletConnector';
import { 
  Shield, 
  BarChart3, 
  Zap, 
  Settings, 
  Menu, 
  X,
  Sparkles,
  Coins
} from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const PayFiNavigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Home', icon: BarChart3 },
    { id: 'policies', label: 'POLICIES', icon: Shield },
    { id: 'flow', label: 'HOW IT WORKS', icon: Zap },
    { id: 'analytics', label: 'ANALYTICS', icon: Sparkles },
    { id: 'my-policies', label: 'MY ACCOUNT', icon: Coins },
  ];

  return (
    <>
      
      <nav className="hidden lg:flex items-center justify-between px-6 py-3 mx-4 mt-4 rounded-full bg-background-navbar border border-border backdrop-blur-xl shadow-medium">
   
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-7 h-7 bg-cyan-400 rounded-sm flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-full"></div>
          </div>
          <span className="text-xl font-black text-white">Riskzap</span>
        </motion.div>

        <div className="flex items-center gap-6">
          {navigationItems.map((item, index) => {
            const isActive = activeSection === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary/15 text-primary border border-primary/30' 
                      : 'text-slate-400 hover:text-foreground hover:bg-primary/5'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        
        <div className="flex items-center">
          <WalletConnector />
        </div>
      </nav>


      <nav className="lg:hidden flex items-center justify-between p-3 mx-2 mt-2 rounded-2xl glass-card border border-primary/10 backdrop-blur-xl shadow-lg">
   
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-6 h-6 bg-cyan-400 rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-black rounded-full"></div>
          </div>
          <span className="text-lg font-black text-white">R</span>
        </motion.div>

  
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="border-glow-soft rounded-full h-8 w-8 p-0"
        >
          {isMobileMenuOpen ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
        </Button>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
            >
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  className="absolute right-2 top-2 bottom-2 w-72 card-modern border border-border rounded-2xl p-4 shadow-elevated backdrop-blur-xl"
                >
    
                  <div className="flex items-center justify-between mb-6">
                   
                    <motion.div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 bg-cyan-400 rounded-sm flex items-center justify-center">
                        <div className="w-3 h-3 bg-black rounded-full"></div>
                      </div>
                      <span className="text-2xl font-black text-white">R</span>
                    </motion.div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="border-modern rounded-full h-7 w-7 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Mobile Navigation Items */}
                  <div className="space-y-1 mb-6">
                    {navigationItems.map((item, index) => {
                      const isActive = activeSection === item.id;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <button
                            onClick={() => {
                              onSectionChange(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                              isActive 
                                ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/30' 
                                : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                            }`}
                          >
                            {item.label}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Mobile Wallet Connector */}
                  <div className="border-t border-primary/20 pt-4">
                  <WalletConnector />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default PayFiNavigation;