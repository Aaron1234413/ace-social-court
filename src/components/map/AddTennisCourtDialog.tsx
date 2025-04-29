import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, PlusCircle, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useMapExplorer } from '@/contexts/MapExplorerContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const surfaceTypes = [
  { value: 'hard', label: 'Hard Court' },
  { value: 'clay', label: 'Clay Court' },
  { value: 'grass', label: 'Grass Court' },
  { value: 'carpet', label: 'Carpet Court' },
  { value: 'artificial_grass', label: 'Artificial Grass' },
  { value: 'asphalt', label: 'Asphalt' },
  { value: 'other', label: 'Other' },
];

export interface CourtFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  surface_type: string;
  is_public: boolean;
  is_indoor: boolean;
  has_lighting: boolean;
  has_restrooms: boolean;
  has_pro_shop: boolean;
  number_of_courts: number;
}

const initialFormData: CourtFormData = {
  name: '',
  description: '',
  address: '',
  city: '',
  state: '',
  country: 'USA',
  latitude: 0,
  longitude: 0,
  surface_type: 'hard',
  is_public: true,
  is_indoor: false,
  has_lighting: false,
  has_restrooms: false,
  has_pro_shop: false,
  number_of_courts: 1,
};

const AddTennisCourtDialog = () => {
  const { user } = useAuth();
  const { mapInstance, userPosition } = useMapExplorer();
  const [formData, setFormData] = useState<CourtFormData>({
    ...initialFormData,
    latitude: userPosition?.lat || 0,
    longitude: userPosition?.lng || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocationSelectMode, setIsLocationSelectMode] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = () => {
    setIsLocationSelectMode(true);
    toast.info(
      "Click on the map to select the court location. The dialog will minimize to let you see the map.",
      { duration: 5000 }
    );
    
    // Add a click event listener to the map
    if (mapInstance) {
      const clickHandler = (e: mapboxgl.MapMouseEvent) => {
        // Get coordinates from the click event
        const { lng, lat } = e.lngLat;
        
        // Update form data with the selected coordinates
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        
        // Show a confirmation toast
        toast.success("Location selected!", { duration: 2000 });
        
        // Remove the click event listener
        mapInstance.off('click', clickHandler);
        
        // Exit location select mode
        setIsLocationSelectMode(false);
      };
      
      mapInstance.on('click', clickHandler);
    }
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      latitude: userPosition?.lat || 0,
      longitude: userPosition?.lng || 0,
    });
    setIsLocationSelectMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to add a tennis court");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Court name is required");
      return;
    }

    if (formData.latitude === 0 && formData.longitude === 0) {
      toast.error("Please select a valid location for the court");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('tennis_courts')
        .insert([
          {
            ...formData,
            created_by: user.id
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      toast.success("Tennis court added successfully!");
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding tennis court:", error);
      toast.error("Failed to add tennis court. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Tennis Court
        </Button>
      </DialogTrigger>
      <DialogContent className={`${isLocationSelectMode ? "opacity-70 pointer-events-none" : ""} max-h-[85vh] p-0 md:max-w-xl`}>
        <DialogHeader className="px-6 pt-6 pb-2 sticky top-0 z-10 bg-background">
          <DialogTitle>Add a Tennis Court</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Share your favorite tennis courts with the community.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6 py-2">
          <form id="court-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Court Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange}
                placeholder="Enter the court name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description || ''} 
                onChange={handleInputChange}
                placeholder="Describe the court (conditions, accessibility, etc.)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={formData.address || ''} 
                  onChange={handleInputChange}
                  placeholder="Street address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={formData.city || ''} 
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  name="state" 
                  value={formData.state || ''} 
                  onChange={handleInputChange}
                  placeholder="State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleInputChange}
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="location">Court Location *</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleLocationSelect}
                >
                  <MapPin className="h-4 w-4 mr-1" /> Select on Map
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                  <Input 
                    id="latitude" 
                    name="latitude" 
                    value={formData.latitude} 
                    onChange={handleNumberInputChange}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                  <Input 
                    id="longitude" 
                    name="longitude" 
                    value={formData.longitude} 
                    onChange={handleNumberInputChange}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="surface_type">Surface Type</Label>
              <Select 
                value={formData.surface_type} 
                onValueChange={(value) => handleSelectChange('surface_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select surface type" />
                </SelectTrigger>
                <SelectContent>
                  {surfaceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_courts">Number of Courts</Label>
              <Input 
                id="number_of_courts" 
                name="number_of_courts" 
                type="number"
                min={1}
                value={formData.number_of_courts} 
                onChange={handleNumberInputChange}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Court Features</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="is_public" className="text-sm">Public Access</Label>
                  <Switch 
                    id="is_public" 
                    checked={formData.is_public}
                    onCheckedChange={(checked) => handleSwitchChange('is_public', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="is_indoor" className="text-sm">Indoor Court</Label>
                  <Switch 
                    id="is_indoor" 
                    checked={formData.is_indoor}
                    onCheckedChange={(checked) => handleSwitchChange('is_indoor', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="has_lighting" className="text-sm">Has Lighting</Label>
                  <Switch 
                    id="has_lighting" 
                    checked={formData.has_lighting}
                    onCheckedChange={(checked) => handleSwitchChange('has_lighting', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="has_restrooms" className="text-sm">Restrooms</Label>
                  <Switch 
                    id="has_restrooms" 
                    checked={formData.has_restrooms}
                    onCheckedChange={(checked) => handleSwitchChange('has_restrooms', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="has_pro_shop" className="text-sm">Pro Shop</Label>
                  <Switch 
                    id="has_pro_shop" 
                    checked={formData.has_pro_shop}
                    onCheckedChange={(checked) => handleSwitchChange('has_pro_shop', checked)}
                  />
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>
        
        <DialogFooter className="px-6 pb-6 pt-2 sticky bottom-0 bg-background border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              resetForm();
              setIsOpen(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            form="court-form"
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Add Court'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTennisCourtDialog;
