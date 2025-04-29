
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define the structure for a tennis court
interface TennisCourt {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  surface_type?: string;
  is_public?: boolean;
  is_indoor?: boolean;
  number_of_courts?: number;
  has_lighting?: boolean;
  has_restrooms?: boolean;
  has_pro_shop?: boolean;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Data sources and fetch functions
const dataSources = {
  // Sample states for initial seeding (more can be added)
  states: [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ],
  
  // Used for approximate distributions of courts
  populationByState: {
    "CA": 39.24, "TX": 29.53, "FL": 22.25, "NY": 19.84, "PA": 13.01, 
    "IL": 12.59, "OH": 11.79, "GA": 10.92, "NC": 10.70, "MI": 10.08,
    "NJ": 9.27, "VA": 8.64, "WA": 7.96, "AZ": 7.52, "MA": 7.03,
    "TN": 7.00, "IN": 6.83, "MO": 6.17, "MD": 6.17, "CO": 5.84,
    "SC": 5.28, "AL": 5.07, "LA": 4.66, "KY": 4.51, "OR": 4.27,
    "OK": 4.02, "CT": 3.60, "UT": 3.34, "IA": 3.20, "NV": 3.17,
    "AR": 3.03, "MS": 2.94, "KS": 2.94, "NM": 2.12, "NE": 1.97,
    "ID": 1.90, "WV": 1.76, "HI": 1.43, "NH": 1.39, "ME": 1.37,
    "MT": 1.11, "RI": 1.10, "DE": 1.01, "SD": 0.91, "ND": 0.78,
    "AK": 0.73, "VT": 0.64, "WY": 0.58
  },

  // Some common tennis court surface types
  surfaceTypes: [
    "Hard", "Clay", "Grass", "Carpet", "Artificial Turf", "Asphalt", 
    "Concrete", "Indoor Hard", "Rubber", "Composite"
  ],

  // Common names for tennis facilities
  facilityNames: [
    "Community Tennis Center", "Tennis Club", "Park Courts", "Recreation Center", 
    "Sports Complex", "Athletic Club", "Tennis Academy", "Public Tennis Courts", 
    "University Courts", "High School Courts", "YMCA Tennis", "Country Club", 
    "Racquet Club", "Indoor Tennis Center", "Tennis Facility"
  ]
}

// Generate realistic synthetic data
function generateSyntheticCourts(stateCode: string, count: number): TennisCourt[] {
  const courts: TennisCourt[] = [];
  const state = stateCode;
  
  // State-specific latitude/longitude ranges (approximate)
  const stateRegions: Record<string, { minLat: number, maxLat: number, minLng: number, maxLng: number }> = {
    "NY": { minLat: 40.5, maxLat: 43.2, minLng: -79.8, maxLng: -73.7 },
    "CA": { minLat: 32.5, maxLat: 42.0, minLng: -124.4, maxLng: -114.1 },
    "TX": { minLat: 26.0, maxLat: 36.5, minLng: -106.6, maxLng: -93.5 },
    "FL": { minLat: 25.0, maxLat: 31.0, minLng: -87.6, maxLng: -80.0 },
    // More states would be defined here
  };
  
  // Default bounds if state-specific ones aren't defined
  const defaultBounds = { 
    minLat: 25.0, 
    maxLat: 49.0, 
    minLng: -125.0, 
    maxLng: -66.0 
  };
  
  const bounds = stateRegions[state] || defaultBounds;
  
  for (let i = 0; i < count; i++) {
    const randomName = `${dataSources.facilityNames[Math.floor(Math.random() * dataSources.facilityNames.length)]}`;
    
    // Use some location variance within the state
    const latitude = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    const longitude = bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng);
    
    // Choose a surface type
    const surface_type = dataSources.surfaceTypes[Math.floor(Math.random() * dataSources.surfaceTypes.length)];
    
    // Determine if public or private
    const is_public = Math.random() > 0.3; // 70% public, 30% private
    
    // Generate a city name based on common city naming patterns
    const cityPrefixes = ["New", "West", "East", "South", "North", "Mount", "Lake", "River", "Spring", "Fair"];
    const citySuffixes = ["ville", "town", "burg", "field", "view", "wood", "land", "side", "port", "city", "harbor", "creek"];
    const cityRoot = ["Green", "Rose", "Mill", "Oak", "Pine", "Cedar", "Maple", "Red", "Blue", "Silver", "Golden"];
    
    let cityName;
    const nameType = Math.floor(Math.random() * 3);
    if (nameType === 0) {
      cityName = `${cityPrefixes[Math.floor(Math.random() * cityPrefixes.length)]} ${cityRoot[Math.floor(Math.random() * cityRoot.length)]}`;
    } else if (nameType === 1) {
      cityName = `${cityRoot[Math.floor(Math.random() * cityRoot.length)]}${citySuffixes[Math.floor(Math.random() * citySuffixes.length)]}`;
    } else {
      cityName = `${cityRoot[Math.floor(Math.random() * cityRoot.length)]}`;
    }
    
    // Create the tennis court object
    courts.push({
      name: `${cityName} ${randomName}`,
      description: `Tennis facility in ${cityName}, ${state}`,
      latitude,
      longitude,
      address: `${Math.floor(Math.random() * 9000) + 1000} ${['Main', 'Park', 'Oak', 'Maple', 'Tennis', 'Sports', 'Center'][Math.floor(Math.random() * 7)]} ${['St', 'Ave', 'Blvd', 'Dr', 'Rd'][Math.floor(Math.random() * 5)]}`,
      city: cityName,
      state,
      country: "USA",
      surface_type,
      is_public,
      is_indoor: Math.random() > 0.8, // 20% indoor
      number_of_courts: Math.floor(Math.random() * 12) + 1,
      has_lighting: Math.random() > 0.4, // 60% have lighting
      has_restrooms: Math.random() > 0.3, // 70% have restrooms
      has_pro_shop: Math.random() > 0.7 // 30% have pro shops
    });
  }
  
