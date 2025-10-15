import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapPin, MapPinOff, Tag, Fish, Waves, Shell, Star, Check, MoreVertical, Trash2 } from 'lucide-react';
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
  const [allImages, setAllImages] = useState<ImageMetadata[]>([]); // Unfiltered images for calendar
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
  const [openMenuImage, setOpenMenuImage] = useState<string | null>(null);
  const [openBatchMenu, setOpenBatchMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const batchMenuRef = useRef<HTMLDivElement>(null);

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

  // Compute set of dates that have images (from all unfiltered images)
  const datesWithImages = useMemo(() => {
    const dates = new Set<string>();
    allImages.forEach(img => {
      const date = parseImageDate(img.datetimeoriginal);
      if (date) dates.add(date);
    });
    return dates;
  }, [allImages]);

  // Load all images once for calendar (no filters)
  const loadAllImages = useCallback(async () => {
    try {
      const data = await api.getImages();
      setAllImages(data.images);
    } catch (error) {
      console.error('Failed to load all images:', error);
    }
  }, []);

  const loadImages = useCallback(async () => {
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
  }, [searchQuery, gpsFilter, selectedDate]);

  // Load all images once on mount for calendar
  useEffect(() => {
    loadAllImages();
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  }, []);

  const toggleImageSelection = useCallback((filename: string) => {
    setSelectedImages(prev =>
      prev.includes(filename)
        ? prev.filter(f => f !== filename)
        : [...prev, filename]
    );
  }, []);

  const handleImageClick = useCallback((image: ImageMetadata) => {
    if (isSelectionMode) {
      toggleImageSelection(image.filename);
    } else {
      setViewingImage(image);
    }
  }, [isSelectionMode, toggleImageSelection]);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    setSelectedImages([]);
  }, []);

  const selectAllImages = useCallback(() => {
    const allFilenames = images.map(img => img.filename);
    setSelectedImages(allFilenames);
  }, [images]);

  const toggleImageMenu = useCallback((filename: string) => {
    setOpenMenuImage(prev => prev === filename ? null : filename);
  }, []);

  const handleDeleteImage = useCallback(async (image: ImageMetadata) => {
    if (!confirm(`Are you sure you want to delete ${image.filename}?`)) return;

    try {
      await api.deleteImage(image.filename);
      setOpenMenuImage(null);
      loadAllImages();
      loadImages();
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image');
    }
  }, [loadAllImages, loadImages]);

  const handleAddLocation = useCallback((image: ImageMetadata) => {
    setTaggingImage(image);
    setOpenMenuImage(null);
  }, []);

  const handleAddTag = useCallback((_image: ImageMetadata) => {
    setOpenMenuImage(null);
    // TODO: Implement tag functionality
    alert('Tag functionality coming soon!');
  }, []);

  const handleBatchAddLocation = useCallback(() => {
    if (selectedImages.length > 0) {
      const firstImage = images.find(img => img.filename === selectedImages[0]);
      if (firstImage) {
        setTaggingImage(firstImage);
        setIsSelectionMode(false);
        setOpenBatchMenu(false);
      }
    }
  }, [selectedImages, images]);

  const handleBatchAddTag = useCallback(() => {
    setOpenBatchMenu(false);
    // TODO: Implement batch tag functionality
    alert('Batch tag functionality coming soon!');
  }, []);

  const handleBatchDelete = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete ${selectedImages.length} ${selectedImages.length === 1 ? 'image' : 'images'}?`)) {
      return;
    }

    try {
      await Promise.all(selectedImages.map(filename => api.deleteImage(filename)));
      setOpenBatchMenu(false);
      setSelectedImages([]);
      setIsSelectionMode(false);
      loadAllImages();
      loadImages();
    } catch (error) {
      console.error('Failed to delete images:', error);
      alert('Failed to delete some images');
    }
  }, [selectedImages, loadAllImages, loadImages]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuImage(null);
      }
      if (batchMenuRef.current && !batchMenuRef.current.contains(event.target as Node)) {
        setOpenBatchMenu(false);
      }
    };

    if (openMenuImage || openBatchMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuImage, openBatchMenu]);

  const handleUploadSuccess = () => {
    loadAllImages(); // Reload all images for calendar
    loadImages();
  };

  const handleGPSTagSuccess = () => {
    loadAllImages(); // Reload all images for calendar
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
            <div className="sticky top-0 z-10 bg-gray-50 px-6 pt-8 pb-2">
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
                  {isSelectionMode ? 'Exit Selection' : 'Select'}
                </button>

                {isSelectionMode && (
                  <button
                    onClick={selectAllImages}
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    Select all
                  </button>
                )}

                {isSelectionMode && selectedImages.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenBatchMenu(!openBatchMenu)}
                      className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <MoreVertical className="w-4 h-4" />
                      Edit
                    </button>

                    {/* Batch Edit Dropdown Menu */}
                    {openBatchMenu && (
                      <div
                        ref={batchMenuRef}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                      >
                        <button
                          onClick={handleBatchAddLocation}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <MapPin className="w-4 h-4" />
                          Add location
                        </button>
                        <button
                          onClick={handleBatchAddTag}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Tag className="w-4 h-4" />
                          Add tag
                        </button>
                        <button
                          onClick={handleBatchDelete}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pt-4 pb-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Loading...</div>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  No images found
                  {gpsFilter === 'with_gps' && (
                    <p className="mt-2 text-sm">
                      Try changing GPS filter or tag images with GPS coordinates
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

                        {/* Edit button with dropdown - only shown when NOT in selection mode */}
                        {!isSelectionMode && (
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleImageMenu(image.filename);
                              }}
                              className="bg-white hover:bg-primary-light text-primary p-2 rounded-lg shadow-md transition-colors"
                              title="Edit"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuImage === image.filename && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleAddLocation(image)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <MapPin className="w-4 h-4" />
                                  Add location
                                </button>
                                <button
                                  onClick={() => handleAddTag(image)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Tag className="w-4 h-4" />
                                  Add tag
                                </button>
                                <button
                                  onClick={() => handleDeleteImage(image)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
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
