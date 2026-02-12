import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef(null);
  const startY = useRef(0);

  const opacity = useTransform(y, [0, 80], [0, 1]);
  const scale = useTransform(y, [0, 80], [0.5, 1]);
  const rotate = useTransform(y, [0, 360], [0, 360]);

  const handleDragStart = (event, info) => {
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      startY.current = info.point.y;
    } else {
      startY.current = -1;
    }
  };

  const handleDrag = (event, info) => {
    if (startY.current === -1) return;
    const delta = Math.max(0, info.point.y - startY.current);
    y.set(Math.min(delta * 0.5, 80));
  };

  const handleDragEnd = async (event, info) => {
    if (y.get() > 60 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    y.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      className="overflow-y-auto h-full"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.2, bottom: 0 }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        className="flex justify-center py-4"
        style={{ opacity }}
      >
        <motion.div
          className="w-8 h-8 text-[#1a365d] dark:text-blue-400"
          style={{ scale, rotate: isRefreshing ? rotate : 0 }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
        >
          <RefreshCw className="w-8 h-8" />
        </motion.div>
      </motion.div>
      {children}
    </motion.div>
  );
}