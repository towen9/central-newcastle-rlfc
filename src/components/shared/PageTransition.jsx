import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'tween',
      ease: 'easeInOut',
      duration: 0.3
    }
  },
  exit: (direction) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    transition: {
      type: 'tween',
      ease: 'easeInOut',
      duration: 0.3
    }
  })
};

export default function PageTransition({ children, pageKey }) {
  const [direction, setDirection] = React.useState(1);
  const location = useLocation();

  React.useEffect(() => {
    // Simple direction logic based on navigation
    const state = location.state;
    if (state?.direction) {
      setDirection(state.direction);
    }
  }, [location]);

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={pageKey || location.pathname}
        custom={direction}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}