
import React from 'react';
import { format } from 'date-fns';
import { useTechniqueMemory } from '@/hooks/use-technique-memory';
import { Loading } from '@/components/ui/loading';
import { AlertCircle } from 'lucide-react';

interface TimelineViewProps {
  techniqueName: string;
}

const TimelineView: React.FC<TimelineViewProps> = ({ techniqueName }) => {
  // Fetch specific technique data to show its timeline
  const { memory, isLoading, error, refreshMemory } = useTechniqueMemory(techniqueName);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loading variant="spinner" text="Loading timeline..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-md">
        <div className="flex items-center text-destructive mb-2">
          <AlertCircle className="h-4 w-4 mr-2" />
          <p className="text-sm font-medium">Failed to load timeline</p>
        </div>
        <button 
          onClick={refreshMemory}
          className="text-xs text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!memory || !memory.discussion_count) {
    return (
      <p className="text-sm text-muted-foreground">
        No timeline data available for this technique yet.
      </p>
    );
  }

  // Create simulated timeline entries based on memory data
  // In a real implementation, we'd store each interaction separately in the database
  const milestones = generateMilestones(memory);

  return (
    <div className="relative pl-6 pb-2">
      {/* Timeline connector */}
      <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-border"></div>
      
      {/* Timeline events */}
      <div className="space-y-6">
        {milestones.map((milestone, index) => (
          <div key={index} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-6 mt-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background"></div>
            
            {/* Content */}
            <div className="pb-2">
              <div className="text-xs text-muted-foreground mb-1">
                {format(new Date(milestone.date), 'MMM d, yyyy')}
              </div>
              <p className="text-sm">
                {milestone.milestone}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to generate timeline milestones based on memory data
// In a real implementation, we'd fetch this from a dedicated table in the database
function generateMilestones(memory: any) {
  const milestones = [];
  
  // Most recent milestone is the last discussion
  milestones.push({
    date: memory.last_discussed,
    milestone: memory.key_points && memory.key_points.length > 0 
      ? `Discussed: "${memory.key_points[0]}"`
      : `Discussed ${memory.technique_name} technique`
  });
  
  // If we have multiple discussions, add some historical entries
  if (memory.discussion_count > 1) {
    // Create some example past milestones based on how many discussions happened
    const pastDate1 = new Date(memory.last_discussed);
    pastDate1.setDate(pastDate1.getDate() - 7);
    
    // If we have key points beyond the first one, use those for previous milestones
    if (memory.key_points && memory.key_points.length > 1) {
      milestones.push({
        date: pastDate1.toISOString(),
        milestone: `Worked on: "${memory.key_points[1]}"`
      });
    } else {
      milestones.push({
        date: pastDate1.toISOString(),
        milestone: `Continued practice with ${memory.technique_name}`
      });
    }
  }

  // For techniques discussed 3+ times, add one more historical entry
  if (memory.discussion_count > 2) {
    const pastDate2 = new Date(memory.last_discussed);
    pastDate2.setDate(pastDate2.getDate() - 21);
    
    milestones.push({
      date: pastDate2.toISOString(),
      milestone: `First discussed ${memory.technique_name} technique`
    });
  }

  // Sort milestones by date (newest first)
  return milestones.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export default TimelineView;
