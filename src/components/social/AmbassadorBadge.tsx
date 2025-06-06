
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AmbassadorBadgeProps {
  variant?: 'full' | 'compact' | 'icon-only';
  animated?: boolean;
  priority?: boolean;
  className?: string;
}

export function AmbassadorBadge({ 
  variant = 'full', 
  animated = true, 
  priority = false,
  className 
}: AmbassadorBadgeProps) {
  const baseClasses = cn(
    "inline-flex items-center gap-1.5 font-medium",
    "bg-gradient-to-r from-purple-100 to-amber-50",
    "border border-purple-200/60",
    "text-purple-800",
    animated && "transition-all duration-300 hover:shadow-sm",
    priority && "from-purple-200 to-amber-100 border-purple-300/80 shadow-sm",
    className
  );

  if (variant === 'icon-only') {
    return (
      <div className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded-full",
        "bg-gradient-to-br from-purple-500 to-amber-400",
        "text-white shadow-sm",
        animated && "animate-pulse-subtle",
        className
      )}>
        <Crown className="h-3 w-3" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Badge className={cn(baseClasses, "text-xs px-2 py-0.5")}>
        <Star className="h-3 w-3" />
        Ambassador
      </Badge>
    );
  }

  return (
    <Badge className={cn(baseClasses, "text-sm px-3 py-1")}>
      <div className="relative">
        <Crown className="h-4 w-4" />
        {priority && (
          <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-amber-500 animate-bounce-subtle" />
        )}
      </div>
      Rally Ambassador
      {priority && (
        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-1">
          Priority
        </span>
      )}
    </Badge>
  );
}

// Ambassador Border Component for wrapping posts
interface AmbassadorBorderProps {
  children: React.ReactNode;
  priority?: boolean;
  className?: string;
}

export function AmbassadorBorder({ 
  children, 
  priority = false, 
  className 
}: AmbassadorBorderProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg",
      "before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r",
      priority 
        ? "before:from-purple-400 before:via-amber-300 before:to-purple-400" 
        : "before:from-purple-300 before:via-amber-200 before:to-purple-300",
      "before:rounded-lg before:animate-pulse-subtle",
      className
    )}>
      <div className="relative bg-card rounded-lg">
        {children}
      </div>
    </div>
  );
}

// Ambassador Header Component for post headers
interface AmbassadorHeaderProps {
  authorName: string;
  variant?: 'full' | 'compact';
  priority?: boolean;
  className?: string;
  showFreshContent?: boolean;
  showFeaturedContent?: boolean;
}

export function AmbassadorHeader({ 
  authorName, 
  variant = 'full', 
  priority = false,
  className,
  showFreshContent = false,
  showFeaturedContent = false
}: AmbassadorHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{authorName}</span>
        <AmbassadorBadge 
          variant={variant === 'compact' ? 'compact' : 'full'} 
          priority={priority}
        />
        
        {/* Rotation indicators next to Ambassador badge */}
        {showFreshContent && (
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-purple-100 to-amber-100 text-purple-800 border-purple-200/60 text-xs px-2 py-1 animate-pulse-subtle"
          >
            <Sparkles className="h-3 w-3 mr-1 animate-bounce-subtle" />
            Fresh Content
          </Badge>
        )}
        
        {showFeaturedContent && (
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-amber-100 to-purple-100 text-amber-800 border-amber-200/60 text-xs px-2 py-1"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Featured Content
          </Badge>
        )}
      </div>
    </div>
  );
}
