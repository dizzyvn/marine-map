export interface ImageMetadata {
  filename: string;
  path: string;
  width?: number;
  height?: number;
  latitude?: number;
  longitude?: number;
  make?: string;
  model?: string;
  datetime?: string;
  datetimeoriginal?: string;
  manually_tagged?: boolean;
  error?: string;
}

export interface ImagesResponse {
  total: number;
  images: ImageMetadata[];
}

export interface StatsResponse {
  total_images: number;
  images_with_gps: number;
  images_without_gps: number;
}

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  created_at?: string;
}

export interface LocationsResponse {
  total: number;
  locations: Location[];
}
