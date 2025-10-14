# Da Nang Marine Creature Map

A web application for mapping marine creature sightings in Da Nang, Vietnam. Upload images with GPS metadata, manually tag locations, and explore them on an interactive map.

## Features

- **Interactive Map View**: Browse marine creature photos on an OpenStreetMap-based interface
- **Grid View**: View all images in a clean grid layout
- **GPS Extraction**: Automatically extracts GPS coordinates from image EXIF data
- **Manual GPS Tagging**: Tag images with GPS coordinates by clicking on the map or selecting from favorite locations
- **Favorite Locations**: Save and manage your favorite dive/snorkel spots
- **Search**: Filter images by filename
- **Admin Upload**: Upload new images with automatic GPS processing
- **Statistics**: View total images and GPS coverage

## Tech Stack

**Backend**:
- FastAPI (Python)
- Pillow (Image processing & EXIF extraction)
- JSON-based local storage

**Frontend**:
- React + TypeScript
- Vite
- React Router (Navigation)
- Tailwind CSS
- Leaflet (Maps)
- Lucide React (Icons)

## Quick Start

### Option 1: Use Start Scripts (Recommended)

Start both backend and frontend automatically:
```bash
./start.sh
```

Or start them individually:
```bash
# Backend only
cd backend
./start.sh

# Frontend only (in another terminal)
cd frontend
./start.sh
```

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Project Structure

```
danang-marine-creature-map/
├── start.sh                 # Master start script (both servers)
├── backend/
│   ├── start.sh            # Backend start script
│   ├── main.py             # FastAPI application
│   ├── services/
│   │   └── image_processor.py  # GPS extraction logic
│   ├── data/
│   │   ├── images_metadata.json  # Auto-generated metadata
│   │   └── locations.json        # Favorite locations
│   └── requirements.txt
├── frontend/
│   ├── start.sh            # Frontend start script
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── HomePage.tsx
│   │   │   ├── LocationsPage.tsx
│   │   │   ├── GPSTagModal.tsx
│   │   │   ├── Map.tsx
│   │   │   ├── ImageCard.tsx
│   │   │   └── ...
│   │   ├── lib/            # API client
│   │   └── types/          # TypeScript types
│   └── package.json
└── fishes/                 # Image storage directory
```

## Usage

### Viewing Images

1. Open the frontend at http://localhost:5173
2. Toggle between **Map View** and **Grid View** using the buttons in the header
3. Use the search bar to filter images by filename
4. Check "GPS only" to show only images with GPS data
5. Click on any image card or map marker to view details

### Manual GPS Tagging

Since your images don't have GPS coordinates, you can manually tag them:

1. In Grid View, hover over an image and click the **Tag** icon
2. Choose one of three methods:
   - **Click on Map**: Click anywhere on the map to set the location
   - **Favorite Locations**: Select from your saved locations
   - **Manual Entry**: Enter exact coordinates
3. Click **Save Location**

### Managing Favorite Locations

1. Click **Locations** in the top navigation
2. Click **Add Location** to create a new favorite spot
3. Enter name, coordinates, and optional description
4. Edit or delete existing locations as needed
5. View all locations on the map

The app includes 4 pre-configured Da Nang locations:
- Location 1: 16.088733, 108.251139
- Location 2: 16.088181, 108.262316
- Location 3: 16.097652, 108.273290
- Location 4: 16.099161, 108.300297

### Uploading Images

1. Click the blue **upload button** (floating button in bottom-right corner)
2. Select an image file (JPG, PNG, HEIC)
3. Click **Upload**
4. The image will be processed and added to the map (if it has GPS data)
5. If no GPS data, manually tag the image using the steps above

### API Endpoints

**Images**:
- `GET /api/images` - List all images (params: `search`, `with_gps_only`)
- `GET /api/images/{filename}` - Get specific image details
- `PATCH /api/images/{filename}/gps` - Update image GPS coordinates
- `POST /api/admin/upload` - Upload new image
- `POST /api/admin/reprocess` - Reprocess all images
- `GET /images/{filename}` - Serve image files

**Locations**:
- `GET /api/locations` - List all favorite locations
- `POST /api/locations` - Create new location
- `PUT /api/locations/{id}` - Update location
- `DELETE /api/locations/{id}` - Delete location

**Stats**:
- `GET /api/stats` - Get statistics
- `GET /` - API information

## Development

### Backend Testing

```bash
cd backend
python -m services.image_processor  # Test image processing
```

### Frontend Development

```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## Features Implemented

✅ Interactive map with Leaflet
✅ Image grid view
✅ Search and filter
✅ Admin image upload
✅ GPS extraction from EXIF
✅ **Manual GPS tagging with 3 methods**
✅ **Favorite locations management**
✅ **Location selection for tagging**
✅ Statistics dashboard
✅ Responsive design

## Future Enhancements

- Add fish species tagging
- Implement user authentication
- Add filtering by species, date, location
- Support for video files
- Database migration (PostgreSQL/MongoDB)
- Image gallery with lightbox
- Export data as GeoJSON
- Mobile app version
- Bulk GPS tagging
- Import/export locations

## License

MIT
