
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, QrCode, Upload, Users } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ContactImport } from './ContactImport';
import { QRCodeSharing } from './QRCodeSharing';
import FollowButton from '@/components/social/FollowButton';

interface SuggestedUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  user_type: string;
  skill_level: string | null;
  bio: string | null;
}

interface FriendDiscoveryProps {
  onFollowCountChange: (count: number) => void;
  currentFollowCount: number;
}

export function FriendDiscovery({ onFollowCountChange, currentFollowCount }: FriendDiscoveryProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [ambassadors, setAmbassadors] = useState<SuggestedUser[]>([]);
  const [searchResults, setSearchResults] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactImport, setShowContactImport] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    fetchSuggestedUsers();
    fetchAmbassadors();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, user_type, skill_level, bio')
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;
      setSuggestedUsers(data || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAmbassadors = async () => {
    try {
      const { data, error } = await supabase
        .from('ambassador_profiles')
        .select(`
          profile_id,
          profiles!inner (
            id, full_name, username, avatar_url, user_type, skill_level, bio
          )
        `)
        .eq('is_active', true);

      if (error) throw error;
      
      const ambassadorProfiles = data?.map(item => ({
        id: item.profiles.id,
        full_name: item.profiles.full_name,
        username: item.profiles.username,
        avatar_url: item.profiles.avatar_url,
        user_type: item.profiles.user_type,
        skill_level: item.profiles.skill_level,
        bio: item.profiles.bio
      })) || [];
      
      setAmbassadors(ambassadorProfiles);
    } catch (error) {
      console.error('Error fetching ambassadors:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, user_type, skill_level, bio')
        .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .neq('id', user?.id)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    }
  };

  const handleFollowSuccess = () => {
    onFollowCountChange(currentFollowCount + 1);
    toast.success('User followed successfully!');
  };

  const UserCard = ({ user: suggestedUser, isAmbassador = false }: { user: SuggestedUser; isAmbassador?: boolean }) => (
    <Card className="p-4">
      <div className="flex items-center space-x-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={suggestedUser.avatar_url || undefined} />
          <AvatarFallback>
            {suggestedUser.full_name?.charAt(0) || suggestedUser.username?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">
              {suggestedUser.full_name || suggestedUser.username || 'Unknown User'}
            </h3>
            {isAmbassador && (
              <Badge variant="secondary" className="text-xs">
                Ambassador
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
          </div>
        </div>
        <FollowButton
          userId={suggestedUser.id}
          username={suggestedUser.username}
          fullName={suggestedUser.full_name}
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
          Connect with other players to see their posts and build your tennis network
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch} size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Results
          </h3>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}

      {/* Ambassador Suggestions */}
      {ambassadors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tennis Ambassadors
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Follow our ambassadors to see great tennis content and tips
          </p>
          <div className="space-y-2">
            {ambassadors.slice(0, 3).map((ambassador) => (
              <UserCard key={ambassador.id} user={ambassador} isAmbassador />
            ))}
          </div>
        </div>
      )}

      {/* Suggested Users */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Suggested for You
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted-foreground/20 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {suggestedUsers.slice(0, 5).map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>

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
