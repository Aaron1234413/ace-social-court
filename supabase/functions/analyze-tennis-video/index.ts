
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Model labels and configurations
const TECHNIQUE_TYPES = ["forehand", "backhand", "serve", "volley", "smash"];

// Feedback templates
const FEEDBACK_TEMPLATES = {
  forehand: [
    "Good hip rotation, ensure follow-through is complete",
    "Watch your footwork positioning before striking the ball",
    "Great racquet preparation, maintain good contact point",
    "Try to keep your wrist firm at impact for better control"
  ],
  backhand: [
    "Your grip could be adjusted for better control",
    "Good weight transfer from back to front foot",
    "Focus on maintaining your balance through the swing",
    "Keep your front shoulder down during follow-through"
  ],
  serve: [
    "Good ball toss, keep it consistent",
    "Focus on knee bend to generate more power",
    "Watch your racquet path to maximize spin potential",
    "Improve trophy position alignment for better accuracy"
  ],
  volley: [
    "Keep your wrist firm and racquet face open",
    "Good forward step with the opposite foot",
    "Try to meet the ball earlier in its trajectory",
    "Work on quicker preparation to improve reaction time"
  ],
  smash: [
    "Good tracking of the ball with your non-racquet hand",
    "Position yourself better under the ball",
    "Focus on full extension at contact point",
    "Follow through toward your target for better direction"
  ]
};

// Get a random feedback comment for a technique
function getRandomFeedback(techniqueType: string): string {
  const templates = FEEDBACK_TEMPLATES[techniqueType as keyof typeof FEEDBACK_TEMPLATES] || [];
  return templates[Math.floor(Math.random() * templates.length)] || 
    "Focus on maintaining proper form throughout your swing";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get request data
    const { videoUrl, videoId, analysisId } = await req.json();

    // Validate required fields
    if (!videoUrl || !videoId || !analysisId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update analysis status to processing
    await supabase
      .from('video_analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId);

    console.log(`Starting analysis of video: ${videoId}`);

    // In a real implementation, we would send the video to a ML model for processing
    // For demonstration, we'll simulate the analysis with randomized detections
    
    // Simulate processing delay (5-10 seconds)
    const processingTime = 5000 + Math.random() * 5000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Generate simulated technique detections
    // In a real implementation, these would come from the ML model
    const numberOfDetections = 5 + Math.floor(Math.random() * 10); // 5-15 detections
    const videoDuration = 60; // Assume 60 seconds for sample data
    
    const techniques = Array.from({ length: numberOfDetections }, (_, i) => {
      const techniqueType = TECHNIQUE_TYPES[Math.floor(Math.random() * TECHNIQUE_TYPES.length)];
      const timestamp = Math.round((i / numberOfDetections) * videoDuration * 10) / 10; // Spread throughout video
      const confidence = 0.5 + Math.random() * 0.5; // 0.5-1.0 confidence
      
      // Generate random bounding box (in normalized coordinates 0-1)
      const boundingBox = {
        x: 0.2 + Math.random() * 0.6, // 0.2-0.8
        y: 0.2 + Math.random() * 0.6, // 0.2-0.8
        width: 0.1 + Math.random() * 0.2, // 0.1-0.3
        height: 0.1 + Math.random() * 0.2 // 0.1-0.3
      };
      
      return {
        techniqueType,
        confidence,
        timestamp,
        boundingBox,
        notes: getRandomFeedback(techniqueType)
      };
    });
    
    // Generate overall summary
    const summary = "Your technique shows good fundamentals. Focus on maintaining consistent form, particularly in your follow-through. Your timing is generally good, but could benefit from more dynamic footwork preparation.";
    
    // Generate recommended drills based on detected techniques
    const uniqueTechniques = [...new Set(techniques.map(t => t.techniqueType))];
    const recommendedDrills = uniqueTechniques.map(technique => {
      switch (technique) {
        case 'forehand':
          return "Shadow forehand drills focusing on hip rotation and follow-through";
        case 'backhand':
          return "Cross-court backhand consistency drill with a focus on grip and preparation";
        case 'serve':
          return "Serve accuracy drill targeting service box zones";
        case 'volley':
          return "Quick-reaction volley drill at the net with a partner";
        case 'smash':
          return "Overhead smash practice with high tosses";
        default:
          return "General footwork and balance drills";
      }
    });
    
    // Update the analysis record with results
    const { error } = await supabase
      .from('video_analyses')
      .update({
        status: 'completed',
        techniques,
        summary,
        recommended_drills: recommendedDrills,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId);
    
    if (error) throw error;
    
    console.log(`Analysis completed for video: ${videoId}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Analysis completed successfully",
        analysisId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-tennis-video function:", error);
    
    // Try to update the analysis status to failed
    try {
      const { analysisId } = await req.json();
      if (analysisId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        await supabase
          .from('video_analyses')
          .update({ status: 'failed' })
          .eq('id', analysisId);
      }
    } catch (e) {
      console.error("Error updating analysis status:", e);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
