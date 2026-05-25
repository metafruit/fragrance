#!/usr/bin/env python3
"""
ScentSpace Fragrantica Scraper Helper
This script extracts fragrance details (brand, name, accords, notes, seasons, time of day)
from a Fragrantica page and outputs it in a clean JSON format that can be imported 
directly into the ScentSpace web application.

Usage:
  python3 scraper.py https://www.fragrantica.com/perfume/Chanel/Bleu-de-Chanel-9099.html
  
Cloudflare Bypass Fallback:
  If Fragrantica blocks automated requests, open the URL in your web browser,
  right-click and 'Save Page As...' (HTML only), then run this script on the saved file:
  python3 scraper.py bleu_de_chanel.html
"""

import os
import sys
import re
import json
import argparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# Attempt to import BeautifulSoup
try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: BeautifulSoup4 is required. Please install it using:")
    print("  pip install beautifulsoup4")
    sys.exit(1)

def get_accord_color(name):
    # Match JS colors in app.js
    colors = {
        "wood": "#8e8e93", "woody": "#8e8e93",
        "citrus": "#f1c40f",
        "amber": "#e67e22",
        "spicy": "#d35400", "warm spicy": "#d35400", "fresh spicy": "#2ecc71",
        "sweet": "#9b59b6",
        "leather": "#795548",
        "vanilla": "#f5c518",
        "aromatic": "#1abc9c",
        "coffee": "#6f4e37",
        "floral": "#e84393", "rose": "#fd79a8", "white floral": "#ecf0f1",
        "marine": "#3498db", "aquatic": "#3498db",
        "aldehydic": "#e2e2e2",
        "powdery": "#e7e7e7",
        "musk": "#bdc3c7", "musky": "#bdc3c7"
    }
    return colors.get(name.lower().strip(), "#55efc4")

