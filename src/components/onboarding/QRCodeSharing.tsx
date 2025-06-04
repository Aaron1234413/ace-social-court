
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Share2, Copy, Download, Camera } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface QRCodeSharingProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeSharing({ isOpen, onClose }: QRCodeSharingProps) {
  const { user, profile } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (user && profile) {
      const baseUrl = window.location.origin;
      const userProfileUrl = `${baseUrl}/profile/${user.id}`;
      setProfileUrl(userProfileUrl);
      
      // Generate QR code URL using a free QR code API
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(userProfileUrl)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [user, profile]);

  const copyProfileUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name || profile?.username || 'Tennis Player'}'s Profile`,
          text: 'Check out my tennis profile!',
          url: profileUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyProfileUrl();
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `tennis-profile-qr-${profile?.username || 'user'}.png`;
    link.click();
  };

  const scanQRCode = () => {
    setShowScanner(true);
    // In a real implementation, you would integrate with a QR scanner library
    toast.info('QR Scanner would open here. For now, you can manually enter profile URLs.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Share Your Profile
          </DialogTitle>
          <DialogDescription>
            Share your QR code to help others find and follow you easily
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <img 
                  src={qrCodeUrl} 
                  alt="Profile QR Code"
                  className="mx-auto rounded-lg shadow-sm"
                  width={200}
                  height={200}
                />
              </div>
              <h3 className="font-medium mb-2">
                {profile?.full_name || profile?.username || 'Tennis Player'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Scan this QR code to follow me
              </p>
              <Button onClick={downloadQRCode} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Save QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Profile URL */}
          <div className="space-y-2">
            <Label htmlFor="profile-url">Your Profile URL</Label>
            <div className="flex gap-2">
              <Input
                id="profile-url"
                value={profileUrl}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyProfileUrl} size="icon" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Share Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={shareProfile} variant="outline" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share Profile
            </Button>
            <Button onClick={scanQRCode} variant="outline" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Scan QR Code
            </Button>
          </div>

          {/* QR Scanner Placeholder */}
          {showScanner && (
            <Card>
              <CardContent className="p-6 text-center">
                <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-2">QR Code Scanner</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Camera integration would be implemented here
                </p>
                <div className="space-y-2">
                  <Input placeholder="Or paste profile URL here..." />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">Follow User</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowScanner(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">💡 Quick Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Share your QR code at tennis courts or events</li>
                <li>• Add the QR code to your social media profiles</li>
                <li>• Print it on business cards or tennis gear</li>
                <li>• Send the profile URL via text or email</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
