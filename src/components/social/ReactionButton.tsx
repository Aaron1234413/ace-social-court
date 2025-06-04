
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReactionButtonProps {
  icon: React.ReactNode;
  count: number;
  isActive: boolean;
  canReact: boolean;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function ReactionButton({
  icon,
  count,
  isActive,
  canReact,
  tooltip,
  onClick,
  disabled = false,
  className = ''
}: ReactionButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={`
              flex items-center gap-1 transition-all duration-200 
              ${isActive 
                ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' 
                : canReact 
                  ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  : 'text-gray-400 opacity-60'
              }
              ${!canReact ? 'cursor-help' : 'cursor-pointer'}
              ${className}
            `}
          >
            <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
              {icon}
            </span>
            <span className="tabular-nums text-sm">{count}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
