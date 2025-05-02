
/**
 * Utility for lazy-loading TensorFlow.js and pose detection models
 */

let tfLoaded = false;
let poseDetectionLoaded = false;

/**
 * Dynamically load TensorFlow.js
 */
export async function loadTensorflow(): Promise<typeof import('@tensorflow/tfjs')> {
  if (tfLoaded) {
    return await import('@tensorflow/tfjs');
  }
  
  try {
    console.log('Loading TensorFlow.js...');
    const tf = await import('@tensorflow/tfjs');
    await tf.ready();
    tfLoaded = true;
    console.log('TensorFlow.js loaded successfully');
    return tf;
  } catch (error) {
    console.error('Failed to load TensorFlow.js:', error);
    throw error;
  }
}

/**
 * Dynamically load pose detection models
 */
export async function loadPoseDetection(): Promise<typeof import('@tensorflow-models/pose-detection')> {
  if (poseDetectionLoaded) {
    return await import('@tensorflow-models/pose-detection');
  }
  
  try {
    // Make sure TensorFlow is loaded first
    await loadTensorflow();
    
    console.log('Loading pose detection models...');
    const poseDetection = await import('@tensorflow-models/pose-detection');
    poseDetectionLoaded = true;
    console.log('Pose detection models loaded successfully');
    return poseDetection;
  } catch (error) {
    console.error('Failed to load pose detection models:', error);
    throw error;
  }
}
