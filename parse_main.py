import re
with open("main.js", "r") as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if re.search(r"typeof\s+\w+", line):
            print(f"Line {i+1}: {line.strip()}")
