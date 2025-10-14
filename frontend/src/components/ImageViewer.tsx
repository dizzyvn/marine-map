import { X, MapPin, Calendar, Camera } from 'lucide-react';
import { api } from '../lib/api';
import type { ImageMetadata } from '../types';

interface ImageViewerProps {
  image: ImageMetadata;
  onClose: () => void;
}

export default function ImageViewer({ image, onClose }: ImageViewerProps) {
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold truncate">{image.filename}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
          <img
            src={api.getImageUrl(image.filename)}
            alt={image.filename}
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>

        {/* Metadata Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-2">
              {image.width && image.height && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Dimensions:</span>
                  <span className="text-gray-600 ml-2">
                    {image.width} × {image.height}
                  </span>
                </div>
              )}

              {image.model && (
                <div className="flex items-center gap-2 text-sm">
                  <Camera className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Camera:</span>
                  <span className="text-gray-600">{image.model}</span>
                </div>
              )}

              {image.datetimeoriginal && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="text-gray-600">{image.datetimeoriginal}</span>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              {image.latitude && image.longitude ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-700">GPS:</span>
                    <span className="text-gray-600">
                      {image.latitude.toFixed(6)}, {image.longitude.toFixed(6)}
                    </span>
                  </div>
                  {image.manually_tagged && (
                    <div className="text-xs text-primary">
                      Manually tagged
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-400">
                  No GPS data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
