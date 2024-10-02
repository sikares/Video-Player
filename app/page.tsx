import VideoPlayer, { Timestamp } from "./components/VideoPlayer";

const App = () => {
  const videoSrc = '/videos/Video.mp4';
  const videoSources = [
    { quality: '720p', src: 'your-video-720p-url.mp4' },
    { quality: '1080p', src: 'your-video-1080p-url.mp4' },
  ];

  const timestamps: Timestamp[] = [
    { time: 30, label: "First Timestamp", triggered: false },
    { time: 65, label: "Second Timestamp", triggered: false },
  ];

  return (
    <div>
      <VideoPlayer src={videoSrc} sources={videoSources} timestamps={timestamps} />
    </div>
  );
};

export default App;