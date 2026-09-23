import { motion } from 'framer-motion';
import { SceneLayout, SafeFrame, VideoText } from '@/lib/video';
import { ClipboardList, Scale, CheckCircle } from 'lucide-react';

export function Scene2() {
  return (
    <SceneLayout>
      <SafeFrame>
        {/* Background Layer */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 0.3, x: 0 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 4.5, ease: "easeOut" }}
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/bg_industrial.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[hsl(var(--color-bg-dark))] via-[hsl(var(--color-bg-dark))/60] to-transparent" />

        <div className="relative z-10 flex h-full w-full items-center px-[8vw] gap-[4vw]">
          
          {/* Left Content */}
          <div className="flex-1 space-y-[3vw]">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-[1.5vw]"
            >
              <div className="inline-flex items-center gap-[0.5vw] rounded-full border border-[hsl(var(--color-primary))/30] bg-[hsl(var(--color-primary))/10] px-[1.5vw] py-[0.5vw]">
                <ClipboardList className="h-[2vw] w-[2vw] text-[hsl(var(--color-primary))]" />
                <VideoText className="text-[1.5vw] text-[hsl(var(--color-primary))]">
                  Ruang Kerja Spesifik
                </VideoText>
              </div>
              <VideoText className="text-[3.5vw] font-bold leading-tight text-white">
                Pemantauan <br /> Kesiapan CSMS
              </VideoText>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-[1.5vw]"
            >
              <div className="inline-flex items-center gap-[0.5vw] rounded-full border border-[hsl(var(--color-accent))/30] bg-[hsl(var(--color-accent))/10] px-[1.5vw] py-[0.5vw]">
                <Scale className="h-[2vw] w-[2vw] text-[hsl(var(--color-accent))]" />
                <VideoText className="text-[1.5vw] text-[hsl(var(--color-accent))]">
                  Dukungan Keputusan
                </VideoText>
              </div>
              <VideoText className="text-[3vw] font-bold leading-tight text-white/90">
                Pencocokan <br /> Kualifikasi Proyek
              </VideoText>
            </motion.div>
          </div>

          {/* Right Floating UI Elements */}
          <div className="flex-1 relative h-full flex flex-col justify-center">
            <motion.div 
              className="w-full rounded-2xl border border-white/10 bg-[#101010]/80 p-[2vw] backdrop-blur-md shadow-2xl relative z-20"
              initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 100 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex gap-[1vw] mb-[1vw] text-[1.2vw] text-white/60 font-medium">
                <div className="flex-1 pb-[0.5vw] border-b border-white/10">Syarat Proyek</div>
                <div className="flex-1 pb-[0.5vw] border-b border-white/10">Profil Tersedia</div>
              </div>
              <div className="space-y-[1vw]">
                <motion.div 
                  className="flex gap-[1vw]"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 1.5 }}
                >
                  <div className="flex-1 p-[1vw] bg-white/5 rounded-lg border border-white/5 text-[1.2vw]">Klasifikasi Bangunan Sipil</div>
                  <div className="flex-1 p-[1vw] bg-[hsl(var(--color-primary))/10] rounded-lg border border-[hsl(var(--color-primary))/30] text-[1.2vw] text-[hsl(var(--color-primary))] flex justify-between items-center">
                    Kualifikasi Menengah
                  </div>
                </motion.div>
                <motion.div 
                  className="flex gap-[1vw]"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 1.8 }}
                >
                  <div className="flex-1 p-[1vw] bg-white/5 rounded-lg border border-white/5 text-[1.2vw]">Tenaga Ahli K3</div>
                  <div className="flex-1 p-[1vw] bg-[hsl(var(--color-accent))/10] rounded-lg border border-[hsl(var(--color-accent))/30] text-[1.2vw] text-[hsl(var(--color-accent))] flex justify-between items-center">
                    Bukti Kompetensi Dilampirkan
                  </div>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Decorative circles */}
            <motion.div 
              className="absolute -right-[4vw] top-[30%] w-[20vw] h-[20vw] rounded-full border border-[hsl(var(--color-primary))/20] z-10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 1 }}
            />
            <motion.div 
              className="absolute -right-[2vw] top-[35%] w-[16vw] h-[16vw] rounded-full border border-[hsl(var(--color-accent))/20] z-10"
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
