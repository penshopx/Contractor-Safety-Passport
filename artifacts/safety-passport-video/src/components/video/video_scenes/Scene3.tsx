import { motion } from 'framer-motion';

export function Scene3() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 1, 
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--color-bg-dark))] overflow-hidden"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={containerVariants}
    >
      {/* Background */}
      <motion.div 
        className="absolute inset-0 opacity-40 mix-blend-screen"
        initial={{ scale: 1.05, y: '5%' }}
        animate={{ scale: 1, y: '0%' }}
        transition={{ duration: 4.5, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/bg_tablet.jpg`}
          alt="Engineer with tablet"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[hsl(var(--color-bg-dark))]/60" />
      </motion.div>

      {/* Grid Overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(to right, hsl(var(--color-text-muted)/0.1) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--color-text-muted)/0.1) 1px, transparent 1px)',
        backgroundSize: '4rem 4rem',
        maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)'
      }} />

      {/* Frame Elements */}
      <motion.div 
        className="absolute inset-12 border border-[hsl(var(--color-primary))/40] rounded-3xl"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "circOut" }}
      >
        <div className="absolute top-0 left-12 w-24 h-px bg-[hsl(var(--color-primary))] -translate-y-px" />
        <div className="absolute bottom-0 right-12 w-24 h-px bg-[hsl(var(--color-primary))] translate-y-px" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl text-center flex flex-col items-center">
        <motion.div 
          className="w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-[hsl(var(--color-accent))] to-[hsl(var(--color-primary))] flex items-center justify-center shadow-[0_0_40px_hsl(var(--color-primary))/40]"
          variants={textVariants}
        >
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </motion.div>

        <motion.h2 
          className="font-display text-6xl md:text-8xl font-bold leading-tight mb-6 text-white"
          variants={textVariants}
        >
          Dirancang Untuk <br/>
          <span className="text-gradient-orange">Lapangan.</span>
        </motion.h2>

        <motion.div className="flex gap-4 justify-center" variants={textVariants}>
          {["Mode Offline", "Sinkronisasi Otomatis", "Unggah Foto"].map((tag, i) => (
            <div key={i} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[hsl(var(--color-text-main))] text-xl font-medium">
              {tag}
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
