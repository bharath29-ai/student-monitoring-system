import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, authChecked } = useAuth();

  useEffect(() => {
    if (authChecked) {
      const timer = setTimeout(() => {
        navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [navigate, isAuthenticated, authChecked]);

  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur mb-6 shadow-2xl">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl font-extrabold text-white"
        >
          Smart Classroom
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-white/60 text-sm mt-2"
        >
          AI-Powered Monitoring
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-12"
      >
        <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </motion.div>
    </div>
  );
}