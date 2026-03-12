with open("js/systems/TechManager.js", "r") as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if "global" in line:
            print(f"Line {i+1}: {line.strip()}")

print("====================")
with open("main.js", "r") as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if "global" in line:
            print(f"Line {i+1}: {line.strip()}")
