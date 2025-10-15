# Marine Data API Tests

This directory contains test scripts for evaluating various free APIs that can add environmental and species data to the Da Nang Marine Creature Map.

## Quick Start

```bash
# Install dependencies
pip3 install -r requirements.txt

# Run all tests (interactive)
./run_all_tests.sh

# Or run individual tests
python3 moon-phase/test_moon.py
python3 worms-species/test_worms.py
python3 noaa-tide/test_noaa_tide.py
python3 noaa-sst/test_noaa_sst.py
```

## What's Tested

1. **🌙 Moon Phase** - Mathematical calculation (no API)
2. **🐠 Species Database** - WoRMS API (World Register of Marine Species)
3. **🌊 Tide Data** - NOAA Tides & Currents API
4. **🌡️ Sea Temperature** - NOAA ERDDAP/Historical Averages

## Results

See **[REPORT.md](REPORT.md)** for full test results and implementation recommendations.

### TL;DR

✅ **ALL 4 ARE WORKING AND FREE!** 🎉
- Moon Phase: ✅ Works perfectly
- Species Data: ✅ WoRMS API confirmed working!
- Tide Data: ✅ Works for Vietnam (NOAA station 1619910)
- Water Temp: ✅ Historical averages work great

**Total Cost**: $0

## Directory Structure

```
apis/
├── README.md              # This file
├── REPORT.md             # Full test report and recommendations
├── requirements.txt      # Python dependencies
├── run_all_tests.sh     # Test runner script
├── moon-phase/
│   └── test_moon.py     # Moon phase calculation test
├── worms-species/
│   └── test_worms.py    # WoRMS species API test
├── noaa-tide/
│   └── test_noaa_tide.py    # NOAA tide API test
└── noaa-sst/
    └── test_noaa_sst.py     # NOAA SST data test
```

## Next Steps

1. Read [REPORT.md](REPORT.md) for detailed results
2. ~~Manually test WoRMS API~~ ✅ CONFIRMED WORKING!
3. Start implementing moon phase calculation (easiest win)
4. Build species tagging system (highest value)
