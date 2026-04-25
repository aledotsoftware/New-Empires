import json
import os
import glob

def check_assets():
    civ_files = glob.glob('assets/civilization/*.json')
    missing_assets = []

    for f in civ_files:
        with open(f, 'r') as file:
            data = json.load(file)
            icon = data.get('icon')
            if icon and not os.path.exists(icon):
                missing_assets.append(f"Civ {data.get('civilizationId')} missing icon: {icon}")

            # Check unique unit
            uu = data.get('uniqueUnit', {})
            if uu:
                uu_icon = uu.get('icon')
                if uu_icon and not os.path.exists(uu_icon):
                    missing_assets.append(f"Civ {data.get('civilizationId')} missing uu icon: {uu_icon}")

            # Check unit overrides
            uo = data.get('unitOverrides', {})
            for u_id, u_data in uo.items():
                u_icon = u_data.get('icon')
                if u_icon and not os.path.exists(u_icon):
                    missing_assets.append(f"Civ {data.get('civilizationId')} missing unit override icon ({u_id}): {u_icon}")

            # Check tech overrides
            to = data.get('technologyOverrides', {})
            for t_id, t_data in to.items():
                t_icon = t_data.get('icon')
                if t_icon and not os.path.exists(t_icon):
                    missing_assets.append(f"Civ {data.get('civilizationId')} missing tech override icon ({t_id}): {t_icon}")

            # Check building overrides
            bo = data.get('buildingOverrides', {})
            for b_id, b_data in bo.items():
                b_icon = b_data.get('icon')
                if b_icon and not os.path.exists(b_icon):
                    missing_assets.append(f"Civ {data.get('civilizationId')} missing building override icon ({b_id}): {b_icon}")

            # Check unique technologies
            ut = data.get('uniqueTechnologies', [])
            for ut_data in ut:
                ut_icon = ut_data.get('icon')
                if ut_icon and not os.path.exists(ut_icon):
                    missing_assets.append(f"Civ {data.get('civilizationId')} missing unique tech icon ({ut_data.get('id')}): {ut_icon}")

    for msg in missing_assets:
        print(msg)

if __name__ == '__main__':
    check_assets()
