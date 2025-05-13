
export type LocationCoordinates = {
  lat: number;
  lng: number;
  address: string;
  id?: string;
  place_name?: string;
};

export type LocationResult = LocationCoordinates;
