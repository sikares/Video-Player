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
  const [isSound, setIsSound] = useState(true);
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

  useEffect(() => {
    const savedVolume = localStorage.getItem('videoVolume');
    if (savedVolume) {
      const parsedVolume = parseFloat(savedVolume);
      setVolume(parsedVolume);
      setIsSound(parsedVolume > 0);
      if (videoRef.current) {
        videoRef.current.volume = parsedVolume;
      }
    }
  }, []);

  const increaseVolume = () => {
    const video = videoRef.current;
    if (video) {
      const newVolume = Math.min(volume + 1, 1);
      video.volume = newVolume;
      setVolume(newVolume);
      setIsSound(true);
      localStorage.setItem('videoVolume', newVolume.toString());
    }
  };

  const muteVideo = () => {
    const video = videoRef.current;
    if (video) {
      video.volume = 0;
      setVolume(0);
      setIsSound(false);
      localStorage.setItem('videoVolume', '0');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      setVolume(newVolume);
      setIsSound(newVolume > 0);
      localStorage.setItem('videoVolume', newVolume.toString());
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

const handleRewind = () => {
  const video = videoRef.current;
  if (video) {
    video.currentTime = Math.max(video.currentTime - 5, 0);
  }
};

const handleForward = () => {
  const video = videoRef.current;
  if (video) {
    video.currentTime = Math.min(video.currentTime + 5, video.duration);
  }
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
            <svg className="w-7 h-7 text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24" fill="none"
            viewBox="0 0 24 24">
            <path stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 6H8a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Zm7 0h-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Z"/>
          </svg>
          
          ) : (
            <svg className="w-7 h-7 text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24" fill="none"
            viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 18V6l8 6-8 6Z"/>
          </svg>

          )}
        </button>

        {/* ฺ Backward Button */}
        <button
          onClick={handleRewind}
          className="text-white focus:outline-none"
          aria-label="Rewind 5 seconds"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14l-7-7 7-7zM19 5v14l-7-7 7-7z" />
          </svg>
        </button>

        {/*  ฺForward Button */}
        <button
          onClick={handleForward}
          className="text-white focus:outline-none"
          aria-label="Forward 5 seconds"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14l7-7-7-7zM5 5v14l7-7-7-7z" />
          </svg>
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
            const duration = videoRef.current?.duration || 1;
            const markerPosition = (timestamp.time / duration) * 100;
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
        <button onClick={isSound ? muteVideo : increaseVolume} className="text-white" aria-label={isSound ? "Volume Mute" : "Volume Up"}>
          {isSound ? (
            <svg className="w-6 h-6 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.5 8.43A4.985 4.985 0 0 1 17 12a4.984 4.984 0 0 1-1.43 3.5m2.794 2.864A8.972 8.972 0 0 0 21 12a8.972 8.972 0 0 0-2.636-6.364M12 6.135v11.73a1 1 0 0 1-1.64.768L6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l4.36-3.633a1 1 0 0 1 1.64.768Z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.5 8.43A4.985 4.985 0 0 1 17 12c0 1.126-.5 2.5-1.5 3.5m2.864-9.864A8.972 8.972 0 0 1 21 12c0 2.023-.5 4.5-2.5 6M7.8 7.5l2.56-2.133a1 1 0 0 1 1.64.768V12m0 4.5v1.365a1 1 0 0 1-1.64.768L6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1m1-4 14 14" />
            </svg>
          )}
        </button>

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
            <svg className="w-6 h-6 text-white"
            aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
            width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round"
            stroke-linejoin="round" stroke-width="2"
            d="M5 9h4m0 0V5m0 4L4 4m15 5h-4m0 0V5m0 4 5-5M5 15h4m0 0v4m0-4-5 5m15-5h-4m0 0v4m0-4 5 5"/>
          </svg>
          
          ) : (
            <svg className="w-6 h-6 text-white"
            aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
            width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round"
            stroke-linejoin="round" stroke-width="2"
            d="M8 4H4m0 0v4m0-4 5 5m7-5h4m0 0v4m0-4-5 5M8 20H4m0 0v-4m0 4 5-5m7 5h4m0 0v-4m0 4-5-5"/>
          </svg>

          )}
        </button>
      </div>
    </div>
    </div>
  )
}

export default VideoPlayer