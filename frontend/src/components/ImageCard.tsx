import { memo } from 'react';
import { MapPin, Calendar, Camera } from 'lucide-react';
import type { ImageMetadata } from '../types';
import { api } from '../lib/api';

interface ImageCardProps {
  image: ImageMetadata;
  onClick?: () => void;
}

function ImageCard({ image, onClick }: ImageCardProps) {
  const hasGps = image.latitude && image.longitude;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
    >
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={api.getThumbnailUrl(image.filename)}
          alt={image.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate mb-2">{image.filename}</p>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{hasGps ? `${image.latitude?.toFixed(4)}, ${image.longitude?.toFixed(4)}` : '--'}</span>
          </div>
          {image.model && (
            <div className="flex items-center gap-1">
              <Camera className="w-3 h-3" />
              <span>{image.model}</span>
            </div>
          )}
          {image.datetimeoriginal && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{image.datetimeoriginal}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ImageCard);
