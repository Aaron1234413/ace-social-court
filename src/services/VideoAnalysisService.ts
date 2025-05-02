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

// New function to save locally detected techniques
export async function saveLocalAnalysisResults(
  analysisId: string,
  techniques: TechniqueDetection[]
): Promise<boolean> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Update the techniques array in the database
    const { error } = await supabase
      .from('video_analyses')
      .update({
        techniques: techniques,
        status: 'completed'
      })
      .eq('id', analysisId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Failed to save local analysis results:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving local analysis results:', error);
    return false;
  }
}

// Generate an analysis summary based on detected techniques
export function generateAnalysisSummary(techniques: TechniqueDetection[]): string {
  if (!techniques || techniques.length === 0) {
    return 'No techniques detected in this video.';
  }
  
  // Count techniques by type
  const techniqueCounts: Record<string, number> = {
    'forehand': 0,
    'backhand': 0,
    'serve': 0,
    'volley': 0,
    'smash': 0
  };
  
  techniques.forEach(t => {
    if (t.techniqueType in techniqueCounts) {
      techniqueCounts[t.techniqueType]++;
    }
  });
  
  // Generate summary
  let summary = 'Video analysis summary: ';
  const detectedTypes = Object.entries(techniqueCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`);
  
  if (detectedTypes.length === 0) {
    return 'No specific tennis techniques detected in this video.';
  }
  
  summary += detectedTypes.join(', ') + '.';
  
  // Add most frequent technique
  const mostFrequent = Object.entries(techniqueCounts)
    .reduce((prev, current) => (prev[1] > current[1]) ? prev : current);
  
  if (mostFrequent[1] > 0) {
    summary += ` The most common technique was ${mostFrequent[0]}.`;
  }
  
  return summary;
}

// Generate recommended drills based on detected techniques
export function generateRecommendedDrills(techniques: TechniqueDetection[]): string[] {
  if (!techniques || techniques.length === 0) {
    return ['Practice basic groundstrokes to build technique'];
  }
  
  const drills: Record<string, string[]> = {
    'forehand': [
      'Crosscourt forehand rally with partner',
      'Forehand down-the-line precision practice',
      'Inside-out forehand drill'
    ],
    'backhand': [
      'Backhand slice approach shots',
      'Two-handed backhand consistency drill',
      'Backhand cross-court control exercise'
    ],
    'serve': [
      'First serve percentage improvement drill',
      'Second serve spin development',
      'Serve placement targets practice'
    ],
    'volley': [
      'Volley-to-volley drill with partner',
      'Approach shot and volley combination',
      'Reflex volley practice'
    ],
    'smash': [
      'Overhead smash footwork drill',
      'Smash accuracy practice',
      'Defensive lob to offensive smash transition'
    ]
  };
  
  // Count techniques by type
  const techniqueCounts: Record<string, number> = {};
  techniques.forEach(t => {
    if (!techniqueCounts[t.techniqueType]) {
      techniqueCounts[t.techniqueType] = 0;
    }
    techniqueCounts[t.techniqueType]++;
  });
  
  // Get the two most frequent techniques
  const sortedTechniques = Object.entries(techniqueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(entry => entry[0]);
  
  // Recommend drills for the most frequent techniques
  let recommendations: string[] = [];
  
  sortedTechniques.forEach(technique => {
    if (drills[technique]) {
      // Randomly select one or two drills for this technique
      const selectedDrills = drills[technique].sort(() => 0.5 - Math.random()).slice(0, 2);
      recommendations = [...recommendations, ...selectedDrills];
    }
  });
  
  // If we couldn't find recommendations, add a generic one
  if (recommendations.length === 0) {
    recommendations.push('Focus on overall court movement and footwork');
  }
  
  return recommendations;
}
