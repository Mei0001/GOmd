"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

// Animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const slideInFromLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

export const slideInFromRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Animation components
interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  variants?: any;
  delay?: number;
}

export function AnimatedContainer({ 
  children, 
  className, 
  variants = fadeInUp,
  delay = 0 
}: AnimatedContainerProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredContainer({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}

// Page transition wrapper
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Loading spinner with animation
export function LoadingSpinner({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`inline-block border-2 border-current border-t-transparent rounded-full ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

// Progress bar with animation
interface AnimatedProgressProps {
  progress: number;
  className?: string;
}

export function AnimatedProgress({ progress, className = "" }: AnimatedProgressProps) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 ${className}`}>
      <motion.div
        className="bg-blue-600 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// Card hover effect
export function HoverCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

// Button press animation
export function AnimatedButton({ children, className = "", ...props }: any) {
  return (
    <motion.button
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Fade in when in view
export function FadeInWhenVisible({ 
  children, 
  className = "",
  delay = 0 
}: { 
  children: ReactNode; 
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

// Typing animation
export function TypingAnimation({ 
  text, 
  className = "",
  speed = 50 
}: { 
  text: string; 
  className?: string;
  speed?: number;
}) {
  const characters = text.split('');
  
  return (
    <motion.div className={className}>
      {characters.map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * (speed / 1000) }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}

// Number counter animation
export function CounterAnimation({ 
  from = 0, 
  to, 
  duration = 2,
  className = ""
}: { 
  from?: number; 
  to: number; 
  duration?: number;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={from}
        animate={to}
        transition={{ duration, ease: "easeOut" }}
        onUpdate={(latest) => {
          if (typeof latest === 'number') {
            const element = document.getElementById('counter');
            if (element) {
              element.textContent = Math.round(latest).toString();
            }
          }
        }}
      >
        <span id="counter">{from}</span>
      </motion.span>
    </motion.span>
  );
}