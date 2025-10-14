import { useState, useEffect } from 'react';
import { Map as MapIcon, Tag, Fish, Waves, Shell, Star } from 'lucide-react';
import Map from './Map';
import SearchBar from './SearchBar';
import AdminUpload from './AdminUpload';
import GPSTagModal from './GPSTagModal';
import { api } from '../lib/api';
import type { ImageMetadata } from '../types';

export default function HomePage() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [taggingImage, setTaggingImage] = useState<ImageMetadata | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const availableTags = [
    { id: 'fish', name: 'Fish', icon: Fish },
    { id: 'coral', name: 'Coral', icon: Waves },
    { id: 'shell', name: 'Shell', icon: Shell },
    { id: 'rare', name: 'Rare', icon: Star },
  ];

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await api.getImages(searchQuery || undefined, true);
      setImages(data.images);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [searchQuery]);

  const handleImageSelect = (image: ImageMetadata) => {
    setSelectedImage(image);
  };

  const handleUploadSuccess = () => {
    loadImages();
  };

  const handleGPSTagSuccess = () => {
    loadImages();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
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

          {/* Image List - Top Half */}
          <div className="flex-1 overflow-y-auto border-b border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500 text-sm">Loading...</div>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center text-gray-500 py-12 px-4">
                <p className="text-sm">No images with GPS found</p>
                <p className="mt-2 text-xs text-gray-400">
                  Tag images with GPS coordinates to see them here
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {images.map((image) => (
                  <div
                    key={image.filename}
                    className="group relative bg-gray-50 hover:bg-gray-100 rounded-lg p-2 cursor-pointer transition-colors"
                    onClick={() => handleImageSelect(image)}
                  >
                    <div className="flex gap-3">
                      <img
                        src={api.getImageUrl(image.filename)}
                        alt={image.filename}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {image.filename}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {image.latitude && image.longitude ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <MapIcon className="w-3 h-3" />
                              GPS
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No GPS</span>
                          )}
                          {image.manually_tagged && (
                            <span className="text-xs text-primary">Tagged</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaggingImage(image);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary-light text-primary rounded"
                        title="Tag GPS Location"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tag Filters - Bottom Half */}
          <div className="flex-1 overflow-y-auto">
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

        {/* Main Content Area - Map View */}
        <main className="flex-1 overflow-hidden">
          <Map images={images} selectedImage={selectedImage} onImageSelect={handleImageSelect} />
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
