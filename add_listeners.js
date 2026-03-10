const fs = require('fs');
let main = fs.readFileSync('main.js', 'utf8');

const listeners = `
// Set up DOM event listeners to replace inline handlers
function setupEventListeners() {
    const attach = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };

    attach('techTreeButton', 'click', window.showTechTree);
    attach('settingsButtonStart', 'click', window.showSettings);
    attach('settingsButton', 'click', window.showSettings);
    attach('closeTechTreeBtn', 'click', window.hideTechTree);
    attach('pauseButton', 'click', window.togglePauseGame);
    attach('helpButton', 'click', window.showShortcuts);
    attach('closeBuildMenuBtn', 'click', window.closeBuildMenu);
    attach('closeSettingsBtn', 'click', window.hideSettings);
    attach('soundToggleBtn', 'click', window.toggleSound);
    attach('volumeDecBtn', 'click', () => window.adjustRange('volumeSlider', -1));
    attach('volumeIncBtn', 'click', () => window.adjustRange('volumeSlider', 1));
    attach('volumeSlider', 'input', (e) => window.updateSoundVolume(e.target.value));
    attach('gridToggleBtn', 'click', window.toggleGrid);
    attach('idleVillagerToggleBtn', 'click', window.toggleIdleVillagerCycle);
    attach('cursorDecBtn', 'click', () => window.adjustRange('cursorSizeSlider', -1));
    attach('cursorIncBtn', 'click', () => window.adjustRange('cursorSizeSlider', 1));
    attach('cursorSizeSlider', 'input', (e) => window.updateCursorSize(e.target.value));
    attach('cameraSpeedDecBtn', 'click', () => window.adjustRange('cameraSpeedSlider', -1));
    attach('cameraSpeedIncBtn', 'click', () => window.adjustRange('cameraSpeedSlider', 1));
    attach('cameraSpeedSlider', 'input', (e) => window.updateCameraSpeed(e.target.value));
    attach('cameraMarginDecBtn', 'click', () => window.adjustRange('cameraMarginSlider', -1));
    attach('cameraMarginIncBtn', 'click', () => window.adjustRange('cameraMarginSlider', 1));
    attach('cameraMarginSlider', 'input', (e) => window.updateCameraMargin(e.target.value));
    attach('copySeedBtn', 'click', window.copyMapSeed);
    attach('saveGameBtn', 'click', window.saveGame);
    attach('loadGameBtn', 'click', window.loadGame);
    attach('exportGameBtn', 'click', window.exportGameToFile);
    attach('quitGameBtn', 'click', window.confirmQuitGame);
    attach('restartGameBtn', 'click', window.confirmRestartGame);
    attach('resumeSettingsBtn', 'click', window.hideSettings);
    attach('closeShortcutsBtn', 'click', window.hideShortcuts);
    attach('resumeShortcutsBtn', 'click', window.hideShortcuts);
    attach('resumeOverlayBtn', 'click', window.togglePauseGame);
}
`;

if (!main.includes('function setupEventListeners()')) {
    main = main.replace('const initApp = async () => {', listeners + '\nconst initApp = async () => {\n    setupEventListeners();');
    fs.writeFileSync('main.js', main);
    console.log('Added setupEventListeners');
}
