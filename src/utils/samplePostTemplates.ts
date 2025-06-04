
import { PostTemplate } from '@/types/post';

export const SAMPLE_POST_TEMPLATES: Omit<PostTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  // Workout Templates
  {
    category: 'workout',
    title: 'Daily Training Session',
    content_template: 'Just finished a {mood} training session focused on {focus_area}! 💪 {achievement} and feeling {energy_level}. Next up: {next_step} 🎾',
    placeholders: ['mood', 'focus_area', 'achievement', 'energy_level', 'next_step'],
    is_active: true
  },
  {
    category: 'workout',
    title: 'Drill Focus Session',
    content_template: 'Today\'s session was all about {drill}! Had {mood} energy and really focused on {technical_focus}. {achievement} 🔥',
    placeholders: ['drill', 'mood', 'technical_focus', 'achievement'],
    is_active: true
  },
  
  // Progress Templates
  {
    category: 'progress',
    title: 'Weekly Progress Update',
    content_template: 'Making steady progress on {focus_area}! This week I\'ve been {challenge} and {achievement}. Feeling {confidence} about my development 📈',
    placeholders: ['focus_area', 'challenge', 'achievement', 'confidence'],
    is_active: true
  },
  {
    category: 'progress',
    title: 'Technique Breakthrough',
    content_template: 'Breakthrough moment today! Finally getting the hang of {technical_focus}. {achievement} and can\'t wait to keep building on this 🚀',
    placeholders: ['technical_focus', 'achievement'],
    is_active: true
  },

  // Match Templates
  {
    category: 'match',
    title: 'Match Preparation',
    content_template: 'Getting ready for an upcoming match! Today\'s {session_type} focused on {focus_area}. Feeling {mood} and {confidence} 🎾💯',
    placeholders: ['session_type', 'focus_area', 'mood', 'confidence'],
    is_active: true
  },

  // Motivation Templates
  {
    category: 'motivation',
    title: 'Training Motivation',
    content_template: 'Another day, another opportunity to improve! {achievement} during today\'s session. Remember: every practice counts! 💪✨',
    placeholders: ['achievement'],
    is_active: true
  },
  {
    category: 'motivation',
    title: 'Persistence Pays Off',
    content_template: 'Some days are harder than others, but {challenge} makes me stronger. {achievement} and staying focused on the journey 🎯',
    placeholders: ['challenge', 'achievement'],
    is_active: true
  },

  // Technique Templates
  {
    category: 'technique',
    title: 'Technical Focus',
    content_template: 'Spent quality time working on {technical_focus} today. The details matter! {achievement} and excited to see this translate to matches 🎾',
    placeholders: ['technical_focus', 'achievement'],
    is_active: true
  }
];
