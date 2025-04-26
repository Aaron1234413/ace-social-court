
import React from 'react';
import { useAuth } from '@/components/AuthProvider';

const Feed = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Home Feed</h1>
      {user ? (
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-lg">Welcome, {user.email}!</p>
            <p className="text-muted-foreground">
              This is your personalized feed. Stay tuned for more updates.
            </p>
          </div>
          {/* Placeholder for future feed items */}
          <div className="bg-gray-100 rounded-lg p-4">
            <p>No feed items yet. Start connecting with other players!</p>
          </div>
        </div>
      ) : (
        <p>Please log in to view your feed.</p>
      )}
    </div>
  );
};

export default Feed;
