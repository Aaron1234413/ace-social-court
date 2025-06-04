
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Info, AlertTriangle } from 'lucide-react';
import { AlertThresholds, AlertEngine } from '@/services/AlertEngine';

interface ThresholdSettingsProps {
  currentThresholds: AlertThresholds;
  onUpdateThresholds?: (thresholds: Partial<AlertThresholds>) => void;
}

export function ThresholdSettings({ currentThresholds, onUpdateThresholds }: ThresholdSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customThresholds, setCustomThresholds] = useState({
    missedSessionThreshold: currentThresholds.missedSessionThreshold,
    neverPostedThreshold: currentThresholds.neverPostedThreshold,
    consecutiveThreshold: currentThresholds.consecutiveThreshold
  });

  const explanation = AlertEngine.getThresholdExplanation(currentThresholds);

  const handleSave = () => {
    if (onUpdateThresholds && customEnabled) {
      onUpdateThresholds(customThresholds);
    }
    setIsOpen(false);
  };

  const getRecommendedThreshold = (rosterSize: number) => {
    const recommended = AlertEngine.calculateThresholds(rosterSize);
    return recommended.missedSessionThreshold;
  };

  return (
    <>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        <span>{explanation}</span>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <Settings className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Alert Threshold Settings
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Current Auto-Settings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Auto-Scaled Thresholds</h4>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-blue-800">Roster Size</div>
                      <div className="text-blue-600">{currentThresholds.rosterSize} students</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-800">Missed Sessions Alert</div>
                      <div className="text-blue-600">{currentThresholds.missedSessionThreshold} sessions</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-800">Never Posted Alert</div>
                      <div className="text-blue-600">{currentThresholds.neverPostedThreshold} days</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-800">Consecutive Missed</div>
                      <div className="text-blue-600">{currentThresholds.consecutiveThreshold} days</div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <div className="font-medium mb-1">How auto-scaling works:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Small groups (≤5): Alert after 1 missed session</li>
                    <li>• Medium groups (6-9): Alert after 2 missed sessions</li>
                    <li>• Large groups (≥10): Alert after 3 missed sessions</li>
                  </ul>
                </div>
              </div>

              {/* Custom Settings Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="custom-thresholds" className="font-medium">
                      Custom Thresholds
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Override auto-scaling with your own settings
                    </div>
                  </div>
                  <Switch
                    id="custom-thresholds"
                    checked={customEnabled}
                    onCheckedChange={setCustomEnabled}
                  />
                </div>

                {customEnabled && (
                  <div className="space-y-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Custom Mode Active</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Missed Sessions Alert: {customThresholds.missedSessionThreshold} sessions
                        </Label>
                        <div className="mt-2">
                          <Slider
                            value={[customThresholds.missedSessionThreshold]}
                            onValueChange={(value) => 
                              setCustomThresholds(prev => ({ 
                                ...prev, 
                                missedSessionThreshold: value[0] 
                              }))
                            }
                            max={7}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Recommended for your group: {getRecommendedThreshold(currentThresholds.rosterSize)} sessions
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Never Posted Alert: {customThresholds.neverPostedThreshold} days
                        </Label>
                        <div className="mt-2">
                          <Slider
                            value={[customThresholds.neverPostedThreshold]}
                            onValueChange={(value) => 
                              setCustomThresholds(prev => ({ 
                                ...prev, 
                                neverPostedThreshold: value[0] 
                              }))
                            }
                            max={14}
                            min={3}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Consecutive Missed Alert: {customThresholds.consecutiveThreshold} days
                        </Label>
                        <div className="mt-2">
                          <Slider
                            value={[customThresholds.consecutiveThreshold]}
                            onValueChange={(value) => 
                              setCustomThresholds(prev => ({ 
                                ...prev, 
                                consecutiveThreshold: value[0] 
                              }))
                            }
                            max={7}
                            min={1}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Settings
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
