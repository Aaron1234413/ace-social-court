
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import VideoAnalysisUploader from '@/components/analysis/VideoAnalysisUploader';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { initializeStorage } from '@/integrations/supabase/storage';
import { Helmet } from 'react-helmet-async';
import { startVideoAnalysis, pollAnalysisStatus, VideoAnalysisResult, TechniqueDetection } from '@/services/VideoAnalysisService';
import { Loader2, ArrowLeft } from 'lucide-react';
import TechniqueDetectionPlayer from '@/components/analysis/TechniqueDetectionPlayer';
import TechniqueDetails from '@/components/analysis/TechniqueDetails';
import AnalysisSummary from '@/components/analysis/AnalysisSummary';
import { supabase } from '@/integrations/supabase/client';

const VideoAnalysis = () => {
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueDetection | null>(null);
  const [previousAnalyses, setPreviousAnalyses] = useState<VideoAnalysisResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const handleVideoUploaded = (url: string, fileId: string) => {
    setVideoUrl(url);
    setVideoId(fileId);
  };

  const handleStartAnalysis = async () => {
    if (!videoUrl || !videoId) {
      toast.error('Please upload a video first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { analysisId: newAnalysisId } = await startVideoAnalysis(videoId, videoUrl);
      setAnalysisId(newAnalysisId);
      
      toast.success('Analysis started!', {
        description: 'Your video is being processed. This may take a few moments.',
      });
      
      // Start polling for results
      const cancelPolling = pollAnalysisStatus(newAnalysisId, (result) => {
        setAnalysisResult(result);
        setIsAnalyzing(false);
        
        if (result.status === 'completed') {
          toast.success('Analysis complete!', {
            description: 'Your video has been analyzed successfully.',
          });
          // If techniques exist, select the first one
          if (result.techniques && result.techniques.length > 0) {
            setSelectedTechnique(result.techniques[0]);
          }
        } else if (result.status === 'failed') {
          toast.error('Analysis failed', {
            description: 'There was an error analyzing your video. Please try again.',
          });
        }
      });
      
      // Clean up polling on component unmount
      return () => cancelPolling();
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze video');
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setVideoUrl(null);
    setVideoId(null);
    setAnalysisId(null);
    setAnalysisResult(null);
    setSelectedTechnique(null);
  };
  
  const handleSelectAnalysis = (result: VideoAnalysisResult) => {
    setAnalysisResult(result);
    if (result.techniques && result.techniques.length > 0) {
      setSelectedTechnique(result.techniques[0]);
    }
  };

  // Load previous analyses when tab changes to history
  const loadPreviousAnalyses = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('video_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      setPreviousAnalyses(data as VideoAnalysisResult[]);
    } catch (error) {
      console.error('Error loading analysis history:', error);
      toast.error('Failed to load analysis history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Initialize storage when component mounts
  useEffect(() => {
    const setupStorage = async () => {
      if (user) {
        try {
          console.log('Initializing storage for video analysis...');
          await initializeStorage();
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
        ) : analysisResult ? (
          // Analysis Results View
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={handleReset} 
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Upload
            </Button>
            
            <AnalysisSummary result={analysisResult} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TechniqueDetectionPlayer 
                  videoUrl={videoUrl || ''} 
                  detections={analysisResult.techniques || []}
                  onSelectDetection={setSelectedTechnique}
                />
              </div>
              <div className="lg:col-span-1">
                <TechniqueDetails detection={selectedTechnique} />
              </div>
            </div>
          </div>
        ) : (
          <Tabs 
            defaultValue="upload" 
            className="space-y-6"
            onValueChange={(value) => {
              if (value === 'history') {
                loadPreviousAnalyses();
              }
            }}
          >
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
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          'Start Analysis'
                        )}
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
                  {isLoadingHistory ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : previousAnalyses.length > 0 ? (
                    <div className="space-y-4">
                      {previousAnalyses.map((analysis) => (
                        <Card key={analysis.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleSelectAnalysis(analysis)}>
                          <CardContent className="py-4 flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{new Date(analysis.createdAt).toLocaleDateString()}</h3>
                              <p className="text-sm text-gray-500">
                                {analysis.techniques?.length || 0} techniques detected
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">View</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No previous analysis found</p>
                    </div>
                  )}
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
