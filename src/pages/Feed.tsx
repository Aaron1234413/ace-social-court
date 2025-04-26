
import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Share } from 'lucide-react';

const Feed = () => {
  const { user } = useAuth();

  // Mock content data for the feed
  const feedItems = [
    {
      id: '1',
      author: 'Sarah Williams',
      authorType: 'coach',
      content: 'Just finished an amazing training session with my students! Working on backhand technique today.',
      timestamp: '2 hours ago',
      likes: 24,
      comments: 5,
    },
    {
      id: '2',
      author: 'Mike Johnson',
      authorType: 'player',
      content: 'Excited to share my progress after 3 months of training! Check out my serve improvement.',
      timestamp: '5 hours ago',
      likes: 42,
      comments: 8,
    },
    {
      id: '3',
      author: 'Tennis Academy NYC',
      authorType: 'coach',
      content: 'New summer camp dates announced! Join us for intensive training with pro coaches.',
      timestamp: '1 day ago',
      likes: 31,
      comments: 12,
    }
  ];

  const handleLike = (itemId: string) => {
    console.log(`Liked item ${itemId}`);
  };

  const handleComment = (itemId: string) => {
    console.log(`Comment on item ${itemId}`);
  };

  const handleShare = (itemId: string) => {
    console.log(`Shared item ${itemId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Home Feed</h1>
      
      {user ? (
        <>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <p className="text-lg">Welcome, {user.email}!</p>
            <p className="text-muted-foreground">
              This is your personalized feed. Connect with other players and coaches.
            </p>
          </div>
          
          <div className="space-y-6">
            {feedItems.length > 0 ? (
              feedItems.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {item.author.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold">{item.author}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.authorType === 'coach' ? 'Coach' : 'Player'} · {item.timestamp}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="py-2">{item.content}</p>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleLike(item.id)}
                      className="flex items-center gap-1"
                    >
                      <Heart className="h-4 w-4" /> {item.likes}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleComment(item.id)}
                      className="flex items-center gap-1"
                    >
                      <MessageSquare className="h-4 w-4" /> {item.comments}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleShare(item.id)}
                      className="flex items-center gap-1"
                    >
                      <Share className="h-4 w-4" /> Share
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p>No feed items yet. Start connecting with other players!</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-lg mb-4">Please log in to view your personalized feed</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      )}
    </div>
  );
};

export default Feed;
