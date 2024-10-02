'use client'
import { useRef, useState, useEffect } from 'react'

export interface Timestamp {
  time: number;
  label: string;
  countdownTime: number;
  triggered: boolean;
}

interface VideoPlayerProps {
  src: string
  sources: { quality: string; src: string }[]
  timestamps: Timestamp[]
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  sources,
  timestamps: initialTimestamps,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [currentSrc, setCurrentSrc] = useState<string>(src)
  const [quality, setQuality] = useState<string>(sources[0]?.quality || '720p')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentPopup, setCurrentPopup] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [countdownInterval, setCountdownInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [timestamps, setTimestamps] = useState<Timestamp[]>(initialTimestamps)

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const duration = video.duration;
      setProgress((current / duration) * 100);

      timestamps.forEach((timestamp) => {
        if (
          Math.floor(current) === Math.floor(timestamp.time) &&
          !timestamp.triggered
        ) {
          setCurrentPopup(`${timestamp.label}`);
          setCountdown(timestamp.countdownTime);
          video.pause();
          setIsPlaying(false);
          setIsCountingDown(false);

          setTimestamps((prev) =>
            prev.map((t) =>
              t.time === timestamp.time ? { ...t, triggered: true } : t
            )
          );
        }
      });
    };

    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [timestamps])

    // Keydown event listener for left and right arrow keys
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        const video = videoRef.current;
        if (!video) return;
        if (event.key === 'ArrowRight') {
          video.currentTime = Math.min(video.currentTime + 5, video.duration);
        } else if (event.key === 'ArrowLeft') {
          video.currentTime = Math.max(video.currentTime - 5, 0);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
        video.volume = value;
        setVolume(value);
    }
};

  const handlePlaybackRateChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const rate = parseFloat(e.target.value)
    const video = videoRef.current
    if (video) {
      video.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  const handleProgressClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const video = videoRef.current
    if (!video) return

    const progressBar = e.currentTarget
    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const newTime = (clickX / width) * video.duration
    video.currentTime = newTime
  }

  const toggleFullscreen = () => {
    const videoContainer = videoRef.current?.parentElement
    if (!videoContainer) return

    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedQuality = e.target.value
    const selectedSource = sources.find(
      (source) => source.quality === selectedQuality
    )
    if (selectedSource) {
      const video = videoRef.current
      if (video) {
        const currentTime = video.currentTime
        const isPlayingNow = !video.paused
        video.src = selectedSource.src
        video.currentTime = currentTime
        if (isPlayingNow) {
          video.play()
        }
        setQuality(selectedQuality)
      }
    }
  }

  const handleVideoClick = () => {
    togglePlayPause()
  }

const handlePopupAction = (action: 'start' | 'stop' | 'close') => {
  const video = videoRef.current;
  if (!video) return;

  if (action === 'start') {
    setIsCountingDown(true);
    setIsPlaying(false);
  
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev && prev > 1) {
          return prev - 1;
        } else {
          clearInterval(interval);
          setCountdownInterval(null);
          setCurrentPopup(null);
          setCountdown(null);
          setIsCountingDown(false);
          video.play();
          setIsPlaying(true);
          return null;
        }
      });
    }, 1000);

    setCountdownInterval(interval);

  } else if (action === 'stop') {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    video.pause();
    setIsPlaying(false);
    setIsCountingDown(false);

  } else if (action === 'close') {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    setCurrentPopup(null);
    setCountdown(null);
    setIsCountingDown(false);
    video.play();
    setIsPlaying(true);
  }
};

const formatTime = (timeInSeconds: number) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="relative w-full max-w-5xl mx-auto bg-black">
      <video
        ref={videoRef}
        src={currentSrc}
        className="w-full h-auto cursor-pointer"
        onClick={handleVideoClick}
      />

      {/* Popup */}
      {currentPopup && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white bg-opacity-90 text-black px-6 py-4 rounded shadow-lg flex flex-col items-center z-3">
            <div className="text-xl font-bold ">{currentPopup}</div>
            {countdown !== null && (
              <div className="font-bold p-4 pb-7 text-xl">
                {formatTime(countdown)}
            </div>
            )}
            <div className="flex space-x-4">
              <button
                onClick={() => handlePopupAction('start')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Start
              </button>
              <button
                onClick={() => handlePopupAction('stop')}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Stop
              </button>
              <button
                onClick={() => handlePopupAction('close')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 flex items-center space-x-4 px-4 py-2">
        <button
          onClick={togglePlayPause}
          className="text-white focus:outline-none"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <polygon points="5,3 19,12 5,21 5,3" />
            </svg>
          )}
        </button>

        {/* Progress Bar */}
        <div
          className="flex-1 h-2 bg-gray-300 rounded cursor-pointer relative"
          onClick={handleProgressClick}
        >
          <div
            className="h-2 bg-red-500 rounded"
            style={{ width: `${progress}%` }}
          ></div>
          
          {/* Yellow markers for timestamps */}
          {timestamps.map((timestamp) => {
            const markerPosition = (timestamp.time / (videoRef.current?.duration || 1)) * 100;
            return (
              <div
                key={timestamp.time}
                className="absolute h-2 bg-yellow-500"
                style={{
                  left: `${markerPosition}%`,
                  top: 0,
                  width: '4px',
                  height: '100%',
                  transform: 'translateX(-50%)',
                }}
              />
            );
          })}
        </div>

        {/* Current Time */}
        <div className="text-white text-sm">
          {videoRef.current
            ? `${Math.floor(videoRef.current.currentTime / 60).toString().padStart(2, '0')}:${(
                '0' + Math.floor(videoRef.current.currentTime % 60)
              ).slice(-2)} / ${Math.floor(videoRef.current.duration / 60).toString().padStart(2, '0')}:${(
                '0' + Math.floor(videoRef.current.duration % 60)
              ).slice(-2)}`
            : '00:00 / 00:00'}
        </div>

        {/* Volume Control */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="w-28 appearance-none bg-white h-2 rounded-full"
          style={{accentColor: 'white'}}
        />

        {/* Playback Rate Control */}
        <select
          onChange={handlePlaybackRateChange}
          value={playbackRate}
          className="bg-gray-700 text-white p-0.5 rounded-md"
        >
          <option value="0.5">0.5x</option>
          <option value="1">1x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>

        {/* Quality Control */}
        <select
          onChange={handleQualityChange}
          value={quality}
          className="bg-gray-700 text-white p-0.5 rounded-md"
        >
          {sources.map((source) => (
            <option key={source.quality} value={source.quality}>
              {source.quality}
            </option>
          ))}
        </select>
        <button onClick={toggleFullscreen} className="text-white">
          {isFullscreen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6h12v12H6z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
    </div>
  )
}

export default VideoPlayer