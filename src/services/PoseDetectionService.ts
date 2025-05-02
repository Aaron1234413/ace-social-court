
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { TechniqueDetection } from './VideoAnalysisService';

// Initialize TensorFlow.js
export async function initializeTensorFlow(): Promise<void> {
  try {
    // Set backend to WebGL for better performance
    await tf.setBackend('webgl');
    console.log('TensorFlow.js initialized successfully with backend:', tf.getBackend());
  } catch (error) {
    console.error('Failed to initialize TensorFlow.js:', error);
    throw error;
  }
}

// Cache the model to avoid reloading it
let detectorSingleton: poseDetection.PoseDetector | null = null;

// Load the MoveNet model
export async function loadPoseDetector(): Promise<poseDetection.PoseDetector> {
  try {
    if (detectorSingleton) {
      return detectorSingleton;
    }

    // Initialize TensorFlow if not already done
    if (tf.getBackend() === null) {
      await initializeTensorFlow();
    }

    const modelConfig: poseDetection.MoveNetModelConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    };

    console.log('Loading MoveNet model...');
    detectorSingleton = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet, 
      modelConfig
    );
    
    console.log('MoveNet model loaded successfully');
    return detectorSingleton;
  } catch (error) {
    console.error('Failed to load pose detector:', error);
    throw error;
  }
}

// Detect poses in a video frame
export async function detectPose(
  video: HTMLVideoElement
): Promise<poseDetection.Pose[]> {
  try {
    const detector = await loadPoseDetector();
    return await detector.estimatePoses(video);
  } catch (error) {
    console.error('Error detecting pose:', error);
    return [];
  }
}

// Map keypoint names to their indices in the keypoints array
const KEYPOINT_DICT: { [key: string]: number } = {
  nose: 0,
  left_eye: 1,
  right_eye: 2,
  left_ear: 3,
  right_ear: 4,
  left_shoulder: 5,
  right_shoulder: 6,
  left_elbow: 7,
  right_elbow: 8,
  left_wrist: 9,
  right_wrist: 10,
  left_hip: 11,
  right_hip: 12,
  left_knee: 13,
  right_knee: 14,
  left_ankle: 15,
  right_ankle: 16,
};

// Tennis technique detection based on pose keypoints
export function detectTennisTechnique(
  poses: poseDetection.Pose[],
  frameTimestamp: number
): TechniqueDetection | null {
  if (!poses || poses.length === 0 || !poses[0].keypoints) {
    return null;
  }

  const pose = poses[0]; // We're using single pose detection
  const keypoints = pose.keypoints;
  
  // Extract key body points
  const rightWrist = keypoints[KEYPOINT_DICT.right_wrist];
  const leftWrist = keypoints[KEYPOINT_DICT.left_wrist];
  const rightShoulder = keypoints[KEYPOINT_DICT.right_shoulder];
  const leftShoulder = keypoints[KEYPOINT_DICT.left_shoulder];
  const rightElbow = keypoints[KEYPOINT_DICT.right_elbow];
  const leftElbow = keypoints[KEYPOINT_DICT.left_elbow];
  const rightHip = keypoints[KEYPOINT_DICT.right_hip];
  const leftHip = keypoints[KEYPOINT_DICT.left_hip];
  
  // Check if we have the necessary keypoints with good confidence
  const minConfidence = 0.3;
  if (!rightWrist || !leftWrist || !rightShoulder || !leftShoulder || 
      !rightElbow || !leftElbow || !rightHip || !leftHip ||
      rightWrist.score < minConfidence || leftWrist.score < minConfidence ||
      rightShoulder.score < minConfidence || leftShoulder.score < minConfidence) {
    return null;
  }

  // Calculate bounding box for the detected technique
  const points = keypoints.filter(kp => kp.score > minConfidence);
  let minX = Math.min(...points.map(p => p.x));
  let maxX = Math.max(...points.map(p => p.x));
  let minY = Math.min(...points.map(p => p.y));
  let maxY = Math.max(...points.map(p => p.y));
  
  // Normalize to 0-1 range based on video dimensions
  const boundingBox = {
    x: minX / 640, // Assuming 640px width, will be updated in real-time
    y: minY / 480, // Assuming 480px height, will be updated in real-time
    width: (maxX - minX) / 640,
    height: (maxY - minY) / 480
  };

  // Detect forehand
  if (isForehand(pose)) {
    return {
      techniqueType: 'forehand',
      confidence: 0.8,
      timestamp: frameTimestamp,
      boundingBox,
      notes: 'Forehand detected. Watch your follow-through.'
    };
  }
  
  // Detect backhand
  if (isBackhand(pose)) {
    return {
      techniqueType: 'backhand',
      confidence: 0.75,
      timestamp: frameTimestamp,
      boundingBox,
      notes: 'Backhand detected. Good form with two hands.'
    };
  }
  
  // Detect serve
  if (isServe(pose)) {
    return {
      techniqueType: 'serve',
      confidence: 0.85,
      timestamp: frameTimestamp,
      boundingBox,
      notes: 'Serve detected. Work on your ball toss height.'
    };
  }
  
  // Detect volley
  if (isVolley(pose)) {
    return {
      techniqueType: 'volley',
      confidence: 0.7,
      timestamp: frameTimestamp,
      boundingBox,
      notes: 'Volley detected. Keep your wrist firm.'
    };
  }
  
  return null;
}

