import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  Check,
  Tv,
  Sparkles,
  Cloud,
  Youtube,
  FolderOpen,
} from 'lucide-react';
import {
  detectVideoType,
  getYouTubeEmbedUrl,
  getGoogleDriveEmbedUrl,
  getVimeoEmbedUrl,
  getVideoProviderInfo,
} from '../../utils/youtube';

interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  duration?: string;
  userEmail?: string;
  userName?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  duration,
  userEmail,
  userName,
  autoPlay = false,
  onEnded,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPos, setHoverPos] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [rippleActive, setRippleActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const videoType = detectVideoType(videoUrl);
  const providerInfo = getVideoProviderInfo(videoUrl);

  // Reset player when URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setBufferedEnd(0);
    setHasError(false);
    setErrorMessage(null);
    setIsBuffering(false);
  }, [videoUrl]);

  // Handle Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls auto-hide timer
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        setShowSpeedMenu(false);
      }, 2500);
    }
  }, [isPlaying]);

  const handleMouseMove = () => {
    showControls();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setControlsVisible(false);
      setShowSpeedMenu(false);
    }
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setRippleActive(true);
        setTimeout(() => setRippleActive(false), 500);
      }).catch((err) => {
        console.warn('Playback blocked or failed:', err);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setRippleActive(true);
      setTimeout(() => setRippleActive(false), 500);
    }
    showControls();
  }, [showControls]);

  // Volume & Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    videoRef.current.volume = clamped;
    setVolume(clamped);
    if (clamped === 0) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  // Skip Rewind / Forward
  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(videoDuration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    showControls();
  };

  // Playback Speed
  const handleSpeedSelect = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (err) {
      console.warn('PiP not available or failed:', err);
    }
  };

  // Timeline scrub click & drag
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current || !videoDuration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * videoDuration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoDuration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPos(pos * 100);
    setHoverTime(pos * videoDuration);
    setIsHoveringTimeline(true);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = Math.floor(secs % 60);

    if (hours > 0) {
      return `${hours}:${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
    }
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is focused on an input/textarea
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowLeft' || e.key === 'j') {
        e.preventDefault();
        skipTime(-10);
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        skipTime(10);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(volume + 0.1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(volume - 0.1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, volume, isMuted, videoDuration]);

  // Update buffer percentage
  const handleProgress = () => {
    if (!videoRef.current) return;
    const buf = videoRef.current.buffered;
    if (buf.length > 0) {
      setBufferedEnd(buf.end(buf.length - 1));
    }
  };

  // 1. Fallback for NO video URL
  if (!videoUrl || videoUrl.trim() === '' || videoType === 'none') {
    return (
      <div className="w-full aspect-video bg-gradient-to-br from-slate-900 via-dark-900 to-dark-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-8 text-center text-slate-300 space-y-4 shadow-xl select-none">
        <div className="w-16 h-16 rounded-2xl bg-brand-950/80 border border-brand-800/60 text-brand-400 flex items-center justify-center shadow-lg">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Sparkles className="w-3 h-3" /> Interactive Architecture Lesson
          </div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-400">
            This lesson is authored with in-depth engineering documentation, architecture diagrams, and code snippets below.
          </p>
        </div>
        {duration && (
          <span className="text-[11px] font-mono text-slate-500">
            Est. Reading Duration: {duration}
          </span>
        )}
      </div>
    );
  }

  // 2. YouTube Embed Video Player
  if (videoType === 'youtube') {
    const embedUrl = getYouTubeEmbedUrl(videoUrl, autoPlay);
    return (
      <div className="group relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
        {/* Anti-leak header badge */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/80 pointer-events-none">
          <Youtube className="w-3.5 h-3.5 text-rose-500" />
          <span>NEC Pro Stream • YouTube Gateway</span>
        </div>

        {/* Floating Watermark for Security */}
        {(userEmail || userName) && (
          <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono text-white/30 pointer-events-none select-none">
            {userEmail || userName}
          </div>
        )}

        <iframe
          src={embedUrl || ''}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // 3. Google Drive Embed Player
  if (videoType === 'google_drive') {
    const driveEmbedUrl = getGoogleDriveEmbedUrl(videoUrl);
    return (
      <div className="group relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/80 pointer-events-none">
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Google Drive Cloud Stream</span>
        </div>

        {(userEmail || userName) && (
          <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono text-white/30 pointer-events-none select-none">
            {userEmail || userName}
          </div>
        )}

        <iframe
          src={driveEmbedUrl || ''}
          title={title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  // 4. Vimeo Embed Player
  if (videoType === 'vimeo') {
    const vimeoEmbedUrl = getVimeoEmbedUrl(videoUrl);
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
        <iframe
          src={vimeoEmbedUrl || ''}
          title={title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // 5. High-Performance Native Cloud Stream Player (GCS, Cloudinary, AWS S3, Supabase, Firebase, MP4, WebM)
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
      className="group relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex items-center justify-center select-none"
    >
      {/* HTML5 Native Video Tag */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay={autoPlay}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture={false}
        className="w-full h-full object-contain cursor-pointer"
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
            setHasError(false);
          }
        }}
        onProgress={handleProgress}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onError={() => {
          setHasError(true);
          setErrorMessage(
            'Unable to stream this cloud video. Please check if the URL has public access, valid CORS headers, or is a valid direct MP4/WebM stream.'
          );
        }}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Floating Center Ripple / Pulse Animation */}
      {rippleActive && (
        <div className="absolute pointer-events-none w-20 h-20 rounded-full bg-brand-500/30 flex items-center justify-center animate-ping z-20">
          {isPlaying ? <Play className="w-8 h-8 text-white" /> : <Pause className="w-8 h-8 text-white" />}
        </div>
      )}

      {/* Buffering Loader Spinner */}
      {isBuffering && !hasError && (
        <div className="absolute z-20 flex flex-col items-center gap-2 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-brand-500 animate-spin" />
          <span className="text-[11px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
            Buffering Stream...
          </span>
        </div>
      )}

      {/* Error Recovery Screen */}
      {hasError && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h4 className="text-sm font-bold text-white">Cloud Video Stream Unavailable</h4>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Stream
            </button>
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Test Link in New Tab
            </a>
          </div>
        </div>
      )}

      {/* Center Big Play Button (When Paused) */}
      {!isPlaying && !hasError && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute z-10 w-16 h-16 rounded-full bg-brand-600/90 hover:bg-brand-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all focus:outline-none ring-4 ring-brand-500/30 backdrop-blur-sm"
          aria-label="Play video"
        >
          <Play className="w-7 h-7 ml-1" />
        </button>
      )}

      {/* Top Header Bar (Fades with controls) */}
      <div
        className={`absolute inset-x-0 top-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          controlsVisible || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 max-w-[70%]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white truncate drop-shadow">{title}</span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Cloud className="w-3 h-3" /> {providerInfo.label}
          </span>
        </div>

        {/* Top-Right Watermark & Security Badge */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          {(userEmail || userName) && (
            <span className="hidden md:inline-block px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white/50">
              {userEmail || userName}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">NEC Pro Secure Stream</span>
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2.5 transition-opacity duration-300 ${
          controlsVisible || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Interactive Progress Scrubber */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={() => setIsHoveringTimeline(false)}
          className="group/timeline relative w-full h-2 hover:h-3 bg-white/20 rounded-full cursor-pointer transition-all duration-150 flex items-center"
        >
          {/* Buffer Bar */}
          <div
            className="absolute left-0 top-0 h-full bg-white/30 rounded-full transition-all duration-200"
            style={{ width: `${(bufferedEnd / (videoDuration || 1)) * 100}%` }}
          />

          {/* Played Progress Bar */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full"
            style={{ width: `${(currentTime / (videoDuration || 1)) * 100}%` }}
          />

          {/* Scrubber Knob */}
          <div
            className="absolute -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg border-2 border-brand-500 opacity-0 group-hover/timeline:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `${(currentTime / (videoDuration || 1)) * 100}%` }}
          />

          {/* Hover Time Tooltip */}
          {isHoveringTimeline && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-white text-[10px] font-mono border border-slate-700 pointer-events-none shadow-xl"
              style={{ left: `${hoverPos}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Buttons and Tools Row */}
        <div className="flex items-center justify-between text-xs text-white">
          {/* Left Controls: Play, Skip, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-brand-400 transition-colors focus:outline-none"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Skip 10s Rewind */}
            <button
              type="button"
              onClick={() => skipTime(-10)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors focus:outline-none flex items-center gap-0.5"
              title="Rewind 10 seconds (←)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono">10</span>
            </button>

            {/* Skip 10s Forward */}
            <button
              type="button"
              onClick={() => skipTime(10)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors focus:outline-none flex items-center gap-0.5"
              title="Forward 10 seconds (→)"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono">10</span>
            </button>

            {/* Volume & Slider */}
            <div className="group/vol flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors focus:outline-none"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-14 sm:w-18 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-brand-500 opacity-70 group-hover/vol:opacity-100 transition-opacity"
                title="Volume"
              />
            </div>

            {/* Current Time / Duration */}
            <span className="font-mono text-[11px] text-slate-300 pl-1">
              {formatTime(currentTime)} <span className="text-slate-500">/</span> {formatTime(videoDuration)}
            </span>
          </div>

          {/* Right Controls: Speed, PiP, Shortcuts, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white font-mono text-[11px] font-semibold transition-colors focus:outline-none flex items-center gap-1"
                title="Playback Speed"
              >
                {playbackSpeed}x
              </button>

              {/* Speed Menu Popup */}
              {showSpeedMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-28 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 backdrop-blur-md">
                  <div className="text-[10px] font-mono text-slate-400 px-2 py-1 font-semibold border-b border-slate-800">
                    Playback Speed
                  </div>
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSpeedSelect(speed)}
                      className={`w-full text-left px-2 py-1 rounded-lg text-[11px] font-mono flex items-center justify-between transition-colors ${
                        playbackSpeed === speed
                          ? 'bg-brand-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{speed === 1 ? '1.0x (Normal)' : `${speed}x`}</span>
                      {playbackSpeed === speed && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            {document.pictureInPictureEnabled && (
              <button
                type="button"
                onClick={togglePiP}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none ${
                  isPiPActive ? 'text-brand-400 bg-brand-500/20' : 'text-slate-300 hover:text-white'
                }`}
                title="Picture in Picture"
              >
                <Tv className="w-4 h-4" />
              </button>
            )}

            {/* Keyboard Shortcuts Guide Toggle */}
            <button
              type="button"
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors focus:outline-none"
              title="Keyboard Shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors focus:outline-none"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          onClick={() => setShowShortcuts(false)}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-brand-400" /> Keyboard Shortcuts
              </h4>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/80">
                <span className="text-slate-400">Play / Pause</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-bold">Space / K</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/80">
                <span className="text-slate-400">Fullscreen</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-bold">F</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/80">
                <span className="text-slate-400">Mute / Unmute</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-bold">M</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/80">
                <span className="text-slate-400">Seek ±10s</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-bold">← / →</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/80">
                <span className="text-slate-400">Volume</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-bold">↑ / ↓</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/80">
                <span className="text-slate-400">Dismiss</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-bold">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
