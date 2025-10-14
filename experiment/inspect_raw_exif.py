#!/usr/bin/env python3
"""
Inspect raw EXIF data from sample images to understand GPS structure.
"""

from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import json


def inspect_image_exif(image_path):
    """Inspect all EXIF data from an image."""
    try:
        image = Image.open(image_path)
        exif_data = image._getexif()

        if not exif_data:
            return {"error": "No EXIF data found"}

        result = {}

        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)

            if tag == "GPSInfo":
                gps_data = {}
                for gps_tag_id in value:
                    gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_value = value[gps_tag_id]

                    # Format the value for display
                    if hasattr(gps_value, 'numerator'):
                        formatted_value = f"{gps_value.numerator}/{gps_value.denominator}"
                    elif isinstance(gps_value, tuple):
                        formatted_items = []
                        for item in gps_value:
                            if hasattr(item, 'numerator'):
                                formatted_items.append(f"{item.numerator}/{item.denominator}")
                            else:
                                formatted_items.append(str(item))
                        formatted_value = f"({', '.join(formatted_items)})"
                    elif isinstance(gps_value, bytes):
                        formatted_value = f"bytes: {gps_value.hex()}"
                    else:
                        formatted_value = str(gps_value)

                    gps_data[gps_tag] = {
                        "value": formatted_value,
                        "raw_type": type(gps_value).__name__
                    }

                result["GPSInfo"] = gps_data
            else:
                # Store other interesting tags
                if tag in ["Make", "Model", "DateTime", "DateTimeOriginal", "Software"]:
                    result[tag] = str(value)

        return result

    except Exception as e:
        return {"error": str(e)}


def main():
    """Main execution."""
    fishes_dir = Path(__file__).parent.parent / "fishes"

    # Find a few images to inspect
    image_files = list(fishes_dir.glob("*.jpg"))[:10]

    print("Inspecting raw EXIF data from sample images")
    print("=" * 80)

    results = {}

    for image_path in image_files:
        print(f"\nInspecting: {image_path.name}")
        print("-" * 80)

        exif_data = inspect_image_exif(image_path)
        results[image_path.name] = exif_data

        if "GPSInfo" in exif_data:
            print("GPS Data found:")
            for gps_tag, gps_value in exif_data["GPSInfo"].items():
                print(f"  {gps_tag}: {gps_value['value']} (type: {gps_value['raw_type']})")
        else:
            print("No GPS data")

        if "Make" in exif_data or "Model" in exif_data:
            print(f"Camera: {exif_data.get('Make', 'Unknown')} {exif_data.get('Model', 'Unknown')}")

    # Save detailed results
    output_file = Path(__file__).parent / "raw_exif_inspection.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n\nDetailed results saved to: {output_file}")


if __name__ == "__main__":
    main()
