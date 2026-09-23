import { motion } from 'framer-motion';
import { SceneLayout, SafeFrame } from '@/lib/video';
import { ClipboardList, Scale, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

export function Scene2() {
  return (
    <SceneLayout>
      <SafeFrame>
        {/* Background Layer */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ opacity: 0.15, x: 50 }}
          animate={{ opacity: 0.35, x: 0 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 4.5, ease: "easeOut" }}
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/bg_industrial.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[hsl(var(--color-bg-dark))] via-[hsl(var(--color-bg-dark))/70] to-transparent" />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[hsl(var(--color-bg-dark))] to-transparent" />

        <div className="relative z-10 flex h-full w-full items-center px-[6vw] gap-[6vw]">
          
          {/* Left Content */}
          <div className="w-[45%] space-y-[4vw]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-[2vw]"
            >
              <div className="inline-flex items-center gap-[0.8vw] rounded-full border border-[hsl(var(--color-primary))/40] bg-[hsl(var(--color-primary))/15] px-[2vw] py-[0.8vw]">
                <ClipboardList className="h-[2vw] w-[2vw] text-[hsl(var(--color-primary))]" />
                <div className="text-[1.8vw] font-medium text-[hsl(var(--color-primary))]">
                  Ruang Kerja Spesifik
                </div>
              </div>
              <div className="text-[4.5vw] font-bold leading-[1.1] text-white">
                Pemantauan <br /> Kesiapan CSMS
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-[2vw]"
            >
              <div className="inline-flex items-center gap-[0.8vw] rounded-full border border-[hsl(var(--color-accent))/40] bg-[hsl(var(--color-accent))/15] px-[2vw] py-[0.8vw]">
                <Scale className="h-[2vw] w-[2vw] text-[hsl(var(--color-accent))]" />
                <div className="text-[1.8vw] font-medium text-[hsl(var(--color-accent))]">
                  Dukungan Keputusan
                </div>
              </div>
              <div className="text-[3.5vw] font-bold leading-[1.1] text-white/90">
                Pencocokan <br /> Kualifikasi Proyek
              </div>
            </motion.div>
          </div>

          {/* Right Floating UI Elements */}
          <div className="w-[55%] relative h-full flex flex-col justify-center perspective-1000">
            {/* Background connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0">
              <motion.path 
                d="M 100,200 C 300,200 300,400 500,400" 
                stroke="hsl(var(--color-primary))" 
                strokeWidth="4" 
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
              />
            </svg>

            <motion.div 
              className="w-full rounded-[1.5vw] border border-white/10 bg-[#151515]/95 p-[3vw] backdrop-blur-xl shadow-2xl relative z-20"
              initial={{ opacity: 0, scale: 0.95, rotateY: 15, x: 30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 50 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between mb-[3vw]">
                <div className="flex items-center gap-[1vw]">
                  <Activity className="w-[2vw] h-[2vw] text-white/50" />
                  <div className="text-[2vw] font-bold text-white">Analisis Syarat</div>
                </div>
                <div className="px-[1vw] py-[0.5vw] bg-white/10 rounded-full text-[1.2vw] text-white/70">
                  ID: PRJ-2024
                </div>
              </div>

              <div className="flex gap-[2vw] mb-[1.5vw] text-[1.4vw] text-white/50 font-medium px-[1vw]">
                <div className="flex-1 pb-[1vw] border-b-[2px] border-white/10">Kebutuhan Proyek</div>
                <div className="w-[3vw]"></div>
                <div className="flex-1 pb-[1vw] border-b-[2px] border-white/10">Profil Kontraktor</div>
              </div>

              <div className="space-y-[1.5vw]">
                <motion.div 
                  className="flex items-center gap-[2vw]"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <div className="flex-1 p-[1.5vw] bg-white/5 rounded-xl border border-white/5 text-[1.6vw] text-white/90">
                    Klasifikasi Sipil
                  </div>
                  <ChevronRight className="w-[3vw] h-[3vw] text-white/20 shrink-0" />
                  <div className="flex-1 p-[1.5vw] bg-[hsl(var(--color-primary))/15] rounded-xl border border-[hsl(var(--color-primary))/40] text-[1.6vw] font-medium text-[hsl(var(--color-primary))] flex items-center justify-between">
                    Kualifikasi Menengah
                    <CheckCircle2 className="w-[2vw] h-[2vw]" />
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-[2vw]"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <div className="flex-1 p-[1.5vw] bg-white/5 rounded-xl border border-white/5 text-[1.6vw] text-white/90">
                    Tenaga Ahli K3
                  </div>
                  <ChevronRight className="w-[3vw] h-[3vw] text-white/20 shrink-0" />
                  <div className="flex-1 p-[1.5vw] bg-[hsl(var(--color-accent))/15] rounded-xl border border-[hsl(var(--color-accent))/40] text-[1.6vw] font-medium text-[hsl(var(--color-accent))] flex items-center justify-between">
                    Bukti Dilampirkan
                    <CheckCircle2 className="w-[2vw] h-[2vw]" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Decorative circles */}
            <motion.div 
              className="absolute -right-[6vw] top-[20%] w-[30vw] h-[30vw] rounded-full border-[2px] border-[hsl(var(--color-primary))/20] z-10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 1 }}
            />
            <motion.div 
              className="absolute -right-[2vw] top-[30%] w-[22vw] h-[22vw] rounded-full border-[2px] border-[hsl(var(--color-accent))/20] z-10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 1.2 }}
            />
          </div>

        </div>
      </SafeFrame>
    </SceneLayout>
  );
}
