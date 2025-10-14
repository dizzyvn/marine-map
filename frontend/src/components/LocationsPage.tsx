import { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../lib/api';
import SearchBar from './SearchBar';
import type { Location } from '../types';

interface LocationFormProps {
  location?: Location;
  onSave: (location: Omit<Location, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}

function LocationForm({ location, onSave, onCancel }: LocationFormProps) {
  const [name, setName] = useState(location?.name || '');
  const [latitude, setLatitude] = useState(location?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(location?.longitude?.toString() || '');
  const [description, setDescription] = useState(location?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g., Coral Reef Area"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
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
            onChange={(e) => setLongitude(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="108.2022"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Add notes about this location..."
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function MapUpdater({ selectedLocation }: { selectedLocation: Location | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([selectedLocation.latitude, selectedLocation.longitude], 15, {
        duration: 1
      });
    }
  }, [selectedLocation, map]);

  return null;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await api.getLocations();
      setLocations(data.locations);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation && markerRefs.current[selectedLocation.id]) {
      markerRefs.current[selectedLocation.id].openPopup();
    }
  }, [selectedLocation]);

  const handleSaveLocation = async (locationData: Omit<Location, 'id' | 'created_at'>) => {
    try {
      if (editingLocation) {
        await api.updateLocation(editingLocation.id, locationData);
      } else {
        await api.createLocation(locationData);
      }
      await loadLocations();
      setShowForm(false);
      setEditingLocation(null);
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      await api.deleteLocation(id);
      await loadLocations();
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingLocation(null);
    setShowForm(true);
  };

  // Filter locations based on search query
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex">
      {/* Left Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search locations..."
          />
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="p-4 border-b border-gray-200 bg-primary-light">
            <h3 className="text-sm font-medium mb-3">
              {editingLocation ? 'Edit Location' : 'New Location'}
            </h3>
            <LocationForm
              location={editingLocation || undefined}
              onSave={handleSaveLocation}
              onCancel={() => {
                setShowForm(false);
                setEditingLocation(null);
              }}
            />
          </div>
        )}

        {/* Locations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 text-sm">Loading...</div>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center text-gray-500 py-12 px-4">
              <p className="text-sm">
                {searchQuery ? 'No locations found' : 'No locations saved yet'}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {searchQuery ? 'Try a different search term' : 'Click "Add Location" to get started'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredLocations.map((location) => {
                const isSelected = selectedLocation?.id === location.id;
                return (
                  <div
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className={`group relative rounded-lg p-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary-light border-2 border-primary'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {location.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </span>
                        </div>
                        {location.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {location.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLocation(location);
                          }}
                          className="p-1.5 text-primary hover:bg-primary-light rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(location.id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Location Button - Bottom */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleAddNew}
            className="w-full bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Location
          </button>
        </div>
      </aside>

      {/* Main Content Area - Map */}
      <main className="flex-1 overflow-hidden">
        <MapContainer
          center={[16.0544, 108.2022]}
          zoom={12}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater selectedLocation={selectedLocation} />
          {locations.map((location) => {
            const isSelected = selectedLocation?.id === location.id;
            return (
              <Marker
                key={location.id}
                position={[location.latitude, location.longitude]}
                icon={L.icon({
                  iconUrl: isSelected
                    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
                    : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: isSelected ? [35, 57] : [25, 41],
                  iconAnchor: isSelected ? [17, 57] : [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
                ref={(ref) => {
                  if (ref) {
                    markerRefs.current[location.id] = ref;
                  }
                }}
                eventHandlers={{
                  click: () => setSelectedLocation(location),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-medium text-sm mb-1">{location.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </span>
                    </div>
                    {location.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {location.description}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </main>
    </div>
  );
}
