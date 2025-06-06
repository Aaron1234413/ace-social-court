
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, QrCode, Upload, Users, Bot } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useEnhancedSearch } from '@/hooks/useEnhancedSearch';
import { ContactImport } from './ContactImport';
import { QRCodeSharing } from './QRCodeSharing';
import { AIUserDiscovery } from '@/components/discovery/AIUserDiscovery';
import EnhancedFollowButton from '@/components/social/EnhancedFollowButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FriendDiscoveryProps {
  onFollowCountChange: (count: number) => void;
  currentFollowCount: number;
}

export function FriendDiscovery({ onFollowCountChange, currentFollowCount }: FriendDiscoveryProps) {
  const { user } = useAuth();
  const [showContactImport, setShowContactImport] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    results: searchResults,
    isLoading,
    getSuggestedAIUsers
  } = useEnhancedSearch();

  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  useEffect(() => {
    loadSuggestedUsers();
  }, []);

  const loadSuggestedUsers = async () => {
    try {
      // Get suggested AI users and mix with regular users
      const aiUsers = await getSuggestedAIUsers(user ? [user.id] : []);
      setSuggestedUsers(aiUsers.slice(0, 5));
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  const handleFollowSuccess = () => {
    onFollowCountChange(currentFollowCount + 1);
  };

  const UserCard = ({ user: suggestedUser, isAIUser = false }: { user: any; isAIUser?: boolean }) => (
    <Card className="p-4">
      <div className="flex items-center space-x-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={suggestedUser.avatar_url || undefined} />
          <AvatarFallback className={isAIUser ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : ""}>
            {isAIUser ? <Bot className="h-6 w-6" /> : 
             (suggestedUser.full_name?.charAt(0) || suggestedUser.username?.charAt(0) || 'U')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">
              {suggestedUser.full_name || suggestedUser.username || 'Unknown User'}
            </h3>
            {isAIUser && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                <Bot className="h-3 w-3 mr-1" />
                AI Coach
              </Badge>
            )}
          </div>
          {suggestedUser.username && (
            <p className="text-sm text-muted-foreground">@{suggestedUser.username}</p>
          )}
          {suggestedUser.bio && (
            <p className="text-xs text-muted-foreground truncate mt-1">{suggestedUser.bio}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {suggestedUser.user_type}
            </Badge>
            {suggestedUser.skill_level && (
              <Badge variant="outline" className="text-xs">
                {suggestedUser.skill_level}
              </Badge>
            )}
            {isAIUser && suggestedUser.ai_personality_type && (
              <Badge variant="outline" className="text-xs">
                {suggestedUser.ai_personality_type.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>
        <EnhancedFollowButton
          userId={suggestedUser.id}
          username={suggestedUser.username}
          fullName={suggestedUser.full_name}
          isAIUser={isAIUser}
          variant="outline"
          size="sm"
        />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Find Your Tennis Community</h2>
        <p className="text-muted-foreground mb-4">
          Connect with players, coaches, and AI tennis experts to build your network
        </p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant={currentFollowCount >= 3 ? "default" : "secondary"}>
            {currentFollowCount}/3 minimum follows
          </Badge>
          {currentFollowCount >= 3 && (
            <Badge variant="default" className="bg-green-500">
              ✓ Unlocked public posting
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          onClick={() => setShowContactImport(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import Contacts
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowQRCode(true)}
          className="flex items-center gap-2"
        >
          <QrCode className="h-4 w-4" />
          Share QR Code
        </Button>
        <div className="flex gap-2">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filters.includeAI ? "default" : "outline"}
          size="sm"
          onClick={() => setFilters(prev => ({ ...prev, includeAI: !prev.includeAI }))}
        >
          <Bot className="h-3 w-3 mr-1" />
          AI Coaches
        </Button>
        <Button
          variant={filters.userType?.includes('coach') ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const newTypes = filters.userType?.includes('coach') 
              ? filters.userType.filter(t => t !== 'coach')
              : [...(filters.userType || []), 'coach'];
            setFilters(prev => ({ ...prev, userType: newTypes }));
          }}
        >
          Coaches
        </Button>
        <Button
          variant={filters.userType?.includes('player') ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const newTypes = filters.userType?.includes('player') 
              ? filters.userType.filter(t => t !== 'player')
              : [...(filters.userType || []), 'player'];
            setFilters(prev => ({ ...prev, userType: newTypes }));
          }}
        >
          Players
        </Button>
      </div>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <UserCard 
                key={user.id} 
                user={user} 
                isAIUser={user.is_ai_user || false}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Tennis Coaches Discovery */}
      <AIUserDiscovery maxUsers={3} />

      {/* General Suggested Users */}
      {suggestedUsers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Suggested for You
          </h3>
          <div className="space-y-2">
            {suggestedUsers.map((user) => (
              <UserCard 
                key={user.id} 
                user={user} 
                isAIUser={user.is_ai_user || false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showContactImport && (
        <ContactImport
          isOpen={showContactImport}
          onClose={() => setShowContactImport(false)}
          onFollowSuccess={handleFollowSuccess}
        />
      )}

      {showQRCode && (
        <QRCodeSharing
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
}
