
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Mail, Phone, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FollowButton from '@/components/social/FollowButton';

interface ContactImportProps {
  isOpen: boolean;
  onClose: () => void;
  onFollowSuccess: () => void;
}

interface FoundContact {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  user_type: string;
}

export function ContactImport({ isOpen, onClose, onFollowSuccess }: ContactImportProps) {
  const [importMethod, setImportMethod] = useState<'email' | 'file' | null>(null);
  const [emails, setEmails] = useState('');
  const [foundContacts, setFoundContacts] = useState<FoundContact[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleEmailSearch = async () => {
    if (!emails.trim()) {
      toast.error('Please enter some email addresses');
      return;
    }

    setIsSearching(true);
    try {
      const emailList = emails
        .split(/[,\n]/)
        .map(email => email.trim().toLowerCase())
        .filter(email => email && email.includes('@'));

      if (emailList.length === 0) {
        toast.error('Please enter valid email addresses');
        return;
      }

      // Search for users by email using a database function
      const { data, error } = await supabase.rpc('search_users_by_email', {
        email_query: emailList.join('|')
      });

      if (error) throw error;

      // Get profile information for found users
      if (data && data.length > 0) {
        const userIds = data.map((user: any) => user.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type')
          .in('id', userIds);

        if (profileError) throw profileError;

        const contactsWithProfiles = profiles?.map(profile => ({
          ...profile,
          email: data.find((user: any) => user.user_id === profile.id)?.email || ''
        })) || [];

        setFoundContacts(contactsWithProfiles);
        
        if (contactsWithProfiles.length === 0) {
          toast.info('No users found with those email addresses');
        } else {
          toast.success(`Found ${contactsWithProfiles.length} contacts on the platform!`);
        }
      } else {
        setFoundContacts([]);
        toast.info('No users found with those email addresses');
      }
    } catch (error) {
      console.error('Error searching contacts:', error);
      toast.error('Failed to search for contacts');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      // Extract emails from CSV or text file
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      const extractedEmails = content.match(emailRegex) || [];
      setEmails(extractedEmails.join('\n'));
    };
    reader.readAsText(file);
  };

  const resetImport = () => {
    setImportMethod(null);
    setEmails('');
    setFoundContacts([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Contacts
          </DialogTitle>
          <DialogDescription>
            Find friends who are already using the tennis app by importing your contacts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!importMethod && (
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setImportMethod('email')}
              >
                <CardContent className="p-6 text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">Email List</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste or type email addresses
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setImportMethod('file')}
              >
                <CardContent className="p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">Upload File</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV or text file
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {importMethod === 'email' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="emails">Email Addresses</Label>
                <Textarea
                  id="emails"
                  placeholder="Enter email addresses (one per line or comma-separated)"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  rows={8}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: friend@email.com, another@example.com
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleEmailSearch} 
                  disabled={isSearching}
                  className="flex-1"
                >
                  {isSearching ? 'Searching...' : 'Find Contacts'}
                </Button>
                <Button variant="outline" onClick={resetImport}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {importMethod === 'file' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Upload Contact File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a CSV or text file containing email addresses
                </p>
              </div>

              {emails && (
                <div>
                  <Label>Extracted Emails ({emails.split('\n').filter(e => e.trim()).length})</Label>
                  <Textarea
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    rows={6}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleEmailSearch} 
                  disabled={isSearching || !emails.trim()}
                  className="flex-1"
                >
                  {isSearching ? 'Searching...' : 'Find Contacts'}
                </Button>
                <Button variant="outline" onClick={resetImport}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {foundContacts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Found Contacts ({foundContacts.length})</h3>
                <Button variant="outline" size="sm" onClick={resetImport}>
                  Import More
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {foundContacts.map((contact) => (
                  <Card key={contact.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {contact.full_name?.charAt(0) || contact.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {contact.full_name || contact.username || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">{contact.email}</p>
                          {contact.username && (
                            <p className="text-xs text-muted-foreground">@{contact.username}</p>
                          )}
                        </div>
                      </div>
                      <FollowButton
                        userId={contact.id}
                        username={contact.username}
                        fullName={contact.full_name}
                        variant="outline"
                        size="sm"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              We respect your privacy. Email addresses are only used to find existing users and are not stored or shared.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