def parse_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 1. Image extraction
    image_url = None
    og_image = soup.find("meta", property="og:image")
    if og_image:
        image_url = og_image.get("content", "").strip()
    else:
        schema_image = soup.find(itemprop="image")
        if schema_image:
            image_url = schema_image.get("src", "").strip()

    # 2. Name & Brand
    brand = "Unknown Brand"
    name = "Unknown Fragrance"
    
    # Try itemprop metadata
    brand_elem = soup.find(itemprop="brand")
    if brand_elem:
        brand = brand_elem.get_text(strip=True)
    else:
        # Fallback: check headers
        brand_meta = soup.find("meta", property="og:title")
        if brand_meta:
            title_text = brand_meta.get("content", "")
            # Og title is usually "Fragrance Name Brand perfume - a fragrance for..."
            parts = title_text.split(" ")
            if len(parts) > 1:
                brand = parts[-1] # Simple guess
    
    name_elem = soup.find("h1", itemprop="name") or soup.find(itemprop="name")
    # If the name element is the same as the brand element's inner name, look for h1
    if name_elem and brand_elem and (name_elem == brand_elem or (brand_elem.find(itemprop="name") == name_elem)):
        name_elem = soup.find("h1")
        
    if name_elem:
        name = name_elem.get_text(strip=True)
        # Strip brand from name if present (case-insensitive)
        if brand.lower() in name.lower():
            name = re.sub(re.escape(brand), '', name, flags=re.IGNORECASE).strip()
            # Clean up double spaces or dashes
            name = re.sub(r'\s+', ' ', name).strip()
    else:
        # Check og:title
        title_elem = soup.find("title")
        if title_elem:
            title_text = title_elem.get_text(strip=True)
            # e.g., Bleu de Chanel Chanel cologne...
            name = title_text.split(" - ")[0].split(" perfume ")[0].strip()

    # 2. Gender Suitability
    gender = "unisex"
    full_text = soup.get_text().lower()
    if "perfume for women" in full_text or "fragrance for women" in full_text:
        gender = "women"
    elif "cologne for men" in full_text or "fragrance for men" in full_text:
        gender = "men"

    # 3. Concentration (EDP, EDT, etc.)
    concentration = "Eau de Parfum"
    if "eau de toilette" in full_text:
        concentration = "Eau de Toilette"
    elif "extrait" in full_text or "pure parfum" in full_text:
        concentration = "Parfum"
    elif "cologne" in full_text or "eau de cologne" in full_text:
        concentration = "Eau de Cologne"

    # 4. Accords
    accords = []
    # Accords are typically div blocks with class "accord-bar"
    accord_bars = soup.find_all(class_="accord-bar")
    if accord_bars:
        for bar in accord_bars:
            accord_name = bar.get_text(strip=True)
            style_str = bar.get("style", "")
            # Extract width: XX%
            width_match = re.search(r'width:\s*([\d\.]+)%', style_str)
            val = int(float(width_match.group(1))) if width_match else 100
            if accord_name:
                accords.append({
                    "name": accord_name,
                    "value": val,
                    "color": get_accord_color(accord_name)
                })
    else:
        # Fallback: search for style sheets or grid elements
        for bar in soup.find_all("div", style=lambda s: s and "width" in s and "background" in s):
            text = bar.get_text(strip=True)
            # Limit accord names to short words
            if text and len(text) < 20 and not text.isdigit() and any(k in text.lower() for k in ["woody", "citrus", "amber", "spicy", "floral", "sweet", "vanilla", "musk", "fresh", "powdery"]):
                style_str = bar.get("style", "")
                width_match = re.search(r'width:\s*([\d\.]+)%', style_str)
                val = int(float(width_match.group(1))) if width_match else 100
                accords.append({
                    "name": text,
                    "value": val,
                    "color": get_accord_color(text)
                })

    # 5. Notes Pyramid (Top, Middle, Base)
    notes = {"top": [], "middle": [], "base": []}
    
    # In Fragrantica pages, notes are grouped by:
    # Top Notes, Middle/Heart Notes, Base Notes
    # We look for containers containing note links: a[href*="/notes/"]
    pyramid_div = soup.find(id="pyramid") or soup.find(class_="pyramid")
    
    if pyramid_div:
        # Parse based on structure
        tiers = pyramid_div.find_all("div", recursive=False)
        # Try to map them (top, middle, base)
        tier_keys = ["top", "middle", "base"]
        for i, tier in enumerate(tiers[:3]):
            key = tier_keys[i]
            note_links = tier.find_all("a", href=lambda h: h and "/notes/" in h)
            for link in note_links:
                note_name = link.get_text(strip=True)
                if note_name and note_name not in notes[key]:
                    notes[key].append(note_name)
    
    # Dynamic header check fallback if ID pyramid didn't parse perfectly
    if not (notes["top"] or notes["middle"] or notes["base"]):
        # Find all note links
        all_note_links = soup.find_all("a", href=lambda h: h and "/notes/" in h)
        # Put all discovered notes into top notes by default
        for link in all_note_links:
            note_name = link.get_text(strip=True)
            # Filter out numbers and garbage
            if note_name and not note_name.isdigit() and len(note_name) < 25:
                if note_name not in notes["top"]:
                    notes["top"].append(note_name)

    # 6. Season and Time of Day (Often rendered dynamically via Canvas, so fallback prompt is vital)
    # We will try to parse voting percentages if they exist in the HTML
    seasons = {"spring": 25, "summer": 25, "autumn": 25, "winter": 25}
    timeOfDay = {"day": 50, "night": 50}
    
    # Try parsing text votes for seasons
    # "spring", "summer", "winter", "autumn" values
    season_elements = soup.find_all(class_=lambda c: c and any(s in c.lower() for s in ["season", "winter", "spring", "summer", "autumn"]))
    parsed_seasons = False
    
    # If the user saved a fully rendered page, we can inspect text distributions
    # Since class-based selectors change, let's ask the user if they'd like to manually input metrics or accept smart defaults
    print(f"\n--- Scraped Fragrance Profile ---")
    print(f"Brand: {brand}")
    print(f"Name: {name}")
    print(f"Concentration: {concentration}")
    print(f"Gender Suitability: {gender}")
    print(f"Accords Found: {', '.join([a['name'] for a in accords]) if accords else 'None'}")
    print(f"Top Notes Found: {', '.join(notes['top']) if notes['top'] else 'None'}")
    print(f"Middle Notes Found: {', '.join(notes['middle']) if notes['middle'] else 'None'}")
    print(f"Base Notes Found: {', '.join(notes['base']) if notes['base'] else 'None'}")
    
    # Interactive Prompts for Season and Time of Day (as Fragrantica's charts are heavily canvas-based and dynamic)
    print("\nBecause Fragrantica's Season, Time of Day, and Performance charts are rendered dynamically,")
    print("please verify/input these values below (Press Enter to keep defaults):")
    
    try:
        sp = input("Spring Suitability % [default 25]: ").strip()
        su = input("Summer Suitability % [default 25]: ").strip()
        au = input("Autumn Suitability % [default 25]: ").strip()
        wi = input("Winter Suitability % [default 25]: ").strip()
        
        seasons["spring"] = int(sp) if sp.isdigit() else 25
        seasons["summer"] = int(su) if su.isdigit() else 25
        seasons["autumn"] = int(au) if au.isdigit() else 25
        seasons["winter"] = int(wi) if wi.isdigit() else 25
        
        day_val = input("Daytime Suitability % [default 50]: ").strip()
        timeOfDay["day"] = int(day_val) if day_val.isdigit() else 50
        timeOfDay["night"] = 100 - timeOfDay["day"]
        
        longevity = input("Longevity (Weak, Moderate, Long Lasting, Eternal) [default Moderate]: ").strip()
        if longevity not in ["Weak", "Moderate", "Long Lasting", "Eternal"]:
            longevity = "Moderate"
            
        sillage = input("Sillage (Intimate, Moderate, Strong, Enormous) [default Moderate]: ").strip()
        if sillage not in ["Intimate", "Moderate", "Strong", "Enormous"]:
            sillage = "Moderate"
            
    except (KeyboardInterrupt, SystemExit):
        print("\nUsing default values for season and performance.")
        longevity = "Moderate"
        sillage = "Moderate"

    # Structure perfume object
    perfume_id = f"scraped-{re.sub(r'[^a-z0-9]', '-', (brand + '-' + name).lower())}-{int(os.path.getmtime(sys.argv[1])) if os.path.exists(sys.argv[1]) else 1}"
    
    return {
        "id": perfume_id,
        "name": name,
        "brand": brand,
        "concentration": concentration,
        "gender": gender,
        "image": image_url,
        "accords": accords if accords else [{"name": "Fresh", "value": 80, "color": "#55efc4"}],
        "seasons": seasons,
        "timeOfDay": timeOfDay,
        "notes": notes,
        "longevity": longevity,
        "sillage": sillage
    }

