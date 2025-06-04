
export interface KeywordMatch {
  keyword: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: 'emotion' | 'performance' | 'technical' | 'physical';
  confidence: number;
}

export class KeywordAnalyzer {
  private static keywords = {
    // Emotional keywords
    struggled: { sentiment: 'negative', category: 'emotion', weight: 0.8 },
    frustrated: { sentiment: 'negative', category: 'emotion', weight: 0.7 },
    disappointed: { sentiment: 'negative', category: 'emotion', weight: 0.6 },
    nervous: { sentiment: 'negative', category: 'emotion', weight: 0.5 },
    
    improved: { sentiment: 'positive', category: 'performance', weight: 0.9 },
    breakthrough: { sentiment: 'positive', category: 'performance', weight: 1.0 },
    confident: { sentiment: 'positive', category: 'emotion', weight: 0.7 },
    amazing: { sentiment: 'positive', category: 'emotion', weight: 0.8 },
    
    // Performance keywords
    lost: { sentiment: 'negative', category: 'performance', weight: 0.7 },
    won: { sentiment: 'positive', category: 'performance', weight: 0.8 },
    victory: { sentiment: 'positive', category: 'performance', weight: 0.9 },
    defeated: { sentiment: 'negative', category: 'performance', weight: 0.6 },
    
    // Technical keywords
    backhand: { sentiment: 'neutral', category: 'technical', weight: 0.5 },
    forehand: { sentiment: 'neutral', category: 'technical', weight: 0.5 },
    serve: { sentiment: 'neutral', category: 'technical', weight: 0.5 },
    volley: { sentiment: 'neutral', category: 'technical', weight: 0.5 },
    
    // Physical keywords
    tired: { sentiment: 'negative', category: 'physical', weight: 0.6 },
    exhausted: { sentiment: 'negative', category: 'physical', weight: 0.8 },
    energetic: { sentiment: 'positive', category: 'physical', weight: 0.7 },
    strong: { sentiment: 'positive', category: 'physical', weight: 0.6 }
  } as const;

  static analyzeContent(content: string): KeywordMatch[] {
    const matches: KeywordMatch[] = [];
    const normalizedContent = content.toLowerCase();
    
    for (const [keyword, data] of Object.entries(this.keywords)) {
      if (normalizedContent.includes(keyword)) {
        matches.push({
          keyword,
          sentiment: data.sentiment,
          category: data.category,
          confidence: data.weight
        });
      }
    }
    
    // Sort by confidence (weight) descending
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  static getPrimaryKeyword(content: string): KeywordMatch | null {
    const matches = this.analyzeContent(content);
    return matches.length > 0 ? matches[0] : null;
  }

  static getEmotionalTone(content: string): 'positive' | 'negative' | 'neutral' {
    const matches = this.analyzeContent(content);
    
    if (matches.length === 0) return 'neutral';
    
    const positiveScore = matches
      .filter(m => m.sentiment === 'positive')
      .reduce((sum, m) => sum + m.confidence, 0);
      
    const negativeScore = matches
      .filter(m => m.sentiment === 'negative')
      .reduce((sum, m) => sum + m.confidence, 0);
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  static hasPerformanceIndicators(content: string): boolean {
    const matches = this.analyzeContent(content);
    return matches.some(m => m.category === 'performance' && m.confidence > 0.6);
  }
}
