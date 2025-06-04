
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Send, Clock, Heart } from 'lucide-react';

interface AlertResolutionProps {
  studentId: string;
  studentName: string;
  action: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const messageTemplates = {
  'Send Welcome Message': {
    subject: 'Welcome to your tennis journey! 🎾',
    template: `Hi {{name}}! 

Welcome to our tennis community! I'm excited to work with you on improving your game.

To get started:
• Log your first training session 
• Share any specific goals you'd like to work on
• Don't hesitate to reach out with questions

Looking forward to seeing your progress!

Best regards,
Coach`
  },
  'Send Gentle Reminder': {
    subject: 'Quick check-in 👋',
    template: `Hey {{name}},

Hope you're doing well! I noticed you haven't logged a training session recently. 

No pressure at all - life gets busy! When you're ready:
• Log any practice time, even just 15 minutes
• Update me on how you're feeling about your game
• Let me know if you need any support

Here to help whenever you need it!

Coach`
  },
  'Remind to Log': {
    subject: 'Don\'t forget to log your sessions! 📝',
    template: `Hi {{name}},

Great work staying active! Just a friendly reminder to log your training sessions when you can.

This helps me:
• Track your awesome progress
• Give you better personalized tips
• Celebrate your improvements together

Keep up the fantastic work!

Coach`
  }
};

export function AlertResolution({ 
  studentId, 
  studentName, 
  action, 
  isOpen, 
  onClose, 
  onSuccess 
}: AlertResolutionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [customMessage, setCustomMessage] = useState('');
  const [messageType, setMessageType] = useState<'template' | 'custom'>('template');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const template = messageTemplates[action as keyof typeof messageTemplates];

  const resolutionMutation = useMutation({
    mutationFn: async ({ message, type }: { message: string; type: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create notification for the student
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          sender_id: user.id,
          type: 'coach_message',
          content: message,
          entity_type: 'coach_alert_resolution',
          entity_id: studentId
        });

      if (notificationError) throw notificationError;

      // Log the alert resolution
      const { error: logError } = await supabase
        .from('log_prompts')
        .insert({
          user_id: user.id,
          prompt_type: 'alert_resolution',
          action_taken: `${action}: ${type}`
        });

      if (logError) console.warn('Failed to log alert resolution:', logError);

      return { success: true };
    },
    onSuccess: () => {
      toast.success(`${action} sent successfully!`);
      queryClient.invalidateQueries({ queryKey: ['coach-alerts'] });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error('Alert resolution error:', error);
      toast.error('Failed to send message');
    }
  });

  const handleSend = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      let message = '';
      
      if (messageType === 'template' && template) {
        message = template.template.replace('{{name}}', studentName);
      } else {
        message = customMessage;
      }

      if (!message.trim()) {
        toast.error('Please enter a message');
        return;
      }

      await resolutionMutation.mutateAsync({ 
        message: message.trim(), 
        type: messageType 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionIcon = () => {
    if (action.includes('Welcome')) return <Heart className="h-4 w-4" />;
    if (action.includes('Reminder') || action.includes('Remind')) return <Clock className="h-4 w-4" />;
    return <Send className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon()}
            {action}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Sending to: <span className="font-medium">{studentName}</span>
          </div>

          {template && (
            <div className="space-y-3">
              <Label>Message Type</Label>
              <Select value={messageType} onValueChange={(value: 'template' | 'custom') => setMessageType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template">Use template</SelectItem>
                  <SelectItem value="custom">Write custom message</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Message</Label>
            {messageType === 'template' && template ? (
              <div className="p-3 bg-gray-50 rounded-md border text-sm">
                <div className="font-medium mb-2">{template.subject}</div>
                <div className="whitespace-pre-line">
                  {template.template.replace('{{name}}', studentName)}
                </div>
              </div>
            ) : (
              <Textarea
                placeholder="Write your custom message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
