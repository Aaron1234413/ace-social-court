
export interface ConversationalPost {
  id: string;
  ambassador_id: string;
  content: string;
  content_type: 'struggle' | 'success' | 'tip' | 'question' | 'encouragement';
  rotation_week: number;
  created_at: string;
  retired_at?: string;
  engagement_seed: {
    likes: number;
    comments: number;
    reactions: number;
  };
}

export interface AmbassadorPersonality {
  id: string;
  name: string;
  tone: 'encouraging' | 'humorous' | 'analytical' | 'casual';
  skill_focus: string[];
  common_struggles: string[];
  success_stories: string[];
  catchphrases: string[];
}

export class ConversationalContentEngine {
  private static instance: ConversationalContentEngine;
  private contentLibrary: Map<string, ConversationalPost[]> = new Map();
  private ambassadorPersonalities: AmbassadorPersonality[] = [];

  static getInstance(): ConversationalContentEngine {
    if (!this.instance) {
      this.instance = new ConversationalContentEngine();
    }
    return this.instance;
  }

  constructor() {
    this.initializePersonalities();
    this.generateInitialContent();
  }

  private initializePersonalities() {
    this.ambassadorPersonalities = [
      {
        id: 'coach_mike',
        name: 'Coach Mike',
        tone: 'encouraging',
        skill_focus: ['footwork', 'serves', 'mental_game'],
        common_struggles: ['nerves', 'consistency', 'footwork'],
        success_stories: ['first_ace', 'tournament_win', 'technique_breakthrough'],
        catchphrases: ['Stay loose!', 'Trust the process', 'One point at a time']
      },
      {
        id: 'player_sarah',
        name: 'Sarah',
        tone: 'casual',
        skill_focus: ['groundstrokes', 'fitness', 'doubles'],
        common_struggles: ['double_faults', 'net_play', 'endurance'],
        success_stories: ['fitness_milestone', 'backhand_improvement', 'first_match_win'],
        catchphrases: ['Keep grinding!', 'Tennis is life 🎾', 'Love this game']
      },
      {
        id: 'coach_elena',
        name: 'Elena',
        tone: 'analytical',
        skill_focus: ['strategy', 'technique', 'video_analysis'],
        common_struggles: ['shot_selection', 'court_positioning', 'tactical_awareness'],
        success_stories: ['strategy_breakthrough', 'technical_fix', 'match_analysis'],
        catchphrases: ['Think the point through', 'Technique first', 'Court geometry matters']
      }
    ];
  }

  private generateInitialContent() {
    this.ambassadorPersonalities.forEach(personality => {
      const posts = this.generatePostsForPersonality(personality, 12);
      this.contentLibrary.set(personality.id, posts);
    });
  }

  private generatePostsForPersonality(personality: AmbassadorPersonality, count: number): ConversationalPost[] {
    const posts: ConversationalPost[] = [];
    const contentTypes: ConversationalPost['content_type'][] = ['struggle', 'success', 'tip', 'question', 'encouragement'];
    
    for (let i = 0; i < count; i++) {
      const contentType = contentTypes[i % contentTypes.length];
      const content = this.generateContentByType(personality, contentType);
      
      posts.push({
        id: `${personality.id}_post_${i + 1}`,
        ambassador_id: personality.id,
        content,
        content_type: contentType,
        rotation_week: Math.floor(i / 2) + 1, // 2 posts per week
        created_at: new Date().toISOString(),
        engagement_seed: this.generateEngagementSeed(contentType)
      });
    }
    
    return posts;
  }

  private generateContentByType(personality: AmbassadorPersonality, type: ConversationalPost['content_type']): string {
    const templates = {
      struggle: [
        "Ugh, just hit my 5th ball into the net today 😅 Anyone else struggle with nerves?",
        "Double-faulted three times in a row today—staying light on my feet tomorrow! 🎾",
        "My coach made me run suicides after missing that easy volley 😤 Worth it though!",
        "Had one of those days where nothing felt right. Tomorrow's a new day! 💪"
      ],
      success: [
        "Finally nailed that backhand slice I've been working on! 🔥",
        "Hit my first ace in practice today—felt amazing! ⚡",
        "Played my best match yet yesterday. All that practice paying off! 🏆",
        "Breakthrough moment: stayed calm under pressure for the first time 🧘‍♂️"
      ],
      tip: [
        "Tried a new foot-drill today—my ankles felt so much looser during rallies. Anyone else notice how tight ankles kill your movement?",
        "Pro tip: breathe between points. Sounds simple but game-changer! 🫁",
        "Been focusing on my follow-through and wow, what a difference in consistency! ✨",
        "Quick reminder: watch the ball hit your strings. Still working on this myself! 👀"
      ],
      question: [
        "What's your go-to mental reset between games? Mine's three deep breaths 🫁",
        "Anyone else find rainy day practice sessions weirdly therapeutic? ☔",
        "Quick poll: do you prefer morning or evening practice? I'm team sunrise! 🌅",
        "What's the best advice your coach ever gave you? Share below! 💬"
      ],
      encouragement: [
        "Remember everyone: every pro started as a beginner. Keep grinding! 💪",
        "Bad day on court? That's just your brain making room for tomorrow's breakthrough! 🧠",
        "Seeing all your progress posts this week—you're all crushing it! 🔥",
        "Tennis reminder: progress isn't always linear. Trust the process! 📈"
      ]
    };

    const typeTemplates = templates[type];
    const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
    
    // Add personality-specific touches
    if (personality.tone === 'humorous' && Math.random() > 0.7) {
      return template + " " + this.addHumorousTouch();
    }
    
    if (personality.catchphrases.length > 0 && Math.random() > 0.8) {
      const catchphrase = personality.catchphrases[Math.floor(Math.random() * personality.catchphrases.length)];
      return template + " " + catchphrase;
    }
    
    return template;
  }

