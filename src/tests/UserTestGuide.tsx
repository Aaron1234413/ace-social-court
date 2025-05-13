
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Types for our test scenarios
interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: string[];
  expectedResult: string;
  route?: string;
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  scenarios: TestScenario[];
}

const UserTestGuide = () => {
  const navigate = useNavigate();
  const [completedTests, setCompletedTests] = useState<Record<string, boolean>>({});
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  // Toggle test completion status
  const toggleTestCompletion = (testId: string) => {
    setCompletedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
    
    // Show toast for test completion
    if (!completedTests[testId]) {
      toast.success("Test marked as completed", {
        description: "You can always uncheck it if you need to retest"
      });
    }
  };

  // Navigate to a specific route
  const navigateToRoute = (route: string) => {
    navigate(route);
  };

  // Calculate progress
  const calculateProgress = (categoryId: string) => {
    const category = testCategories.find(cat => cat.id === categoryId);
    if (!category) return 0;
    
    const totalTests = category.scenarios.length;
    const completed = category.scenarios.filter(s => completedTests[s.id]).length;
    
    return totalTests > 0 ? Math.round((completed / totalTests) * 100) : 0;
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    const allScenarios = testCategories.flatMap(cat => cat.scenarios);
    const totalTests = allScenarios.length;
    const completed = allScenarios.filter(s => completedTests[s.id]).length;
    
    return totalTests > 0 ? Math.round((completed / totalTests) * 100) : 0;
  };

  // Test scenarios organized by category
  const testCategories: TestCategory[] = [
    {
      id: "auth",
      name: "Authentication & User Profile",
      description: "Test user authentication, profile creation and editing",
      scenarios: [
        {
          id: "auth-signup",
          name: "New User Sign Up",
          description: "Test the sign up process for new users",
          steps: [
            "Go to the Auth page",
            "Click on 'Sign Up'",
            "Fill in your email and password",
            "Complete the profile creation process"
          ],
          expectedResult: "Account should be created and you should be redirected to complete your profile",
          route: "/auth"
        },
        {
          id: "auth-login",
          name: "User Login",
          description: "Test the login process",
          steps: [
            "Go to the Auth page",
            "Enter your credentials",
            "Click on 'Sign In'"
          ],
          expectedResult: "You should be logged in and redirected to the feed page",
          route: "/auth"
        },
        {
          id: "profile-edit",
          name: "Edit Profile",
          description: "Test editing user profile information",
          steps: [
            "Navigate to your profile page",
            "Click on 'Edit Profile'",
            "Update various fields",
            "Save changes"
          ],
          expectedResult: "Profile should be updated with new information",
          route: "/profile/edit"
        },
        {
          id: "profile-avatar",
          name: "Upload Profile Avatar",
          description: "Test uploading a new profile picture",
          steps: [
            "Go to profile edit page",
            "Click on avatar/photo upload area",
            "Select an image file",
            "Save changes"
          ],
          expectedResult: "New avatar should be displayed on your profile",
          route: "/profile/edit"
        }
      ]
    },
    {
      id: "social",
      name: "Social Features",
      description: "Test posting, commenting, liking, and following features",
      scenarios: [
        {
          id: "post-create",
          name: "Create Post",
          description: "Test creating a new post",
          steps: [
            "Go to the Feed page",
            "Find the post creation form at the top",
            "Add text content",
            "Optionally upload media",
            "Submit the post"
          ],
          expectedResult: "New post should appear in your feed",
          route: "/feed"
        },
        {
          id: "post-like",
          name: "Like a Post",
          description: "Test the post like functionality",
          steps: [
            "Find a post in the feed",
            "Click the like button",
            "Observe the like count change"
          ],
          expectedResult: "Like count should increase and like button should show as active",
          route: "/feed"
        },
        {
          id: "post-comment",
          name: "Comment on a Post",
          description: "Test adding a comment to a post",
          steps: [
            "Find a post in the feed",
            "Click the comment button",
            "Type a comment in the comment box",
            "Submit the comment"
          ],
          expectedResult: "Comment should appear under the post and comment count should increase",
          route: "/feed"
        },
        {
          id: "profile-follow",
          name: "Follow Another User",
          description: "Test the follow user functionality",
          steps: [
            "Navigate to another user's profile",
            "Click the 'Follow' button",
            "Observe the follower count change"
          ],
          expectedResult: "Follow button should change to 'Following' and the user's posts should appear in your feed",
          route: "/search"
        }
      ]
    },
    {
      id: "map",
      name: "Map Explorer",
      description: "Test map exploration and tennis court discovery features",
      scenarios: [
        {
          id: "map-view",
          name: "View Map",
          description: "Test the map loading and display",
          steps: [
            "Navigate to the Map page",
            "Check if map loads correctly",
            "Try zooming in and out",
            "Try panning the map"
          ],
          expectedResult: "Map should display correctly with proper controls",
          route: "/map"
        },
        {
          id: "map-courts",
          name: "Find Tennis Courts",
          description: "Test finding tennis courts on the map",
          steps: [
            "Navigate to the Map page",
            "Select 'Courts' tab if not already selected",
            "Look for tennis court markers on the map",
            "Click on a tennis court marker"
          ],
          expectedResult: "Court information should display when clicked",
          route: "/map"
        },
        {
          id: "map-people",
          name: "Find Nearby Players/Coaches",
          description: "Test finding tennis players and coaches on the map",
          steps: [
            "Navigate to the Map page",
            "Select the 'People' tab",
            "Look for player/coach markers on the map",
            "Filter between players and coaches"
          ],
          expectedResult: "People markers should display on the map according to filters",
          route: "/map"
        },
        {
          id: "add-court",
          name: "Add a Tennis Court",
          description: "Test adding a new tennis court to the map",
          steps: [
            "Navigate to the Map page",
            "Click on 'Add Court' button",
            "Fill in court details and location",
            "Submit the new court"
          ],
          expectedResult: "New court should appear on the map",
          route: "/map"
        }
      ]
    },
    {
      id: "messaging",
      name: "Messaging",
      description: "Test direct messaging functionality",
      scenarios: [
        {
          id: "messages-view",
          name: "View Messages",
          description: "Test viewing message conversations",
          steps: [
            "Navigate to the Messages page",
            "Check if conversations load",
            "Select a conversation"
          ],
          expectedResult: "Conversation history should load and display correctly",
          route: "/messages"
        },
        {
          id: "messages-send",
          name: "Send Message",
          description: "Test sending a new message",
          steps: [
            "Navigate to the Messages page",
            "Select a conversation or start a new one",
            "Type a message in the input field",
            "Press send"
          ],
          expectedResult: "Message should appear in the conversation",
          route: "/messages"
        },
        {
          id: "messages-media",
          name: "Send Media in Message",
          description: "Test sending media in messages",
          steps: [
            "Navigate to a conversation",
            "Click the media attachment button",
            "Select an image or video file",
            "Send the message with attachment"
          ],
          expectedResult: "Media should be uploaded and displayed in the conversation",
          route: "/messages"
        }
      ]
    },
    {
      id: "notifications",
      name: "Notifications",
      description: "Test notification system",
      scenarios: [
        {
          id: "notifications-view",
          name: "View Notifications",
          description: "Test viewing notifications",
          steps: [
            "Navigate to Notifications page",
            "Check if notifications load correctly",
            "Scroll through notifications"
          ],
          expectedResult: "Notifications should display with relevant information",
          route: "/notifications"
        },
        {
          id: "notifications-interact",
          name: "Interact with Notifications",
          description: "Test interacting with notifications",
          steps: [
            "Navigate to Notifications page",
            "Click on a notification",
            "Verify you're directed to the relevant content"
          ],
          expectedResult: "Clicking notifications should navigate to the appropriate content",
          route: "/notifications"
        }
      ]
    },
    {
      id: "tennis-ai",
      name: "Tennis AI Features",
      description: "Test AI-powered tennis features",
      scenarios: [
        {
          id: "ai-chat",
          name: "Tennis AI Chat",
          description: "Test the Tennis AI chat assistant",
          steps: [
            "Navigate to the Tennis AI page",
            "Type a tennis-related question in the chat",
            "Submit your question",
            "Review the AI response"
          ],
          expectedResult: "AI should provide relevant tennis advice or information",
          route: "/tennis-ai"
        },
        {
          id: "video-analysis",
          name: "Video Analysis",
          description: "Test uploading a video for AI analysis",
          steps: [
            "Navigate to the Video Analysis page",
            "Upload a tennis video",
            "Wait for analysis to complete",
            "Review the analysis results"
          ],
          expectedResult: "Analysis should provide feedback on tennis technique",
          route: "/analysis"
        }
      ]
    },
    {
      id: "search",
      name: "Search",
      description: "Test search functionality",
      scenarios: [
        {
          id: "search-users",
          name: "Search for Users",
          description: "Test searching for other users",
          steps: [
            "Click on the search bar in the navigation",
            "Enter a search term",
            "Submit the search",
            "View search results"
          ],
          expectedResult: "Search results should display relevant users",
          route: "/search"
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">rallypointx User Testing Guide</h1>
        <p className="text-muted-foreground">
          Use this guide to systematically test all features of the application.
        </p>
        
        <div className="mt-4">
          <div className="flex justify-center items-center gap-2">
            <div className="text-sm font-medium">Overall Progress:</div>
            <div className="h-4 w-64 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${calculateOverallProgress()}%` }}
              />
            </div>
            <div className="text-sm font-medium">{calculateOverallProgress()}%</div>
          </div>
        </div>
      </div>

      {/* Category Selection */}
      {!currentCategory && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testCategories.map(category => (
            <Card key={category.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground mb-2">
                  Progress: {calculateProgress(category.id)}%
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${calculateProgress(category.id)}%` }}
                  />
                </div>
                <div className="mt-4 text-sm">
                  {category.scenarios.length} test scenarios
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => setCurrentCategory(category.id)}
                >
                  Start Testing
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Test Scenarios for Selected Category */}
      {currentCategory && (
        <>
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              onClick={() => setCurrentCategory(null)}
            >
              Back to Categories
            </Button>
            <h2 className="text-2xl font-bold">
              {testCategories.find(cat => cat.id === currentCategory)?.name}
            </h2>
            <div className="w-24" /> {/* Empty space for layout balance */}
          </div>

          <div className="space-y-4">
            {testCategories
              .find(cat => cat.id === currentCategory)
              ?.scenarios.map(scenario => (
                <Card key={scenario.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{scenario.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={scenario.id}
                          checked={!!completedTests[scenario.id]}
                          onCheckedChange={() => toggleTestCompletion(scenario.id)}
                        />
                        <label htmlFor={scenario.id} className="text-sm font-medium">
                          Completed
                        </label>
                      </div>
                    </div>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Steps to Test:</h4>
                        <ol className="list-decimal list-inside space-y-1">
                          {scenario.steps.map((step, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">{step}</li>
                          ))}
                        </ol>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Expected Result:</h4>
                        <p className="text-sm text-muted-foreground">{scenario.expectedResult}</p>
                      </div>
                    </div>
                  </CardContent>
                  {scenario.route && (
                    <CardFooter>
                      <Button 
                        variant="secondary" 
                        onClick={() => navigateToRoute(scenario.route!)}
                      >
                        Go to Test Location
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UserTestGuide;
