
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusSquare, CheckCircle, Trophy, Award } from 'lucide-react';

const CoachDashboard = () => {
  const [activeTab, setActiveTab] = useState("lessons");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coach Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your students and track your coaching progress
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lessons">Today's Lessons</TabsTrigger>
          <TabsTrigger value="activity">Student Activity</TabsTrigger>
          <TabsTrigger value="growth">Growth Hub</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lessons" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">John Smith</h3>
                      <p className="text-sm text-muted-foreground">2:00 PM - Court 1</p>
                    </div>
                    <select className="border rounded px-2 py-1 text-sm">
                      <option>ON</option>
                      <option>CANCELLED</option>
                      <option>COMPLETED</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Sarah Wilson</h3>
                      <p className="text-sm text-muted-foreground">4:00 PM - Court 2</p>
                    </div>
                    <select className="border rounded px-2 py-1 text-sm">
                      <option>ON</option>
                      <option>CANCELLED</option>
                      <option>COMPLETED</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusSquare className="h-5 w-5" />
                Sessions Awaiting Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Mike Johnson's Session</h3>
                      <p className="text-sm text-muted-foreground">Logged yesterday - Forehand practice</p>
                    </div>
                    <Button size="sm">Sign Off</Button>
                  </div>
                </div>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/log/session">
                    <PlusSquare className="mr-2 h-4 w-4" />
                    Log Session for Player
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="growth" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Total Sessions Coached
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">247</div>
                <p className="text-muted-foreground text-sm">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Leaderboard Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">#12</div>
                <p className="text-muted-foreground text-sm">In your region</p>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl">🎖️</div>
                    <div>
                      <p className="font-semibold">100 Sessions Coached</p>
                      <p className="text-sm text-muted-foreground">Achieved 2 weeks ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoachDashboard;
