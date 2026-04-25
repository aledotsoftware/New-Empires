import json
import os
import glob

# Add technology overrides to those missing them
tech_overrides = {
    "ottomans": {
        "blacksmith": {
            "name": "Gunpowder Mastery",
            "icon": "assets/icons/tech_military.png",
            "description": "Advanced gunpowder weapons"
        }
    },
    "argentinians": {
        "cavalry_tactics": {
            "name": "Gaucho Horsemanship",
            "icon": "assets/icons/tech_military.png",
            "description": "Advanced riding skills"
        }
    },
    "romans": {
        "architecture": {
            "name": "Roman Engineering",
            "icon": "assets/icons/tech_defense.png",
            "description": "Mastery of concrete and arches"
        }
    },
    "vikings": {
        "sailing": {
            "name": "Longship Navigation",
            "icon": "assets/icons/tech_economy.png",
            "description": "Mastery of the seas"
        }
    },
    "incas": {
        "masonry": {
            "name": "Ashlar Masonry",
            "icon": "assets/icons/tech_defense.png",
            "description": "Perfect stone fitting without mortar"
        }
    },
    "chinese": {
        "chemistry": {
            "name": "Gunpowder Discovery",
            "icon": "assets/icons/science.png",
            "description": "Early explosive powders"
        }
    }
}

# Add unit overrides to those missing them
unit_overrides = {
    "caliphate": {
        "warrior": {
            "name": "Ghulam",
            "icon": "assets/icons/warrior.png",
            "description": "Slave soldiers of the Caliphate"
        }
    },
    "spain": {
        "warrior": {
            "name": "Conquistador",
            "icon": "assets/icons/warrior.png",
            "description": "Spanish explorer and soldier"
        }
    },
    "babylon": {
        "villager": {
            "name": "Babylonian Builder",
            "icon": "assets/icons/villager.png",
            "description": "Skilled worker of Mesopotamia"
        }
    },
    "byzantium": {
        "warrior": {
            "name": "Cataphract",
            "icon": "assets/icons/warrior.png",
            "description": "Heavily armored cavalry"
        }
    },
    "egypt": {
        "villager": {
            "name": "Fellah",
            "icon": "assets/icons/villager.png",
            "description": "Egyptian farmer and laborer"
        }
    },
    "sumeria": {
        "villager": {
            "name": "Sumerian Farmer",
            "icon": "assets/icons/villager.png",
            "description": "Early agricultural worker"
        }
    },
    "greece": {
        "warrior": {
            "name": "Hoplite",
            "icon": "assets/icons/warrior.png",
            "description": "Greek citizen-soldier"
        }
    },
    "persia": {
        "warrior": {
            "name": "Immortal",
            "icon": "assets/icons/warrior.png",
            "description": "Elite heavy infantry of Persia"
        }
    }
}


for civ_id in tech_overrides:
    file_path = f"assets/civilization/{civ_id}.json"
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            civ_json = json.load(f)

        civ_json["technologyOverrides"] = tech_overrides[civ_id]

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(civ_json, f, indent=4, ensure_ascii=False)
            f.write('\n')

for civ_id in unit_overrides:
    file_path = f"assets/civilization/{civ_id}.json"
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            civ_json = json.load(f)

        civ_json["unitOverrides"] = unit_overrides[civ_id]

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(civ_json, f, indent=4, ensure_ascii=False)
            f.write('\n')
