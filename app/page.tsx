import VideoPlayer, { Timestamp } from "./components/VideoPlayer";

const App = () => {
  const videoSrc = '/videos/Video.mp4';
  const videoSources = [
    { quality: '720p', src: '/videos/Video.mp4' },
    { quality: '1080p', src: '/videos/Video.mp4' },
  ];

  const timestamps: Timestamp[] = [
    { time: 30, label: "First Timestamp", countdownTime: 3800, triggered: false },
    { time: 65, label: "Second Timestamp", countdownTime: 30, triggered: false },
    { time: 80, label: "Third Timestamp", countdownTime: 30, triggered: false },
  ];

  return (
    <div>
      <VideoPlayer src={videoSrc} sources={videoSources} timestamps={timestamps} />
    </div>
  );
}

export default App;