  private addHumorousTouch(): string {
    const touches = [
      "Tennis is 90% mental and the other half is physical 😂",
      "My racket and I are having trust issues 🎾",
      "Note to self: the net is not my friend 🤦‍♂️",
      "My backhand has trust issues with consistency 😅"
    ];
    return touches[Math.floor(Math.random() * touches.length)];
  }

  private generateEngagementSeed(contentType: ConversationalPost['content_type']): ConversationalPost['engagement_seed'] {
    const baseEngagement = {
      struggle: { likes: 8, comments: 3, reactions: 12 },
      success: { likes: 15, comments: 5, reactions: 18 },
      tip: { likes: 12, comments: 4, reactions: 16 },
      question: { likes: 6, comments: 8, reactions: 14 },
      encouragement: { likes: 20, comments: 6, reactions: 22 }
    };

    const base = baseEngagement[contentType];
    // Add some randomness to make it feel more natural
    return {
      likes: base.likes + Math.floor(Math.random() * 5) - 2,
      comments: base.comments + Math.floor(Math.random() * 3) - 1,
      reactions: base.reactions + Math.floor(Math.random() * 6) - 3
    };
  }

  getWeeklyContent(week: number): ConversationalPost[] {
    const weeklyPosts: ConversationalPost[] = [];
    
    this.contentLibrary.forEach((posts) => {
      const weekPosts = posts.filter(post => 
        post.rotation_week === week && !post.retired_at
      );
      weeklyPosts.push(...weekPosts);
    });
    
    return weeklyPosts;
  }

  retireOldContent(cutoffWeeks: number = 8) {
    const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    
    this.contentLibrary.forEach((posts) => {
      posts.forEach(post => {
        if (currentWeek - post.rotation_week > cutoffWeeks && !post.retired_at) {
          post.retired_at = new Date().toISOString();
        }
      });
    });
  }

  generateNewWeeklyDrop(): ConversationalPost[] {
    const newPosts: ConversationalPost[] = [];
    const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    
    this.ambassadorPersonalities.forEach(personality => {
      // Generate 2-3 new posts per ambassador
      const postCount = 2 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < postCount; i++) {
        const contentTypes: ConversationalPost['content_type'][] = ['struggle', 'success', 'tip', 'question', 'encouragement'];
        const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
        
        const post: ConversationalPost = {
          id: `${personality.id}_week_${currentWeek}_${i + 1}`,
          ambassador_id: personality.id,
          content: this.generateContentByType(personality, contentType),
          content_type: contentType,
          rotation_week: currentWeek,
          created_at: new Date().toISOString(),
          engagement_seed: this.generateEngagementSeed(contentType)
        };
        
        newPosts.push(post);
        
        // Add to content library
        const existingPosts = this.contentLibrary.get(personality.id) || [];
        existingPosts.push(post);
        this.contentLibrary.set(personality.id, existingPosts);
      }
    });
    
    return newPosts;
  }

  generateEncouragingReply(userPostContent: string, userSkillLevel?: string): string {
    const encouragements = [
      "Great hustle on that forehand, {name}! 💪",
      "Love seeing the progress! Keep it up! 🔥",
      "That's the spirit! Every practice counts! ⚡",
      "Nice work! You're getting stronger every session! 💪",
      "Awesome to see you pushing through! 🎾",
      "That determination is going to pay off! ✨",
      "Keep grinding! The breakthrough is coming! 🚀"
    ];
    
    const skillSpecific = {
      beginner: [
        "Everyone starts somewhere—you're doing great! 🌟",
        "Love the dedication! Beginning is the hardest part! 💪",
        "Perfect practice makes perfect! Keep going! 🎯"
      ],
      intermediate: [
        "Your consistency is really showing! 📈",
        "That technique work is paying off! 🔧",
        "Great court awareness in that description! 🧠"
      ],
      advanced: [
        "That tactical thinking is next level! 🎯",
        "Love the strategic approach! 🧠",
        "Your technical precision is inspiring! ⚡"
      ]
    };
    
    let replies = [...encouragements];
    if (userSkillLevel && skillSpecific[userSkillLevel as keyof typeof skillSpecific]) {
      replies = [...replies, ...skillSpecific[userSkillLevel as keyof typeof skillSpecific]];
    }
    
    const reply = replies[Math.floor(Math.random() * replies.length)];
    return reply.replace('{name}', 'there'); // Will be replaced with actual name in implementation
  }

  getPersonalities(): AmbassadorPersonality[] {
    return this.ambassadorPersonalities;
  }

  getAllContent(): Map<string, ConversationalPost[]> {
    return this.contentLibrary;
  }
}
