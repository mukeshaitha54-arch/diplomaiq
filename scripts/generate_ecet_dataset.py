import csv
import json
import random

random.seed(42)

colleges = [
    {"code": "OUCE", "name": "Osmania University College of Engineering", "tier": 1},
    {"code": "JNTH", "name": "JNTUH College of Engineering Hyderabad", "tier": 1},
    {"code": "CBIT", "name": "Chaitanya Bharathi Institute of Technology", "tier": 1.2},
    {"code": "VASE", "name": "Vasavi College of Engineering", "tier": 1.5},
    {"code": "VNRV", "name": "VNR Vignana Jyothi Institute of Engineering and Technology", "tier": 1.8},
    {"code": "GRET", "name": "Gokaraju Rangaraju Institute of Engineering and Technology", "tier": 2.2},
    {"code": "MGIT", "name": "Mahatma Gandhi Institute of Technology", "tier": 2.8},
    {"code": "KUCW", "name": "Kakatiya University", "tier": 3.0},
    {"code": "ANUR", "name": "Anurag University", "tier": 3.5},
    {"code": "KMIT", "name": "Keshav Memorial Institute of Technology", "tier": 4.0},
    {"code": "CVRH", "name": "CVR College of Engineering", "tier": 4.5},
    {"code": "BVRIT", "name": "BV Raju Institute of Technology", "tier": 5.0},
    {"code": "GNTW", "name": "G. Narayanamma Institute of Technology and Science", "tier": 5.5}, 
    {"code": "CMRK", "name": "CMR College of Engineering and Technology", "tier": 6.5},
    {"code": "CMRG", "name": "CMR Technical Campus", "tier": 8.0},
    {"code": "MREC", "name": "Malla Reddy Engineering College", "tier": 8.5},
    {"code": "MRIT", "name": "Malla Reddy Institute of Technology", "tier": 10.0},
    {"code": "VJIT", "name": "Vidya Jyothi Institute of Technology", "tier": 11.0},
    {"code": "MLRD", "name": "MLR Institute of Technology", "tier": 12.0},
    {"code": "MLRS", "name": "MLR Institute of Technology and Management", "tier": 13.0},
    {"code": "IARE", "name": "Institute of Aeronautical Engineering", "tier": 14.0},
    {"code": "SNIS", "name": "Sreenidhi Institute of Science and Technology", "tier": 15.0},
    {"code": "NGIT", "name": "Neil Gogte Institute of Technology", "tier": 16.0},
    {"code": "GCTC", "name": "Geethanjali College of Engineering", "tier": 18.0},
    {"code": "MHVR", "name": "Mahaveer Institute of Science and Technology", "tier": 20.0},
    {"code": "GNIT", "name": "Gurunanak Institute of Technology", "tier": 22.0},
    {"code": "AVIH", "name": "Avanthi Institute of Engineering", "tier": 25.0},
    {"code": "TKRC", "name": "TKR College of Engineering", "tier": 28.0},
    {"code": "METH", "name": "Methodist College of Engineering", "tier": 32.0},
    {"code": "HITM", "name": "Hyderabad Institute of Technology and Management", "tier": 35.0},
    {"code": "LRDS", "name": "Lords Institute of Engineering", "tier": 40.0}
]

branches = [
    {"code": "CSE", "popularity_mult": 1.0},
    {"code": "CSM", "popularity_mult": 1.2},
    {"code": "IT", "popularity_mult": 1.5},
    {"code": "ECE", "popularity_mult": 2.5},
    {"code": "EEE", "popularity_mult": 5.0},
    {"code": "CIV", "popularity_mult": 8.0},
    {"code": "MEC", "popularity_mult": 10.0}
]

categories = [
    {"name": "OC", "mult": 1.0},
    {"name": "BC-A", "mult": 2.5},
    {"name": "BC-B", "mult": 1.8},
    {"name": "BC-C", "mult": 3.0},
    {"name": "BC-D", "mult": 2.0},
    {"name": "BC-E", "mult": 3.5},
    {"name": "SC", "mult": 5.0},
    {"name": "ST", "mult": 6.0},
    {"name": "EWS", "mult": 1.3}
]