// Simple technique detection heuristics based on pose keypoints
// These are simplified examples and would need refinement for production use

function isForehand(pose: poseDetection.Pose): boolean {
  const keypoints = pose.keypoints;
  const rightWrist = keypoints[KEYPOINT_DICT.right_wrist];
  const rightShoulder = keypoints[KEYPOINT_DICT.right_shoulder];
  const rightElbow = keypoints[KEYPOINT_DICT.right_elbow];
  
  // For a right-handed player, forehand typically involves:
  // - Right arm extended
  // - Right wrist position relative to shoulder
  if (rightWrist && rightElbow && rightShoulder) {
    // Check if arm is extended horizontally
    const isArmExtended = rightWrist.x > rightElbow.x + 50;
    // Check if wrist is higher than shoulder (follow-through position)
    const isFollowThrough = rightWrist.y < rightShoulder.y - 20;
    
    return isArmExtended && isFollowThrough;
  }
  return false;
}

function isBackhand(pose: poseDetection.Pose): boolean {
  const keypoints = pose.keypoints;
  const leftWrist = keypoints[KEYPOINT_DICT.left_wrist];
  const rightWrist = keypoints[KEYPOINT_DICT.right_wrist];
  const rightShoulder = keypoints[KEYPOINT_DICT.right_shoulder];
  
  // For a two-handed backhand:
  // - Both hands close together
  // - Arms across body
  if (leftWrist && rightWrist && rightShoulder) {
    // Check if wrists are close to each other
    const areWristsClose = Math.abs(leftWrist.x - rightWrist.x) < 30 && 
                          Math.abs(leftWrist.y - rightWrist.y) < 30;
    
    // Check if arms are across body (left of right shoulder for right-handed player)
    const isAcrossBody = rightWrist.x < rightShoulder.x - 20;
    
    return areWristsClose && isAcrossBody;
  }
  return false;
}

function isServe(pose: poseDetection.Pose): boolean {
  const keypoints = pose.keypoints;
  const rightWrist = keypoints[KEYPOINT_DICT.right_wrist];
  const leftWrist = keypoints[KEYPOINT_DICT.left_wrist];
  const rightShoulder = keypoints[KEYPOINT_DICT.right_shoulder];
  
  // Serving typically involves:
  // - Right arm raised high (for right-handed player)
  // - Left arm extended upward for ball toss
  if (rightWrist && leftWrist && rightShoulder) {
    // Check if right arm is raised high
    const isRightArmHigh = rightWrist.y < rightShoulder.y - 50;
    
    // Check if left arm is extended upward (for ball toss)
    const isLeftArmUp = leftWrist.y < leftWrist.y - 30;
    
    return isRightArmHigh || isLeftArmUp;
  }
  return false;
}

function isVolley(pose: poseDetection.Pose): boolean {
  const keypoints = pose.keypoints;
  const rightWrist = keypoints[KEYPOINT_DICT.right_wrist];
  const rightElbow = keypoints[KEYPOINT_DICT.right_elbow];
  const rightShoulder = keypoints[KEYPOINT_DICT.right_shoulder];
  
  // Volley typically involves:
  // - Arm in front of body
  // - Elbow bent at specific angle
  if (rightWrist && rightElbow && rightShoulder) {
    // Check if arm is in front of body
    const isArmForward = (rightWrist.x > rightShoulder.x) && (rightWrist.x > rightElbow.x);
    
    // Check if elbow is bent (not fully extended)
    const isElbowBent = Math.abs(rightWrist.x - rightElbow.x) < 40;
    
    return isArmForward && isElbowBent;
  }
  return false;
}
