import { motion } from 'framer-motion';
import React from 'react';

const FloatingShape = ({ color, size, top, left, delay = 0 }) => {
  return (
    <motion.div
      className={`absolute rounded-full ${color} ${size} opacity-20 blur-3xl`}
      style={{ top, left }}
      animate={{
        y: ['0%', '50%', '0%'],
        x: ['0%', '30%', '0%'],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 15 + delay,
        ease: 'linear',
        repeat: Infinity,
        delay,
      }}
      aria-hidden="true"
    />
  );
};

export default FloatingShape;