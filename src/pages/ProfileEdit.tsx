import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/integrations/supabase/types';

type UserType = Database['public']['Enums']['user_type'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

const ProfileEdit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    user_type: 'player' as UserType,
    playing_style: '',
    experience_level: '' as ExperienceLevel,
    bio: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile({
          username: data.username || '',
          full_name: data.full_name || '',
          user_type: (data.user_type as UserType) || 'player',
          playing_style: data.playing_style || '',
          experience_level: (data.experience_level as ExperienceLevel) || 'beginner',
          bio: data.bio || '',
        });
      } catch (error) {
        toast.error('Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          full_name: profile.full_name,
          user_type: profile.user_type,
          playing_style: profile.playing_style,
          experience_level: profile.experience_level,
          bio: profile.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            value={profile.username}
            onChange={handleInputChange}
            placeholder="Choose a username"
          />
        </div>
        
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            value={profile.full_name}
            onChange={handleInputChange}
            placeholder="Your full name"
          />
        </div>

        <div>
          <Label htmlFor="user_type">Account Type</Label>
          <Select 
            value={profile.user_type} 
            onValueChange={(value: UserType) => setProfile(prev => ({ ...prev, user_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="player">Player</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="playing_style">Playing Style</Label>
          <Input
            id="playing_style"
            name="playing_style"
            value={profile.playing_style}
            onChange={handleInputChange}
            placeholder="Describe your playing style"
          />
        </div>

        <div>
          <Label htmlFor="experience_level">Experience Level</Label>
          <Select 
            value={profile.experience_level} 
            onValueChange={(value: ExperienceLevel) => setProfile(prev => ({ ...prev, experience_level: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            name="bio"
            value={profile.bio}
            onChange={handleInputChange}
            className="w-full border rounded p-2"
            placeholder="Tell us about yourself"
            rows={4}
          />
        </div>

        <Button type="submit" className="w-full">Save Profile</Button>
      </form>
    </div>
  );
};

export default ProfileEdit;
