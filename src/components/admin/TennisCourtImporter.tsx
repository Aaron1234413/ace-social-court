
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Database, MapPin, Map } from 'lucide-react';
import { toast } from 'sonner';

const TennisCourtImporter = () => {
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState('all');
  const [courtCount, setCourtCount] = useState(50);
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
    imported?: number;
    errors?: any[];
    timestamp?: string;
  }>({});

  const states = [
    { code: 'all', name: 'All States' },
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];

  const importCourts = async () => {
    try {
      setLoading(true);
      
      // Call our edge function to import tennis courts
      const { data, error } = await supabase.functions.invoke('import-tennis-courts', {
        body: {
          state: selectedState,
          count: parseInt(courtCount.toString(), 10)
        }
      });

      if (error) {
        console.error("Error importing courts:", error);
        toast.error(`Import failed: ${error.message}`);
        setImportStatus({
          success: false,
          message: `Error: ${error.message}`,
          timestamp: new Date().toLocaleString()
        });
        return;
      }
      
      console.log("Import result:", data);
      
      setImportStatus({
        success: data.success,
        message: data.message,
        imported: data.imported,
        errors: data.errors,
        timestamp: new Date().toLocaleString()
      });
      
      if (data.success) {
        toast.success(data.message || 'Tennis courts imported successfully');
      } else if (data.imported > 0) {
        toast.info(`Imported ${data.imported} courts with some errors`);
      } else {
        toast.error('Failed to import tennis courts');
      }
      
    } catch (err) {
      console.error("Exception during import:", err);
      toast.error(`Import failed: ${err.message || 'Unknown error'}`);
      setImportStatus({
        success: false,
        message: `Exception: ${err.message || 'Unknown error'}`,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> Tennis Court Data Importer
        </CardTitle>
        <CardDescription>
          Import tennis court data for the USA tennis map
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">Select State</Label>
              <Select
                value={selectedState}
                onValueChange={setSelectedState}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="count">Count per State</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={1000}
                value={courtCount}
                onChange={(e) => setCourtCount(parseInt(e.target.value) || 50)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {selectedState === 'all' 
                  ? 'Courts will be distributed across states based on population' 
                  : 'Number of courts to generate for the selected state'}
              </p>
            </div>
          </div>
          
          {importStatus.timestamp && (
            <div className={`border rounded-lg p-4 ${importStatus.success ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-start gap-3">
                {importStatus.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-medium">
                    {importStatus.message || (importStatus.success ? 'Import successful' : 'Import failed')}
                  </p>
                  {importStatus.imported && (
                    <p className="text-sm">Imported {importStatus.imported} tennis courts</p>
                  )}
                  <p className="text-xs text-muted-foreground">{importStatus.timestamp}</p>
                  
                  {importStatus.errors && importStatus.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-700">Errors:</p>
                      <ul className="text-xs text-red-600 list-disc list-inside">
                        {importStatus.errors.slice(0, 3).map((err, i) => (
                          <li key={i}>{typeof err === 'object' ? JSON.stringify(err) : err}</li>
                        ))}
                        {importStatus.errors.length > 3 && (
                          <li>...and {importStatus.errors.length - 3} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="flex gap-1 items-center">
            <MapPin className="h-3 w-3" />
            Data Source: Synthetic Generator
          </Badge>
          <Badge variant="outline" className="flex gap-1 items-center">
            <Map className="h-3 w-3" />
            USA Coverage
          </Badge>
        </div>
        
        <Button onClick={importCourts} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Importing...' : 'Import Tennis Courts'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TennisCourtImporter;
