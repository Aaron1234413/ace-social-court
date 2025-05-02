
import { supabase } from '@/integrations/supabase/client';

export interface TechniqueDetection {
  techniqueType: 'forehand' | 'backhand' | 'serve' | 'volley' | 'smash';
  confidence: number; // 0-1 score
  timestamp: number; // timestamp in seconds
  boundingBox?: { x: number, y: number, width: number, height: number }; // position in frame
  notes?: string; // AI-generated feedback
}

export interface VideoAnalysisResult {
  id: string;
  videoId: string;
  userId: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  techniques: TechniqueDetection[];
  summary?: string;
  recommendedDrills?: string[];
}

// Function to start analysis of an uploaded video
export async function startVideoAnalysis(videoId: string, videoUrl: string): Promise<{ analysisId: string }> {
  try {
    // Create analysis record in database
    const { data: analysis, error: createError } = await supabase
      .from('video_analyses')
      .insert({
        video_id: videoId,
        status: 'pending',
        techniques: [],
      })
      .select('id')
      .single();

    if (createError) throw createError;

    // Call the AI processing service
    const response = await fetch('/api/analyze-tennis-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        videoUrl,
        videoId, 
        analysisId: analysis.id 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start video analysis');
    }

    return { analysisId: analysis.id };
  } catch (error) {
    console.error('Error starting video analysis:', error);
    throw error;
  }
}

// Function to get analysis status and results
export async function getVideoAnalysisResults(analysisId: string): Promise<VideoAnalysisResult | null> {
  try {
    const { data, error } = await supabase
      .from('video_analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error) throw error;
    
    return data as VideoAnalysisResult;
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    return null;
  }
}

// Function to check if analysis is completed
export async function pollAnalysisStatus(analysisId: string, onComplete: (result: VideoAnalysisResult) => void): Promise<() => void> {
  const intervalId = setInterval(async () => {
    try {
      const result = await getVideoAnalysisResults(analysisId);
      if (result && (result.status === 'completed' || result.status === 'failed')) {
        clearInterval(intervalId);
        onComplete(result);
      }
    } catch (error) {
      console.error('Error polling analysis status:', error);
    }
  }, 3000); // Check every 3 seconds

  // Return function to cancel polling
  return () => clearInterval(intervalId);
}
