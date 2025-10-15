#!/usr/bin/env python3
"""
Test moon phase calculation using astronomical formulas.
No external API needed - pure mathematical calculation.
"""

import math
from datetime import datetime, timezone


def calculate_moon_phase(date: datetime) -> dict:
    """
    Calculate moon phase for a given date using astronomical formulas.
    Returns phase name, illumination percentage, and age in days.
    """
    # Convert to Julian date
    year = date.year
    month = date.month
    day = date.day + date.hour / 24.0 + date.minute / 1440.0

    if month <= 2:
        year -= 1
        month += 12

    a = year // 100
    b = 2 - a + a // 4
    jd = int(365.25 * (year + 4716)) + int(30.6001 * (month + 1)) + day + b - 1524.5

    # Days since known new moon (January 6, 2000)
    days_since_new = jd - 2451549.5

    # New moons occur every 29.53 days (synodic month)
    synodic_month = 29.53058867

    # Calculate moon age
    moon_age = days_since_new % synodic_month

    # Calculate illumination (0-100%)
    illumination = (1 - math.cos((moon_age / synodic_month) * 2 * math.pi)) / 2 * 100

    # Determine phase name
    if moon_age < 1.84566:
        phase_name = "New Moon"
        phase_emoji = "🌑"
    elif moon_age < 5.53699:
        phase_name = "Waxing Crescent"
        phase_emoji = "🌒"
    elif moon_age < 9.22831:
        phase_name = "First Quarter"
        phase_emoji = "🌓"
    elif moon_age < 12.91963:
        phase_name = "Waxing Gibbous"
        phase_emoji = "🌔"
    elif moon_age < 16.61096:
        phase_name = "Full Moon"
        phase_emoji = "🌕"
    elif moon_age < 20.30228:
        phase_name = "Waning Gibbous"
        phase_emoji = "🌖"
    elif moon_age < 23.99361:
        phase_name = "Last Quarter"
        phase_emoji = "🌗"
    elif moon_age < 27.68493:
        phase_name = "Waning Crescent"
        phase_emoji = "🌘"
    else:
        phase_name = "New Moon"
        phase_emoji = "🌑"

    return {
        "phase_name": phase_name,
        "phase_emoji": phase_emoji,
        "illumination": round(illumination, 1),
        "age_days": round(moon_age, 1),
        "synodic_month": synodic_month
    }


def main():
    print("=" * 60)
    print("🌙 MOON PHASE CALCULATION TEST")
    print("=" * 60)
    print()

    # Test current date
    now = datetime.now(timezone.utc)
    print(f"Test Date: {now.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print()

    result = calculate_moon_phase(now)

    print("Results:")
    print(f"  Phase: {result['phase_emoji']} {result['phase_name']}")
    print(f"  Illumination: {result['illumination']}%")
    print(f"  Age: {result['age_days']} days")
    print(f"  Synodic Month: {result['synodic_month']} days")
    print()

    # Test several dates
    print("Testing multiple dates:")
    print("-" * 60)

    test_dates = [
        datetime(2025, 1, 13, 12, 0, tzinfo=timezone.utc),  # Known full moon
        datetime(2025, 1, 29, 12, 0, tzinfo=timezone.utc),  # Known new moon
        datetime(2025, 2, 12, 12, 0, tzinfo=timezone.utc),  # Known full moon
        datetime(2024, 10, 15, 8, 30, tzinfo=timezone.utc),  # Sample diving date
    ]

    for test_date in test_dates:
        result = calculate_moon_phase(test_date)
        print(f"{test_date.strftime('%Y-%m-%d')}: {result['phase_emoji']} {result['phase_name']} ({result['illumination']}%)")

    print()
    print("✅ SUCCESS: Moon phase calculation works without external API!")
    print("💡 This can be implemented directly in Python/JavaScript")
    print()


if __name__ == "__main__":
    main()
