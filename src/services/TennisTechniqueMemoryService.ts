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
      // Get existing key points
      const existingPoints: string[] = existingData.key_points || [];
      
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
