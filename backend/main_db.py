"""
FastAPI application with PostgreSQL database.
This replaces main.py when deploying with a database.
"""

import os
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from PIL import Image as PILImage

from database import get_db, init_db, check_db_connection
from models import Image, Location
from services.image_processor import extract_image_metadata

app = FastAPI(title="Da Nang Marine Creature Map API")

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = Path(__file__).parent.parent
FISHES_DIR = Path(os.getenv("FISHES_DIR", BASE_DIR / "fishes"))
THUMBNAILS_DIR = Path(os.getenv("THUMBNAILS_DIR", BASE_DIR / "backend" / "thumbnails"))

# Create directories
FISHES_DIR.mkdir(parents=True, exist_ok=True)
THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files
app.mount("/images", StaticFiles(directory=str(FISHES_DIR)), name="images")


def generate_thumbnail(image_path: Path, thumbnail_path: Path, size: tuple = (400, 400)):
    """Generate a thumbnail for an image."""
    try:
        with PILImage.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = PILImage.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background

            # Create thumbnail maintaining aspect ratio
            img.thumbnail(size, PILImage.Resampling.LANCZOS)

            # Save thumbnail
            img.save(thumbnail_path, "JPEG", quality=85, optimize=True)
            return True
    except Exception as e:
        print(f"Error generating thumbnail for {image_path}: {e}")
        return False


def parse_datetime(dt_string: str) -> datetime:
    """Parse datetime string."""
    if not dt_string or dt_string == "--":
        return None
    try:
        return datetime.strptime(dt_string, "%Y:%m:%d %H:%M:%S")
    except:
        return None


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    print("Initializing database...")
    if not check_db_connection():
        print("⚠️ WARNING: Database connection failed!")
    else:
        init_db()
        print("✅ Database initialized")


@app.get("/")
async def root():
    """API root endpoint."""
    return {"message": "Da Nang Marine Creature Map API", "version": "2.0.0-db"}


@app.get("/api/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except:
        return {"status": "unhealthy", "database": "disconnected"}


@app.get("/api/images")
async def get_images(
    search: Optional[str] = None,
    with_gps_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all images with optional filtering."""
    query = db.query(Image)

    # Filter by GPS if requested
    if with_gps_only:
        query = query.filter(Image.latitude.isnot(None), Image.longitude.isnot(None))

    # Search by filename if provided
    if search:
        query = query.filter(Image.filename.ilike(f"%{search}%"))

    images = query.all()

    return {
        "total": len(images),
        "images": [img.to_dict() for img in images]
    }


@app.get("/api/images/{filename}")
async def get_image_details(filename: str, db: Session = Depends(get_db)):
    """Get details for a specific image."""
    image = db.query(Image).filter(Image.filename == filename).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    return image.to_dict()


@app.get("/api/thumbnails/{filename}")
async def get_thumbnail(filename: str):
    """Get thumbnail for an image. Generate and cache if not exists."""
    # Check if original image exists
    image_path = FISHES_DIR / filename
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    # Thumbnail path
    thumbnail_path = THUMBNAILS_DIR / f"thumb_{filename}"
    if not thumbnail_path.suffix.lower() in ['.jpg', '.jpeg']:
        thumbnail_path = thumbnail_path.with_suffix('.jpg')

    # Check if thumbnail exists and is valid
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

    return FileResponse(
        thumbnail_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"}
    )


@app.post("/api/admin/upload")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Admin endpoint to upload a new image."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    file_path = FISHES_DIR / file.filename

    try:
        # Save the file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        # Extract metadata
        metadata = extract_image_metadata(str(file_path))

        # Check if image already exists
        existing = db.query(Image).filter(Image.filename == file.filename).first()

        if existing:
            # Update existing image
            for key, value in metadata.items():
                if key == "datetime" or key == "datetimeoriginal":
                    value = parse_datetime(value)
                setattr(existing, key, value)
            db.commit()
            db.refresh(existing)
            return {"message": "Image updated successfully", "metadata": existing.to_dict()}
        else:
            # Create new image
            new_image = Image(
                filename=metadata["filename"],
                path=metadata.get("path"),
                width=metadata.get("width"),
                height=metadata.get("height"),
                make=metadata.get("make"),
                model=metadata.get("model"),
                datetime=parse_datetime(metadata.get("datetime")),
                datetimeoriginal=parse_datetime(metadata.get("datetimeoriginal")),
                latitude=metadata.get("latitude"),
                longitude=metadata.get("longitude"),
                manually_tagged=metadata.get("manually_tagged", False),
            )
            db.add(new_image)
            db.commit()
            db.refresh(new_image)
            return {"message": "Image uploaded successfully", "metadata": new_image.to_dict()}

    except Exception as e:
        db.rollback()
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get statistics about the images."""
    total_images = db.query(Image).count()
    images_with_gps = db.query(Image).filter(
        Image.latitude.isnot(None),
        Image.longitude.isnot(None)
    ).count()

    return {
        "total_images": total_images,
        "images_with_gps": images_with_gps,
        "images_without_gps": total_images - images_with_gps
    }


# Locations endpoints
@app.get("/api/locations")
async def get_locations(db: Session = Depends(get_db)):
    """Get all favorite locations."""
    locations = db.query(Location).all()
    return {
        "total": len(locations),
        "locations": [loc.to_dict() for loc in locations]
    }


@app.post("/api/locations")
async def create_location(location: dict, db: Session = Depends(get_db)):
    """Create a new favorite location."""
    new_location = Location(
        name=location["name"],
        latitude=location["latitude"],
        longitude=location["longitude"],
        description=location.get("description"),
    )

    db.add(new_location)
    db.commit()
    db.refresh(new_location)

    return {"message": "Location created successfully", "location": new_location.to_dict()}


@app.put("/api/locations/{location_id}")
async def update_location(location_id: str, location: dict, db: Session = Depends(get_db)):
    """Update a favorite location."""
    loc = db.query(Location).filter(Location.id == location_id).first()

    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    loc.name = location.get("name", loc.name)
    loc.latitude = location.get("latitude", loc.latitude)
    loc.longitude = location.get("longitude", loc.longitude)
    loc.description = location.get("description", loc.description)

    db.commit()
    db.refresh(loc)

    return {"message": "Location updated successfully", "location": loc.to_dict()}


@app.delete("/api/locations/{location_id}")
async def delete_location(location_id: str, db: Session = Depends(get_db)):
    """Delete a favorite location."""
    loc = db.query(Location).filter(Location.id == location_id).first()

    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    db.delete(loc)
    db.commit()

    return {"message": "Location deleted successfully"}


# Image GPS tagging endpoint
@app.patch("/api/images/{filename}/gps")
async def update_image_gps(filename: str, gps_data: dict, db: Session = Depends(get_db)):
    """Manually update GPS coordinates for an image."""
    image = db.query(Image).filter(Image.filename == filename).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    image.latitude = gps_data.get("latitude")
    image.longitude = gps_data.get("longitude")
    image.manually_tagged = True

    db.commit()
    db.refresh(image)

    return {"message": "GPS coordinates updated successfully", "image": image.to_dict()}


@app.delete("/api/images/{filename}")
async def delete_image(filename: str, db: Session = Depends(get_db)):
    """Delete an image and its metadata."""
    image = db.query(Image).filter(Image.filename == filename).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found in database")

    # Delete database record
    db.delete(image)
    db.commit()

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

    return {"message": "Image deleted successfully"}
