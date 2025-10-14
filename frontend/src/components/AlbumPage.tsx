import { useState, useEffect, useMemo } from 'react';
import { MapPin, MapPinOff, Tag, Fish, Waves, Shell, Star, Check } from 'lucide-react';
import SearchBar from './SearchBar';
import ImageCard from './ImageCard';
import AdminUpload from './AdminUpload';
import GPSTagModal from './GPSTagModal';
import ImageViewer from './ImageViewer';
import Calendar from './Calendar';
import { api } from '../lib/api';
import type { ImageMetadata } from '../types';

type GpsFilter = 'all' | 'with_gps' | 'without_gps';

export default function AlbumPage() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [gpsFilter, setGpsFilter] = useState<GpsFilter>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [taggingImage, setTaggingImage] = useState<ImageMetadata | null>(null);
  const [viewingImage, setViewingImage] = useState<ImageMetadata | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const availableTags = [
    { id: 'fish', name: 'Fish', icon: Fish },
    { id: 'coral', name: 'Coral', icon: Waves },
    { id: 'shell', name: 'Shell', icon: Shell },
    { id: 'rare', name: 'Rare', icon: Star },
  ];

  // Helper function to parse EXIF date format (YYYY:MM:DD HH:MM:SS) to YYYY-MM-DD
  const parseImageDate = (datetimeoriginal?: string): string | null => {
    if (!datetimeoriginal) return null;
    const datePart = datetimeoriginal.split(' ')[0]; // Get "YYYY:MM:DD"
    return datePart.replace(/:/g, '-'); // Convert to "YYYY-MM-DD"
  };

  // Compute set of dates that have images
  const datesWithImages = useMemo(() => {
    const dates = new Set<string>();
    images.forEach(img => {
      const date = parseImageDate(img.datetimeoriginal);
      if (date) dates.add(date);
    });
    return dates;
  }, [images]);

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

      // Apply date filter
      if (selectedDate) {
        filteredImages = filteredImages.filter(img => {
          const imgDate = parseImageDate(img.datetimeoriginal);
          return imgDate === selectedDate;
        });
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
  }, [searchQuery, gpsFilter, selectedTags, selectedDate]);

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleImageClick = (image: ImageMetadata) => {
    if (isSelectionMode) {
      toggleImageSelection(image.filename);
    } else {
      setViewingImage(image);
    }
  };

  const toggleImageSelection = (filename: string) => {
    setSelectedImages(prev =>
      prev.includes(filename)
        ? prev.filter(f => f !== filename)
        : [...prev, filename]
    );
  };

  const handleBatchTag = () => {
    if (selectedImages.length > 0) {
      const firstImage = images.find(img => img.filename === selectedImages[0]);
      if (firstImage) {
        setTaggingImage(firstImage);
        // Exit selection mode after opening batch tag modal
        setIsSelectionMode(false);
      }
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedImages([]);
    }
  };

  const handleUploadSuccess = () => {
    loadImages();
  };

  const handleGPSTagSuccess = () => {
    loadImages();
    setSelectedImages([]); // Clear selection after successful batch tag
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

          {/* Calendar */}
          <Calendar
            datesWithImages={datesWithImages}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

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
            {/* Selection Controls - Top Right */}
            <div className="sticky top-0 z-10 bg-gray-50 px-6 pt-6 pb-2">
              <div className="flex justify-end gap-2">
                <button
                  onClick={toggleSelectionMode}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isSelectionMode
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {isSelectionMode ? 'Exit Selection' : 'Select Images'}
                </button>

                {isSelectionMode && selectedImages.length > 0 && (
                  <button
                    onClick={handleBatchTag}
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4" />
                    Tag {selectedImages.length} {selectedImages.length === 1 ? 'Image' : 'Images'}
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 pb-6">
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
                  {images.map((image) => {
                    const isSelected = selectedImages.includes(image.filename);
                    return (
                      <div
                        key={image.filename}
                        className={`relative group ${
                          isSelectionMode ? 'cursor-pointer' : ''
                        } ${isSelected ? 'ring-4 ring-green-500 rounded-lg' : ''}`}
                      >
                        <ImageCard
                          image={image}
                          onClick={() => handleImageClick(image)}
                        />

                        {/* Green check mark - shown when selected */}
                        {isSelectionMode && isSelected && (
                          <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1 shadow-lg">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}

                        {/* Tag button - only shown when NOT in selection mode */}
                        {!isSelectionMode && (
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
                        )}
                      </div>
                    );
                  })}
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
          images={selectedImages.length > 0 ? images.filter(img => selectedImages.includes(img.filename)) : undefined}
          onClose={() => setTaggingImage(null)}
          onSuccess={handleGPSTagSuccess}
        />
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <ImageViewer
          image={viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}
    </>
  );
}
