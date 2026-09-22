import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';

const SCENE_DETAILS: Record<string, { title: string; filePath: string }> = {
  intro: {
    title: 'Masalah Industri',
    filePath: 'src/components/video/video_scenes/Scene1.tsx',
  },
  solution: {
    title: 'Solusi Terintegrasi',
    filePath: 'src/components/video/video_scenes/Scene2.tsx',
  },
  field: {
    title: 'Aktivitas Lapangan',
    filePath: 'src/components/video/video_scenes/Scene3.tsx',
  },
  analytics: {
    title: 'Data dan Analitik',
    filePath: 'src/components/video/video_scenes/Scene4.tsx',
  },
  outro: {
    title: 'Safety Passport',
    filePath: 'src/components/video/video_scenes/Scene5.tsx',
  },
};

function formatTime(durationMs: number) {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function announceScene(index: number, sceneKeys: string[]) {
  const key = sceneKeys[index];
  const detail = SCENE_DETAILS[key];
  if (!detail) return;
  window.parent.postMessage(
    {
      type: 'REPLIT_VIDEO_SCENE_SELECTED',
      payload: {
        sceneIndex: index,
        sceneCount: sceneKeys.length,
        sceneTitle: detail.title,
        filePath: detail.filePath,
        lineNumber: 1,
      },
    },
    '*',
  );
}

function PlaybackStatus({
  sceneKeys,
  activeIndex,
  activeDuration,
  activeStartTime,
  totalDuration,
  tick,
  paused,
  onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  activeStartTime: number;
  totalDuration: number;
  tick: number;
  paused: boolean;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedBase = useRef(0);

  useEffect(() => {
    setElapsed(0);
    elapsedBase.current = 0;
  }, [tick]);

  useEffect(() => {
    if (paused) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      setElapsed(elapsedBase.current + performance.now() - startedAt);
    }, 60);
    return () => {
      window.clearInterval(timer);
      elapsedBase.current += performance.now() - startedAt;
    };
  }, [paused, tick]);

  const progress =
    activeDuration > 0 ? Math.min(1, elapsed / activeDuration) : 0;
  const totalElapsed = Math.min(
    totalDuration,
    activeStartTime + Math.min(elapsed, activeDuration),
  );

  return (
    <>
      <div className="flex flex-1 items-center gap-1.5">
        {sceneKeys.map((key, index) => (
          <button
            key={key}
            className="relative h-3 min-h-3 flex-1 overflow-hidden rounded-full bg-white/20 transition-all hover:h-4 hover:bg-white/25"
            onClick={() => onJumpTo(index)}
            aria-label={`Buka adegan ${index + 1}: ${SCENE_DETAILS[key]?.title ?? key}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-white/90"
              style={{
                width: `${index === activeIndex ? progress * 100 : 0}%`,
              }}
            />
          </button>
        ))}
      </div>
      <span className="shrink-0 font-mono text-xl tabular-nums text-white/65">
        {activeIndex + 1}/{sceneKeys.length}
      </span>
      <span className="min-w-[11ch] shrink-0 text-right font-mono text-xl tabular-nums text-white/80">
        {formatTime(totalElapsed)} / {formatTime(totalDuration)}
      </span>
    </>
  );
}

export default function VideoWithControls() {
  const isIframed =
    typeof window !== 'undefined' && window.self !== window.top;

  const controls = useSceneControls(SCENE_DURATIONS);
  const [muted, setMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const sensorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!controls.paused) return;
    const frozen = document
      .getAnimations()
      .filter((animation) => animation.playState === 'running');
    frozen.forEach((animation) => animation.pause());
    return () => frozen.forEach((animation) => animation.play());
  }, [controls.paused]);

  const handleJump = useCallback(
    (index: number) => {
      controls.jumpTo(index);
      announceScene(index, controls.sceneKeys);
    },
    [controls],
  );

  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setHovering(true);
  };
  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setHovering(false);
  };

  if (!isIframed) return <VideoTemplate />;

  const barVisible = !collapsed || hovering;
  const iconButton =
    'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-white/65 transition-colors hover:bg-white/10 hover:text-white';

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <VideoTemplate
        key={controls.mountKey}
        durations={controls.durations}
        paused={controls.paused}
        muted={muted}
        onSceneChange={controls.onSceneChange}
      />
      <div
        ref={sensorRef}
        className="absolute inset-x-0 bottom-0 z-50 flex h-1/4 flex-col justify-end"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div
          className={`flex items-center gap-3 bg-black/55 px-5 py-4 backdrop-blur-md transition-all duration-200 ${
            barVisible
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-full opacity-0'
          }`}
        >
          <button
            className={iconButton}
            onClick={controls.togglePause}
            aria-label={controls.paused ? 'Putar' : 'Jeda'}
            title={controls.paused ? 'Putar' : 'Jeda'}
          >
            {controls.paused ? <Play /> : <Pause />}
          </button>
          <button
            className={`${iconButton} ${controls.locked ? 'bg-white/15 text-white' : ''}`}
            onClick={controls.toggleLock}
            aria-label="Ulangi adegan aktif"
            aria-pressed={controls.locked}
            title="Ulangi adegan aktif"
          >
            <Repeat />
          </button>
          <button
            className={iconButton}
            onClick={() => setMuted((value) => !value)}
            aria-label={muted ? 'Aktifkan suara' : 'Bisukan'}
            title={muted ? 'Aktifkan suara' : 'Bisukan'}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </button>
          <div className="w-px self-stretch bg-white/15" />
          <PlaybackStatus
            sceneKeys={controls.sceneKeys}
            activeIndex={controls.activeIndex}
            activeDuration={controls.activeDuration}
            activeStartTime={controls.activeStartTime}
            totalDuration={controls.totalDuration}
            tick={controls.tick}
            paused={controls.paused}
            onJumpTo={handleJump}
          />
          <button
            className={iconButton}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Tampilkan kontrol' : 'Sembunyikan kontrol'}
            title={collapsed ? 'Tampilkan kontrol' : 'Sembunyikan kontrol'}
          >
            {collapsed ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
      </div>
    </div>
  );
}