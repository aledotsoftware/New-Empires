with open("main.js", "r") as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if "typeof game" in line or "window.game" in line or "typeof soundManager" in line or "typeof saveManager" in line or "typeof dataLoader" in line:
            print(f"Line {i+1}: {line.strip()}")
