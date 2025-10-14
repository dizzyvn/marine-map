import json
import os
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from PIL import Image

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
THUMBNAILS_DIR = BASE_DIR / "backend" / "thumbnails"
METADATA_FILE = DATA_DIR / "images_metadata.json"
LOCATIONS_FILE = DATA_DIR / "locations.json"

# Create thumbnails directory if it doesn't exist
THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

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


def generate_thumbnail(image_path: Path, thumbnail_path: Path, size: tuple = (400, 400)):
    """Generate a thumbnail for an image."""
    try:
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background

            # Create thumbnail maintaining aspect ratio
            img.thumbnail(size, Image.Resampling.LANCZOS)

            # Save thumbnail
            img.save(thumbnail_path, "JPEG", quality=85, optimize=True)
            return True
    except Exception as e:
        print(f"Error generating thumbnail for {image_path}: {e}")
        return False


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


@app.get("/api/thumbnails/{filename}")
async def get_thumbnail(filename: str):
    """Get thumbnail for an image. Generate and cache if not exists."""
    # Check if original image exists
    image_path = FISHES_DIR / filename
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    # Thumbnail path
    thumbnail_path = THUMBNAILS_DIR / f"thumb_{filename}"
    # Ensure thumbnail has .jpg extension
    if not thumbnail_path.suffix.lower() in ['.jpg', '.jpeg']:
        thumbnail_path = thumbnail_path.with_suffix('.jpg')

    # Check if thumbnail exists and is valid (newer than original)
    thumbnail_valid = False
    if thumbnail_path.exists():
        thumb_mtime = thumbnail_path.stat().st_mtime
        image_mtime = image_path.stat().st_mtime
        thumbnail_valid = thumb_mtime >= image_mtime

    # Generate thumbnail if needed
    if not thumbnail_valid:
        success = generate_thumbnail(image_path, thumbnail_path)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to generate thumbnail")

    # Return the thumbnail
    return FileResponse(
        thumbnail_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"}  # Cache for 24 hours
    )


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


@app.delete("/api/images/{filename}")
async def delete_image(filename: str):
    """Delete an image and its metadata."""
    metadata = load_metadata()

    # Find the image in metadata
    image_found = False
    for i, img in enumerate(metadata):
        if img.get("filename") == filename:
            metadata.pop(i)
            image_found = True
            break

    if not image_found:
        raise HTTPException(status_code=404, detail="Image not found in metadata")

    # Delete the actual image file
    image_path = FISHES_DIR / filename
    if image_path.exists():
        image_path.unlink()

    # Delete the thumbnail if it exists
    thumbnail_path = THUMBNAILS_DIR / f"thumb_{filename}"
    if not thumbnail_path.suffix.lower() in ['.jpg', '.jpeg']:
        thumbnail_path = thumbnail_path.with_suffix('.jpg')
    if thumbnail_path.exists():
        thumbnail_path.unlink()

    # Save updated metadata
    save_metadata(metadata)

    return {"message": "Image deleted successfully"}
