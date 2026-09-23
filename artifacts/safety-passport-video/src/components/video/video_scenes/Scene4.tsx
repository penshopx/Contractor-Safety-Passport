import { motion } from 'framer-motion';
import { SceneLayout, SafeFrame } from '@/lib/video';
import { WifiOff, ShieldAlert, Image as ImageIcon, Database, CloudOff } from 'lucide-react';

export function Scene4() {
  return (
    <SceneLayout>
      <SafeFrame>
        {/* Background Layer */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ opacity: 0.15, x: -50 }}
          animate={{ opacity: 0.35, x: 0 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 4.5, ease: "easeOut" }}
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/bg_tablet.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'left center',
          }}
        />
        
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[hsl(var(--color-bg-dark))] via-[hsl(var(--color-bg-dark))/80] to-transparent" />
        <div className="absolute inset-0 z-0 bg-gradient-to-l from-[hsl(var(--color-bg-dark))] via-transparent to-[hsl(var(--color-bg-dark))/60]" />

        <div className="relative z-10 flex h-full w-full items-center px-[8vw] gap-[8vw] flex-row-reverse">
          
          {/* Right Content */}
          <div className="w-[45%] space-y-[4vw]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-[2vw]"
            >
              <div className="inline-flex items-center gap-[0.8vw] rounded-full border border-[hsl(var(--color-primary))/40] bg-[hsl(var(--color-primary))/15] px-[2vw] py-[0.8vw]">
                <WifiOff className="h-[2vw] w-[2vw] text-[hsl(var(--color-primary))]" />
                <div className="text-[1.8vw] font-medium text-[hsl(var(--color-primary))]">
                  Ketahanan Jaringan
                </div>
              </div>
              <div className="text-[4.5vw] font-bold leading-[1.1] text-white">
                Pengumpulan <br /> Bukti Lapangan
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-[2.2vw] text-white/70 leading-relaxed">
                Tetap rekam inspeksi dan temuan meski tanpa sinyal. Sistem menyerap foto dan data, menyimpannya dalam antrean lokal dengan aman.
              </div>
            </motion.div>
          </div>

          {/* Left Floating Mobile UI */}
          <div className="w-[55%] relative h-full flex justify-center items-center perspective-1000">
            {/* Sync Waves background */}
            <motion.div 
              className="absolute w-[45vw] h-[45vw] rounded-full border-[3px] border-[hsl(var(--color-primary))/10] z-0"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 2.5, delay: 1, repeat: Infinity }}
            />
            <motion.div 
              className="absolute w-[35vw] h-[35vw] rounded-full border-[2px] border-[hsl(var(--color-primary))/30] z-0"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 2.5, delay: 1.5, repeat: Infinity }}
            />

            {/* Offline indicator floating */}
            <motion.div 
              className="absolute top-[15%] right-[10%] z-30 bg-[#151515] border-[2px] border-amber-500/50 rounded-full p-[1.5vw] shadow-xl shadow-amber-500/20"
              initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
            >
              <CloudOff className="w-[3vw] h-[3vw] text-amber-500" />
            </motion.div>

            <motion.div 
              className="w-[28vw] h-[55vw] max-h-[85vh] rounded-[3vw] border-[1vw] border-white/10 bg-[#101010] p-[2vw] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative z-20 flex flex-col"
              initial={{ opacity: 0, y: 50, rotateZ: -2, rotateY: -5 }}
              animate={{ opacity: 1, y: 0, rotateZ: 0, rotateY: -5 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Mobile Header */}
              <div className="flex justify-between items-center mb-[2.5vw]">
                <div className="w-[8vw] h-[0.6vw] bg-white/20 rounded-full mx-auto" />
              </div>
              
              <div className="flex justify-between items-center mb-[3vw]">
                <div className="text-[1.8vw] font-bold text-white/90">Inspeksi Harian</div>
                <motion.div
                  className="bg-amber-500/20 px-[1vw] py-[0.5vw] rounded-full flex items-center gap-[0.5vw]"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <WifiOff className="w-[1.2vw] h-[1.2vw] text-amber-500" />
                  <span className="text-[1vw] text-amber-500 font-bold">Offline</span>
                </motion.div>
              </div>

              {/* Photo placeholder */}
              <div className="w-full h-[18vw] bg-[#1a1a1a] rounded-[1.5vw] border-[2px] border-white/10 flex flex-col items-center justify-center mb-[3vw] relative overflow-hidden group">
                <ImageIcon className="w-[4vw] h-[4vw] text-white/20 mb-[1vw]" />
                <div className="text-[1.2vw] text-white/30 font-medium">1 Foto Tersimpan</div>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--color-primary))/20] to-transparent"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.5, delay: 0.8 }}
                />
              </div>

              {/* Form lines */}
              <div className="space-y-[1.5vw] mb-auto">
                <div className="h-[1.5vw] w-full bg-white/10 rounded-full" />
                <div className="h-[1.5vw] w-[85%] bg-white/10 rounded-full" />
                <div className="h-[1.5vw] w-[60%] bg-white/10 rounded-full" />
              </div>

              {/* Action Button */}
              <motion.div 
                className="w-full py-[1.5vw] bg-[#1a1a1a] border-[2px] border-white/20 rounded-[1vw] flex items-center justify-center gap-[1vw] mt-[2vw]"
                initial={{ scale: 0.95, borderColor: "rgba(255,255,255,0.2)" }}
                animate={{ scale: 1, borderColor: "hsla(var(--color-primary), 0.5)" }}
                transition={{ duration: 1, delay: 0.8, repeat: Infinity, repeatType: "reverse" }}
              >
                <Database className="w-[1.5vw] h-[1.5vw] text-[hsl(var(--color-primary))]" />
                <div className="text-[1.4vw] text-[hsl(var(--color-primary))] font-bold">Simpan ke Antrean Lokal</div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </SafeFrame>
    </SceneLayout>
  );
}
