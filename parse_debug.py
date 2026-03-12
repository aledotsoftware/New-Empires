with open("js/utils/DebugLogger.js", "r") as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
        if "window.debugLogger" in line:
            for j in range(i-2, i+5):
                print(lines[j-1].rstrip())
