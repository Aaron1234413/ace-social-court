
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

export interface PoseDetectionOptions {
  modelType?: 'movenet' | 'blazepose' | 'posenet';
  modelConfig?: any;
}

export interface PoseDetectionResult {
  poses: poseDetection.Pose[];
  timestamp: number;
}

// Default configuration for MoveNet model (fastest and lightweight)
const DEFAULT_MODEL_CONFIG: PoseDetectionOptions = {
  modelType: 'movenet',
  modelConfig: {
    modelType: 'lightning',
    enableSmoothing: true,
  }
};

let detector: poseDetection.PoseDetector | null = null;

/**
 * Initialize the pose detector
 */
export async function initializePoseDetector(
  options: PoseDetectionOptions = DEFAULT_MODEL_CONFIG
): Promise<void> {
  try {
    // Make sure TensorFlow.js is initialized
    await tf.ready();
    
    // Create detector based on options
    const modelType = options.modelType || DEFAULT_MODEL_CONFIG.modelType;
    
    switch (modelType) {
      case 'movenet':
        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          options.modelConfig || DEFAULT_MODEL_CONFIG.modelConfig
        );
        break;
      case 'blazepose':
        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.BlazePose,
          options.modelConfig || { runtime: 'tfjs' }
        );
        break;
      case 'posenet':
        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.PoseNet,
          options.modelConfig || {}
        );
        break;
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
    
    console.log(`Pose detector initialized with model: ${modelType}`);
    
  } catch (error) {
    console.error('Error initializing pose detector:', error);
    throw error;
  }
}

/**
 * Detect poses in an image or video frame
 */
export async function detectPoses(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<PoseDetectionResult | null> {
  if (!detector) {
    console.warn('Pose detector not initialized. Call initializePoseDetector first.');
    return null;
  }
  
  try {
    const poses = await detector.estimatePoses(source);
    return {
      poses,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error detecting poses:', error);
    return null;
  }
}

/**
 * Clean up resources used by the detector
 */
export function disposePoseDetector(): void {
  if (detector) {
    detector.dispose();
    detector = null;
    console.log('Pose detector disposed');
  }
}
