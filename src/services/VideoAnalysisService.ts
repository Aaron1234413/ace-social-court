
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

// Helper function to safely convert JSON data to TechniqueDetection array
function convertToTechniqueDetections(data: any): TechniqueDetection[] {
  if (!data || !Array.isArray(data)) {
    return [];
  }
  
  return data.filter(item => {
    // Validate that item has the required properties and is of correct type
    return (
      item &&
      typeof item === 'object' &&
      'techniqueType' in item &&
      'confidence' in item &&
      'timestamp' in item &&
      typeof item.confidence === 'number' &&
      typeof item.timestamp === 'number'
    );
  }).map(item => {
    // Explicitly shape the data to match our interface
    const detection: TechniqueDetection = {
      techniqueType: item.techniqueType,
      confidence: item.confidence,
      timestamp: item.timestamp
    };
    
    // Add optional fields if they exist
    if ('boundingBox' in item && item.boundingBox) {
      detection.boundingBox = item.boundingBox;
    }
    
    if ('notes' in item && typeof item.notes === 'string') {
      detection.notes = item.notes;
    }
    
    return detection;
  });
}

// Function to start analysis of an uploaded video
export async function startVideoAnalysis(videoId: string, videoUrl: string): Promise<{ analysisId: string }> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Create analysis record in database
    const { data: analysis, error: createError } = await supabase
      .from('video_analyses')
      .insert({
        video_id: videoId,
        user_id: user.id, // Add the user_id from authenticated user
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
    
    // Map the database fields to our interface structure
    if (data) {
      return {
        id: data.id,
        videoId: data.video_id,
        userId: data.user_id,
        createdAt: data.created_at,
        status: data.status as 'pending' | 'processing' | 'completed' | 'failed',
        // Use our safe conversion function
        techniques: convertToTechniqueDetections(data.techniques),
        summary: data.summary,
        recommendedDrills: data.recommended_drills,
      };
    }
    
    return null;
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
