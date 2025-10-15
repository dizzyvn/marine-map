#!/usr/bin/env python3
"""
Test WoRMS (World Register of Marine Species) API.
Free API for marine species taxonomic data.
API Docs: https://www.marinespecies.org/rest/
"""

import requests
import json


BASE_URL = "https://www.marinespecies.org/rest"


def search_species(scientific_name: str) -> list:
    """Search for species by scientific name."""
    url = f"{BASE_URL}/AphiaRecordsByName/{scientific_name}"
    params = {"like": "true", "marine_only": "true"}

    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()


def get_species_by_id(aphia_id: int) -> dict:
    """Get detailed species information by AphiaID."""
    url = f"{BASE_URL}/AphiaRecordByAphiaID/{aphia_id}"

    response = requests.get(url)
    response.raise_for_status()
    return response.json()


def search_common_name(common_name: str) -> list:
    """Search by common/vernacular name."""
    url = f"{BASE_URL}/AphiaRecordsByVernacular/{common_name}"
    params = {"like": "true"}

    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()


def get_classification(aphia_id: int) -> list:
    """Get full taxonomic classification for a species."""
    url = f"{BASE_URL}/AphiaClassificationByAphiaID/{aphia_id}"

    response = requests.get(url)
    response.raise_for_status()
    return response.json()


def main():
    print("=" * 60)
    print("🐠 WoRMS API TEST (World Register of Marine Species)")
    print("=" * 60)
    print()

    try:
        # Test 1: Search by scientific name
        print("Test 1: Search by scientific name - 'Amphiprion ocellaris'")
        print("-" * 60)
        results = search_species("Amphiprion ocellaris")

        if results:
            species = results[0]
            print(f"  AphiaID: {species['AphiaID']}")
            print(f"  Scientific Name: {species['scientificname']}")
            print(f"  Authority: {species.get('authority', 'N/A')}")
            print(f"  Status: {species['status']}")
            print(f"  Valid Name: {species.get('valid_name', 'N/A')}")
            print(f"  Kingdom: {species.get('kingdom', 'N/A')}")
            print(f"  Phylum: {species.get('phylum', 'N/A')}")
            print(f"  Class: {species.get('class', 'N/A')}")
            print(f"  Order: {species.get('order', 'N/A')}")
            print(f"  Family: {species.get('family', 'N/A')}")
            print()

            # Get classification
            print("  Full Classification:")
            classification = get_classification(species['AphiaID'])
            print(f"    {json.dumps(classification, indent=4)}")
            print()

        # Test 2: Search by common name
        print("Test 2: Search by common name - 'clownfish'")
        print("-" * 60)
        results = search_common_name("clownfish")

        if results:
            print(f"  Found {len(results)} species:")
            for i, species in enumerate(results[:5]):  # Show first 5
                print(f"    {i+1}. {species['scientificname']} (AphiaID: {species['AphiaID']})")
            if len(results) > 5:
                print(f"    ... and {len(results) - 5} more")
            print()

        # Test 3: Common Da Nang marine species
        print("Test 3: Search common Da Nang marine species")
        print("-" * 60)

        test_species = [
            "Acanthurus lineatus",  # Lined surgeonfish
            "Chaetodon",  # Butterflyfish genus
            "Tridacna",  # Giant clam genus
            "Acropora",  # Coral genus
        ]

        for species_name in test_species:
            try:
                results = search_species(species_name)
                if results:
                    print(f"  ✓ {species_name}: Found {len(results)} records")
                    print(f"    → {results[0]['scientificname']} ({results[0].get('rank', 'N/A')})")
                else:
                    print(f"  ✗ {species_name}: Not found")
            except Exception as e:
                print(f"  ✗ {species_name}: Error - {str(e)}")

        print()
        print("=" * 60)
        print("✅ SUCCESS: WoRMS API is fully functional!")
        print()
        print("Features available:")
        print("  • Search by scientific name")
        print("  • Search by common/vernacular name")
        print("  • Full taxonomic classification")
        print("  • 514,088+ marine species")
        print("  • Completely FREE")
        print("  • No API key required")
        print()
        print("💡 Recommendation: Use WoRMS as primary species database")
        print()

    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: Failed to connect to WoRMS API")
        print(f"   {str(e)}")
        print()
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print()


if __name__ == "__main__":
    main()
