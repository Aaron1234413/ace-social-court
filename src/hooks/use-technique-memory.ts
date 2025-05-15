
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { TennisTechniqueMemory } from '@/components/tennis-ai/types';
import { 
  getUserTechniqueMemories, 
  getTechniqueMemory 
} from '@/services/TennisTechniqueMemoryService';

export function useTechniqueMemory(techniqueName?: string) {
  const { user } = useAuth();
  const [memories, setMemories] = useState<TennisTechniqueMemory[]>([]);
  const [memory, setMemory] = useState<TennisTechniqueMemory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all memories for the user
  const fetchMemories = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserTechniqueMemories(user.id);
      setMemories(data);
    } catch (err) {
      console.error('Error fetching technique memories:', err);
      setError('Failed to load technique memories');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a specific memory by technique name
  const fetchMemory = async (name: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getTechniqueMemory(user.id, name);
      setMemory(data);
    } catch (err) {
      console.error(`Error fetching technique memory for ${name}:`, err);
      setError(`Failed to load technique memory for ${name}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data based on whether techniqueName is provided
  useEffect(() => {
    if (user) {
      if (techniqueName) {
        fetchMemory(techniqueName);
      } else {
        fetchMemories();
      }
    }
  }, [user, techniqueName]);

  return {
    memories,
    memory,
    isLoading,
    error,
    refreshMemories: fetchMemories,
    refreshMemory: techniqueName ? () => fetchMemory(techniqueName) : undefined,
  };
}
