import json
import os
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from services.image_processor import (
    extract_image_metadata,
    process_images_directory
)

app = FastAPI(title="Da Nang Marine Creature Map API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = Path(__file__).parent.parent
FISHES_DIR = BASE_DIR / "fishes"
DATA_DIR = BASE_DIR / "backend" / "data"
METADATA_FILE = DATA_DIR / "images_metadata.json"
LOCATIONS_FILE = DATA_DIR / "locations.json"

# Mount static files (images)
app.mount("/images", StaticFiles(directory=str(FISHES_DIR)), name="images")


def load_metadata() -> List[dict]:
    """Load images metadata from JSON file."""
    if METADATA_FILE.exists():
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    return []


def save_metadata(data: List[dict]):
    """Save images metadata to JSON file."""
    with open(METADATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def load_locations() -> List[dict]:
    """Load locations from JSON file."""
    if LOCATIONS_FILE.exists():
        with open(LOCATIONS_FILE, "r") as f:
            return json.load(f)
    return []


def save_locations(data: List[dict]):
    """Save locations to JSON file."""
    with open(LOCATIONS_FILE, "w") as f:
        json.dump(data, f, indent=2)


@app.on_event("startup")
async def startup_event():
    """Process images on startup if metadata doesn't exist."""
    if not METADATA_FILE.exists():
        print("Processing images from fishes directory...")
        process_images_directory(str(FISHES_DIR), str(METADATA_FILE))
    else:
        print("Loading existing metadata...")
        metadata = load_metadata()
        print(f"Loaded {len(metadata)} images from metadata")


@app.get("/")
async def root():
    return {"message": "Da Nang Marine Creature Map API", "version": "1.0.0"}


@app.get("/api/images")
async def get_images(
    search: Optional[str] = None,
    with_gps_only: bool = False
):
    """Get all images with optional filtering."""
    metadata = load_metadata()

    # Filter by GPS if requested
    if with_gps_only:
        metadata = [img for img in metadata if "latitude" in img and "longitude" in img]

    # Search by filename if provided
    if search:
        search_lower = search.lower()
        metadata = [
            img for img in metadata
            if search_lower in img.get("filename", "").lower()
        ]

    return {
        "total": len(metadata),
        "images": metadata
    }


@app.get("/api/images/{filename}")
async def get_image_details(filename: str):
    """Get details for a specific image."""
    metadata = load_metadata()

    for img in metadata:
        if img.get("filename") == filename:
            return img

    raise HTTPException(status_code=404, detail="Image not found")


@app.post("/api/admin/upload")
async def upload_image(file: UploadFile = File(...)):
    """Admin endpoint to upload a new image."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Save the file
    file_path = FISHES_DIR / file.filename

    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Extract metadata
        metadata = extract_image_metadata(str(file_path))

        # Update metadata file
        all_metadata = load_metadata()

        # Check if image already exists and update or append
        existing_index = next(
            (i for i, img in enumerate(all_metadata) if img.get("filename") == file.filename),
            None
        )

        if existing_index is not None:
            all_metadata[existing_index] = metadata
        else:
            all_metadata.append(metadata)

        save_metadata(all_metadata)

        return {
            "message": "Image uploaded successfully",
            "metadata": metadata
        }
    except Exception as e:
        # Clean up file if processing failed
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/api/admin/reprocess")
async def reprocess_images():
    """Admin endpoint to reprocess all images in the fishes directory."""
    try:
        process_images_directory(str(FISHES_DIR), str(METADATA_FILE))
        metadata = load_metadata()
        return {
            "message": "Images reprocessed successfully",
            "total": len(metadata)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reprocessing images: {str(e)}")


@app.get("/api/stats")
async def get_stats():
    """Get statistics about the images."""
    metadata = load_metadata()

    images_with_gps = sum(1 for img in metadata if "latitude" in img and "longitude" in img)

    return {
        "total_images": len(metadata),
        "images_with_gps": images_with_gps,
        "images_without_gps": len(metadata) - images_with_gps
    }


# Locations endpoints
@app.get("/api/locations")
async def get_locations():
    """Get all favorite locations."""
    locations = load_locations()
    return {"total": len(locations), "locations": locations}


@app.post("/api/locations")
async def create_location(location: dict):
    """Create a new favorite location."""
    locations = load_locations()

    # Generate ID
    import uuid
    location["id"] = f"loc-{uuid.uuid4().hex[:8]}"
    location["created_at"] = str(Path(__file__).stat().st_mtime)

    locations.append(location)
    save_locations(locations)

    return {"message": "Location created successfully", "location": location}


@app.put("/api/locations/{location_id}")
async def update_location(location_id: str, location: dict):
    """Update a favorite location."""
    locations = load_locations()

    for i, loc in enumerate(locations):
        if loc["id"] == location_id:
            location["id"] = location_id
            locations[i] = location
            save_locations(locations)
            return {"message": "Location updated successfully", "location": location}

    raise HTTPException(status_code=404, detail="Location not found")


@app.delete("/api/locations/{location_id}")
async def delete_location(location_id: str):
    """Delete a favorite location."""
    locations = load_locations()

    locations = [loc for loc in locations if loc["id"] != location_id]
    save_locations(locations)

    return {"message": "Location deleted successfully"}


# Image GPS tagging endpoint
@app.patch("/api/images/{filename}/gps")
async def update_image_gps(filename: str, gps_data: dict):
    """Manually update GPS coordinates for an image."""
    metadata = load_metadata()

    for i, img in enumerate(metadata):
        if img.get("filename") == filename:
            img["latitude"] = gps_data.get("latitude")
            img["longitude"] = gps_data.get("longitude")
            img["manually_tagged"] = True
            metadata[i] = img
            save_metadata(metadata)
            return {"message": "GPS coordinates updated successfully", "image": img}

    raise HTTPException(status_code=404, detail="Image not found")
