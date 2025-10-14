import os
import json
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from typing import Optional


def extract_gps_from_exif(image_path: str) -> Optional[dict]:
    """Extract GPS coordinates from image EXIF data."""
    try:
        image = Image.open(image_path)
        exif_data = image._getexif()

        if not exif_data:
            return None

        gps_info = {}
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)
            if tag_name == "GPSInfo":
                for gps_tag_id in value:
                    gps_tag_name = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_info[gps_tag_name] = value[gps_tag_id]

        if not gps_info:
            return None

        # Convert GPS coordinates to decimal degrees
        lat = convert_to_degrees(gps_info.get("GPSLatitude"))
        lon = convert_to_degrees(gps_info.get("GPSLongitude"))

        if lat is None or lon is None:
            return None

        # Adjust for hemisphere
        if gps_info.get("GPSLatitudeRef") == "S":
            lat = -lat
        if gps_info.get("GPSLongitudeRef") == "W":
            lon = -lon

        # Validate coordinates - reject 0,0 and other invalid values
        if lat == 0.0 and lon == 0.0:
            return None

        # Check if coordinates are within valid ranges
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return None

        return {"latitude": lat, "longitude": lon}
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None


def convert_to_degrees(value) -> Optional[float]:
    """Convert GPS coordinates to decimal degrees."""
    if not value:
        return None

    try:
        # Handle tuple of IFDRational or other formats
        if hasattr(value[0], 'numerator') and hasattr(value[0], 'denominator'):
            degrees = value[0].numerator / value[0].denominator if value[0].denominator != 0 else 0
            minutes = value[1].numerator / value[1].denominator if value[1].denominator != 0 else 0
            seconds = value[2].numerator / value[2].denominator if value[2].denominator != 0 else 0
        else:
            degrees = float(value[0])
            minutes = float(value[1])
            seconds = float(value[2])

        # Check if any value is NaN or infinite
        import math
        if any(math.isnan(x) or math.isinf(x) for x in [degrees, minutes, seconds]):
            return None

        result = degrees + (minutes / 60.0) + (seconds / 3600.0)

        # Final validation
        if math.isnan(result) or math.isinf(result):
            return None

        return result
    except (TypeError, ValueError, ZeroDivisionError, IndexError, AttributeError):
        return None


def extract_image_metadata(image_path: str) -> dict:
    """Extract all relevant metadata from an image."""
    try:
        image = Image.open(image_path)
        exif_data = image._getexif() or {}

        # Extract basic info
        metadata = {
            "filename": os.path.basename(image_path),
            "path": image_path,
            "width": image.width,
            "height": image.height,
        }

        # Extract EXIF data
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)
            if tag_name in ["Make", "Model", "DateTime", "DateTimeOriginal"]:
                metadata[tag_name.lower()] = str(value)

        # Extract GPS
        gps_data = extract_gps_from_exif(image_path)
        if gps_data:
            metadata.update(gps_data)

        return metadata
    except Exception as e:
        print(f"Error extracting metadata from {image_path}: {e}")
        return {
            "filename": os.path.basename(image_path),
            "path": image_path,
            "error": str(e)
        }


def process_images_directory(directory_path: str, output_file: str):
    """Process all images in a directory and save metadata to JSON."""
    images_data = []

    image_extensions = {".jpg", ".jpeg", ".png", ".heic"}
    directory = Path(directory_path)

    for image_file in directory.iterdir():
        if image_file.suffix.lower() in image_extensions:
            print(f"Processing: {image_file.name}")
            metadata = extract_image_metadata(str(image_file))
            images_data.append(metadata)

    # Save to JSON file
    with open(output_file, "w") as f:
        json.dump(images_data, f, indent=2)

    print(f"\nProcessed {len(images_data)} images")
    print(f"Metadata saved to: {output_file}")

    # Print statistics
    images_with_gps = sum(1 for img in images_data if "latitude" in img)
    print(f"Images with GPS data: {images_with_gps}/{len(images_data)}")

    return images_data
