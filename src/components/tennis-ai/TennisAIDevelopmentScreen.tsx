
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Video, Target, TrendingUp, Zap, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TennisAIDevelopmentScreen = () => {
  const navigate = useNavigate();

  const upcomingFeatures = [
    {
      icon: Brain,
      title: "AI Tennis Coach",
      description: "Get personalized coaching advice and technique analysis from our advanced AI tennis expert",
      status: "In Development",
      statusColor: "bg-blue-500"
    },
    {
      icon: Video,
      title: "Video Analysis",
      description: "Upload your match videos for detailed stroke analysis, form correction, and performance insights",
      status: "Coming Soon",
      statusColor: "bg-orange-500"
    },
    {
      icon: Target,
      title: "Shot Pattern Analysis",
      description: "Analyze your shot patterns, court positioning, and tactical decision-making",
      status: "Planned",
      statusColor: "bg-purple-500"
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description: "Track your improvement over time with detailed analytics and progress reports",
      status: "In Development",
      statusColor: "bg-green-500"
    },
    {
      icon: Zap,
      title: "Real-time Coaching",
      description: "Get instant feedback and suggestions during practice sessions",
      status: "Future Release",
      statusColor: "bg-gray-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full blur-xl opacity-20 scale-110"></div>
            <div className="relative bg-white rounded-full p-6 shadow-lg">
              <Brain className="h-16 w-16 text-blue-600 mx-auto" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            Tennis AI
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <Badge variant="outline" className="text-lg px-4 py-2 bg-gradient-to-r from-blue-100 to-green-100 border-blue-200">
              <Clock className="h-4 w-4 mr-2" />
              In Development
            </Badge>
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </div>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're building the future of tennis training with cutting-edge AI technology. 
            Get ready for personalized coaching, advanced video analysis, and insights that will transform your game.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {upcomingFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-blue-50 to-green-50 rounded-full p-4 w-fit mx-auto">
                      <IconComponent className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-800">{feature.title}</CardTitle>
                  <Badge className={`${feature.statusColor} text-white text-xs`}>
                    {feature.status}
                  </Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Elevate Your Game?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            While we're putting the finishing touches on Tennis AI, explore other features to track your progress and connect with the tennis community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/dashboard')}
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
            >
              View Dashboard
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => navigate('/feed')}
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold"
            >
              Explore Community
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <div className="flex gap-1">
              {[1, 2, 3].map((dot) => (
                <div
                  key={dot}
                  className={`h-2 w-2 rounded-full ${
                    dot === 1 ? 'bg-blue-500' : dot === 2 ? 'bg-blue-300' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">Development Progress: 65%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TennisAIDevelopmentScreen;