genders = ["General", "Female"]
years = [2023, 2024, 2025] # ADDED 2025
rounds = [1, 2]

dataset = []
base_rank = 5

for year in years:
    for r in rounds:
        for col in colleges:
            for branch in branches:
                for cat in categories:
                    for gen in genders:
                        
                        # Add some random variation between years and rounds
                        # E.g. ranks drop slightly in 2024, and drop again in 2025
                        if year == 2023: year_variation = 1.1
                        elif year == 2024: year_variation = 1.0
                        else: year_variation = 0.95 # Competition getting slightly tougher in 2025
                        
                        round_variation = 1.0 if r == 1 else 1.2
                        gen_mult = 1.2 if gen == "Female" else 1.0
                        
                        rank = base_rank * col["tier"] * branch["popularity_mult"] * cat["mult"] * gen_mult * year_variation * round_variation
                        
                        noise = random.uniform(0.85, 1.15)
                        final_rank = int(rank * noise)
                        
                        if col["code"] == "GNTW" and gen == "General":
                            continue 
                            
                        if final_rank > 25000:
                            if random.random() > 0.3:
                                continue
                            else:
                                final_rank = min(final_rank, 25000 + random.randint(0, 5000))
                                
                        if final_rank < 1: final_rank = 1

                        dataset.append({
                            "year": year,
                            "round": r,
                            "college_code": col["code"],
                            "branch_code": branch["code"],
                            "category": cat["name"],
                            "gender": gen,
                            "closing_rank": final_rank
                        })

# Save Updated Dataset
csv_file = "data/ecet_cutoffs.csv"
with open(csv_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["year", "round", "college_code", "branch_code", "category", "gender", "closing_rank"])
    writer.writeheader()
    writer.writerows(dataset)

# Forecasting 2026 logic
forecasts = []

# Group data by (college, branch, category, gender) to run trend analysis
# We will use only round 2 (final round) for forecasting to give the safest possible estimate
history = {}
for row in dataset:
    if row["round"] == 2:
        key = (row["college_code"], row["branch_code"], row["category"], row["gender"])
        if key not in history:
            history[key] = {}
        history[key][row["year"]] = row["closing_rank"]

for key, ranks in history.items():
    if len(ranks) < 3:
        # Require 2023, 2024, 2025 to make a confident forecast
        continue
        
    rank23 = ranks.get(2023)
    rank24 = ranks.get(2024)
    rank25 = ranks.get(2025)
    
    # Weighted historical modelling: 
    # 2025 has 50% weight, 2024 has 30% weight, 2023 has 20% weight
    predicted = int((rank25 * 0.5) + (rank24 * 0.3) + (rank23 * 0.2))
    
    # Calculate confidence based on variance (Standard deviation proxy)
    # If the trend is erratic, confidence drops.
    avg = (rank23 + rank24 + rank25) / 3
    variance_ratio = max(abs(rank25 - avg), abs(rank24 - avg), abs(rank23 - avg)) / avg if avg > 0 else 0
    
    # Base confidence 95%, reduce by variance percentage * 100
    confidence = max(0, min(99, 95 - (variance_ratio * 100)))
    
    forecasts.append({
        "year": 2026,
        "college_code": key[0],
        "branch_code": key[1],
        "category": key[2],
        "gender": key[3],
        "predicted_closing_rank": predicted,
        "confidence_score": round(confidence, 1),
        "methodology": "Weighted Historical Average (WHA) using 2023-2025 Final Phase Data"
    })

# Save Forecast Dataset
forecast_csv_file = "data/ecet_forecasts.csv"
with open(forecast_csv_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["year", "college_code", "branch_code", "category", "gender", "predicted_closing_rank", "confidence_score", "methodology"])
    writer.writeheader()
    writer.writerows(forecasts)
    
print(f"Generated {len(dataset)} historical records and {len(forecasts)} forecasts for 2026.")
