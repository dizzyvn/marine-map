import type { ImagesResponse, StatsResponse, ImageMetadata, LocationsResponse, Location } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  async getImages(search?: string, withGpsOnly?: boolean): Promise<ImagesResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (withGpsOnly) params.append('with_gps_only', 'true');

    const response = await fetch(`${API_BASE_URL}/api/images?${params}`);
    if (!response.ok) throw new Error('Failed to fetch images');
    return response.json();
  },

  async getImageDetails(filename: string): Promise<ImageMetadata> {
    const response = await fetch(`${API_BASE_URL}/api/images/${filename}`);
    if (!response.ok) throw new Error('Failed to fetch image details');
    return response.json();
  },

  async uploadImage(file: File): Promise<{ message: string; metadata: ImageMetadata }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/admin/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload image');
    return response.json();
  },

  async reprocessImages(): Promise<{ message: string; total: number }> {
    const response = await fetch(`${API_BASE_URL}/api/admin/reprocess`, {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Failed to reprocess images');
    return response.json();
  },

  async getStats(): Promise<StatsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  getImageUrl(filename: string): string {
    return `${API_BASE_URL}/images/${filename}`;
  },

  getThumbnailUrl(filename: string): string {
    return `${API_BASE_URL}/api/thumbnails/${filename}`;
  },

  // Locations API
  async getLocations(): Promise<LocationsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/locations`);
    if (!response.ok) throw new Error('Failed to fetch locations');
    return response.json();
  },

  async createLocation(location: Omit<Location, 'id' | 'created_at'>): Promise<{ message: string; location: Location }> {
    const response = await fetch(`${API_BASE_URL}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location),
    });

    if (!response.ok) throw new Error('Failed to create location');
    return response.json();
  },

  async updateLocation(id: string, location: Partial<Location>): Promise<{ message: string; location: Location }> {
    const response = await fetch(`${API_BASE_URL}/api/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location),
    });

    if (!response.ok) throw new Error('Failed to update location');
    return response.json();
  },

  async deleteLocation(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/locations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete location');
    return response.json();
  },

  // Image GPS tagging
  async updateImageGPS(filename: string, latitude: number, longitude: number): Promise<{ message: string; image: ImageMetadata }> {
    const response = await fetch(`${API_BASE_URL}/api/images/${filename}/gps`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) throw new Error('Failed to update image GPS');
    return response.json();
  },

  // Delete image
  async deleteImage(filename: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/images/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete image');
    return response.json();
  },
};
