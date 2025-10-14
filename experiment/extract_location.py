#!/usr/bin/env python3
"""
Extract GPS location information from image EXIF data.

This script reads EXIF metadata from images and extracts GPS coordinates
if available. It processes images from the fishes directory and reports
which images contain location data.
"""

import os
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import json


def extract_gps_info(image_path):
    """
    Extract GPS information from image EXIF data.

    Args:
        image_path: Path to the image file

    Returns:
        Dictionary containing GPS data or None if no GPS data found
    """
    try:
        image = Image.open(image_path)
        exif_data = image._getexif()

        if not exif_data:
            return None

        gps_info = {}

        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)

            if tag == "GPSInfo":
                for gps_tag_id in value:
                    gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_info[gps_tag] = value[gps_tag_id]

        return gps_info if gps_info else None

    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None


def convert_to_degrees(value):
    """
    Convert GPS coordinates to degrees in float format.

    Args:
        value: GPS coordinate in degrees, minutes, seconds format

    Returns:
        Float value of the coordinate in degrees
    """
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

        return degrees + (minutes / 60.0) + (seconds / 3600.0)
    except (ZeroDivisionError, TypeError, IndexError) as e:
        raise ValueError(f"Invalid GPS coordinate format: {value}") from e


def parse_gps_coordinates(gps_info):
    """
    Parse GPS information into latitude and longitude.

    Args:
        gps_info: Dictionary containing GPS EXIF data

    Returns:
        Dictionary with latitude, longitude, and other GPS metadata
    """
    if not gps_info:
        return None

    result = {}

    try:
        # Extract latitude
        if "GPSLatitude" in gps_info and "GPSLatitudeRef" in gps_info:
            lat = convert_to_degrees(gps_info["GPSLatitude"])
            if gps_info["GPSLatitudeRef"] == "S":
                lat = -lat
            result["latitude"] = lat
            result["latitude_ref"] = gps_info["GPSLatitudeRef"]

        # Extract longitude
        if "GPSLongitude" in gps_info and "GPSLongitudeRef" in gps_info:
            lon = convert_to_degrees(gps_info["GPSLongitude"])
            if gps_info["GPSLongitudeRef"] == "W":
                lon = -lon
            result["longitude"] = lon
            result["longitude_ref"] = gps_info["GPSLongitudeRef"]

        # Extract altitude if available
        if "GPSAltitude" in gps_info:
            alt_value = gps_info["GPSAltitude"]
            if hasattr(alt_value, 'numerator') and hasattr(alt_value, 'denominator'):
                altitude = alt_value.numerator / alt_value.denominator if alt_value.denominator != 0 else 0
            else:
                altitude = float(alt_value)
            result["altitude"] = altitude

        # Extract timestamp if available
        if "GPSDateStamp" in gps_info:
            result["gps_date"] = gps_info["GPSDateStamp"]
        if "GPSTimeStamp" in gps_info:
            result["gps_time"] = gps_info["GPSTimeStamp"]

        # Store raw GPS info for debugging
        result["raw_gps_keys"] = list(gps_info.keys())

    except Exception as e:
        # Return partial result with error info
        result["parse_error"] = str(e)

    return result if result else None


def analyze_directory(directory_path):
    """
    Analyze all images in a directory for GPS location data.

    Args:
        directory_path: Path to directory containing images

    Returns:
        Dictionary with analysis results
    """
    images_with_gps = []
    images_without_gps = []
    images_with_partial_gps = []
    errors = []

    image_files = list(Path(directory_path).glob("*.jpg")) + \
                  list(Path(directory_path).glob("*.JPG")) + \
                  list(Path(directory_path).glob("*.jpeg")) + \
                  list(Path(directory_path).glob("*.JPEG"))

    for image_path in sorted(image_files):
        try:
            gps_info = extract_gps_info(image_path)

            if gps_info:
                coordinates = parse_gps_coordinates(gps_info)
                if coordinates and "latitude" in coordinates and "longitude" in coordinates:
                    images_with_gps.append({
                        "filename": image_path.name,
                        "path": str(image_path),
                        "coordinates": coordinates
                    })
                elif coordinates:
                    # Has GPS data but incomplete coordinates
                    images_with_partial_gps.append({
                        "filename": image_path.name,
                        "coordinates": coordinates
                    })
                else:
                    images_without_gps.append(str(image_path.name))
            else:
                images_without_gps.append(str(image_path.name))

        except Exception as e:
            errors.append({"filename": image_path.name, "error": str(e)})

    return {
        "total_images": len(image_files),
        "images_with_gps": len(images_with_gps),
        "images_with_partial_gps": len(images_with_partial_gps),
        "images_without_gps": len(images_without_gps),
        "errors": len(errors),
        "details": {
            "with_gps": images_with_gps,
            "with_partial_gps": images_with_partial_gps,
            "without_gps": images_without_gps,
            "errors": errors
        }
    }


def main():
    """Main execution function."""
    fishes_dir = Path(__file__).parent.parent / "fishes"

    print(f"Analyzing images in: {fishes_dir}")
    print("=" * 80)

    results = analyze_directory(fishes_dir)

    print(f"\nSummary:")
    print(f"  Total images: {results['total_images']}")
    print(f"  Images with complete GPS data: {results['images_with_gps']}")
    print(f"  Images with partial GPS data: {results['images_with_partial_gps']}")
    print(f"  Images without GPS data: {results['images_without_gps']}")
    print(f"  Errors: {results['errors']}")
    print("=" * 80)

    if results['images_with_gps'] > 0:
        print(f"\nImages with complete GPS coordinates:")
        for img in results['details']['with_gps']:
            coords = img['coordinates']
            print(f"\n  {img['filename']}")
            print(f"    Latitude: {coords['latitude']:.6f} ({coords.get('latitude_ref', 'N')})")
            print(f"    Longitude: {coords['longitude']:.6f} ({coords.get('longitude_ref', 'E')})")
            if 'altitude' in coords:
                print(f"    Altitude: {coords['altitude']:.2f}m")
            if 'gps_date' in coords:
                print(f"    GPS Date: {coords['gps_date']}")

    if results['images_with_partial_gps'] > 0:
        print(f"\nImages with partial GPS data:")
        for img in results['details']['with_partial_gps'][:5]:  # Show first 5
            print(f"\n  {img['filename']}")
            coords = img['coordinates']
            print(f"    Available GPS fields: {coords.get('raw_gps_keys', 'unknown')}")
            if 'parse_error' in coords:
                print(f"    Parse error: {coords['parse_error']}")
        if len(results['details']['with_partial_gps']) > 5:
            print(f"\n  ... and {len(results['details']['with_partial_gps']) - 5} more")

    # Save results to JSON
    output_file = Path(__file__).parent / "gps_extraction_results.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\n\nDetailed results saved to: {output_file}")

    # Print conclusion
    print("\n" + "=" * 80)
    if results['images_with_gps'] > 0:
        print("✓ SUCCESS: Location extraction is possible!")
        print(f"  Found GPS coordinates in {results['images_with_gps']} out of {results['total_images']} images")
    else:
        print("✗ No GPS data found in any images")
        print("  Images may not have been geotagged or EXIF data was stripped")


if __name__ == "__main__":
    main()
