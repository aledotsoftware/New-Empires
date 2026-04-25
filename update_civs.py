import json
import os
import glob

# Defines the lore and campaign seeds for each civ
civ_data = {
    "mongols": {
        "lore": "Nomads of the vast steppes, the Mongols are born in the saddle. Their mastery of horse archery and mobility makes them a terrifying force that strikes like lightning.",
        "campaignSeed": "Unify the divided tribes under a single banner and sweep across the continent, adapting to the warfare of sedentary empires while maintaining nomadic speed."
    },
    "sumeria": {
        "lore": "The cradle of civilization. Sumerians built the first cities, invented writing, and mastered agriculture between the great rivers.",
        "campaignSeed": "Defend the fertile crescent from raiding barbarians, establish the first written laws, and build monuments that will touch the heavens."
    },
    "romans": {
        "lore": "Disciplined and relentless, the Roman Empire expands through superior engineering, unyielding legions, and brilliant logistics.",
        "campaignSeed": "Expand the borders of the Republic against Gaulish tribes and Carthaginian rivals, laying down roads and fortresses to secure the Pax Romana."
    },
    "vikings": {
        "lore": "Fierce seafarers and warriors from the frozen north. They raid coastal settlements with devastating speed before disappearing back into the sea.",
        "campaignSeed": "Lead a great heathen army to conquer foreign shores, establishing earldoms and plundering riches to win the favor of the gods."
    },
    "argentinians": {
        "lore": "A proud nation emerging from the vast Pampas, excelling in cavalry and agricultural resilience during their fight for independence.",
        "campaignSeed": "Lead the independence movement across the Andes, utilizing guerrilla cavalry tactics to liberate the continent from colonial rule."
    },
    "babylon": {
        "lore": "A jewel of the ancient world, Babylon is a center of science, astronomy, and monumental architecture like the Hanging Gardens.",
        "campaignSeed": "Rebuild the glorious empire, outsmarting rival Mesopotamian city-states through advanced technology, diplomacy, and impenetrable walls."
    },
    "byzantium": {
        "lore": "The surviving eastern half of the Roman Empire, boasting impregnable walls, heavy cataphracts, and cunning diplomacy.",
        "campaignSeed": "Hold the line against relentless sieges from multiple fronts, preserving the light of antiquity in the impregnable city of Constantinople."
    },
    "caliphate": {
        "lore": "A vast network of trade, science, and faith spanning deserts and oases. They excel in rapid expansion and economic prosperity.",
        "campaignSeed": "Unite the desert tribes, establish lucrative trade routes, and protect the golden age of science and culture from external crusades."
    },
    "egypt": {
        "lore": "Children of the Nile, builders of the eternal pyramids. A civilization blessed with immense wealth and divine rulership.",
        "campaignSeed": "Unify Upper and Lower Egypt, command the annual floods for agricultural supremacy, and construct monuments to guarantee immortality."
    },
    "greece": {
        "lore": "A coalition of fiercely independent city-states, bound by shared culture, Olympic traditions, and heavily armored hoplites.",
        "campaignSeed": "Repel the massive invasions of eastern empires through tactical superiority, then spread Hellenic culture across the known world."
    },
    "persia": {
        "lore": "An expansive empire of kings, combining the strengths of countless conquered nations into a massive, diverse military machine.",
        "campaignSeed": "Build an empire that spans from the Mediterranean to the Indus, utilizing vast wealth to assemble the immortal guard and crush any rebellion."
    },
    "spain": {
        "lore": "Masters of the seas and exploration, driven by faith and the promise of untold riches in uncharted territories.",
        "campaignSeed": "Complete the Reconquista, then set sail into the unknown to establish a global empire built on naval dominance and gunpowder."
    },
    "incas": {
        "lore": "The children of the sun, rulers of the harsh Andes mountains. They built an empire connected by an incredible network of roads and stone fortresses.",
        "campaignSeed": "Expand the Tawantinsuyu through diplomacy and military might, adapting to the high altitudes and fortifying the mountain passes."
    },
    "chinese": {
        "lore": "An ancient and enduring civilization, pioneers of gunpowder, paper, and monumental defenses like the Great Wall.",
        "campaignSeed": "Defend the Middle Kingdom from northern invaders, centralize power, and revolutionize warfare with early gunpowder technology."
    },
    "ottomans": {
        "lore": "A rising gunpowder empire that straddles the crossroads of the world, fielding elite Janissaries and devastating siege artillery.",
        "campaignSeed": "Transition from nomadic ghazis to a sedentary empire, breaching the walls of the world's greatest cities with revolutionary cannons."
    }
}

for civ_id, data in civ_data.items():
    file_path = f"assets/civilization/{civ_id}.json"
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            civ_json = json.load(f)

        civ_json["lore"] = data["lore"]
        civ_json["campaignSeed"] = data["campaignSeed"]

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(civ_json, f, indent=4, ensure_ascii=False)
            f.write('\n')
        print(f"Updated {civ_id}")
    else:
        print(f"File not found: {file_path}")
