import { motion } from 'framer-motion';
import { SceneLayout, SafeFrame, VideoText } from '@/lib/video';
import { WifiOff, ShieldAlert } from 'lucide-react';

export function Scene4() {
  return (
    <SceneLayout>
      <SafeFrame>
        {/* Background Layer */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 0.3, x: 0 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 4.5, ease: "easeOut" }}
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/bg_tablet.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'left center',
          }}
        />
        
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[hsl(var(--color-bg-dark))] via-[hsl(var(--color-bg-dark))/60] to-transparent" />

        <div className="relative z-10 flex h-full w-full items-center px-[8vw] gap-[4vw] flex-row-reverse">
          
          {/* Right Content */}
          <div className="flex-1 space-y-[3vw] pl-[4vw]">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-[1.5vw]"
            >
              <div className="inline-flex items-center gap-[0.5vw] rounded-full border border-[hsl(var(--color-primary))/30] bg-[hsl(var(--color-primary))/10] px-[1.5vw] py-[0.5vw]">
                <WifiOff className="h-[2vw] w-[2vw] text-[hsl(var(--color-primary))]" />
                <VideoText className="text-[1.5vw] text-[hsl(var(--color-primary))]">
                  Ketahanan Jaringan
                </VideoText>
              </div>
              <VideoText className="text-[3.5vw] font-bold leading-tight text-white">
                Pengumpulan <br /> Bukti Lapangan
              </VideoText>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <VideoText className="text-[2.2vw] text-white/70 max-w-[30vw] leading-relaxed">
                Tetap rekam inspeksi dan temuan meski tanpa sinyal. Sistem menyerap foto dan data, menyimpannya dalam antrean.
              </VideoText>
            </motion.div>
          </div>

          {/* Left Floating Mobile UI */}
          <div className="flex-1 relative h-full flex flex-col justify-center items-center">
            <motion.div 
              className="w-[20vw] h-[40vw] rounded-[3vw] border-[0.8vw] border-white/10 bg-[#101010] p-[1.5vw] shadow-2xl relative z-20 flex flex-col"
              initial={{ opacity: 0, y: 100, rotateZ: -5 }}
              animate={{ opacity: 1, y: 0, rotateZ: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Mobile Header */}
              <div className="flex justify-between items-center mb-[2vw]">
                <div className="w-[6vw] h-[0.5vw] bg-white/20 rounded-full mx-auto" />
              </div>
              
              <div className="flex justify-between items-center mb-[2vw]">
                <VideoText className="text-[1.2vw] font-medium text-white/80">Inspeksi Harian</VideoText>
                <motion.div
                  animate={{ color: ["#ef4444", "#fbbf24"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                >
                  <WifiOff className="w-[1.5vw] h-[1.5vw]" />
                </motion.div>
              </div>

              {/* Photo placeholder */}
              <div className="w-full h-[12vw] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mb-[2vw] relative overflow-hidden">
                <ShieldAlert className="w-[3vw] h-[3vw] text-white/20" />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--color-primary))/20] to-transparent"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.5, delay: 1.5 }}
                />
              </div>

              {/* Form lines */}
              <div className="space-y-[1vw] mb-auto">
                <div className="h-[1vw] w-[80%] bg-white/10 rounded-full" />
                <div className="h-[1vw] w-[60%] bg-white/10 rounded-full" />
                <div className="h-[1vw] w-[90%] bg-white/10 rounded-full" />
              </div>

              {/* Action Button */}
              <motion.div 
                className="w-full py-[1vw] bg-[hsl(var(--color-primary))/20] border border-[hsl(var(--color-primary))/50] rounded-[0.5vw] flex justify-center mt-[1.5vw]"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                <VideoText className="text-[1vw] text-[hsl(var(--color-primary))] font-medium">Simpan ke Antrean</VideoText>
              </motion.div>
            </motion.div>
            
            {/* Sync Waves background */}
            <motion.div 
              className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-[35vw] h-[35vw] rounded-full border-[0.2vw] border-[hsl(var(--color-primary))/20] z-10"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 2, delay: 1, repeat: Infinity }}
            />
            <motion.div 
              className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-[25vw] h-[25vw] rounded-full border-[0.2vw] border-[hsl(var(--color-primary))/40] z-10"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 2, delay: 1.5, repeat: Infinity }}
            />
          </div>

        </div>
      </SafeFrame>
    </SceneLayout>
  );
}
