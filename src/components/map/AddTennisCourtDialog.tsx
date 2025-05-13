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
import { LocationPickerDialog, LocationResult } from '@/components/location';

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
  const { userPosition } = useMapExplorer();
  const [formData, setFormData] = useState<CourtFormData>({
    ...initialFormData,
    latitude: userPosition?.lat || 0,
    longitude: userPosition?.lng || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

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
    console.log("Opening location picker");
    setShowLocationPicker(true);
  };

  const handleLocationPickerClose = () => {
    console.log("Closing location picker");
    setShowLocationPicker(false);
  };

  const handleLocationPickerSelect = (location: LocationResult) => {
    console.log("Location selected:", location.lat, location.lng, location.address);
    
    // Parse the address to extract city, state, country if possible
    let city = '';
    let state = '';
    let country = 'USA'; // Default
    
    // Simple parsing of the address string
    const parts = location.address.split(', ');
    if (parts.length >= 3) {
      // Assuming format like "Street, City, State ZIP, Country"
      city = parts[1] || '';
      
      // Try to extract state from the third part (which might have ZIP code)
      const stateZip = parts[2] || '';
      const stateMatch = stateZip.match(/([A-Z]{2})/);
      state = stateMatch ? stateMatch[0] : '';
      
      // Last part is usually country
      country = parts[parts.length - 1] || 'USA';
    }

    setFormData((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      address: location.address.split(',')[0] || '', // First part is typically street address
      city,
      state,
      country
    }));
    
    setShowLocationPicker(false);
    toast.success("Location selected successfully!");
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      latitude: userPosition?.lat || 0,
      longitude: userPosition?.lng || 0,
    });
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
      console.log("Submitting tennis court data:", formData);
      
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
    <>
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
        <DialogContent className="max-h-[85vh] p-0 md:max-w-xl">
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="location" className="font-medium">Court Location *</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleLocationSelect}
                    className="gap-1"
                  >
                    <MapPin className="h-4 w-4" /> Select Location
                  </Button>
                </div>

                {(formData.latitude !== 0 || formData.longitude !== 0) && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">Selected Location:</p>
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      {formData.address ? (
                        <>
                          {formData.address}, {formData.city}, {formData.state}, {formData.country}
                        </>
                      ) : (
                        <>Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}</>
                      )}
                    </p>
                  </div>
                )}
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

      <LocationPickerDialog 
        open={showLocationPicker}
        onOpenChange={setShowLocationPicker}
        onLocationSelect={handleLocationPickerSelect}
      />
    </>
  );
};

export default AddTennisCourtDialog;
