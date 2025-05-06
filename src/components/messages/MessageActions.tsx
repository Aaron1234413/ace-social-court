
import React, { useState } from 'react';
import { Heart, ThumbsUp, Trash2, Laugh, Frown } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MessageReaction } from './types';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MessageActionsProps {
  messageId: string;
  senderId: string;
  reactions?: MessageReaction[];
  onAddReaction: (messageId: string, type: MessageReaction['reaction_type']) => void;
  onRemoveReaction: (messageId: string, reactionId: string) => void;
  onDelete: (messageId: string) => void;
}

const MessageActions = ({
  messageId,
  senderId,
  reactions = [],
  onAddReaction,
  onRemoveReaction,
  onDelete
}: MessageActionsProps) => {
  const { user } = useAuth();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Check if current user has already reacted with specific reaction type
  const getUserReaction = (type: MessageReaction['reaction_type']) => {
    if (!user) return null;
    return reactions.find(r => r.user_id === user.id && r.reaction_type === type);
  };

  // Count reactions of each type
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Check if current user is the sender
  const isOwner = user?.id === senderId;

  return (
    <div className="flex items-center gap-1">
      {/* Reaction buttons */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-accent">
            <Heart className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="flex flex-row p-1">
          {/* Like reaction */}
          <DropdownMenuItem asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${getUserReaction('like') ? 'text-primary bg-primary/10' : ''}`}
              onClick={() => {
                const existingReaction = getUserReaction('like');
                if (existingReaction) {
                  onRemoveReaction(messageId, existingReaction.id);
                } else {
                  onAddReaction(messageId, 'like');
                }
              }}
            >
              <ThumbsUp className="h-4 w-4" />
              {reactionCounts['like'] && <span className="ml-1 text-xs">{reactionCounts['like']}</span>}
            </Button>
          </DropdownMenuItem>
          
          {/* Heart reaction */}
          <DropdownMenuItem asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${getUserReaction('heart') ? 'text-red-500 bg-red-500/10' : ''}`}
              onClick={() => {
                const existingReaction = getUserReaction('heart');
                if (existingReaction) {
                  onRemoveReaction(messageId, existingReaction.id);
                } else {
                  onAddReaction(messageId, 'heart');
                }
              }}
            >
              <Heart className="h-4 w-4" />
              {reactionCounts['heart'] && <span className="ml-1 text-xs">{reactionCounts['heart']}</span>}
            </Button>
          </DropdownMenuItem>
          
          {/* Laugh reaction */}
          <DropdownMenuItem asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${getUserReaction('laugh') ? 'text-yellow-500 bg-yellow-500/10' : ''}`}
              onClick={() => {
                const existingReaction = getUserReaction('laugh');
                if (existingReaction) {
                  onRemoveReaction(messageId, existingReaction.id);
                } else {
                  onAddReaction(messageId, 'laugh');
                }
              }}
            >
              <Laugh className="h-4 w-4" />
              {reactionCounts['laugh'] && <span className="ml-1 text-xs">{reactionCounts['laugh']}</span>}
            </Button>
          </DropdownMenuItem>
          
          {/* Sad reaction */}
          <DropdownMenuItem asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${getUserReaction('sad') ? 'text-blue-500 bg-blue-500/10' : ''}`}
              onClick={() => {
                const existingReaction = getUserReaction('sad');
                if (existingReaction) {
                  onRemoveReaction(messageId, existingReaction.id);
                } else {
                  onAddReaction(messageId, 'sad');
                }
              }}
            >
              <Frown className="h-4 w-4" />
              {reactionCounts['sad'] && <span className="ml-1 text-xs">{reactionCounts['sad']}</span>}
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Delete button (only for sender) */}
      {isOwner && (
        <>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          
          <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Message</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this message? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    onDelete(messageId);
                    setConfirmDeleteOpen(false);
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default MessageActions;