def main():
    parser = argparse.ArgumentParser(description="Scrape and extract Fragrantica perfume profiles to ScentSpace JSON.")
    parser.add_argument("source", help="Fragrantica URL or a path to a saved local HTML file")
    parser.add_argument("-o", "--output", help="Output JSON filename (default: custom_perfume.json)")
    
    args = parser.parse_args()
    
    html_content = ""
    
    # Check if source is a local file
    if os.path.exists(args.source):
        print(f"Reading from local file: {args.source}...")
        with open(args.source, "r", encoding="utf-8") as f:
            html_content = f.read()
    else:
        # Source must be a URL
        print(f"Fetching URL: {args.source}...")
        req = Request(
            args.source,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        )
        try:
            with urlopen(req, timeout=10) as response:
                html_content = response.read().decode('utf-8')
        except HTTPError as e:
            if e.code == 403:
                print("\nError: Access Forbidden (403). Fragrantica's Cloudflare protection blocked the scraper.")
                print("To bypass this:")
                print(" 1. Open the URL in your web browser.")
                print(" 2. Right-click and select 'Save Page As...' (save as 'fragrance.html').")
                print(f" 3. Run: python3 scraper.py fragrance.html")
            else:
                print(f"HTTP Error: {e.code} - {e.reason}")
            sys.exit(1)
        except URLError as e:
            print(f"Connection Error: {e.reason}")
            sys.exit(1)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            sys.exit(1)
            
    # Parse HTML content
    try:
        perfume_data = parse_html(html_content)
        
        # Output filename
        output_file = args.output
        if not output_file:
            safe_name = re.sub(r'[^a-zA-Z0-9]', '_', perfume_data['name'].lower())
            output_file = f"{safe_name}.json"
            
        # Write to JSON file
        # We wrap it in a list so the import handler can parse it as a batch directly
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump([perfume_data], f, indent=2)
            
        print(f"\n[Success] Profile saved to {output_file}!")
        print("To load this fragrance into ScentSpace:")
        print("  1. Open ScentSpace in your browser.")
        print("  2. In the sidebar, click 'Import JSON'.")
        print(f"  3. Select the file '{output_file}'.")
        
    except Exception as e:
        print(f"Error parsing page content: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
