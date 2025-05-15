
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { TennisUserPreferences, TennisUserProgress } from '@/components/tennis-ai/types';
import { toast } from 'sonner';

export const useTennisPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  console.log('useTennisPreferences: Hook called, user:', user ? 'exists' : 'null');
  
  // Fetch user preferences from the database
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['tennis-preferences'],
    queryFn: async () => {
      if (!user) {
        console.log('useTennisPreferences: No user, skipping preferences fetch');
        return null;
      }
      
      console.log('useTennisPreferences: Fetching preferences for user:', user.id);
      const { data, error } = await supabase
        .from('tennis_user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        // If no record is found, that's expected for new users
        if (error.code === 'PGRST116') {
          console.log('useTennisPreferences: No preferences found for user, will create when needed');
          return null;
        }
        console.error('useTennisPreferences: Error fetching preferences:', error);
        toast.error('Failed to load tennis preferences');
        throw error;
      }
      
      console.log('useTennisPreferences: Preferences loaded successfully');
      return data as TennisUserPreferences;
    },
    enabled: !!user
  });

  // Fetch user progress from the database
  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['tennis-progress'],
    queryFn: async () => {
      if (!user) {
        console.log('useTennisPreferences: No user, skipping progress fetch');
        return null;
      }
      
      console.log('useTennisPreferences: Fetching progress for user:', user.id);
      const { data, error } = await supabase
        .from('tennis_user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        // If no record is found, that's expected for new users
        if (error.code === 'PGRST116') {
          console.log('useTennisPreferences: No progress found for user, will create when needed');
          return null;
        }
        console.error('useTennisPreferences: Error fetching progress:', error);
        toast.error('Failed to load tennis progress data');
        throw error;
      }
      
      console.log('useTennisPreferences: Progress loaded successfully');
      
      // Convert the database JSON to the expected TypeScript type
      return {
        ...data,
        skill_assessments: data.skill_assessments as TennisUserProgress['skill_assessments'],
        completed_drills: data.completed_drills as TennisUserProgress['completed_drills'],
        lesson_history: data.lesson_history as TennisUserProgress['lesson_history']
      } as TennisUserProgress;
    },
    enabled: !!user
  });

  // Update user preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updatedPreferences: Partial<TennisUserPreferences>) => {
      if (!user) throw new Error('User not authenticated');
      
      // Check if preferences exist for this user
      const { data: existingPrefs } = await supabase
        .from('tennis_user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
        
      // Prepare the data to update/insert
      const prefsData = {
        user_id: user.id,
        ...updatedPreferences
      };
      
      if (existingPrefs) {
        // Update existing preferences
        const { data, error } = await supabase
          .from('tennis_user_preferences')
          .update(prefsData)
          .eq('user_id', user.id)
          .select('*');
          
        if (error) {
          console.error('Error updating preferences:', error);
          throw error;
        }
        
        return data[0] as TennisUserPreferences;
      } else {
        // Insert new preferences
        const { data, error } = await supabase
          .from('tennis_user_preferences')
          .insert(prefsData)
          .select('*');
          
        if (error) {
          console.error('Error inserting preferences:', error);
          throw error;
        }
        
        return data[0] as TennisUserPreferences;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tennis-preferences'] });
      queryClient.setQueryData(['tennis-preferences'], data);
      toast.success('Tennis preferences updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update tennis preferences');
      console.error('Error updating preferences:', error);
    }
  });

  // Update user progress
  const updateProgressMutation = useMutation({
    mutationFn: async (updatedProgress: Partial<TennisUserProgress>) => {
      if (!user) throw new Error('User not authenticated');
      
      // Check if progress exists for this user
      const { data: existingProgress } = await supabase
        .from('tennis_user_progress')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
        
      // Prepare the data to update/insert
      const progressData = {
        user_id: user.id,
        ...updatedProgress
      };
      
      if (existingProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from('tennis_user_progress')
          .update(progressData)
          .eq('user_id', user.id)
          .select('*');
          
        if (error) {
          console.error('Error updating progress:', error);
          throw error;
        }
        
        // Convert the database JSON to the expected TypeScript type
        return {
          ...data[0],
          skill_assessments: data[0].skill_assessments as TennisUserProgress['skill_assessments'],
          completed_drills: data[0].completed_drills as TennisUserProgress['completed_drills'],
          lesson_history: data[0].lesson_history as TennisUserProgress['lesson_history']
        } as TennisUserProgress;
      } else {
        // Insert new progress
        const { data, error } = await supabase
          .from('tennis_user_progress')
          .insert(progressData)
          .select('*');
          
        if (error) {
          console.error('Error inserting progress:', error);
          throw error;
        }
        
        // Convert the database JSON to the expected TypeScript type
        return {
          ...data[0],
          skill_assessments: data[0].skill_assessments as TennisUserProgress['skill_assessments'],
          completed_drills: data[0].completed_drills as TennisUserProgress['completed_drills'],
          lesson_history: data[0].lesson_history as TennisUserProgress['lesson_history']
        } as TennisUserProgress;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tennis-progress'] });
      queryClient.setQueryData(['tennis-progress'], data);
      toast.success('Tennis progress updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update tennis progress');
      console.error('Error updating progress:', error);
    }
  });

  return {
    preferences,
    progress,
    isLoadingPreferences,
    isLoadingProgress,
    updatePreferences: updatePreferencesMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isUpdatingProgress: updateProgressMutation.isPending
  };
};
