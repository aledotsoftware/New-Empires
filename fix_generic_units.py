import json
import os

generic_icons = {
    'unit': 'assets/icons/villager.png',
    'warrior': 'assets/icons/warrior.png',
    'archer': 'assets/icons/archer.png',
    'cavalry': 'assets/icons/villager.png', # default missing fallback
    'ship': 'assets/icons/villager.png',
    'building': 'assets/icons/build.png',
    'house': 'assets/icons/house.png',
    'townCenter': 'assets/icons/townCenter.png',
    'barracks': 'assets/icons/barracks.png',
    'market': 'assets/icons/market.png',
    'temple': 'assets/icons/temple.png',
    'workshop': 'assets/icons/workshop.png',
    'farm': 'assets/icons/house.png',
    'lumberCamp': 'assets/icons/workshop.png',
    'miningCamp': 'assets/icons/workshop.png',
    'tech': 'assets/icons/tech.png',
    'science': 'assets/icons/science.png'
}

files_to_fix = ['assets/technologies/base_units.json', 'assets/technologies/base_buildings.json', 'assets/technologies/base_technologies.json']

for f in files_to_fix:
    with open(f, 'r', encoding='utf-8') as file:
        data = json.load(file)

    updated = False

    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, dict):
                icon = value.get('icon')
                if icon and not os.path.exists(icon):
                    if 'base_units' in f:
                        if 'cavalry' in key.lower() or 'jinete' in key.lower() or 'caballeria' in key.lower() or 'scout' in key.lower():
                            data[key]['icon'] = generic_icons['cavalry']
                        elif 'ship' in key.lower() or 'carabela' in key.lower():
                            data[key]['icon'] = generic_icons['ship']
                        else:
                            data[key]['icon'] = generic_icons['unit']
                    elif 'base_buildings' in f:
                        if 'farm' in key.lower():
                            data[key]['icon'] = generic_icons['farm']
                        elif 'lumber' in key.lower():
                            data[key]['icon'] = generic_icons['lumberCamp']
                        elif 'mining' in key.lower() or 'gold' in key.lower():
                            data[key]['icon'] = generic_icons['miningCamp']
                        else:
                            data[key]['icon'] = generic_icons['building']
                    elif 'base_technologies' in f:
                        if 'gold' in key.lower():
                            data[key]['icon'] = 'assets/icons/gold.png'
                        else:
                            data[key]['icon'] = generic_icons['tech']
                    updated = True

    if updated:
        with open(f, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
            file.write('\n')
        print(f"Updated icons for {f}")
