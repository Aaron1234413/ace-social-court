
import { supabase } from '@/integrations/supabase/client';
import { TennisTechniqueMemory } from '@/components/tennis-ai/types';

// List of common tennis techniques to detect in conversations
export const COMMON_TENNIS_TECHNIQUES = [
  'forehand',
  'backhand',
  'serve',
  'volley',
  'overhead',
  'slice',
  'approach shot',
  'lob',
  'drop shot',
  'footwork',
  'groundstroke',
  'topspin',
  'flat serve',
  'kick serve',
  'slice serve',
  'return of serve',
  'continental grip',
  'eastern grip',
  'semi-western grip',
  'western grip',
  'split step',
  'follow through',
  'court positioning',
  'net play',
  'baseline play',
  'two-handed backhand',
  'one-handed backhand'
];

// Function to detect tennis techniques in text
export const detectTechniques = (text: string): string[] => {
  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Find all techniques mentioned in the text
  return COMMON_TENNIS_TECHNIQUES.filter(technique => 
    lowerText.includes(technique.toLowerCase())
  );
};

// Extract key points about a technique from a conversation
export const extractKeyPoints = (text: string, technique: string): string[] => {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  // Find sentences that mention the technique and might contain advice
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    return (
      lowerSentence.includes(technique.toLowerCase()) && 
      (
        // Look for sentences that might contain advice or instructions
        lowerSentence.includes('should') || 
        lowerSentence.includes('try to') || 
        lowerSentence.includes('focus on') || 
        lowerSentence.includes('remember to') ||
        lowerSentence.includes('important') ||
        lowerSentence.includes('technique') ||
        lowerSentence.includes('tip')
      )
    );
  });
  
  return relevantSentences;
};

// Save or update technique memory
export const saveTechniqueMemory = async (
  userId: string,
  technique: string, 
  newPoints: string[]
): Promise<TennisTechniqueMemory | null> => {
  try {
    // Check if technique already exists for the user
    const { data: existingData, error: fetchError } = await supabase
      .from('tennis_technique_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('technique_name', technique)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching existing technique memory:', fetchError);
      return null;
    }
    
    // If technique exists, update it
    if (existingData) {
      // Handle key_points from database, ensuring it's treated as string[]
      let existingPoints: string[] = [];
      
      if (existingData.key_points && Array.isArray(existingData.key_points)) {
        // Map each item to ensure they're all strings
        existingPoints = existingData.key_points.map(point => 
          typeof point === 'string' ? point : String(point)
        );
      }
      
      // Merge existing and new points, removing duplicates
      const allPoints = [...existingPoints, ...newPoints];
      const uniquePoints = Array.from(new Set(allPoints));
      
      // Update record
      const { data, error } = await supabase
        .from('tennis_technique_memory')
        .update({ 
          key_points: uniquePoints,
          // last_discussed and discussion_count are updated via trigger
        })
        .eq('id', existingData.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating technique memory:', error);
        return null;
      }
      
      return data as TennisTechniqueMemory;
    } 
    // Otherwise create a new record
    else {
      const { data, error } = await supabase
        .from('tennis_technique_memory')
        .insert({ 
          user_id: userId,
          technique_name: technique,
          key_points: newPoints
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating technique memory:', error);
        return null;
      }
      
      return data as TennisTechniqueMemory;
    }
  } catch (error) {
    console.error('Unexpected error in saveTechniqueMemory:', error);
    return null;
  }
};

// Get all technique memories for a user
export const getUserTechniqueMemories = async (userId: string): Promise<TennisTechniqueMemory[]> => {
  try {
    const { data, error } = await supabase
      .from('tennis_technique_memory')
      .select('*')
      .eq('user_id', userId)
      .order('last_discussed', { ascending: false });
    
    if (error) {
      console.error('Error fetching technique memories:', error);
      return [];
    }
    
    return data as TennisTechniqueMemory[];
  } catch (error) {
    console.error('Unexpected error in getUserTechniqueMemories:', error);
    return [];
  }
};

// Get technique memory for a specific technique
export const getTechniqueMemory = async (userId: string, techniqueName: string): Promise<TennisTechniqueMemory | null> => {
  try {
    const { data, error } = await supabase
      .from('tennis_technique_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('technique_name', techniqueName)
      .single();
    
    if (error) {
      console.error('Error fetching technique memory:', error);
      return null;
    }
    
    return data as TennisTechniqueMemory;
  } catch (error) {
    console.error('Unexpected error in getTechniqueMemory:', error);
    return null;
  }
};

// Get recently discussed techniques
export const getRecentlyDiscussedTechniques = async (userId: string, limit: number = 3): Promise<TennisTechniqueMemory[]> => {
  try {
    const { data, error } = await supabase
      .from('tennis_technique_memory')
      .select('*')
      .eq('user_id', userId)
      .order('last_discussed', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching recent techniques:', error);
      return [];
    }
    
    return data as TennisTechniqueMemory[];
  } catch (error) {
    console.error('Unexpected error in getRecentlyDiscussedTechniques:', error);
    return [];
  }
};

// Format human-readable time since last discussion
export const formatTimeSinceLastDiscussion = (lastDiscussedDate: string): string => {
  const lastDiscussed = new Date(lastDiscussedDate);
  const now = new Date();
  const diffMs = now.getTime() - lastDiscussed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
};

// Generate reminder about previous advice
export const generatePreviousAdviceReminder = (technique: TennisTechniqueMemory): string => {
  if (!technique || !technique.key_points || technique.key_points.length === 0) {
    return '';
  }
  
  const timeSince = formatTimeSinceLastDiscussion(technique.last_discussed);
  const keyPoints = Array.isArray(technique.key_points) 
    ? technique.key_points.map(point => typeof point === 'string' ? point : String(point))
    : [];
  
  // Choose one key point to highlight (most recent one is often the most relevant)
  const highlightPoint = keyPoints[0];
  
  if (!highlightPoint) return '';
  
  // Generate a reminder message
  return `Last time we discussed your ${technique.technique_name} ${timeSince}, I suggested ${highlightPoint.toLowerCase()}. Have you had a chance to work on that?`;
};

// New function to get user learning progress for a technique
export const getLearningProgress = async (userId: string, techniqueName: string): Promise<any[]> => {
  try {
    const memory = await getTechniqueMemory(userId, techniqueName);
    
    if (!memory) {
      return [];
    }
    
    // In a real implementation, we would have a separate table for tracking progress over time
    // For now, we'll simulate progress data based on the existing memory
    const progress = [];
    const discussionCount = memory.discussion_count || 1;
    const lastDiscussed = new Date(memory.last_discussed);
    
    // Create some simulated historical entries
    for (let i = 0; i < discussionCount; i++) {
      const date = new Date(lastDiscussed);
      // Spread the dates out by 7 days for each historical entry
      date.setDate(date.getDate() - (i * 7));
      
      let keyPoint = "";
      if (memory.key_points && Array.isArray(memory.key_points) && i < memory.key_points.length) {
        keyPoint = typeof memory.key_points[i] === 'string' 
          ? memory.key_points[i] as string
          : String(memory.key_points[i]);
      }
      
      progress.push({
        date: date.toISOString(),
        milestoneType: i === 0 ? "latest" : (i === discussionCount - 1 ? "first" : "progress"),
        keyPoint: keyPoint || `Discussed ${techniqueName} technique`
      });
    }
    
    return progress.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error getting learning progress:', error);
    return [];
  }
};
