import re

with open("index.html", "r") as f:
    html = f.read()

# Make selectedCivilization and startGame available globally for Playwright
if "window.startGame = startGame;" not in html:
    html = html.replace("function startGame(", "window.startGame = startGame;\nfunction startGame(")

with open("index.html", "w") as f:
    f.write(html)
