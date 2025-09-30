import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  index?: number;
  className?: string;
  children?: React.ReactNode;
}

const SectionTransition: React.FC<Props> = ({ index = 0, className = '', children }) => {
  const delay = Math.max(0, Number(index) * 0.12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default SectionTransition;
