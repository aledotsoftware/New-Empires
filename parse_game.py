with open("js/entities/Entity.js", "r") as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if "window.game" in line:
            print(f"Line {i+1}: {line.strip()}")
