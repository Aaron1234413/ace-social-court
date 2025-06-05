
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Eye, EyeOff } from 'lucide-react';

interface PillarSummaryCardProps {
  pillar: string;
  config: {
    title: string;
    emoji: string;
    gradient: string;
    bgGradient: string;
  } | undefined;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  children: React.ReactNode;
}

export default function PillarSummaryCard({
  pillar,
  config,
  isExpanded,
  onToggleExpand,
  onEdit,
  children
}: PillarSummaryCardProps) {
  // Add safety check for undefined config
  if (!config) {
    console.warn(`No config found for pillar: ${pillar}`);
    return (
      <Card className="bg-gray-50 border-l-4 border-l-gray-400">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">❓</span>
              {pillar.toUpperCase()}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-r ${config.bgGradient} border-l-4 border-l-orange-500`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{config.emoji}</span>
            {config.title}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
