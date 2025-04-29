
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import NotificationsList from '@/components/notifications/NotificationsList';

const Notifications = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <p>Please log in to view your notifications.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Notifications</h1>
      
      <Card className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="all">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <TabsContent value="all" className="mt-0">
              <NotificationsList />
            </TabsContent>
            
            <TabsContent value="unread" className="mt-0">
              {/* We'll implement this filter in the backend query */}
              <NotificationsList />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default Notifications;
