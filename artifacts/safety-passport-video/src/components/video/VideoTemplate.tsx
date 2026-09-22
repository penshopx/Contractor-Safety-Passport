import {
  VideoCanvas,
  VideoPausedContext,
  type VideoAspectRatio,
  useVideoPlayer,
} from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS = {
  intro: 3500,
  solution: 4000,
  field: 4000,
  analytics: 4000,
  outro: 3500,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '16:9';

const SCENE_COMPONENTS = {
  intro: Scene1,
  solution: Scene2,
  field: Scene3,
  analytics: Scene4,
  outro: Scene5,
} as const;

const SCENE_START_SEC = Object.entries(SCENE_DURATIONS).reduce(
  (result, [key, duration]) => {
    result.offsets[key] = result.elapsed / 1000;
    result.elapsed += duration;
    return result;
  },
  { offsets: {} as Record<string, number>, elapsed: 0 },
).offsets;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({
    durations,
    loop,
    paused,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSceneKey = useRef<string | null>(null);
  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent =
    SCENE_COMPONENTS[baseSceneKey as keyof typeof SCENE_COMPONENTS];

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    if (paused) {
      audio.pause();
      return;
    }
    if (lastSceneKey.current !== currentSceneKey) {
      lastSceneKey.current = currentSceneKey;
      const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
      if (Math.abs(audio.currentTime - targetTime) > 0.18) {
        audio.currentTime = targetTime;
      }
    }
    audio.play().catch(() => {});
  }, [baseSceneKey, currentSceneKey, muted, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas
        aspectRatio={VIDEO_ASPECT_RATIO}
        style={{ backgroundColor: 'hsl(var(--color-bg-dark))' }}
      >
        <motion.div 
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
            mixBlendMode: 'overlay'
          }}
        />
        <motion.div
          className="absolute left-0 top-0 z-50 h-2 bg-[hsl(var(--color-primary))]"
          initial={{ width: 0 }}
          animate={{ width: `${(Math.max(0, sceneIndex) / 4) * 100}%` }}
          transition={{ duration: 0.8, ease: "circOut" }}
        />
        <AnimatePresence mode="popLayout">
          {SceneComponent && (
            <SceneComponent key={currentSceneKey} />
          )}
        </AnimatePresence>
        <audio
          ref={audioRef}
          src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
          preload="auto"
          autoPlay
          muted={muted}
        />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
