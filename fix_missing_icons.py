import json
import os
import glob
import shutil

# Make sure all icons exist, if not, create generic ones or point to existing ones
# the easiest way is to rewrite the json to point to an existing icon

generic_icons = {
    'unit': 'assets/icons/villager.png', # default
    'warrior': 'assets/icons/warrior.png',
    'archer': 'assets/icons/archer.png',
    'building': 'assets/icons/build.png',
    'house': 'assets/icons/house.png',
    'townCenter': 'assets/icons/townCenter.png',
    'barracks': 'assets/icons/barracks.png',
    'market': 'assets/icons/market.png',
    'temple': 'assets/icons/temple.png',
    'workshop': 'assets/icons/workshop.png',
    'tech': 'assets/icons/tech.png',
    'science': 'assets/icons/science.png'
}

def ensure_icon(icon_path, fallback_type):
    if not icon_path: return generic_icons.get(fallback_type, generic_icons['tech'])
    if os.path.exists(icon_path): return icon_path

    # Just fall back to a generic icon if it doesn't exist
    return generic_icons.get(fallback_type, generic_icons['tech'])

civ_files = glob.glob('assets/civilization/*.json')

for f in civ_files:
    with open(f, 'r', encoding='utf-8') as file:
        data = json.load(file)

    updated = False

    icon = data.get('icon')
    if icon and not os.path.exists(icon):
        data['icon'] = 'assets/icons/population.png'
        updated = True

    uu = data.get('uniqueUnit', {})
    if uu:
        uu_icon = uu.get('icon')
        if uu_icon and not os.path.exists(uu_icon):
            base_unit = uu.get('baseUnit', 'warrior')
            data['uniqueUnit']['icon'] = ensure_icon(None, base_unit)
            updated = True

    uo = data.get('unitOverrides', {})
    for u_id, u_data in uo.items():
        u_icon = u_data.get('icon')
        if u_icon and not os.path.exists(u_icon):
            data['unitOverrides'][u_id]['icon'] = ensure_icon(None, u_id)
            updated = True

    to = data.get('technologyOverrides', {})
    for t_id, t_data in to.items():
        t_icon = t_data.get('icon')
        if t_icon and not os.path.exists(t_icon):
            data['technologyOverrides'][t_id]['icon'] = ensure_icon(None, 'tech')
            updated = True

    bo = data.get('buildingOverrides', {})
    for b_id, b_data in bo.items():
        b_icon = b_data.get('icon')
        if b_icon and not os.path.exists(b_icon):
            data['buildingOverrides'][b_id]['icon'] = ensure_icon(None, b_id)
            updated = True

    ut = data.get('uniqueTechnologies', [])
    for idx, ut_data in enumerate(ut):
        ut_icon = ut_data.get('icon')
        if ut_icon and not os.path.exists(ut_icon):
            data['uniqueTechnologies'][idx]['icon'] = ensure_icon(None, 'tech')
            updated = True

    if updated:
        with open(f, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
            file.write('\n')
        print(f"Updated icons for {data.get('civilizationId')}")
