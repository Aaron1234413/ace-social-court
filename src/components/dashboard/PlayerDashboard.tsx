
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusSquare, CalendarPlus, Flame } from 'lucide-react';

const PlayerDashboard = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Player Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your tennis progress and stay motivated
        </p>
      </div>

      {/* Hero Section - Session Streak */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <Flame className="h-8 w-8 text-orange-500" />
            <div className="text-center">
              <div className="text-3xl font-bold">4-day streak</div>
              <p className="text-muted-foreground">Keep it going!</p>
            </div>
            <Flame className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild size="lg" className="w-full bg-tennis-green hover:bg-tennis-darkGreen">
            <Link to="/log/session">
              <PlusSquare className="mr-2 h-5 w-5" />
              Log Today's Session
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link to="/schedule-match">
              <CalendarPlus className="mr-2 h-5 w-5" />
              Schedule Match
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* This Week's Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>3 of 5 sessions</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-tennis-green h-3 rounded-full transition-all duration-300"
                style={{ width: '60%' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-muted-foreground text-sm">This season</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
            <p className="text-muted-foreground text-sm">This week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayerDashboard;
