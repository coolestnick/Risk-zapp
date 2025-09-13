import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCheck, 
  Shield, 
  FileCheck, 
  Calculator, 
  CreditCard, 
  Award,
  Bell,
  FileText,
  BarChart3,
  Zap,
  CheckCircle,
  Clock
} from 'lucide-react';

interface FlowStep {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'active' | 'completed';
}

const InsuranceFlowVisualization: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const flowSteps: FlowStep[] = [
    {
      id: 'request',
      title: 'User Request',
      description: 'Initiate micro-policy request',
      detailedDescription: 'User initiates a micro-policy request through the Riskzap interface. Smart contracts validate the request parameters and user eligibility for seamless processing.',
      icon: UserCheck,
      status: currentStep === 0 ? 'active' : completedSteps.includes(0) ? 'completed' : 'pending'
    },
    {
      id: 'validation',
      title: 'Validation',
      description: 'Smart contract validation',
      detailedDescription: 'Advanced validation algorithms check request integrity, user credentials, and smart contract conditions to ensure all parameters meet security requirements.',
      icon: Shield,
      status: currentStep === 1 ? 'active' : completedSteps.includes(1) ? 'completed' : 'pending'
    },
    {
      id: 'kyc',
      title: 'KYC / AML',
      description: 'Identity verification',
      detailedDescription: 'Automated KYC/AML verification using decentralized identity protocols ensures regulatory compliance while maintaining user privacy and security.',
      icon: FileCheck,
      status: currentStep === 2 ? 'active' : completedSteps.includes(2) ? 'completed' : 'pending'
    },
    {
      id: 'underwriting',
      title: 'Underwriting',
      description: 'AI-powered risk assessment',
      detailedDescription: 'AI-powered underwriting engine analyzes risk factors using real-time data feeds and predictive modeling algorithms to determine coverage eligibility.',
      icon: Calculator,
      status: currentStep === 3 ? 'active' : completedSteps.includes(3) ? 'completed' : 'pending'
    },
    {
      id: 'quote',
      title: 'Quote Generation',
      description: 'Dynamic pricing algorithm',
      detailedDescription: 'Dynamic pricing algorithms generate personalized quotes based on comprehensive risk assessment, current market conditions, and selected coverage options.',
      icon: BarChart3,
      status: currentStep === 4 ? 'active' : completedSteps.includes(4) ? 'completed' : 'pending'
    },
    {
      id: 'selection',
      title: 'Policy Selection',
      description: 'Choose coverage options',
      detailedDescription: 'Interactive policy selection interface allows users to customize coverage parameters with real-time premium adjustments and feature comparisons.',
      icon: Award,
      status: currentStep === 5 ? 'active' : completedSteps.includes(5) ? 'completed' : 'pending'
    },
    {
      id: 'payment',
      title: 'Riskzap Payment',
      description: 'Instant SHM micropayment',
      detailedDescription: 'Instant Riskzap micropayments using SHM tokens enable seamless premium collection with minimal transaction fees and immediate confirmation.',
      icon: CreditCard,
      status: currentStep === 6 ? 'active' : completedSteps.includes(6) ? 'completed' : 'pending'
    },
    {
      id: 'creation',
      title: 'Policy Creation',
      description: 'On-chain policy issuance',
      detailedDescription: 'Smart contracts automatically issue policy NFTs with embedded terms and conditions, creating immutable on-chain insurance records for transparency.',
      icon: FileText,
      status: currentStep === 7 ? 'active' : completedSteps.includes(7) ? 'completed' : 'pending'
    },
    {
      id: 'notification',
      title: 'Notification',
      description: 'Real-time updates',
      detailedDescription: 'Real-time notification system updates all stakeholders about policy status changes, claim submissions, and other important events via multiple channels.',
      icon: Bell,
      status: currentStep === 8 ? 'active' : completedSteps.includes(8) ? 'completed' : 'pending'
    },
    {
      id: 'dashboard',
      title: 'Dashboard Update',
      description: 'Live policy management',
      detailedDescription: 'Live dashboard updates provide comprehensive policy management, claims tracking, portfolio analytics, and real-time visualization of all insurance activities.',
      icon: Zap,
      status: currentStep === 9 ? 'active' : completedSteps.includes(9) ? 'completed' : 'pending'
    }
  ];

  const handleStepClick = (stepIndex: number) => {
    if (expandedStep === stepIndex) {
      setExpandedStep(null);
    } else {
      setExpandedStep(stepIndex);
      setCurrentStep(stepIndex);
      if (!completedSteps.includes(stepIndex)) {
        setCompletedSteps(prev => [...prev, stepIndex]);
      }
    }
  };

  const getStepIcon = (step: FlowStep, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle className="h-7 w-7 text-green-400" />;
    } else if (step.status === 'active') {
      return <Clock className="h-7 w-7 text-cyan-400 animate-pulse" />;
    } else {
      const IconComponent = step.icon;
      return <IconComponent className="h-7 w-7 text-gray-400" />;
    }
  };

  const getNodeStyles = (step: FlowStep) => {
    if (step.status === 'completed') {
      return 'bg-gradient-to-br from-green-400 to-green-500 border-green-400 shadow-lg shadow-green-500/50';
    } else if (step.status === 'active') {
      return 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-400 shadow-lg shadow-cyan-500/50';
    } else {
      return 'bg-gray-800/80 border-gray-600 hover:border-gray-500';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-blue-500/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <h2 className="text-4xl font-bold text-white mb-4">
          Insurance Flow Process
        </h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Complete end-to-end insurance policy creation workflow with smart contract automation
        </p>
      </div>

      <div className="relative z-10">
        {/* Vertical Timeline Line */}
        <div className="absolute left-10 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-600 rounded-full"></div>
        
        {/* Progress Line Animation */}
        <motion.div
          className="absolute left-10 top-0 w-1 bg-gradient-to-b from-cyan-400 via-blue-400 to-purple-400 rounded-full shadow-lg shadow-cyan-500/50"
          initial={{ height: 0 }}
          animate={{ 
            height: `${((completedSteps.length + (currentStep > completedSteps.length ? 1 : 0)) / flowSteps.length) * 100}%`
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* Timeline Steps */}
        <div className="space-y-10">
          {flowSteps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start group"
              >
                {/* Timeline Node */}
                <motion.div
                  className={`relative z-10 flex items-center justify-center w-20 h-20 rounded-full border-4 ${getNodeStyles(step)} cursor-pointer shadow-lg transition-all duration-300 group-hover:scale-110`}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStepClick(index)}
                >
                  {getStepIcon(step, index)}
                  
                  {/* Active Step Pulse Effect */}
                  {step.status === 'active' && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-cyan-400"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-cyan-400/20"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    </>
                  )}
                  
                  {/* Completed Step Glow */}
                  {step.status === 'completed' && (
                    <div className="absolute inset-0 rounded-full bg-green-400/20 blur-sm" />
                  )}
                </motion.div>

                {/* Step Content */}
                <div className="ml-8 flex-1 cursor-pointer group-hover:translate-x-2 transition-transform duration-300" onClick={() => handleStepClick(index)}>
                  <motion.div
                    className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/80 hover:border-cyan-400/50 transition-all duration-300"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-full">
                        Step {index + 1}
                      </div>
                      {step.status === 'completed' && (
                        <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                          Completed
                        </div>
                      )}
                      {step.status === 'active' && (
                        <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full animate-pulse">
                          In Progress
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {step.description}
                    </p>
                    
                    <div className="mt-4 flex items-center gap-2 text-cyan-400 text-sm font-medium">
                      <span>Click to expand details</span>
                      <motion.div
                        animate={{ x: expandedStep === index ? 0 : [0, 5, 0] }}
                        transition={{ repeat: expandedStep === index ? 0 : Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedStep === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="mt-6 p-6 rounded-xl bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-cyan-400/30 shadow-lg shadow-cyan-500/20"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-cyan-500/20 rounded-lg">
                            <IconComponent className="h-8 w-8 text-cyan-400 flex-shrink-0" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                              <span className="text-cyan-400">Detailed Process:</span>
                              {step.title}
                            </h4>
                            <p className="text-gray-300 text-sm leading-relaxed mb-4">
                              {step.detailedDescription}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-cyan-400">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                              <span>Automated process with smart contract validation</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-cyan-400/30 shadow-2xl shadow-cyan-500/20"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-cyan-400" />
                </div>
                Process Overview
              </h3>
              <p className="text-gray-300 text-lg">
                {completedSteps.length} of {flowSteps.length} steps completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">
                {Math.round((completedSteps.length / flowSteps.length) * 100)}%
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Complete</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${(completedSteps.length / flowSteps.length) * 100}%` }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            </div>
            <motion.div
              className="absolute top-0 left-0 h-3 bg-gradient-to-r from-cyan-400/50 to-blue-400/50 rounded-full blur-sm"
              initial={{ width: 0 }}
              animate={{ width: `${(completedSteps.length / flowSteps.length) * 100}%` }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{completedSteps.length} Completed</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-400">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">
                {currentStep !== undefined && !completedSteps.includes(currentStep) ? '1 Active' : '0 Active'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
              <span className="text-sm font-medium">
                {flowSteps.length - completedSteps.length - (currentStep !== undefined && !completedSteps.includes(currentStep) ? 1 : 0)} Pending
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InsuranceFlowVisualization;