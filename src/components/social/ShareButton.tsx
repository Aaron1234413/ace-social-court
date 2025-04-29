
import React, { useState } from 'react';
import { Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ShareButtonProps {
  postId: string;
  postContent?: string;
}

const ShareButton = ({ postId, postContent }: ShareButtonProps) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const shareUrl = `${window.location.origin}/post/${postId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  };

  const shareViaEmail = () => {
    const subject = "Check out this post on AceSocial";
    const body = `I thought you might be interested in this post: ${shareUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    toast.success("Email client opened");
  };

  const shareViaTwitter = () => {
    const text = "Check out this tennis post on AceSocial";
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    toast.success("Sharing to Twitter");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 text-xs md:text-sm"
            aria-label="Share post"
          >
            <Share className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border shadow-lg">
          <DropdownMenuItem onClick={handleCopyLink}>
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
            Share via message
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareViaEmail}>
            Share via email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareViaTwitter}>
            Share on Twitter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share via Message</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input
                id="share-link"
                defaultValue={shareUrl}
                readOnly
                className="w-full"
              />
            </div>
            <Button type="submit" size="sm" onClick={handleCopyLink}>
              Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this link with other AceSocial users
          </p>
          <DialogFooter className="sm:justify-start">
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = `/messages?share=${encodeURIComponent(shareUrl)}`;
                setShareDialogOpen(false);
              }}
            >
              Choose Recipient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareButton;
