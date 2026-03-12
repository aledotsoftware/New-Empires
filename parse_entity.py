with open("js/entities/Entity.js", "r") as f:
    lines = f.readlines()
    found = False
    for i, line in enumerate(lines):
        if "getTeamColor()" in line or "getTeamColor {" in line or "getTeamColor() {" in line:
            for j in range(i-2, i+15):
                print(lines[j-1].rstrip())
