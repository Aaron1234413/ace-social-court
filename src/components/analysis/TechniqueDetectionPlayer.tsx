
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TechniqueDetection } from '@/services/VideoAnalysisService';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface TechniqueDetectionPlayerProps {
  videoUrl: string;
  detections: TechniqueDetection[];
  onSelectDetection: (detection: TechniqueDetection) => void;
}

const TechniqueDetectionPlayer: React.FC<TechniqueDetectionPlayerProps> = ({
  videoUrl,
  detections,
  onSelectDetection,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Sort detections by timestamp
  const sortedDetections = [...detections].sort((a, b) => a.timestamp - b.timestamp);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, []);

  // Find current technique detection based on time
  const currentDetection = sortedDetections.find((detection, index) => {
    const nextDetection = sortedDetections[index + 1];
    return (
      currentTime >= detection.timestamp &&
      (!nextDetection || currentTime < nextDetection.timestamp)
    );
  });

  useEffect(() => {
    if (currentDetection) {
      onSelectDetection(currentDetection);
    }
  }, [currentDetection, onSelectDetection]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSliderChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const jumpToDetection = (detection: TechniqueDetection) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = detection.timestamp;
    video.pause();
    onSelectDetection(detection);
  };

  // Function to format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Jump to next or previous technique
  const jumpToNextTechnique = () => {
    if (!currentDetection || sortedDetections.length <= 1) return;
    
    const currentIndex = sortedDetections.findIndex(d => d === currentDetection);
    if (currentIndex < sortedDetections.length - 1) {
      jumpToDetection(sortedDetections[currentIndex + 1]);
    }
  };

  const jumpToPrevTechnique = () => {
    if (!currentDetection || sortedDetections.length <= 1) return;
    
    const currentIndex = sortedDetections.findIndex(d => d === currentDetection);
    if (currentIndex > 0) {
      jumpToDetection(sortedDetections[currentIndex - 1]);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-black">
        {currentDetection?.boundingBox && (
          <div
            className="absolute border-2 border-red-500 pointer-events-none z-10"
            style={{
              left: `${currentDetection.boundingBox.x * 100}%`,
              top: `${currentDetection.boundingBox.y * 100}%`,
              width: `${currentDetection.boundingBox.width * 100}%`,
              height: `${currentDetection.boundingBox.height * 100}%`,
            }}
          />
        )}
        <video 
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-[600px] object-contain"
          controls={false}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline" 
          size="icon"
          onClick={jumpToPrevTechnique}
          disabled={!currentDetection || sortedDetections.indexOf(currentDetection) === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="outline" 
          size="icon"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline" 
          size="icon"
          onClick={jumpToNextTechnique}
          disabled={!currentDetection || sortedDetections.indexOf(currentDetection) === sortedDetections.length - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      
      <div className="pb-6">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
        />
      </div>
      
      <div className="flex flex-wrap gap-2 mt-2">
        {sortedDetections.map((detection, index) => (
          <Button
            key={`${detection.techniqueType}-${index}`}
            variant={currentDetection === detection ? "default" : "outline"}
            size="sm"
            onClick={() => jumpToDetection(detection)}
            className="flex items-center gap-1"
          >
            {detection.techniqueType}
            <span className="text-xs opacity-80">
              {formatTime(detection.timestamp)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TechniqueDetectionPlayer;
