#!/usr/bin/env python3
"""
Migration script to transfer data from JSON files to PostgreSQL database.
Run this once to migrate existing data.
"""

import json
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session

from database import SessionLocal, init_db, check_db_connection
from models import Image, Location


def parse_datetime(dt_string: str) -> datetime:
    """Parse datetime string from JSON."""
    if not dt_string:
        return None
    try:
        # Format: "2025:08:17 12:11:30"
        return datetime.strptime(dt_string, "%Y:%m:%d %H:%M:%S")
    except:
        return None


def migrate_images(db: Session, json_file: Path):
    """Migrate images from JSON to database."""
    print(f"Migrating images from {json_file}...")

    if not json_file.exists():
        print(f"  ⚠️  File not found: {json_file}")
        return

    with open(json_file, "r") as f:
        data = json.load(f)

    total = len(data)
    migrated = 0
    skipped = 0
    errors = 0

    for item in data:
        try:
            # Check if image already exists
            existing = db.query(Image).filter(Image.filename == item["filename"]).first()
            if existing:
                skipped += 1
                continue

            # Create new image record
            image = Image(
                filename=item["filename"],
                path=item.get("path"),
                width=item.get("width"),
                height=item.get("height"),
                make=item.get("make"),
                model=item.get("model"),
                datetime=parse_datetime(item.get("datetime")),
                datetimeoriginal=parse_datetime(item.get("datetimeoriginal")),
                latitude=item.get("latitude"),
                longitude=item.get("longitude"),
                manually_tagged=item.get("manually_tagged", False),
            )

            db.add(image)
            migrated += 1

        except Exception as e:
            print(f"  ❌ Error migrating {item.get('filename')}: {e}")
            errors += 1

    db.commit()

    print(f"  ✅ Migrated: {migrated}/{total}")
    print(f"  ⏭️  Skipped (already exists): {skipped}")
    if errors > 0:
        print(f"  ❌ Errors: {errors}")


def migrate_locations(db: Session, json_file: Path):
    """Migrate locations from JSON to database."""
    print(f"Migrating locations from {json_file}...")

    if not json_file.exists():
        print(f"  ⚠️  File not found: {json_file}")
        return

    with open(json_file, "r") as f:
        data = json.load(f)

    total = len(data)
    migrated = 0
    skipped = 0
    errors = 0

    for item in data:
        try:
            # Check if location already exists by name
            existing = db.query(Location).filter(Location.name == item["name"]).first()
            if existing:
                skipped += 1
                continue

            # Create new location record
            location = Location(
                name=item["name"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                description=item.get("description"),
            )

            db.add(location)
            migrated += 1

        except Exception as e:
            print(f"  ❌ Error migrating location {item.get('name')}: {e}")
            errors += 1

    db.commit()

    print(f"  ✅ Migrated: {migrated}/{total}")
    print(f"  ⏭️  Skipped (already exists): {skipped}")
    if errors > 0:
        print(f"  ❌ Errors: {errors}")


def main():
    """Run migration."""
    print("=" * 60)
    print("🔄 DATABASE MIGRATION SCRIPT")
    print("=" * 60)
    print()

    # Check database connection
    print("1. Checking database connection...")
    if not check_db_connection():
        print("  ❌ Database connection failed!")
        print("  💡 Make sure DATABASE_URL is set correctly in .env")
        return
    print("  ✅ Database connected")
    print()

    # Initialize database (create tables)
    print("2. Initializing database tables...")
    try:
        init_db()
        print("  ✅ Tables created/verified")
    except Exception as e:
        print(f"  ❌ Failed to create tables: {e}")
        return
    print()

    # Get database session
    db = SessionLocal()

    try:
        # Paths
        base_dir = Path(__file__).parent.parent
        images_file = base_dir / "backend" / "data" / "images_metadata.json"
        locations_file = base_dir / "backend" / "data" / "locations.json"

        # Migrate images
        print("3. Migrating images...")
        migrate_images(db, images_file)
        print()

        # Migrate locations
        print("4. Migrating locations...")
        migrate_locations(db, locations_file)
        print()

        print("=" * 60)
        print("✅ MIGRATION COMPLETED!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        db.rollback()

    finally:
        db.close()


if __name__ == "__main__":
    main()
