import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PayFiBackground from '@/components/PayFiBackground';
import PayFiNavigation from '@/components/PayFiNavigation';
import SectionTransition from '@/components/SectionTransition';
import Dashboard from '@/components/Dashboard';
import PolicyCards from '@/components/PolicyCards';
import InsuranceFlowVisualization from '@/components/InsuranceFlowVisualization';
import AnalyticsView from '@/components/AnalyticsView';
import MyPoliciesPage from '@/pages/MyPoliciesPage';
import { WalletProvider } from '@/components/WalletConnector';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  // Handle URL hash changes for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'policies', 'flow', 'analytics', 'my-policies'].includes(hash)) {
        setActiveSection(hash);
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL when section changes
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    window.location.hash = section;
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onSectionChange={handleSectionChange} />;
      case 'policies':
        return <PolicyCards />;
      case 'flow':
        return <InsuranceFlowVisualization />;
      case 'analytics':
        return <AnalyticsView />;
      case 'my-policies':
        return <MyPoliciesPage onBack={() => handleSectionChange('dashboard')} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <WalletProvider>
      <div className="min-h-screen bg-background relative">
        {/* 3D Particle Background */}
        <SectionTransition index={0} className="absolute inset-0 -z-10">
          <PayFiBackground />
        </SectionTransition>

        {/* Navigation */}
        <SectionTransition index={1}>
          <PayFiNavigation 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
          />
        </SectionTransition>
        
        {/* Main Content */}
        <main className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="container mx-auto py-8"
            >
              <SectionTransition index={2}>
                {renderSection()}
              </SectionTransition>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </WalletProvider>
  );
};

export default Index;
