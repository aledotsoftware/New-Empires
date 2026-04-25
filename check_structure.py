import json
import glob

def check_structure():
    civ_files = glob.glob('assets/civilization/*.json')

    for f in civ_files:
        with open(f, 'r') as file:
            data = json.load(file)
            missing = []
            for key in ['description', 'lore', 'campaignSeed', 'uniqueUnit', 'uniqueTechnologies', 'buildingOverrides', 'technologyOverrides', 'unitOverrides']:
                if key not in data or not data[key]:
                    missing.append(key)
            print(f"{data.get('civilizationId')}: missing {', '.join(missing)}")

if __name__ == '__main__':
    check_structure()
