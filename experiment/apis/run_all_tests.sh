#!/bin/bash

echo "=================================================="
echo "   MARINE DATA API TESTING SUITE"
echo "   Testing APIs for Da Nang Marine Creature Map"
echo "=================================================="
echo ""

# Check if requests library is installed
python3 -c "import requests" 2>/dev/null || {
    echo "Installing required Python packages..."
    pip3 install -q requests
    echo ""
}

# Test 1: Moon Phase
echo ""
echo "🌙 TEST 1: MOON PHASE CALCULATION"
echo "=================================================="
python3 moon-phase/test_moon.py
echo ""
read -p "Press Enter to continue to next test..."

# Test 2: WoRMS Species API
echo ""
echo "🐠 TEST 2: WoRMS SPECIES DATABASE API"
echo "=================================================="
python3 worms-species/test_worms.py
echo ""
read -p "Press Enter to continue to next test..."

# Test 3: NOAA Tide API
echo ""
echo "🌊 TEST 3: NOAA TIDES & CURRENTS API"
echo "=================================================="
python3 noaa-tide/test_noaa_tide.py
echo ""
read -p "Press Enter to continue to next test..."

# Test 4: NOAA SST API
echo ""
echo "🌡️  TEST 4: NOAA SEA SURFACE TEMPERATURE API"
echo "=================================================="
python3 noaa-sst/test_noaa_sst.py
echo ""

echo "=================================================="
echo "   ALL TESTS COMPLETED!"
echo "   Check REPORT.md for summary"
echo "=================================================="
