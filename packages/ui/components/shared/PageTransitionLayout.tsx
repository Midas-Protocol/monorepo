import { motion } from 'framer-motion';
import { ReactNode } from 'react';

function PageTransitionLayout({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransitionLayout;
