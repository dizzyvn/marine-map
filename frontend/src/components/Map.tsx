import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ImageMetadata } from '../types';
import { api } from '../lib/api';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const HighlightedIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [35, 57],
  iconAnchor: [17, 57],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  images: ImageMetadata[];
  selectedImage?: ImageMetadata | null;
  onImageSelect?: (image: ImageMetadata) => void;
}

function MapUpdater({ images, selectedImage }: { images: ImageMetadata[], selectedImage?: ImageMetadata | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedImage?.latitude && selectedImage?.longitude) {
      map.flyTo([selectedImage.latitude, selectedImage.longitude], 16, {
        duration: 1
      });
    } else if (images.length > 0) {
      const bounds = images
        .filter(img => img.latitude && img.longitude)
        .map(img => [img.latitude!, img.longitude!] as [number, number]);

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [images, selectedImage, map]);

  return null;
}

export default function Map({ images, selectedImage, onImageSelect }: MapProps) {
  const imagesWithGps = images.filter(img => img.latitude && img.longitude);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});

  // Default to Da Nang, Vietnam coordinates
  const defaultCenter: [number, number] = [16.0544, 108.2022];
  const defaultZoom = 12;

  useEffect(() => {
    if (selectedImage?.filename && markerRefs.current[selectedImage.filename]) {
      markerRefs.current[selectedImage.filename].openPopup();
    }
  }, [selectedImage]);

  return (
    <div className="w-full h-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater images={imagesWithGps} selectedImage={selectedImage} />
        {imagesWithGps.map((image) => {
          const isSelected = selectedImage?.filename === image.filename;
          return (
            <Marker
              key={image.filename}
              position={[image.latitude!, image.longitude!]}
              icon={isSelected ? HighlightedIcon : DefaultIcon}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[image.filename] = ref;
                }
              }}
              eventHandlers={{
                click: () => onImageSelect?.(image),
              }}
            >
              <Popup>
                <div className="p-2">
                  <img
                    src={api.getImageUrl(image.filename)}
                    alt={image.filename}
                    className="w-48 h-32 object-cover rounded mb-2"
                  />
                  <p className="font-medium text-sm">{image.filename}</p>
                  {image.model && (
                    <p className="text-xs text-gray-600">Camera: {image.model}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
