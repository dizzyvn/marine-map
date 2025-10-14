# Da Nang Marine Creature Map - Backend

FastAPI backend for processing and serving marine creature images with GPS metadata.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

- `GET /` - API info
- `GET /api/images` - Get all images (query params: `search`, `with_gps_only`)
- `GET /api/images/{filename}` - Get specific image details
- `GET /api/stats` - Get statistics
- `POST /api/admin/upload` - Upload new image (multipart/form-data)
- `POST /api/admin/reprocess` - Reprocess all images
- `GET /images/{filename}` - Serve static image files

## Data Storage

Metadata is stored in `data/images_metadata.json` as a simple JSON file.