  return courts;
}

// Function to import courts to the database
async function importCourtsToDatabase(courts: TennisCourt[]): Promise<{ success: boolean, imported: number, errors: any[] }> {
  const errors: any[] = [];
  let imported = 0;
  
  try {
    // Insert courts in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < courts.length; i += batchSize) {
      const batch = courts.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('tennis_courts')
        .insert(batch)
        .select();
        
      if (error) {
        console.error('Error importing batch:', error);
        errors.push(error);
      } else {
        imported += (data?.length || 0);
        console.log(`Imported batch of ${data?.length || 0} courts`);
      }
    }
    
    return {
      success: errors.length === 0,
      imported,
      errors
    };
  } catch (err) {
    console.error('Exception during import:', err);
    return {
      success: false,
      imported,
      errors: [...errors, err]
    };
  }
}

// Main handler for the edge function
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests for data import
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { state, count = 50 } = await req.json();
    
    let courts: TennisCourt[] = [];
    
    if (state === 'all') {
      // Import courts for all states, weighted by population
      for (const stateCode of dataSources.states) {
        // Use population to determine roughly how many courts to generate per state
        const statePop = dataSources.populationByState[stateCode] || 1;
        const stateCount = Math.max(5, Math.floor((statePop / 10) * count / 5));
        
        const stateCourts = generateSyntheticCourts(stateCode, stateCount);
        courts = [...courts, ...stateCourts];
      }
    } else if (state && dataSources.states.includes(state)) {
      // Import courts for a specific state
      courts = generateSyntheticCourts(state, count);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid state code' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log(`Generated ${courts.length} synthetic courts for import`);
    
    // Import the generated courts to the database
    const result = await importCourtsToDatabase(courts);
    
    return new Response(
      JSON.stringify({
        success: result.success,
        message: `Imported ${result.imported} tennis courts${state !== 'all' ? ` for ${state}` : ' across the USA'}`,
        errors: result.errors,
      }),
      {
        status: result.success ? 200 : 207, // 207 Multi-Status if partial success
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
