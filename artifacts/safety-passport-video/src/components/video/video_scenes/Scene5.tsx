import { motion } from 'framer-motion';

export function Scene5() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.4,
      }
    },
    exit: { 
      opacity: 0,
      scale: 1.1,
      filter: 'blur(20px)',
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        duration: 1.2, 
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[hsl(var(--color-bg-dark))] overflow-hidden"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={containerVariants}
    >
      {/* Dynamic Background Glow */}
      <motion.div 
        className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-30 mix-blend-screen pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--color-primary)) 0%, transparent 70%)'
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 3, ease: "easeOut" }}
      />

      <motion.div 
        className="relative z-10 flex flex-col items-center text-center"
        variants={itemVariants}
      >
        {/* Abstract Logo */}
        <div className="w-32 h-32 mb-8 relative">
          <motion.div 
            className="absolute inset-0 border-4 border-[hsl(var(--color-primary))] rounded-xl"
            initial={{ rotate: 45, scale: 0 }}
            animate={{ rotate: 45, scale: 1 }}
            transition={{ duration: 1, ease: "backOut" }}
          />
          <motion.div 
            className="absolute inset-0 bg-[hsl(var(--color-accent))] rounded-xl mix-blend-screen"
            initial={{ rotate: 0, scale: 0 }}
            animate={{ rotate: 45, scale: 0.8 }}
            transition={{ delay: 0.2, duration: 1, ease: "backOut" }}
          />
          <svg className="absolute inset-0 w-16 h-16 m-auto text-white z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <motion.h1 
          className="font-display text-8xl font-bold text-white mb-6 tracking-tight"
          variants={itemVariants}
        >
          Safety Passport
        </motion.h1>

        <motion.div 
          className="flex items-center gap-6 text-3xl font-light text-[hsl(var(--color-text-muted))]"
          variants={itemVariants}
        >
          <span className="text-white font-medium">Aman.</span>
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-primary))]" />
          <span className="text-white font-medium">Cerdas.</span>
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-accent))]" />
          <span className="text-white font-medium">Terintegrasi.</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
