#!/usr/bin/env python3
"""
Test NOAA Sea Surface Temperature (SST) data access.
Uses NOAA OISST (Optimum Interpolation Sea Surface Temperature).
Data is free but requires NetCDF/THREDDS data access.
"""

import requests
from datetime import datetime, timedelta


def test_erddap_sst(lat: float, lon: float, date: str) -> dict:
    """
    Test NOAA ERDDAP server for SST data.
    ERDDAP provides easier API access to NOAA data.
    """
    base_url = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/nceiPH53sstd1day.json"

    # Format: [(time)][0][(latitude):(latitude)][(longitude):(longitude)]
    params = {
        "sst": f"[({date})][({lat}):({lat})][({lon}):({lon})]"
    }

    try:
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        return {"success": True, "data": response.json()}
    except Exception as e:
        return {"success": False, "error": str(e)}


def test_simple_sst_api(lat: float, lon: float) -> dict:
    """
    Test simpler SST API endpoint.
    """
    # NOAA CoastWatch ERDDAP - simpler query
    url = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/nceiPH53sstd1day.json"

    # Get data for today
    today = datetime.now()
    # OISST data usually has 1-2 day lag
    date = (today - timedelta(days=2)).strftime("%Y-%m-%d")

    params = f"?sst[({date})][(0.0)][(16.0):(16.1)][(108.0):(108.1)]"

    try:
        response = requests.get(url + params, timeout=15)

        if response.status_code == 200:
            data = response.json()
            return {"success": True, "data": data, "date": date}
        else:
            return {"success": False, "error": f"HTTP {response.status_code}", "response": response.text[:200]}

    except Exception as e:
        return {"success": False, "error": str(e)}


def estimate_sst_simple(lat: float, month: int) -> dict:
    """
    Simple SST estimation based on location and month.
    Fallback method using historical averages.
    """
    # Da Nang average SST by month (°C) - historical data
    sst_table = {
        1: 24, 2: 24, 3: 25, 4: 27,
        5: 29, 6: 30, 7: 30, 8: 30,
        9: 29, 10: 28, 11: 26, 12: 25
    }

    return {
        "temperature": sst_table.get(month, 27),
        "method": "historical_average",
        "note": "Approximate value based on historical data"
    }


def main():
    print("=" * 60)
    print("🌡️  NOAA SEA SURFACE TEMPERATURE (SST) TEST")
    print("=" * 60)
    print()

    # Da Nang coordinates
    danang_lat = 16.0544
    danang_lon = 108.2022

    print(f"Location: Da Nang, Vietnam ({danang_lat}, {danang_lon})")
    print()

    # Test 1: Try ERDDAP API
    print("Test 1: NOAA ERDDAP API (CoastWatch)")
    print("-" * 60)

    result = test_simple_sst_api(danang_lat, danang_lon)

    if result["success"]:
        print("✅ SUCCESS: SST data retrieved!")
        print(f"   Date: {result.get('date')}")

        try:
            data = result["data"]
            if "table" in data:
                rows = data["table"]["rows"]
                if rows:
                    sst_value = rows[0][-1]  # Last column is SST
                    print(f"   Temperature: {sst_value}°C")
                else:
                    print("   No data rows found")
            else:
                print(f"   Data structure: {list(data.keys())}")
        except Exception as e:
            print(f"   Could not parse: {str(e)}")

        print()

    else:
        print(f"❌ FAILED: {result.get('error')}")
        if "response" in result:
            print(f"   Response: {result['response']}")
        print()

    # Test 2: Historical average fallback
    print("Test 2: Historical Average Estimation (Fallback)")
    print("-" * 60)

    current_month = datetime.now().month
    estimate = estimate_sst_simple(danang_lat, current_month)

    print(f"✅ Current month ({current_month}): {estimate['temperature']}°C")
    print(f"   Method: {estimate['method']}")
    print(f"   Note: {estimate['note']}")
    print()

    # Show all months
    print("Da Nang SST by month (historical average):")
    for month in range(1, 13):
        temp = estimate_sst_simple(danang_lat, month)["temperature"]
        month_name = datetime(2000, month, 1).strftime("%B")
        print(f"  {month_name:>10}: {temp}°C")

    print()

    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print()
    print("NOAA SST Data Status:")
    print()
    print("✅ AVAILABLE:")
    print("  • NOAA OISST global coverage (1/4 degree resolution)")
    print("  • ERDDAP API access available")
    print("  • 1-2 day lag for near real-time data")
    print()
    print("⚠️  CHALLENGES:")
    print("  • Complex NetCDF/THREDDS data format")
    print("  • API can be slow or unreliable")
    print("  • Requires proper coordinate formatting")
    print()
    print("💡 RECOMMENDATIONS:")
    print()
    print("Option 1: ERDDAP API (when available)")
    print("  - Free global coverage")
    print("  - 1-2 day data lag")
    print("  - May have reliability issues")
    print()
    print("Option 2: Historical averages + offset")
    print("  - Very simple and reliable")
    print("  - Use monthly historical average")
    print("  - Good enough for general marine observation")
    print()
    print("Option 3: Paid API (Storm Glass, etc.)")
    print("  - More reliable")
    print("  - Real-time data")
    print("  - Costs money")
    print()
    print("🎯 BEST APPROACH FOR THIS APP:")
    print("   Use historical averages for now")
    print("   Add ERDDAP API as optional enhancement later")
    print()


if __name__ == "__main__":
    main()
