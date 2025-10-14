import { useState, useEffect } from 'react';
import { X, MapPin, BookmarkCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../lib/api';
import type { ImageMetadata, Location } from '../types';

interface GPSTagModalProps {
  image: ImageMetadata;
  images?: ImageMetadata[]; // Optional: for batch tagging
  onClose: () => void;
  onSuccess: () => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function GPSTagModal({ image, images, onClose, onSuccess }: GPSTagModalProps) {
  const isBatchMode = images && images.length > 0;
  const imageCount = isBatchMode ? images.length : 1;
  const [latitude, setLatitude] = useState(image.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(image.longitude?.toString() || '');
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    image.latitude && image.longitude ? [image.latitude, image.longitude] : null
  );
  const [locations, setLocations] = useState<Location[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'favorites' | 'manual'>('map');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await api.getLocations();
      setLocations(data.locations);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setMarkerPosition([lat, lng]);
  };

  const handleLocationSelect = (location: Location) => {
    setLatitude(location.latitude.toString());
    setLongitude(location.longitude.toString());
    setMarkerPosition([location.latitude, location.longitude]);
    setActiveTab('map');
  };

  const handleSave = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid coordinates');
      return;
    }

    try {
      setIsSaving(true);

      if (isBatchMode && images) {
        // Batch update all selected images
        await Promise.all(
          images.map(img => api.updateImageGPS(img.filename, lat, lng))
        );
      } else {
        // Single image update
        await api.updateImageGPS(image.filename, lat, lng);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update GPS:', error);
      alert('Failed to update GPS coordinates');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Tag GPS Location</h2>
            {isBatchMode ? (
              <p className="text-sm text-gray-600 mt-1">
                Tagging {imageCount} {imageCount === 1 ? 'image' : 'images'}
              </p>
            ) : (
              <p className="text-sm text-gray-600 mt-1">{image.filename}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'map'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Click on Map
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'favorites'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 inline mr-2" />
            Favorite Locations
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manual Entry
          </button>
        </div>

        {/* Content */}
        <div className="h-[500px] overflow-hidden">
          {activeTab === 'map' && (
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <MapContainer
                  center={markerPosition || [16.0544, 108.2022]}
                  zoom={markerPosition ? 14 : 12}
                  className="w-full h-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onLocationSelect={handleMapClick} />
                  {markerPosition && (
                    <Marker
                      position={markerPosition}
                      icon={L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                      })}
                    />
                  )}
                </MapContainer>
              </div>
              <p className="text-sm text-gray-600 p-4 bg-gray-50 border-t">
                Click anywhere on the map to set the location
              </p>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="h-full overflow-y-auto p-6">
              {locations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No favorite locations saved yet
                </div>
              ) : (
                <div className="space-y-3">
                  {locations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary-light transition-colors text-left"
                    >
                      <h3 className="font-medium text-gray-900 mb-1">
                        {location.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </span>
                      </div>
                      {location.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {location.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => {
                      setLatitude(e.target.value);
                      const lat = parseFloat(e.target.value);
                      const lng = parseFloat(longitude);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setMarkerPosition([lat, lng]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="16.0544"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => {
                      setLongitude(e.target.value);
                      const lat = parseFloat(latitude);
                      const lng = parseFloat(e.target.value);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setMarkerPosition([lat, lng]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="108.2022"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {markerPosition && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
              <strong>Selected:</strong> {latitude}, {longitude}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!latitude || !longitude || isSaving}
              className="flex-1 bg-primary hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
