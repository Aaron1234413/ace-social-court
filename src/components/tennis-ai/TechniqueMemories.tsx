
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, BookOpen, Clock, MessageSquare, ChevronDown, ChevronUp, History } from 'lucide-react';
import { useTechniqueMemory } from '@/hooks/use-technique-memory';
import { Loading } from '@/components/ui/loading';
import { TennisTechniqueMemory } from '../tennis-ai/types';
import { formatTimeSinceLastDiscussion } from '@/services/TennisTechniqueMemoryService';
import TimelineView from './TimelineView';

export interface TechniqueMemoriesProps {
  className?: string;
  showEmpty?: boolean;
}

export const TechniqueMemories: React.FC<TechniqueMemoriesProps> = ({ 
  className,
  showEmpty = true
}) => {
  const { memories, isLoading, error, refreshMemories } = useTechniqueMemory();
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loading variant="spinner" text="Loading technique memories..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
            Error Loading Memories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button 
            onClick={refreshMemories}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (memories.length === 0) {
    if (!showEmpty) return null;
    
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Technique Memories
          </CardTitle>
          <CardDescription>
            As you chat with Tennis AI, it will remember key points about different techniques.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No technique memories have been saved yet. Start discussing specific tennis techniques
            with the Tennis AI to build your personalized memory bank.
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleExpand = (techniqueId: string) => {
    if (expandedTechnique === techniqueId) {
      setExpandedTechnique(null);
    } else {
      setExpandedTechnique(techniqueId);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Technique Memories
        </CardTitle>
        <CardDescription>
          Key points about tennis techniques discussed in your conversations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {memories.map((memory) => (
            <TechniqueMemoryItem 
              key={memory.id} 
              memory={memory} 
              isExpanded={expandedTechnique === memory.id}
              onToggleExpand={() => toggleExpand(memory.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface TechniqueMemoryItemProps {
  memory: TennisTechniqueMemory;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const TechniqueMemoryItem: React.FC<TechniqueMemoryItemProps> = ({ 
  memory, 
  isExpanded,
  onToggleExpand
}) => {
  const { technique_name, key_points, discussion_count, last_discussed } = memory;
  const timeSince = formatTimeSinceLastDiscussion(last_discussed);
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-medium capitalize">{technique_name}</h3>
            <button 
              onClick={onToggleExpand}
              className="text-muted-foreground hover:text-foreground transition-colors ml-2 p-1"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs flex items-center">
              <MessageSquare className="mr-1 h-3 w-3" />
              {discussion_count} {discussion_count === 1 ? 'discussion' : 'discussions'}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              Last discussed: {timeSince}
            </span>
          </div>
        </div>
      </div>
      
      <div className="pl-4 border-l-2 border-muted space-y-2">
        {Array.isArray(key_points) && key_points.length > 0 ? (
          key_points.map((point, index) => (
            <p key={index} className="text-sm">
              {point}
            </p>
          ))
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No key points saved for this technique yet.
          </p>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center mb-3">
            <History className="h-4 w-4 mr-2" />
            <h4 className="text-sm font-medium">Learning Timeline</h4>
          </div>
          <TimelineView techniqueName={technique_name} />
        </div>
      )}
      
      <Separator className="mt-4" />
    </div>
  );
};

export default TechniqueMemories;
