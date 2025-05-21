import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowButton from '@/components/social/FollowButton';
import { useAuth } from '@/components/AuthProvider';
import { UserCheck, MapPin, Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchUser } from '@/hooks/useSearch';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCreateConversation } from '@/hooks/use-create-conversation';
import { supabase } from '@/integrations/supabase/client';

interface UserSearchResultsProps {
  users: SearchUser[];
}

// Helper function to get appropriate color based on skill level
const getSkillLevelColor = (skillLevel: string | null | undefined): string => {
  if (!skillLevel) return 'bg-gray-300';
  
  // Extract numeric value from skill level (e.g., "3.5" -> 3.5)
  const level = parseFloat(skillLevel);
  
  if (level <= 3.0) return 'bg-green-500';
  if (level <= 4.0) return 'bg-yellow-500';
  return 'bg-orange-500';
};

// Quick messages to choose from for the ice breakers
const QUICK_MESSAGES = [
  "Great serve video!",
  "Fancy a hitting session?",
  "Love your style!"
];

const UserCard = ({ user, index }: { user: SearchUser; index: number }) => {
  const { user: currentUser } = useAuth();
  const [flipped, setFlipped] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createConversation, isCreating } = useCreateConversation();
  
  // Animation variants for staggered entrance
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };
  
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite(!favorite);
    
    toast({
      title: favorite ? "Removed from favorites" : "Added to favorites",
      description: favorite 
        ? `${user.full_name || user.username} was removed from your favorites.`
        : `${user.full_name || user.username} was added to your favorites.`
    });
  };

  const sendIcebreaker = (message: string) => {
    if (!user.id || !currentUser) return;
    
    try {
      // Create or find conversation with this user
      createConversation(user.id, {
        onSuccess: (conversationId: string) => {
          // Send the icebreaker message
          const sendMessageAction = async () => {
            try {
              // Send message to the conversation
              const { data, error } = await supabase
                .from('direct_messages')
                .insert({
                  sender_id: currentUser.id,
                  recipient_id: user.id,
                  content: message,
                  read: false
                })
                .select();
                
              if (error) throw error;
              
              // Update the conversation's last_message_at timestamp
              await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', conversationId);
                
              // Navigate to messages page with this conversation
              navigate(`/messages/${conversationId}`);
              
              toast({
                title: "Message sent!",
                description: `Your message was sent to ${user.full_name || user.username}.`
              });
            } catch (err) {
              console.error('Error sending message:', err);
              toast({
                title: "Failed to send message",
                description: "Please try again later.",
                variant: "destructive"
              });
            }
          };
          
          // Execute the message sending action
          sendMessageAction();
        },
        onError: (error: any) => {
          console.error('Error creating conversation:', error);
          toast({
            title: "Error",
            description: "Failed to start conversation. Please try again.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('Error in sendIcebreaker:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
    setShowIcebreakers(false);
  };
  
  const skillLevelColor = getSkillLevelColor(user.skill_level);
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      custom={index}
      variants={itemVariants}
      className="w-full"
    >
      <div 
        className="perspective-1000 relative h-[250px] transition-all duration-300 cursor-pointer w-full hover:shadow-lg"
        onClick={() => setFlipped(!flipped)}
      >
        {/* Front of card with racquet-shaped frame styling */}
        <Card 
          className={cn(
            "absolute inset-0 backface-hidden transition-all duration-500 p-4 flex flex-col overflow-hidden",
            flipped ? "rotate-y-180 opacity-0" : "rotate-y-0 opacity-100"
          )}
        >
          {/* Racquet-shaped decorative frame */}
          <div className="absolute -right-10 -top-12 w-40 h-40 rounded-full border-8 border-tennis-green/20 opacity-30 transform rotate-45"></div>
          <div className="absolute -right-12 -top-10 w-40 h-40 border-b-8 border-r-8 border-tennis-green/20 opacity-30"></div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-tennis-green/30 hover:border-tennis-green transition-colors transform -rotate-6">
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.full_name || 'User'} />
                ) : (
                  <AvatarFallback className="bg-tennis-green/10 text-tennis-darkGreen">
                    {user.full_name?.charAt(0) || user.username?.charAt(0) || '?'}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {/* Skill level indicator as a colored ring */}
              {user.skill_level && (
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white border-2 border-white",
                  skillLevelColor
                )}>
                  {user.skill_level}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${user.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-semibold text-base truncate">
                  {user.full_name || user.username || 'Anonymous User'}
                </h3>
              </Link>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {user.username && <span>@{user.username}</span>}
                <Badge variant={user.user_type === 'coach' ? 'default' : 'secondary'} className="text-xs">
                  {user.user_type === 'coach' ? 'Coach' : 'Player'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                <MapPin className="h-3 w-3" />
                <span>{user.location || 'Local area'}</span>
              </div>
            </div>
          </div>
          
          {user.bio && (
            <p className="text-sm text-muted-foreground mt-4 line-clamp-3">
              {user.bio}
            </p>
          )}
          
          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Tap card to see more
            </div>
            
            {currentUser && currentUser.id === user.id && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <UserCheck className="h-3 w-3" />
                <span>You</span>
              </div>
            )}
          </div>
        </Card>
        
        {/* Back of card */}
        <Card 
          className={cn(
            "absolute inset-0 backface-hidden transition-all duration-500 p-4 flex flex-col",
            !flipped ? "rotate-y-180 opacity-0" : "rotate-y-0 opacity-100"
          )}
        >
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-2">
              {user.full_name || user.username || 'Anonymous User'}
            </h3>
            
            {user.bio ? (
              <p className="text-sm text-muted-foreground line-clamp-4">
                {user.bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                This user hasn't added a bio yet.
              </p>
            )}
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            {currentUser && currentUser.id !== user.id && (
              <>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={favorite ? "default" : "outline"} 
                    size="sm" 
                    className={cn(
                      "flex-1 gap-2 transition-all",
                      favorite && "bg-yellow-500 hover:bg-yellow-600"
                    )}
                    onClick={handleFavoriteToggle}
                  >
                    <Star className={cn(
                      "h-4 w-4 transition-all", 
                      favorite && "fill-white animate-scale-in"
                    )} />
                    <span>{favorite ? "Favorited" : "Favorite"}</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowIcebreakers(true);
                    }}
                    disabled={isCreating}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Say Hi</span>
                  </Button>
                </div>
                
                <FollowButton userId={user.id} />
              </>
            )}
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Tap to flip card back
          </div>
        </Card>
      </div>

      {/* Icebreaker messages dialog */}
      <Dialog open={showIcebreakers} onOpenChange={setShowIcebreakers}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Say hi to {user.full_name || user.username}</DialogTitle>
            <DialogDescription>
              Choose an icebreaker to start the conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {QUICK_MESSAGES.map((message, index) => (
              <Button 
                key={index} 
                variant="outline" 
                className="justify-start text-left hover:bg-tennis-green/10"
                onClick={() => sendIcebreaker(message)}
                disabled={isCreating}
              >
                {message}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const UserSearchResults: React.FC<UserSearchResultsProps> = ({ users }) => {
  // Use CSS grid for clean, responsive layout instead of masonry
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {users.map((user, index) => (
        <UserCard key={user.id} user={user} index={index} />
      ))}
    </div>
  );
};

export default UserSearchResults;
