
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import VideoAnalysisUploader from '@/components/analysis/VideoAnalysisUploader';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { initializeStorage } from '@/integrations/supabase/storage';
import { Helmet } from 'react-helmet-async';

const VideoAnalysis = () => {
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleVideoUploaded = (url: string, fileId: string) => {
    setVideoUrl(url);
    setVideoId(fileId);
  };

  const handleStartAnalysis = async () => {
    if (!videoUrl) {
      toast.error('Please upload a video first');
      return;
    }

    setIsAnalyzing(true);
    try {
      // This is where we would call an API to start the analysis
      // For now, we'll just show a success toast after a delay
      setTimeout(() => {
        toast.success('Analysis complete!', {
          description: 'Your video has been analyzed successfully.',
        });
        setIsAnalyzing(false);
      }, 3000);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze video');
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setVideoUrl(null);
    setVideoId(null);
  };

  // Initialize storage when component mounts
  React.useEffect(() => {
    const setupStorage = async () => {
      if (user) {
        try {
          console.log('Initializing storage for video analysis...');
          await initializeStorage();
          
          // We'll need to create the analysis bucket if it doesn't exist
          // This would typically be done in the initializeStorage function
          // but for now we'll assume it exists or is created elsewhere
        } catch (err) {
          console.error('Failed to initialize storage:', err);
          toast.error('Error initializing storage for video uploads');
        }
      }
    };
    
    setupStorage();
  }, [user]);

  // Get current origin for social meta tags
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = `${origin}/lovable-uploads/5c8dd227-ee47-4884-bb8c-f702433f7f2c.png`;

  return (
    <>
      {/* Custom meta tags for this page */}
      <Helmet>
        <title>Video Analysis - rallypointx</title>
        <meta name="description" content="Analyze your tennis skills with rallypointx" />
        <meta property="og:title" content="Video Analysis - rallypointx" />
        <meta property="og:description" content="Analyze your tennis skills with rallypointx" />
        <meta property="og:image" content={logoUrl} />
        <meta name="twitter:image" content={logoUrl} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Video Analysis</h1>
        
        {!user ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mb-4">Please log in to use the video analysis feature</p>
              <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="history" disabled={!user}>History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Tennis Video</CardTitle>
                  <CardDescription>
                    Upload a video of your tennis match or practice session for AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <VideoAnalysisUploader onVideoUploaded={handleVideoUploaded} maxDurationSeconds={120} />
                  
                  {videoUrl && (
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={handleReset} disabled={isAnalyzing}>
                        Reset
                      </Button>
                      <Button onClick={handleStartAnalysis} disabled={isAnalyzing || !videoUrl}>
                        {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                  <CardDescription>
                    Your previous video analysis sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <p>No previous analysis found</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
};

export default VideoAnalysis;
