
export type LocationCoordinates = {
  lat: number;
  lng: number;
  address: string;
  id?: string;
  place_name?: string;
  place_type?: string[];
  properties?: Record<string, any>;
  relevance?: number;
  text?: string;
  bbox?: [number, number, number, number];
  center?: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
};

export type LocationResult = LocationCoordinates;
