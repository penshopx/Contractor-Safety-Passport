import { motion } from 'framer-motion';

export function Scene1() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    },
    exit: { 
      opacity: 0,
      scale: 1.05,
      filter: 'blur(10px)',
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, rotateX: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0,
      transition: { 
        duration: 1.2, 
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-start px-24 bg-black overflow-hidden"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={containerVariants}
    >
      {/* Background Image */}
      <motion.div 
        className="absolute inset-0 opacity-40 mix-blend-luminosity"
        initial={{ scale: 1.2, filter: 'blur(20px)' }}
        animate={{ scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 4, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/bg_industrial.jpg`}
          alt="Industrial background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--color-bg-dark))] via-[hsl(var(--color-bg-dark))/80] to-transparent" />
      </motion.div>

      {/* Decorative Accents */}
      <motion.div 
        className="absolute left-0 top-1/4 w-32 h-1 bg-[hsl(var(--color-primary))]"
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 1, ease: 'circOut' }}
      />
      
      <motion.div 
        className="absolute right-24 bottom-24 w-[40vw] h-[40vw] rounded-full border border-[hsl(var(--color-primary))/20]"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 1 }}
        transition={{ delay: 0.2, duration: 3, ease: 'easeOut' }}
      />

      <div className="relative z-10 max-w-4xl pt-16">
        <motion.div className="flex items-center gap-4 mb-6" variants={itemVariants}>
          <div className="w-4 h-4 rounded-full bg-[hsl(var(--color-primary))] animate-pulse" />
          <span className="font-display tracking-widest uppercase text-[hsl(var(--color-primary))] text-xl font-bold">
            Masalah Industri
          </span>
        </motion.div>
        
        <motion.h1 
          className="font-display text-7xl md:text-8xl font-bold leading-[1.1] mb-8 text-white tracking-tight"
          variants={itemVariants}
        >
          Keselamatan Bukan Sekadar <br/>
          <span className="text-gradient-orange italic">Dokumen.</span>
        </motion.h1>

        <motion.p 
          className="text-2xl text-[hsl(var(--color-text-muted))] max-w-2xl font-light"
          variants={itemVariants}
        >
          Tinggalkan cara lama. Saatnya beralih ke sistem digital yang aman, cerdas, dan terintegrasi.
        </motion.p>
      </div>
    </motion.div>
  );
}
