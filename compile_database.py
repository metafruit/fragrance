import os
import json
import re
import csv
import pandas as pd

OUTPUT_FILE = "supabase_fragrances.csv"
INPUT_EXCEL = "perfume_database.xlsx"

def detect_concentration(name):
    name_lower = name.lower()
    if "eau de toilette" in name_lower or " edt" in name_lower:
        return "Eau de Toilette"
    elif "eau de parfum" in name_lower or " edp" in name_lower:
        return "Eau de Parfum"
    elif "extrait" in name_lower:
        return "Extrait de Parfum"
    elif "cologne" in name_lower or " edc" in name_lower:
        return "Eau de Cologne"
    elif "parfum" in name_lower:
        return "Parfum"
    else:
        return "Eau de Parfum"

def detect_gender(name, brand):
    name_lower = name.lower()
    brand_lower = brand.lower()
    
    men_keywords = ["pour homme", "for men", "uomo", "homme", "for him", "l'homme", "man", "gentleman"]
    women_keywords = ["pour femme", "for women", "donna", "femme", "for her", "la femme", "woman", "mademoiselle", "lady", "dame"]
    
    if "man made" in brand_lower:
        return "men"
        
    for kw in men_keywords:
        if kw in name_lower:
            return "men"
            
    for kw in women_keywords:
        if kw in name_lower:
            return "women"
            
    return "unisex"

def generate_seasons_from_accords(accords):
    scores = {"spring": 10, "summer": 10, "autumn": 10, "winter": 10}
    
    spring_accords = ["floral", "green", "fresh", "fruity", "citrus", "aromatic", "white floral", "yellow floral", "herbal", "rose", "violet", "iris"]
    summer_accords = ["citrus", "aquatic", "fresh", "marine", "tropical", "coconut", "fruity", "ozone"]
    autumn_accords = ["woody", "warm spicy", "amber", "leather", "patchouli", "smoky", "earthy", "animalic", "mossy"]
    winter_accords = ["amber", "sweet", "vanilla", "warm spicy", "cacao", "coffee", "leather", "woody", "balsamic", "honey", "powdery", "tobacco", "cinnamon"]
    
    for i, accord in enumerate(accords):
        weight = max(1, 5 - i)
        accord_lower = accord.lower()
        
        if any(x in accord_lower for x in spring_accords):
            scores["spring"] += weight * 15
        if any(x in accord_lower for x in summer_accords):
            scores["summer"] += weight * 15
        if any(x in accord_lower for x in autumn_accords):
            scores["autumn"] += weight * 15
        if any(x in accord_lower for x in winter_accords):
            scores["winter"] += weight * 15
            
    total = sum(scores.values())
    spring = round(scores["spring"] / total * 100)
    summer = round(scores["summer"] / total * 100)
    autumn = round(scores["autumn"] / total * 100)
    winter = 100 - (spring + summer + autumn)
    
    return {
        "spring": max(0, spring),
        "summer": max(0, summer),
        "autumn": max(0, autumn),
        "winter": max(0, winter)
    }

def generate_time_of_day_from_accords(accords):
    scores = {"day": 20, "night": 20}
    
    day_accords = ["citrus", "fresh", "green", "floral", "aquatic", "fruity", "marine", "white floral", "ozone", "herbal"]
    night_accords = ["amber", "warm spicy", "sweet", "vanilla", "leather", "smoky", "woody", "animalic", "tobacco", "patchouli", "cacao", "coffee", "balsamic"]
    
    for i, accord in enumerate(accords):
        weight = max(1, 5 - i)
        accord_lower = accord.lower()
        
        if any(x in accord_lower for x in day_accords):
            scores["day"] += weight * 15
        if any(x in accord_lower for x in night_accords):
            scores["night"] += weight * 15
            
    total = sum(scores.values())
    day = round(scores["day"] / total * 100)
    night = 100 - day
    
    return {
        "day": max(0, day),
        "night": max(0, night)
    }

