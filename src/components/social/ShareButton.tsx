
import React, { useState } from 'react';
import { Share, Instagram } from 'lucide-react';
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
    const subject = "Check out this post on rallypointx";
    const body = `I thought you might be interested in this tennis post: ${shareUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    toast.success("Email client opened");
  };

  const shareViaTwitter = () => {
    const text = "Check out this tennis post on rallypointx";
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    toast.success("Sharing to Twitter");
  };
  
  const shareViaInstagram = () => {
    // Instagram doesn't have a direct web API for sharing links
    // We'll use a mobile deep link that opens Instagram and allows users to share via Stories
    // Note: This primarily works on mobile devices with Instagram app installed
    
    const instagramUrl = `instagram://story?url=${encodeURIComponent(shareUrl)}&source_application=rallypointx`;
    
    // Try to open Instagram app
    window.location.href = instagramUrl;
    
    // Set a timeout to check if the app opened
    setTimeout(() => {
      // If we're still here, it likely means the Instagram app isn't installed
      // Provide a fallback to open Instagram website
      toast.info("For best sharing experience, use Instagram on your mobile device", {
        description: "The Instagram app may be needed to share stories",
        action: {
          label: "Open Instagram",
          onClick: () => window.open("https://www.instagram.com", "_blank")
        }
      });
    }, 500);
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
          <DropdownMenuItem onClick={shareViaInstagram}>
            Share on Instagram
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
            Share this link with other rallypointx users
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
