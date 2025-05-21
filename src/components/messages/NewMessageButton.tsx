
import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import NewMessageDialog from './NewMessageDialog';

interface NewMessageButtonProps extends ButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default';
}

const NewMessageButton = ({ 
  variant = 'default',
  size = 'default',
  className,
  ...props
}: NewMessageButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className="gap-2"
        onClick={() => setDialogOpen(true)}
        {...props}
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span>New Message</span>
      </Button>
      
      <NewMessageDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </>
  );
};

export default NewMessageButton;
