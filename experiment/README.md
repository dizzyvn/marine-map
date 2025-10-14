# GPS Location Extraction Experiment

## Objective
Test whether location information can be extracted from images in the `fishes` directory using EXIF metadata.

## Results Summary

### Images Analyzed
- **Total images**: 66 JPG files
- **Images with GPS tags**: 45 (68%)
- **Images without GPS data**: 21 (32%)

### Critical Finding
**Location extraction is NOT possible with current images.**

While 45 images contain GPS EXIF tags, all coordinate values are zeroed out (0/0, 0/0, 0/0), indicating:
1. GPS was enabled when photos were taken
2. Location data was either:
   - Never captured (GPS signal unavailable)
   - Stripped/redacted for privacy
   - Zeroed out by camera or editing software

### Technical Details

#### GPS Data Structure Found
Images with GPS tags contain these EXIF fields:
- `GPSLatitudeRef`: Empty string
- `GPSLatitude`: (0/0, 0/0, 0/0) - degrees, minutes, seconds all zero
- `GPSLongitudeRef`: Empty string
- `GPSLongitude`: (0/0, 0/0, 0/0) - degrees, minutes, seconds all zero
- `GPSAltitude`: 0/0
- `GPSTimeStamp`: (0/0, 0/0, 0/0)
- `GPSDateStamp`: Empty string

#### Camera Information
- Primary camera: vivo X100 Ultra
- Some images show `--` for make/model (possibly processed/edited)

## Scripts Created

### 1. `extract_location.py`
Main script that attempts to extract GPS coordinates from images.

**Usage:**
```bash
python3 extract_location.py
```

**Features:**
- Scans all JPG images in the fishes directory
- Extracts GPS coordinates if available
- Handles various EXIF data formats (IFDRational, tuples)
- Generates detailed JSON report
- Provides summary statistics

### 2. `inspect_raw_exif.py`
Diagnostic tool to inspect raw EXIF structure.

**Usage:**
```bash
python3 inspect_raw_exif.py
```

**Features:**
- Shows raw EXIF data format
- Displays GPS tag structure
- Helps debug coordinate extraction issues

## Output Files

- `gps_extraction_results.json` - Detailed extraction results
- `raw_exif_inspection.json` - Raw EXIF data samples

## Conclusions

1. **GPS extraction is technically possible** - The code works correctly
2. **No valid GPS data exists** - All coordinates are zeroed
3. **Privacy consideration** - This appears intentional (location data removed)

## Recommendations

### Option 1: Manual Geotagging
If you know the dive/photo locations, you could:
- Use software like ExifTool or Adobe Lightroom
- Manually add GPS coordinates to images
- Or maintain a separate location database

### Option 2: Location Database
Instead of relying on EXIF data:
- Create a JSON/database mapping filenames to locations
- Store location metadata separately from images
- More reliable and maintainable

### Option 3: Future Photos
For new photos:
- Ensure GPS is enabled on camera
- Verify location data is being captured
- Check immediately after taking photos

## Example Location Database Structure

```json
{
  "IMG_20250719_213700.jpg": {
    "location": "Son Tra Peninsula",
    "coordinates": {
      "latitude": 16.1086,
      "longitude": 108.2646
    },
    "dive_site": "Mushroom Rock",
    "depth": 12
  }
}
```

## Next Steps

1. Decide on location data strategy (manual tagging vs separate database)
2. If using database approach, create location schema
3. Map existing images to their dive sites/locations
4. Build application to display images with location data
