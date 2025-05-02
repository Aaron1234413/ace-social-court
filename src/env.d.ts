
/// <reference types="vite/client" />

// TensorFlow modules declaration
declare module '@tensorflow/tfjs' {
  export function ready(): Promise<void>;
}

declare module '@tensorflow-models/pose-detection' {
  export interface Pose {
    keypoints: Keypoint[];
    score?: number;
    id?: number;
    box?: {
      xMin: number;
      yMin: number;
      xMax: number;
      yMax: number;
      width: number;
      height: number;
    };
  }
  
  export interface Keypoint {
    x: number;
    y: number;
    z?: number;
    score?: number;
    name?: string;
  }
  
  export interface PoseDetector {
    estimatePoses(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<Pose[]>;
    dispose(): void;
  }
  
  export enum SupportedModels {
    MoveNet = 'MoveNet',
    BlazePose = 'BlazePose',
    PoseNet = 'PoseNet'
  }
  
  export function createDetector(model: SupportedModels, config?: any): Promise<PoseDetector>;
}
