const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const replacements = [
    // We already removed `onclick` successfully, but let's replace the whole tag including what it originally had.
    // This script will operate on the ORIGINAL file.
    ['<button id="techTreeButton" class="btn-secondary" onclick="showTechTree()">', '<button id="techTreeButton" class="btn-secondary">'],
    ['<button id="settingsButtonStart" class="btn-secondary" onclick="showSettings()">', '<button id="settingsButtonStart" class="btn-secondary">'],
    ['<button class="btn-close" onclick="hideTechTree()" aria-label="Cerrar">✕</button>', '<button id="closeTechTreeBtn" class="btn-close" aria-label="Cerrar">✕</button>'],
    ['<button id="pauseButton" class="btn-icon-top" onclick="togglePauseGame()" title="Pausar (P)">', '<button id="pauseButton" class="btn-icon-top" title="Pausar (P)">'],
    ['<button id="helpButton" class="btn-icon-top" onclick="showShortcuts()" title="Controles (H)">', '<button id="helpButton" class="btn-icon-top" title="Controles (H)">'],
    ['<button id="settingsButton" class="btn-icon-top" onclick="showSettings()" title="Ajustes (Esc)">', '<button id="settingsButton" class="btn-icon-top" title="Ajustes (Esc)">'],
    ['<button class="btn-close" onclick="closeBuildMenu()" aria-label="Cerrar">✕</button>', '<button id="closeBuildMenuBtn" class="btn-close" aria-label="Cerrar">✕</button>'],
    ['<button class="btn-close" onclick="hideSettings()" aria-label="Cerrar">✕</button>', '<button id="closeSettingsBtn" class="btn-close" aria-label="Cerrar">✕</button>'],
    ['<button id="soundToggleBtn" class="toggle-btn" onclick="toggleSound()">', '<button id="soundToggleBtn" class="toggle-btn">'],
    ['<button class="stepper-btn" onclick="adjustRange(\'volumeSlider\', -1)"', '<button id="volumeDecBtn" class="stepper-btn"'],
    ['<input type="range" id="volumeSlider" min="0" max="100" value="50"\n                            oninput="updateSoundVolume(this.value)">', '<input type="range" id="volumeSlider" min="0" max="100" value="50">'],
    ['<button class="stepper-btn" onclick="adjustRange(\'volumeSlider\', 1)"', '<button id="volumeIncBtn" class="stepper-btn"'],
    ['<button id="gridToggleBtn" class="toggle-btn active" onclick="toggleGrid()">', '<button id="gridToggleBtn" class="toggle-btn active">'],
    ['<button id="idleVillagerToggleBtn" class="toggle-btn active" onclick="toggleIdleVillagerCycle()">', '<button id="idleVillagerToggleBtn" class="toggle-btn active">'],
    ['<button class="stepper-btn" onclick="adjustRange(\'cursorSizeSlider\', -1)"', '<button id="cursorDecBtn" class="stepper-btn"'],
    ['<input type="range" id="cursorSizeSlider" min="16" max="48" step="4" value="32"\n                            oninput="updateCursorSize(this.value)">', '<input type="range" id="cursorSizeSlider" min="16" max="48" step="4" value="32">'],
    ['<button class="stepper-btn" onclick="adjustRange(\'cursorSizeSlider\', 1)"', '<button id="cursorIncBtn" class="stepper-btn"'],
    ['<button class="stepper-btn" onclick="adjustRange(\'cameraSpeedSlider\', -1)"', '<button id="cameraSpeedDecBtn" class="stepper-btn"'],
    ['<input type="range" id="cameraSpeedSlider" min="200" max="1500" step="50" value="800"\n                            oninput="updateCameraSpeed(this.value)">', '<input type="range" id="cameraSpeedSlider" min="200" max="1500" step="50" value="800">'],
    ['<button class="stepper-btn" onclick="adjustRange(\'cameraSpeedSlider\', 1)"', '<button id="cameraSpeedIncBtn" class="stepper-btn"'],
    ['<button class="stepper-btn" onclick="adjustRange(\'cameraMarginSlider\', -1)"', '<button id="cameraMarginDecBtn" class="stepper-btn"'],
    ['<input type="range" id="cameraMarginSlider" min="10" max="100" step="5" value="30"\n                            oninput="updateCameraMargin(this.value)">', '<input type="range" id="cameraMarginSlider" min="10" max="100" step="5" value="30">'],
    ['<button class="stepper-btn" onclick="adjustRange(\'cameraMarginSlider\', 1)"', '<button id="cameraMarginIncBtn" class="stepper-btn"'],
    ['<button id="copySeedBtn" class="btn-icon-small" onclick="copyMapSeed()"', '<button id="copySeedBtn" class="btn-icon-small"'],
    ['<button id="saveGameBtn" class="btn-secondary" onclick="saveGame()">', '<button id="saveGameBtn" class="btn-secondary">'],
    ['<button id="loadGameBtn" class="btn-secondary" onclick="loadGame()">', '<button id="loadGameBtn" class="btn-secondary">'],
    ['<button id="exportGameBtn" class="btn-secondary" onclick="exportGameToFile()">', '<button id="exportGameBtn" class="btn-secondary">'],
    ['<button id="quitGameBtn" class="btn-danger" onclick="confirmQuitGame()">', '<button id="quitGameBtn" class="btn-danger">'],
    ['<button id="restartGameBtn" class="btn-danger" onclick="confirmRestartGame()">', '<button id="restartGameBtn" class="btn-danger">'],
    ['<button class="btn-primary" onclick="hideSettings()">Reanudar</button>', '<button id="resumeSettingsBtn" class="btn-primary">Reanudar</button>'],
    ['<button class="btn-close" onclick="hideShortcuts()" aria-label="Cerrar">✕</button>', '<button id="closeShortcutsBtn" class="btn-close" aria-label="Cerrar">✕</button>'],
    ['<button class="btn-primary" onclick="hideShortcuts()">Entendido</button>', '<button id="resumeShortcutsBtn" class="btn-primary">Entendido</button>'],
    ['<button id="resumeOverlayBtn" class="btn-primary btn-large" onclick="togglePauseGame()">Reanudar</button>', '<button id="resumeOverlayBtn" class="btn-primary btn-large">Reanudar</button>']
];

for (const [search, replace] of replacements) {
    html = html.replace(search, replace);
}

fs.writeFileSync('index.html', html);