def parse_excel_and_compile():
    print("=== ScentSpace Database Compiler ===")
    
    if not os.path.exists(INPUT_EXCEL):
        print(f"Error: {INPUT_EXCEL} not found. Please run the download first.")
        return
        
    print(f"[LOAD] Loading {INPUT_EXCEL}...")
    df = pd.read_excel(INPUT_EXCEL)
    print(f"[LOAD] Loaded {len(df)} rows.")
    
    total_fragrances = 0
    skipped_fragrances = 0
    
    with open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as f_out:
        writer = csv.writer(f_out, delimiter="|", quotechar='"', quoting=csv.QUOTE_MINIMAL)
        writer.writerow([
            "id", "name", "brand", "concentration", "gender", "image",
            "accords", "notes", "seasons", "time_of_day", "longevity", "sillage"
        ])
        
        for idx, row in df.iterrows():
            try:
                brand = str(row["brand"]).strip()
                name = str(row["perfume"]).strip()
                image_raw = str(row["image"]).strip()
                launch_year = row["launch_year"]
                accords_raw = row["main_accords"]
                notes_raw = row["notes"]
                longevity_raw = row["longevity"]
                sillage_raw = row["sillage"]
                
                # Skip invalid brand or name
                if not brand or not name or brand == "nan" or name == "nan":
                    skipped_fragrances += 1
                    continue
                
                # Generate unique ID from image digits, or slugify name/brand if no digits
                digits = re.findall(r"\d+", image_raw)
                if digits:
                    pid = digits[0]
                else:
                    # Fallback slug
                    slug = re.sub(r"[^a-z0-9]+", "-", f"{brand}-{name}".lower()).strip("-")
                    pid = f"{slug}-{idx}"
                    
                # Format Image URL
                image_url = ""
                if digits:
                    image_url = f"https://fimgs.net/images/perfume/nd.{digits[0]}.jpg"
                
                # Parse Accords
                accords_list = []
                if isinstance(accords_raw, str) and accords_raw.startswith("["):
                    acc_names = json.loads(accords_raw)
                    # Create descending value sequence: 100, 85, 70, 55, 40, 25...
                    for i, acc_name in enumerate(acc_names):
                        val = max(25, 100 - i * 15)
                        accords_list.append({
                            "name": acc_name.title(),
                            "value": val
                        })
                
                # Parse Notes
                notes_dict = {"top": [], "middle": [], "base": []}
                if isinstance(notes_raw, str):
                    if notes_raw.startswith("{"):
                        # JSON dict structure
                        raw_dict = json.loads(notes_raw)
                        notes_dict["top"] = [n.title() for n in raw_dict.get("top", [])]
                        notes_dict["middle"] = [n.title() for n in raw_dict.get("middle", [])]
                        notes_dict["base"] = [n.title() for n in raw_dict.get("base", [])]
                    elif notes_raw.startswith("["):
                        # Flat list structure - divide into top, middle, base pyramid
                        flat_list = json.loads(notes_raw)
                        n_len = len(flat_list)
                        if n_len > 0:
                            t_end = max(1, n_len // 3)
                            m_end = max(t_end + 1, 2 * n_len // 3)
                            notes_dict["top"] = [n.title() for n in flat_list[:t_end]]
                            notes_dict["middle"] = [n.title() for n in flat_list[t_end:m_end]]
                            notes_dict["base"] = [n.title() for n in flat_list[m_end:]]
                
                # Accords list in plain text to generate seasons & time of day
                acc_names_list = [a["name"] for a in accords_list]
                
                # Seasons
                seasons_json = generate_seasons_from_accords(acc_names_list)
                
                # Time of Day
                time_json = generate_time_of_day_from_accords(acc_names_list)
                
                # Longevity
                # Excel lists format: [poor, weak, moderate, long, eternal]
                longevity_json = {
                    "label": "Moderate",
                    "score": 3.0,
                    "distribution": {"poor": 0, "weak": 0, "moderate": 100, "long": 0, "eternal": 0}
                }
                if isinstance(longevity_raw, str) and longevity_raw.startswith("["):
                    long_votes = [int(v) for v in json.loads(longevity_raw)]
                    if len(long_votes) == 5:
                        poor_v, weak_v, mod_v, long_v, etern_v = long_votes
                        total_v = sum(long_votes)
                        if total_v > 0:
                            poor_pct = round((poor_v / total_v) * 100)
                            weak_pct = round((weak_v / total_v) * 100)
                            mod_pct = round((mod_v / total_v) * 100)
                            long_pct = round((long_v / total_v) * 100)
                            etern_pct = 100 - (poor_pct + weak_pct + mod_pct + long_pct)
                            
                            score = round((poor_v * 1 + weak_v * 2 + mod_v * 3 + long_v * 4 + etern_v * 5) / total_v, 1)
                            
                            votes_list = [("Very Weak", poor_v), ("Weak", weak_v), ("Moderate", mod_v), ("Long Lasting", long_v), ("Eternal", etern_v)]
                            label = max(votes_list, key=lambda x: x[1])[0]
                            
                            longevity_json = {
                                "label": label,
                                "score": score,
                                "distribution": {
                                    "poor": max(0, poor_pct),
                                    "weak": max(0, weak_pct),
                                    "moderate": max(0, mod_pct),
                                    "long": max(0, long_pct),
                                    "eternal": max(0, etern_pct)
                                }
                            }
                
                # Sillage
                # Excel lists format: [intimate, moderate, strong, enormous]
                sillage_json = {
                    "label": "Moderate",
                    "score": 3.0,
                    "distribution": {"intimate": 0, "moderate": 100, "strong": 0, "enormous": 0}
                }
                if isinstance(sillage_raw, str) and sillage_raw.startswith("["):
                    sil_votes = [int(v) for v in json.loads(sillage_raw)]
                    if len(sil_votes) == 4:
                        int_v, mod_sil_v, strong_v, enorm_v = sil_votes
                        total_sil_v = sum(sil_votes)
                        if total_sil_v > 0:
                            int_pct = round((int_v / total_sil_v) * 100)
                            mod_sil_pct = round((mod_sil_v / total_sil_v) * 100)
                            strong_pct = round((strong_v / total_sil_v) * 100)
                            enorm_pct = 100 - (int_pct + mod_sil_pct + strong_pct)
                            
                            # scale 1-4 to 1-5 score: 1.25, 2.5, 3.75, 5.0
                            score = round((int_v * 1.25 + mod_sil_v * 2.5 + strong_v * 3.75 + enorm_v * 5.0) / total_sil_v, 1)
                            
                            votes_list = [("Intimate", int_v), ("Moderate", mod_sil_v), ("Strong", strong_v), ("Enormous", enorm_v)]
                            label = max(votes_list, key=lambda x: x[1])[0]
                            
                            sillage_json = {
                                "label": label,
                                "score": score,
                                "distribution": {
                                    "intimate": max(0, int_pct),
                                    "moderate": max(0, mod_sil_pct),
                                    "strong": max(0, strong_pct),
                                    "enormous": max(0, enorm_pct)
                                }
                            }
                            
                # Concentration
                concentration = detect_concentration(name)
                
                # Gender
                gender = detect_gender(name, brand)
                
                # Write flat denormalized CSV row
                writer.writerow([
                    pid,
                    name,
                    brand,
                    concentration,
                    gender,
                    image_url,
                    json.dumps(accords_list),
                    json.dumps(notes_dict),
                    json.dumps(seasons_json),
                    json.dumps(time_json),
                    json.dumps(longevity_json),
                    json.dumps(sillage_json)
                ])
                
                total_fragrances += 1
                if total_fragrances % 5000 == 0:
                    print(f"Processed {total_fragrances} fragrances...")
                    
            except Exception as e:
                skipped_fragrances += 1
                
    print(f"[COMPLETE] Done compiling database!")
    print(f"Total compiled fragrances written to CSV: {total_fragrances}")
    print(f"Skipped rows: {skipped_fragrances}")
    print(f"Output CSV saved at: {OUTPUT_FILE}")

if __name__ == "__main__":
    parse_excel_and_compile()
