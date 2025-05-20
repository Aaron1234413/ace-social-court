
import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Settings = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      console.log("Settings: No user found, redirecting to auth");
      navigate("/auth");
    } else {
      console.log("Settings: User authenticated, rendering settings page", { userId: user.id });
    }
  }, [user, navigate]);

  const handleSavePreferences = () => {
    // This would connect to your backend in a real app
    toast.success("Preferences saved successfully!");
  };

  // Add log when component mounts
  useEffect(() => {
    console.log("Settings page mounted", { path: window.location.pathname });
    return () => {
      console.log("Settings page unmounting", { path: window.location.pathname });
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Settings - rallypointx</title>
      </Helmet>
      
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  To change your email, please contact support
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={profile?.username || ""} 
                  disabled 
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  To change your username, please update your profile
                </p>
              </div>

              <div className="pt-2">
                <Button variant="outline" onClick={() => navigate("/profile/edit")}>
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch 
                  id="email-notifications" 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications on your device
                  </p>
                </div>
                <Switch 
                  id="push-notifications" 
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSavePreferences}>
                Save Notification Preferences
              </Button>
            </CardFooter>
          </Card>

          {/* Tennis AI Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Tennis AI Preferences</CardTitle>
              <CardDescription>
                Manage your Tennis AI settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/tennis-preferences")}>
                Manage Tennis AI Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Logout Section */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={() => {
                  signOut();
                  navigate("/auth");
                }}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Settings;
