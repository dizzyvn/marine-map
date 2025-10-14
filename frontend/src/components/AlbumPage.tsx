import { useState, useEffect } from 'react';
import { MapPin, MapPinOff, Tag, Fish, Waves, Shell, Star } from 'lucide-react';
import SearchBar from './SearchBar';
import ImageCard from './ImageCard';
import AdminUpload from './AdminUpload';
import GPSTagModal from './GPSTagModal';
import { api } from '../lib/api';
import type { ImageMetadata } from '../types';

type GpsFilter = 'all' | 'with_gps' | 'without_gps';

export default function AlbumPage() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [gpsFilter, setGpsFilter] = useState<GpsFilter>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [taggingImage, setTaggingImage] = useState<ImageMetadata | null>(null);

  const availableTags = [
    { id: 'fish', name: 'Fish', icon: Fish },
    { id: 'coral', name: 'Coral', icon: Waves },
    { id: 'shell', name: 'Shell', icon: Shell },
    { id: 'rare', name: 'Rare', icon: Star },
  ];

  const loadImages = async () => {
    try {
      setLoading(true);
      const withGps = gpsFilter === 'with_gps';
      const data = await api.getImages(searchQuery || undefined, withGps);

      let filteredImages = data.images;

      // Apply GPS filter
      if (gpsFilter === 'without_gps') {
        filteredImages = filteredImages.filter(img => !img.latitude || !img.longitude);
      }

      // TODO: Apply tag filters when backend supports tags
      // For now, tags are just UI placeholders

      setImages(filteredImages);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [searchQuery, gpsFilter, selectedTags]);

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleImageSelect = (image: ImageMetadata) => {
    setTaggingImage(image);
  };

  const handleUploadSuccess = () => {
    loadImages();
  };

  const handleGPSTagSuccess = () => {
    loadImages();
  };

  return (
    <>
      <div className="h-full flex">
        {/* Left Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by filename..."
            />
          </div>

          {/* Filters */}
          <div className="flex-1 overflow-y-auto">
            {/* GPS Filter */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">GPS Info</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setGpsFilter('all')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    gpsFilter === 'all'
                      ? 'bg-primary-light text-primary'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  All Images
                </button>
                <button
                  onClick={() => setGpsFilter('with_gps')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    gpsFilter === 'with_gps'
                      ? 'bg-primary-light text-primary'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  With GPS
                </button>
                <button
                  onClick={() => setGpsFilter('without_gps')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    gpsFilter === 'without_gps'
                      ? 'bg-primary-light text-primary'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MapPinOff className="w-4 h-4" />
                  Without GPS
                </button>
              </div>
            </div>

            {/* Tag Filter */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
              <div className="space-y-2">
                {availableTags.map((tag) => {
                  const Icon = tag.icon;
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                        isSelected
                          ? 'bg-primary-light text-primary'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Note: Tag filtering coming soon
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area - Grid View */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto bg-gray-50">
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Loading...</div>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  No images found
                  {showGpsOnly && (
                    <p className="mt-2 text-sm">
                      Try unchecking "GPS only" or tag images with GPS coordinates
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.filename} className="relative group">
                      <ImageCard
                        image={image}
                        onClick={() => handleImageSelect(image)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaggingImage(image);
                        }}
                        className="absolute top-2 right-2 bg-white hover:bg-primary-light text-primary p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Tag GPS Location"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Admin Upload Button */}
      <AdminUpload onUploadSuccess={handleUploadSuccess} />

      {/* GPS Tag Modal */}
      {taggingImage && (
        <GPSTagModal
          image={taggingImage}
          onClose={() => setTaggingImage(null)}
          onSuccess={handleGPSTagSuccess}
        />
      )}
    </>
  );
}
