import { motion } from 'framer-motion';

export function Scene4() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    },
    exit: { 
      opacity: 0,
      rotateX: -15,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -30 },
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
      className="absolute inset-0 flex flex-col justify-center px-24 bg-[hsl(var(--color-bg-dark))] overflow-hidden"
      style={{ perspective: 1000 }}
      initial="hidden"
      animate="show"
      exit="exit"
      variants={containerVariants}
    >
      {/* Dynamic Data Ring Background */}
      <div className="absolute inset-0 flex items-center justify-end -right-1/4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-[2px] border-[hsl(var(--color-accent))]/20"
            style={{ 
              width: `${60 + i * 20}vw`, 
              height: `${60 + i * 20}vw`,
              borderStyle: i % 2 === 0 ? 'solid' : 'dashed'
            }}
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 20 + i * 10, 
              ease: "linear", 
              repeat: Infinity 
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-2/3">
        <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
          <div className="w-16 h-px bg-[hsl(var(--color-accent))]" />
          <span className="font-display tracking-widest text-[hsl(var(--color-accent))] font-bold text-lg uppercase">
            Analitik & Laporan
          </span>
        </motion.div>

        <motion.h2 
          className="font-display text-7xl font-bold leading-tight mb-8 text-white"
          variants={itemVariants}
        >
          Tingkatkan <br/>
          Kinerja <span className="text-gradient">K3.</span>
        </motion.h2>

        <motion.div 
          className="grid grid-cols-2 gap-8 mb-12"
          variants={itemVariants}
        >
          {[
            { value: "100%", label: "Audit Proyek" },
            { value: "24/7", label: "Evaluasi Kontraktor" }
          ].map((stat, i) => (
            <div key={i} className="border-l-2 border-[hsl(var(--color-primary))] pl-6">
              <div className="font-display text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-[hsl(var(--color-text-muted))] text-xl">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.p 
          className="text-2xl text-[hsl(var(--color-text-muted))] font-light"
          variants={itemVariants}
        >
          Pantau semua laporan di satu tempat.
        </motion.p>
      </div>

      {/* Floating Chart Element */}
      <motion.div
        className="absolute right-24 bottom-24 w-96 h-64 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md"
        initial={{ opacity: 0, y: 100, rotateY: -30 }}
        animate={{ opacity: 1, y: 0, rotateY: -15 }}
        transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
      >
        <div className="h-full flex items-end justify-between gap-4">
          {[40, 70, 45, 90, 60, 100].map((h, i) => (
            <motion.div
              key={i}
              className="w-full bg-gradient-to-t from-[hsl(var(--color-primary))] to-[hsl(var(--color-accent))] rounded-t-sm"
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 1.5 + i * 0.1, duration: 1, ease: "circOut" }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
