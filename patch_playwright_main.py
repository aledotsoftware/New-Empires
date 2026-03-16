import re

with open("main.js", "r") as f:
    js = f.read()

# Make selectedCivilization and startGame available globally for Playwright
if "window.startGame = startGame;" not in js:
    js = js.replace("function startGame(", "window.startGame = startGame;\nfunction startGame(")

if "window.game = game;" not in js:
    js = js.replace("game = new Game(civId, mapConfig);", "game = new Game(civId, mapConfig);\n    window.game = game;")

with open("main.js", "w") as f:
    f.write(js)
