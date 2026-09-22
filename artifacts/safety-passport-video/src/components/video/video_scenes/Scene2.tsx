import { motion } from 'framer-motion';

export function Scene2() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    },
    exit: { 
      opacity: 0,
      x: '-10%',
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    show: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { 
        duration: 1, 
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-end px-24 bg-[hsl(var(--color-bg-dark))] overflow-hidden"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={containerVariants}
    >
      {/* Background Layer */}
      <motion.div 
        className="absolute inset-0 opacity-50 mix-blend-screen"
        initial={{ x: '-10%', scale: 1.1 }}
        animate={{ x: '0%', scale: 1 }}
        transition={{ duration: 4.5, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/bg_data.jpg`}
          alt="Data Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[hsl(var(--color-bg-dark))] via-[hsl(var(--color-bg-dark))/90] to-transparent" />
      </motion.div>

      {/* Floating 3D Elements */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/4 w-[30vw] h-[10vh] border border-[hsl(var(--color-accent))/30] rounded-xl bg-[hsl(var(--color-accent))/5] backdrop-blur-sm"
          style={{ 
            top: `${20 + i * 20}%`, 
            zIndex: 5
          }}
          initial={{ opacity: 0, x: -100, rotateY: 45 }}
          animate={{ opacity: 1, x: 0, rotateY: 15 }}
          transition={{ 
            delay: 0.5 + (i * 0.2), 
            duration: 1.5, 
            ease: "easeOut" 
          }}
        >
          <div className="flex h-full items-center px-8 gap-6">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--color-primary))] opacity-80" />
            <div className="space-y-2 flex-1">
              <div className="h-2 w-1/3 bg-[hsl(var(--color-text-main))] rounded" />
              <div className="h-2 w-2/3 bg-[hsl(var(--color-text-muted))] rounded" />
            </div>
            <div className="text-[hsl(var(--color-primary))] font-mono">100%</div>
          </div>
        </motion.div>
      ))}

      {/* Content */}
      <div className="relative z-10 w-1/2 text-right">
        <motion.div variants={itemVariants} className="mb-4">
          <span className="inline-block px-4 py-2 border border-[hsl(var(--color-accent))] text-[hsl(var(--color-accent))] rounded-full font-display uppercase tracking-widest text-sm font-bold">
            Solusi Digital
          </span>
        </motion.div>

        <motion.h2 
          className="font-display text-7xl font-bold leading-[1.1] mb-6 text-white"
          variants={itemVariants}
        >
          Safety Passport
        </motion.h2>

        <motion.div variants={itemVariants} className="w-full h-px bg-gradient-to-r from-transparent via-[hsl(var(--color-text-muted))/30] to-[hsl(var(--color-primary))] mb-8" />

        <motion.p 
          className="text-2xl text-[hsl(var(--color-text-muted))] font-light leading-relaxed"
          variants={itemVariants}
        >
          Pantau RKK, CSMS, dan Kepatuhan K3 secara real-time. Semuanya dalam satu genggaman.
        </motion.p>
      </div>
    </motion.div>
  );
}
