
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Users, ArrowRight } from 'lucide-react';

interface AmbassadorFallbackProps {
  totalPosts: number;
}

export function AmbassadorFallback({ totalPosts }: AmbassadorFallbackProps) {
  const tips = [
    {
      icon: <Sparkles className="h-5 w-5 text-purple-600" />,
      title: "Boost Engagement",
      description: "Share technique tips and motivational content to inspire your students",
      action: "Create Post"
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      title: "Set Weekly Goals",
      description: "Challenge students to post 2-3 training updates per week",
      action: "Send Message"
    },
    {
      icon: <Users className="h-5 w-5 text-green-600" />,
      title: "Group Activities",
      description: "Organize group training sessions to build community",
      action: "Schedule Session"
    }
  ];

  return (
    <Card className="h-full border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-purple-800">Boost Student Activity</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-800 mb-1">
            {totalPosts} posts
          </div>
          <div className="text-sm text-purple-600">
            this week from your students
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-purple-700 font-medium">
            💡 Tips to increase student engagement:
          </p>
          
          {tips.map((tip, index) => (
            <div key={index} className="p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {tip.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    {tip.title}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {tip.description}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    {tip.action}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center pt-2">
          <div className="text-xs text-purple-600">
            💪 Aim for 10+ student posts per week for optimal engagement
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
