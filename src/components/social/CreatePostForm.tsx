import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import MediaUploader from '@/components/media/MediaUploader';
import { Image, FileVideo, X } from 'lucide-react';
import { TagSelector } from './TagSelector';

interface CreatePostFormProps {
  onPostCreated: () => void;
}

interface Tag {
  id: string;
  name: string;
  category: string;
}

const CreatePostForm = ({ onPostCreated }: CreatePostFormProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('id, name, category')
          .order('name');
        
        if (error) {
          console.error('Error fetching tags:', error);
          toast.error('Failed to load tags');
          return;
        }
        
        setAvailableTags(data || []);
      } catch (error) {
        console.error('Error in fetchTags:', error);
        setAvailableTags([]);
      }
    };
    
    fetchTags();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a post');
      return;
    }
    
    if (!content.trim() && !mediaUrl) {
      toast.error('Please write something or add media to post');
      return;
    }
    
    try {
      setIsPosting(true);
      
      // First create the post
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert([{
          content: content.trim(),
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType
        }])
        .select()
        .single();
      
      if (postError) throw postError;
      
      // Then add tags if any
      if (selectedTags && selectedTags.length > 0 && newPost) {
        const tagInserts = selectedTags.map(tag => ({
          post_id: newPost.id,
          tag_id: tag.id
        }));
        
        const { error: tagError } = await supabase
          .from('post_tags')
          .insert(tagInserts);
          
        if (tagError) {
          console.error('Error adding tags:', tagError);
          toast.error('Post created but tags could not be added');
        }
      }
      
      // Reset form
      setContent('');
      setMediaUrl(null);
      setMediaType(null);
      setShowMediaUploader(false);
      setSelectedTags([]);
      
      // Notify parent component
      onPostCreated();
      
      toast.success('Post created successfully!');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(`Failed to create post: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };
  
  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
    setShowMediaUploader(false);
  };
  
  const clearMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Share something with the tennis community..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full resize-none"
        />
        
        {mediaUrl && mediaType && (
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            {mediaType === 'image' ? (
              <div className="flex items-center justify-center">
                <img 
                  src={mediaUrl} 
                  alt="Uploaded media" 
                  className="max-h-48 object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center bg-gray-100">
                <video 
                  src={mediaUrl} 
                  controls 
                  className="max-h-48 max-w-full"
                />
              </div>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 rounded-full w-6 h-6 bg-gray-800/60 hover:bg-gray-800"
              onClick={clearMedia}
              type="button"
            >
              <X className="h-3 w-3 text-white" />
            </Button>
          </div>
        )}
        
        <TagSelector 
          selectedTags={selectedTags || []}
          onTagsChange={setSelectedTags}
          availableTags={availableTags || []}
        />
        
        {showMediaUploader && !mediaUrl && (
          <div className="mb-3">
            <MediaUploader onMediaUpload={handleMediaUpload} />
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {!showMediaUploader && !mediaUrl && (
              <>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowMediaUploader(true)}
                  className="flex items-center gap-1"
                >
                  <Image className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Media</span>
                </Button>
              </>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={isPosting || (!content.trim() && !mediaUrl)}
          >
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CreatePostForm;
