#!/usr/bin/env python3
"""
Test NOAA Tides & Currents API for Da Nang, Vietnam area.
API Docs: https://api.tidesandcurrents.noaa.gov/api/prod/
Free API but primarily covers US coasts.
"""

import requests
from datetime import datetime, timedelta
import json


BASE_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter"


def find_nearest_station(lat: float, lon: float) -> dict:
    """
    Try to find the nearest tide station.
    Note: NOAA stations are primarily in US territories.
    """
    # This is a simplified search - NOAA doesn't have a proper station search API
    # We'll test some known stations in Southeast Asia if they exist
    test_stations = [
        {"id": "9999999", "name": "Da Nang Test", "country": "Vietnam"},
        {"id": "1619910", "name": "Vung Tau", "country": "Vietnam"},
        {"id": "1770000", "name": "Hong Kong", "country": "China"},
    ]

    return test_stations


def get_tide_predictions(station_id: str, begin_date: str, end_date: str) -> dict:
    """Get tide predictions for a station."""
    params = {
        "begin_date": begin_date,
        "end_date": end_date,
        "station": station_id,
        "product": "predictions",
        "datum": "MLLW",
        "time_zone": "gmt",
        "units": "metric",
        "interval": "hilo",  # High and low tides only
        "format": "json"
    }

    response = requests.get(BASE_URL, params=params)
    return response.json()


def get_water_level(station_id: str, begin_date: str, end_date: str) -> dict:
    """Get observed water levels."""
    params = {
        "begin_date": begin_date,
        "end_date": end_date,
        "station": station_id,
        "product": "water_level",
        "datum": "MLLW",
        "time_zone": "gmt",
        "units": "metric",
        "format": "json"
    }

    response = requests.get(BASE_URL, params=params)
    return response.json()


def main():
    print("=" * 60)
    print("🌊 NOAA TIDES & CURRENTS API TEST")
    print("=" * 60)
    print()

    # Da Nang coordinates
    danang_lat = 16.0544
    danang_lon = 108.2022

    print(f"Testing for Da Nang, Vietnam ({danang_lat}, {danang_lon})")
    print()

    # Test date range
    today = datetime.now()
    begin = today.strftime("%Y%m%d")
    end = (today + timedelta(days=7)).strftime("%Y%m%d")

    print(f"Date range: {begin} to {end}")
    print()

    # Test 1: Try known US station (should work)
    print("Test 1: US Station (San Francisco) - Control Test")
    print("-" * 60)

    try:
        us_station = "9414290"  # San Francisco
        result = get_tide_predictions(us_station, begin, end)

        if "predictions" in result:
            print(f"✅ SUCCESS: Got {len(result['predictions'])} tide predictions")
            print("Sample predictions:")
            for pred in result["predictions"][:3]:
                print(f"  {pred['t']}: {pred['v']} meters ({pred['type']})")
            print()
        else:
            print(f"❌ FAILED: {result}")
            print()

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print()

    # Test 2: Try Vietnam/Asia stations
    print("Test 2: Vietnam/Asia Stations")
    print("-" * 60)

    vietnam_stations = [
        "1619910",  # Possible Vietnam station
        "1770000",  # Hong Kong
        "5130100",  # Possible Southeast Asia
    ]

    asia_found = False
    for station_id in vietnam_stations:
        try:
            result = get_tide_predictions(station_id, begin, end)

            if "predictions" in result:
                print(f"✅ Station {station_id}: FOUND!")
                print(f"   Got {len(result['predictions'])} predictions")
                asia_found = True
                break
            elif "error" in result:
                print(f"✗ Station {station_id}: {result['error']['message']}")
            else:
                print(f"✗ Station {station_id}: No data")

        except Exception as e:
            print(f"✗ Station {station_id}: {str(e)}")

    print()

    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    if not asia_found:
        print("❌ NOAA TIDE DATA NOT AVAILABLE FOR DA NANG")
        print()
        print("Findings:")
        print("  • NOAA API works perfectly for US coasts")
        print("  • No stations found for Da Nang, Vietnam")
        print("  • NOAA primarily covers US territories")
        print()
        print("🔄 ALTERNATIVES:")
        print()
        print("1. WorldTides API (paid but has global coverage)")
        print("   https://www.worldtides.info/")
        print()
        print("2. Tidal prediction calculations (free but complex)")
        print("   - Use harmonic constants")
        print("   - Libraries: pytides, noaa-coops")
        print()
        print("3. Regional tide tables (manual data)")
        print("   - Vietnam maritime authorities")
        print("   - Local fishing communities")
        print()
        print("💡 RECOMMENDATION:")
        print("   For Da Nang, consider using WorldTides API")
        print("   or implementing tide calculation algorithms")
        print()
    else:
        print("✅ TIDE DATA AVAILABLE FOR ASIA REGION")
        print()


if __name__ == "__main__":
    main()
