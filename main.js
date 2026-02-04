/**
 * main.js - Punto de entrada principal del juego
 * Este archivo coordina la carga de todos los módulos ES6 y expone
 * las funciones necesarias globalmente para compatibilidad con HTML
 */

// ===== IMPORTS DE MÓDULOS =====

// Core
import { CONFIG, TILE_SIZE, MAP_SIZES, TERRAIN_TYPES } from './js/core/constants.js';
import { Game } from './js/core/Game.js';

// Utils
import { debugLogger } from './js/utils/DebugLogger.js';
import { FocusManager } from './js/utils/FocusManager.js';

// Managers
import { assetLoader } from './js/managers/AssetLoader.js';

// Note: Los siguientes scripts se cargarán como globales por ahora:
// - dataLoader.js (civilizationManager)
// - technologies.js (TechManager, TECHNOLOGIES)
// - mapGenerator.js (ProceduralMapGenerator)
// - soundManager.js (soundManager)
// - effects.js (efectos visuales)

// ===== VARIABLES GLOBALES =====
let game = null;
let selectedCivilization = 'sumeria';
let selectedMapSize = 'normal';

// Focus management variable
let lastFocusedElement = null;

// ===== FUNCIONES DE UI (expuestas globalmente) =====

/**
 * Muestra el árbol de tecnologías
 */
window.showTechTree = function () {
    debugLogger.info('Abriendo árbol de tecnologías', 'ui');

    // Palette: Auto-pause game
    if (game && !game.isGameOver) {
        game.isPaused = true;
        debugLogger.info('Juego pausado', 'game');
    }

    FocusManager.saveFocus();

    const screen = document.getElementById('techTreeScreen');

    // Guardar foco actual
    lastFocusedElement = document.activeElement;

    screen.classList.remove('hidden');

    // Mover foco al botón de cerrar o al primer elemento interactivo
    const closeBtn = screen.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.focus();
    } else {
        screen.focus();
    }

    // Renderizar tech tree si el juego está activo
    if (game && game.techManager) {
        renderTechTree();
    } else {
        renderStaticTechTree();
    }

    // Mover foco al modal y activar trap
    setTimeout(() => FocusManager.trapFocus(screen), 50);
};

/**
 * Oculta el árbol de tecnologías
 */
window.hideTechTree = function () {
    debugLogger.info('Cerrando árbol de tecnologías', 'ui');

    FocusManager.releaseTrap();
    document.getElementById('techTreeScreen').classList.add('hidden');

    // Palette: Resume game
    if (game && !game.isGameOver) {
        game.isPaused = false;
        debugLogger.info('Juego reanudado', 'game');
    }

    FocusManager.restoreFocus();
};

/**
 * Muestra la pantalla de atajos de teclado
 */
window.showShortcuts = function () {
    debugLogger.info('Abriendo atajos', 'ui');

    // Palette: Auto-pause game
    if (game && !game.isGameOver) {
        game.isPaused = true;
        debugLogger.info('Juego pausado', 'game');
    }

    FocusManager.saveFocus();

    const screen = document.getElementById('shortcutsScreen');
    screen.classList.remove('hidden');

    // Mover foco al modal y activar trap
    setTimeout(() => FocusManager.trapFocus(screen), 50);
};

/**
 * Oculta la pantalla de atajos de teclado
 */
window.hideShortcuts = function () {
    debugLogger.info('Cerrando atajos', 'ui');

    FocusManager.releaseTrap();
    document.getElementById('shortcutsScreen').classList.add('hidden');

    // Palette: Resume game
    if (game && !game.isGameOver) {
        game.isPaused = false;
        debugLogger.info('Juego reanudado', 'game');
    }

    FocusManager.restoreFocus();
};

/**
 * Muestra la pantalla de configuración
 */
window.showSettings = function () {
    debugLogger.info('Abriendo configuración', 'ui');

    // Palette: Auto-pause game
    if (game && !game.isGameOver) {
        game.isPaused = true;
        debugLogger.info('Juego pausado', 'game');
    }

    FocusManager.saveFocus();

    const screen = document.getElementById('settingsScreen');
    screen.classList.remove('hidden');

    // Palette: Show quit and restart buttons only if game is active
    const isGameActive = typeof game !== 'undefined' && game && !game.isGameOver;

    const quitBtn = document.getElementById('quitGameBtn');
    if (quitBtn) {
        if (isGameActive) {
            quitBtn.classList.remove('hidden');
        } else {
            quitBtn.classList.add('hidden');
        }
    }

    const restartBtn = document.getElementById('restartGameBtn');
    if (restartBtn) {
        if (isGameActive) {
            restartBtn.classList.remove('hidden');
        } else {
            restartBtn.classList.add('hidden');
        }
    }

    // Palette: Map Info Section Logic
    const mapInfoSection = document.getElementById('mapInfoSection');
    const mapSeedValue = document.getElementById('mapSeedValue');

    if (mapInfoSection && mapSeedValue) {
        if (game && game.mapConfig && game.mapConfig.seed) {
            mapInfoSection.classList.remove('hidden');
            mapSeedValue.textContent = game.mapConfig.seed;
        } else {
            mapInfoSection.classList.add('hidden');
        }
    }

    // Mover foco al modal y activar trap
    setTimeout(() => FocusManager.trapFocus(screen), 50);
};

// Palette: Generic confirmation modal helper
window.showConfirmation = function (message, onConfirm, onCancel) {
    const modal = document.getElementById('confirmationModal');
    const msgEl = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYesBtn');
    const noBtn = document.getElementById('confirmNoBtn');

    if (!modal || !msgEl || !yesBtn || !noBtn) return;

    msgEl.textContent = message;
    modal.classList.remove('hidden');

    // Save previous focus
    FocusManager.saveFocus();

    const close = () => {
        FocusManager.releaseTrap();
        modal.classList.add('hidden');
        FocusManager.restoreFocus();
    };

    // Clean up old listeners
    const newYes = yesBtn.cloneNode(true);
    const newNo = noBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYes, yesBtn);
    noBtn.parentNode.replaceChild(newNo, noBtn);

    newYes.onclick = () => { close(); onConfirm(); };
    newNo.onclick = () => { close(); if (onCancel) onCancel(); };

    // Add escape key support specifically for this modal
    newYes.onkeydown = (e) => { if (e.key === 'Escape') newNo.click(); };
    newNo.onkeydown = (e) => { if (e.key === 'Escape') newNo.click(); };

    // Focus "No" by default to prevent accidental clicks
    // Use trapFocus to keep focus inside the confirmation
    setTimeout(() => FocusManager.trapFocus(modal), 50);
};

// Palette: Handle quit game action with custom modal
window.confirmQuitGame = function () {
    showConfirmation(
        '¿Estás seguro de que quieres abandonar? El progreso no guardado se perderá.',
        () => {
            hideSettings();
            loadMainMenu();
        }
    );
};

// Palette: Handle restart game action with custom modal
window.confirmRestartGame = function () {
    showConfirmation(
        '¿Estás seguro de que quieres reiniciar? El progreso actual se perderá y se generará un nuevo mapa.',
        () => {
            hideSettings();
            playAgain();
        }
    );
};

/**
 * Oculta la pantalla de configuración
 */
window.hideSettings = function () {
    debugLogger.info('Cerrando configuración', 'ui');

    FocusManager.releaseTrap();
    document.getElementById('settingsScreen').classList.add('hidden');

    // Palette: Resume game
    if (game && !game.isGameOver) {
        game.isPaused = false;
        debugLogger.info('Juego reanudado', 'game');
    }

    FocusManager.restoreFocus();
};

/**
 * Actualiza la configuración de grid
 */
window.updateGridSetting = function (enabled) {
    debugLogger.info(`Grid ${enabled ? 'activado' : 'desactivado'}`, 'ui');
    if (game) {
        game.showGrid = enabled;
    }
};

// Compatibilidad: función global legacy usada en HTML
window.toggleGrid = function () {
    let newState = false;
    if (window.game) {
        window.game.showGrid = !window.game.showGrid;
        newState = window.game.showGrid;
    } else {
        const toggleElement = document.getElementById('gridToggleValue');
        if (toggleElement) {
            newState = toggleElement.textContent !== 'Activada';
        }
    }

    // Update UI
    const toggleElement = document.getElementById('gridToggleValue');
    if (toggleElement) {
        toggleElement.textContent = newState ? 'Activada' : 'Desactivada';
        toggleElement.style.color = newState ? '#48bb78' : '#f56565';
    }

    // Update ARIA
    const btn = document.getElementById('gridToggleBtn');
    if (btn) btn.setAttribute('aria-pressed', newState);
};

// Toggle para ciclo de aldeanos inactivos (sincronizado con game.js)
window.toggleIdleVillagerCycle = function () {
    let newState = false;
    if (window.game) {
        window.game.enableIdleVillagerCycle = !window.game.enableIdleVillagerCycle;
        newState = window.game.enableIdleVillagerCycle;
    } else {
        const toggleElement = document.getElementById('idleVillagerToggleValue');
        if (toggleElement) {
            newState = toggleElement.textContent !== 'Activado';
        }
    }

    // Update UI
    const toggleElement = document.getElementById('idleVillagerToggleValue');
    if (toggleElement) {
        toggleElement.textContent = newState ? 'Activado' : 'Desactivado';
        toggleElement.style.color = newState ? '#48bb78' : '#f56565';
    }

    // Update ARIA
    const btn = document.getElementById('idleVillagerToggleBtn');
    if (btn) btn.setAttribute('aria-pressed', newState);
};

/**
 * Toggle sound enabled/disabled
 * Palette: Enhanced UX with visual feedback
 */
/**
 * Toggle pause state via UI button
 * Palette: Pause/Resume functionality
 */
window.togglePauseGame = function () {
    if (window.game) {
        window.game.togglePause();
    }
};

window.toggleSound = function () {
    let newState = false;
    if (typeof soundManager !== 'undefined') {
        soundManager.setEnabled(!soundManager.enabled);
        newState = soundManager.enabled;

        // If sound was re-enabled, play a feedback sound if possible, but might be annoying
        // if (newState) soundManager.play('selectUnit');
    } else {
        const toggleElement = document.getElementById('soundToggleValue');
        if (toggleElement) {
            newState = toggleElement.textContent !== 'Activado';
        }
    }

    // Update UI
    const toggleElement = document.getElementById('soundToggleValue');
    if (toggleElement) {
        toggleElement.textContent = newState ? 'Activado' : 'Desactivado';
        toggleElement.style.color = newState ? '#48bb78' : '#f56565';
    }

    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
        btn.setAttribute('aria-pressed', newState);
    }

    // Also update the volume icon to reflect state (muted if disabled)
    const volSlider = document.getElementById('volumeSlider');
    if (volSlider) {
        // Force update of volume icon
        window.updateSoundVolume(volSlider.value);
    }
};

/**
 * Helper to adjust range input values with buttons
 * Palette: Stepper control logic
 */
window.adjustRange = function (id, direction) {
    const input = document.getElementById(id);
    if (!input) return;

    const step = parseFloat(input.step) || 1;
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;

    // Calculate new value
    let val = parseFloat(input.value) + (direction * step);

    // Clamp
    val = Math.max(min, Math.min(max, val));

    // Update value
    input.value = val;

    // Dispatch input event so the existing oninput handler runs
    input.dispatchEvent(new Event('input'));

    // Audio Feedback
    if (typeof soundManager !== 'undefined') {
        soundManager.play('click');
    }
};

/**
 * Update sound volume
 * Palette: Added dynamic icon feedback
 */
window.updateSoundVolume = function (value) {
    const volume = parseInt(value);

    // 1. Update backend
    if (typeof soundManager !== 'undefined') {
        soundManager.setVolume(volume / 100);
    }

    // 2. Update Label
    const label = document.getElementById('volumeValue');
    if (label) label.textContent = volume + '%';

    // 3. Update Dynamic Icon (UX Enhancement)
    const icon = document.getElementById('volumeIcon');
    if (icon) {
        // Check if sound is globally disabled first
        const isEnabled = typeof soundManager !== 'undefined' ? soundManager.enabled : true;

        if (!isEnabled || volume === 0) {
            icon.textContent = 'MUTE';
            icon.setAttribute('aria-label', 'Silenciado');
        } else if (volume < 30) {
            icon.textContent = 'LOW';
            icon.setAttribute('aria-label', 'Volumen bajo');
        } else if (volume < 70) {
            icon.textContent = 'MED';
            icon.setAttribute('aria-label', 'Volumen medio');
        } else {
            icon.textContent = 'HIGH';
            icon.setAttribute('aria-label', 'Volumen alto');
        }
    }
};

/**
 * Actualiza el tamaño del cursor
 */
window.updateCursorSize = function (value) {
    // debugLogger.debug(`Tamaño de cursor: ${value}px`, 'ui');
    if (game && game.cursorElement) {
        game.cursorElement.style.width = value + 'px';
    } else {
        // Si no hay juego, intentar buscar el elemento directamente
        const cursor = document.getElementById('customCursor');
        if (cursor) {
            cursor.style.width = value + 'px';
        }
    }
    const label = document.getElementById('cursorSizeValue');
    if (label) label.textContent = value + 'px';
};

/**
 * Actualiza el margen de la cámara
 */
window.updateCameraMargin = function (value) {
    debugLogger.debug(`Margen de cámara: ${value}px`, 'ui');
    if (game && game.cameraConfig) {
        game.cameraConfig.edgeThreshold = parseInt(value);
    }
    const label = document.getElementById('cameraMarginValue');
    if (label) label.textContent = value + 'px';
};

/**
 * Actualiza la velocidad de la cámara
 */
window.updateCameraSpeed = function (value) {
    debugLogger.debug(`Velocidad de cámara: ${value}px/s`, 'ui');
    if (game && game.cameraConfig) {
        game.cameraConfig.baseSpeed = parseInt(value);
    }
    const label = document.getElementById('cameraSpeedValue');
    if (label) label.textContent = value + ' px/s';
};

/**
 * Reinicia la partida con la misma configuración
 */
window.playAgain = function () {
    if (!game) return;

    debugLogger.info('Reiniciando partida (Play Again)...', 'game');

    // Capturar configuración actual
    const currentCiv = game.civilizationId;
    const currentMapConfig = { ...game.mapConfig };

    // Actualizar semilla para nuevo mapa
    currentMapConfig.seed = Date.now();

    // Limpiar juego actual
    if (game.destroy) game.destroy();
    game = null;

    // Ocultar pantalla de Game Over
    document.getElementById('gameOverScreen').classList.add('hidden');

    // Iniciar nuevo juego
    startGame(currentCiv, currentMapConfig);
};

/**
 * Regresa al menú principal
 */
window.loadMainMenu = function () {
    debugLogger.info('Volviendo al menú principal', 'ui');

    // Ocultar todas las pantallas
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    // Ensure stats return button is hidden
    const returnBtn = document.getElementById('returnToStatsBtn');
    if (returnBtn) returnBtn.classList.add('hidden');

    document.getElementById('settingsScreen').classList.add('hidden');
    document.getElementById('techTreeScreen').classList.add('hidden');
    document.getElementById('mapSizeScreen').classList.add('hidden');
    document.getElementById('civSelectionScreen').classList.add('hidden');

    // Mostrar pantalla de inicio
    document.getElementById('startScreen').classList.remove('hidden');

    // Limpiar el juego si existe
    if (game) {
        if (game.destroy) game.destroy();
        game = null;
    }
};

/**
 * Guarda la partida actual
 */
window.saveGame = function () {
    if (!game) {
        updateSaveStatus('No hay partida activa para guardar', 'error');
        return;
    }

    if (typeof saveManager !== 'undefined') {
        const success = saveManager.save(game);
        if (success) {
            updateSaveStatus('✅ Partida guardada correctamente', 'success');
            // Palette: Toast notification
            if (game && game.showNotification) game.showNotification('Partida guardada', 'success');
        } else {
            updateSaveStatus('❌ Error al guardar la partida', 'error');
            if (game && game.showNotification) game.showNotification('Error al guardar', 'error');
        }
    } else {
        updateSaveStatus('❌ Sistema de guardado no disponible', 'error');
    }
};

/**
 * Carga la última partida guardada
 */
window.loadGame = function () {
    if (typeof saveManager === 'undefined') {
        updateSaveStatus('❌ Sistema de guardado no disponible', 'error');
        return;
    }

    const saveInfo = saveManager.getSaveInfo();
    if (!saveInfo) {
        updateSaveStatus('No hay partida guardada', 'info');
        return;
    }

    // Por ahora solo mostramos info, la carga completa requiere más trabajo
    const date = new Date(saveInfo.timestamp).toLocaleString();
    updateSaveStatus(`📁 Última partida: ${saveInfo.civilizationId} - ${date}`, 'info');

    // TODO: Implementar carga completa del estado del juego
    debugLogger.info('Información de guardado:', 'save', saveInfo);
};

/**
 * Exporta la partida a un archivo JSON
 */
window.exportGameToFile = function () {
    if (!game) {
        updateSaveStatus('No hay partida activa para exportar', 'error');
        return;
    }

    if (typeof saveManager !== 'undefined') {
        saveManager.exportToFile(game);
        updateSaveStatus('📤 Archivo exportado', 'success');
    } else {
        updateSaveStatus('❌ Sistema de guardado no disponible', 'error');
    }
};

/**
 * Actualiza el estado del guardado en la UI
 */
function updateSaveStatus(message, type) {
    const statusEl = document.getElementById('saveStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = type === 'success' ? '#48bb78' :
            type === 'error' ? '#f56565' : '#a0aec0';

        // Limpiar después de 5 segundos
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.textContent = '';
            }
        }, 5000);
    }
}

/**
 * Helper para renderizar un item de tecnología
 */
function createTechItemElement(tech, status, isInteractive) {
    let statusClass = 'locked';
    if (status.researched) statusClass = 'researched';
    else if (status.researching) statusClass = 'researching';
    else if (status.available) statusClass = 'available';
    else if (status.unaffordable) statusClass = 'unaffordable'; // Palette: New status

    const techItem = document.createElement('div');
    techItem.className = `tech-item ${statusClass}`;

    // Interaction attributes
    const isClickable = isInteractive && (status.available || status.unaffordable);
    techItem.setAttribute('role', isClickable ? 'button' : 'article');
    techItem.setAttribute('tabindex', '0'); // Always focusable for tooltip reading

    let ariaLabel = `${tech.name}`;
    // Accessibility: Include description and cost in the label
    if (tech.description) ariaLabel += `. ${tech.description}`;

    if (status.researched) ariaLabel += ' (Investigado)';
    else if (status.researching) ariaLabel += ' (Investigando)';
    else if (status.available) ariaLabel += ' (Disponible para investigar)';
    else if (status.unaffordable) ariaLabel += ' (Recursos insuficientes)';
    else ariaLabel += ' (Bloqueado)';

    if (tech.cost) {
        const costParts = [];
        for (const [res, amount] of Object.entries(tech.cost)) {
            let part = `${amount} ${res}`;
            // Palette: Check affordability for ARIA label
            if (isInteractive && game && game.resources && game.resources[res] < amount) {
                part += ' (Falta)';
            }
            costParts.push(part);
        }
        if (costParts.length > 0) {
            ariaLabel += `. Costo: ${costParts.join(', ')}`;
        }
    }

    techItem.setAttribute('aria-label', ariaLabel);

    if (statusClass === 'locked' || statusClass === 'unaffordable') {
        techItem.setAttribute('aria-disabled', 'true');
    }

    // Icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'tech-icon';
    if (assetLoader && assetLoader.getSrc && assetLoader.getSrc(tech.id)) {
        const img = document.createElement('img');
        img.src = assetLoader.getSrc(tech.id);
        img.className = 'tech-icon-img';
        img.alt = '';
        iconDiv.appendChild(img);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'tech-icon-placeholder';
        if (!tech.icon) placeholder.textContent = 'T';
        else if (tech.icon.length < 5) placeholder.textContent = tech.icon;
        else placeholder.textContent = 'T'; // fallback
        iconDiv.appendChild(placeholder);
    }
    techItem.appendChild(iconDiv);

    // Name
    const nameDiv = document.createElement('div');
    nameDiv.className = 'tech-name';
    nameDiv.textContent = tech.name;
    techItem.appendChild(nameDiv);

    // Desc
    const descDiv = document.createElement('div');
    descDiv.className = 'tech-desc';
    descDiv.textContent = tech.description;
    techItem.appendChild(descDiv);

    // Cost
    const costDiv = document.createElement('div');
    costDiv.className = 'tech-cost';
    if (tech.cost) {
        for (let [res, amount] of Object.entries(tech.cost)) {
            const costSpan = document.createElement('span');
            costSpan.style.cssText = 'display:inline-flex;align-items:center;margin-right:5px;';

            // Palette: Visual feedback for missing resources
            if (isInteractive && game && game.resources && game.resources[res] < amount) {
                costSpan.style.color = '#e53e3e'; // Red
                costSpan.style.fontWeight = 'bold';
            }

            if (assetLoader && assetLoader.getSrc) {
                const src = assetLoader.getSrc(res);
                if (src) {
                    const img = document.createElement('img');
                    img.src = src;
                    img.style.cssText = 'width:16px;height:16px;vertical-align:middle;margin-right:2px;';
                    img.alt = res;
                    costSpan.appendChild(img);
                } else {
                    const txt = document.createElement('span');
                    txt.style.fontSize = '10px';
                    txt.textContent = res.substring(0, 1).toUpperCase();
                    costSpan.appendChild(txt);
                }
            } else {
                const txt = document.createElement('span');
                txt.style.fontSize = '10px';
                txt.textContent = res.substring(0, 1).toUpperCase();
                costSpan.appendChild(txt);
            }

            const amountText = document.createTextNode(amount);
            costSpan.appendChild(amountText);
            costDiv.appendChild(costSpan);
        }
    }
    techItem.appendChild(costDiv);

    if (status.researching) {
        let percent = 0;
        let remaining = 0;
        let total = 1; // Avoid divide by zero

        // Palette: Calculate real-time progress
        if (typeof game !== 'undefined' && game && game.techManager && game.techManager.researchQueue) {
            const item = game.techManager.researchQueue.find(i => i.techId === tech.id);
            if (item) {
                remaining = item.timer;
                if (typeof tech.researchTime === 'number') {
                    total = tech.researchTime;
                } else if (typeof TECHNOLOGIES !== 'undefined' && TECHNOLOGIES[tech.id]) {
                    total = TECHNOLOGIES[tech.id].researchTime;
                }
                percent = Math.max(0, Math.min(100, (1 - remaining / total) * 100));
            }
        }

        const progContainer = document.createElement('div');
        progContainer.className = 'tech-progress-container';
        // Accessibility Attributes
        progContainer.setAttribute('role', 'progressbar');
        progContainer.setAttribute('aria-valuenow', Math.floor(percent));
        progContainer.setAttribute('aria-valuemin', '0');
        progContainer.setAttribute('aria-valuemax', '100');
        progContainer.setAttribute('aria-label', `Investigando ${tech.name}: ${Math.floor(percent)}% completado`);

        const progFill = document.createElement('div');
        progFill.className = 'tech-progress-fill';
        progFill.style.width = `${percent}%`;

        const progText = document.createElement('div');
        progText.className = 'tech-progress-text';
        // Show remaining seconds if < 60s, else %
        if (remaining > 0 && remaining < 60) {
            progText.textContent = `${Math.ceil(remaining)}s`;
        } else {
            progText.textContent = `${Math.floor(percent)}%`;
        }

        progContainer.appendChild(progFill);
        progContainer.appendChild(progText);
        techItem.appendChild(progContainer);
    }

    return techItem;
}

function renderTechTreeCommon(isInteractive) {
    const content = document.getElementById('techTreeContent');
    if (!content) return;

    // Convert to array if it's an object
    let techArray = [];
    if (typeof TECHNOLOGIES !== 'undefined') {
        techArray = Array.isArray(TECHNOLOGIES) ? TECHNOLOGIES : Object.values(TECHNOLOGIES);
    }

    if (techArray.length === 0) {
        content.innerHTML = '<p style="text-align: center; color: #999;">Árbol de tecnologías vacío o no disponible</p>';
        return;
    }

    content.textContent = ''; // Clear content safely

    const categories = { economy: [], military: [], defense: [], other: [] };
    const categoryMapping = {
        'Economía': 'economy', 'ECONOMY': 'economy',
        'Militar': 'military', 'MILITARY': 'military',
        'Defensa': 'defense', 'DEFENSE': 'defense'
    };
    const categoryNames = { economy: 'Economía', military: 'Militar', defense: 'Defensa', other: 'Otros' };

    for (let tech of techArray) {
        const catKey = categoryMapping[tech.category] || 'other';
        if (categories[catKey]) categories[catKey].push(tech);
        else categories.other.push(tech);
    }

    for (let [categoryKey, techs] of Object.entries(categories)) {
        if (techs.length === 0) continue;

        const catDiv = document.createElement('div');
        catDiv.className = 'tech-category';

        const h3 = document.createElement('h3');
        h3.textContent = categoryNames[categoryKey] || categoryKey;
        catDiv.appendChild(h3);

        const gridDiv = document.createElement('div');
        gridDiv.className = 'tech-grid';

        for (let tech of techs) {
            // Palette: Enhanced status tracking
            let status = {
                researched: false,
                researching: false,
                available: false,
                unaffordable: false,
                locked: true
            };

            if (isInteractive && game && game.techManager) {
                if (game.techManager.getResearchStatus) {
                    status = game.techManager.getResearchStatus(tech.id);
                } else {
                    const isResearched = game.techManager.isResearched(tech.id);
                    const isResearching = game.techManager.isResearching(tech.id);
                    const isLocked = game.techManager.isLocked ? game.techManager.isLocked(tech.id) : false; // Fallback check

                    // Note: canResearch includes affordable check, so we manually check afford
                    const canAfford = game.canAfford ? game.canAfford(tech.cost) : true;

                    status = {
                        researched: isResearched,
                        researching: isResearching,
                        available: !isResearched && !isResearching && !isLocked && canAfford,
                        unaffordable: !isResearched && !isResearching && !isLocked && !canAfford,
                        locked: isLocked
                    };
                }
            }

            const techItem = createTechItemElement(tech, status, isInteractive);

            if (isInteractive) {
                if (status.available) {
                    const handleResearch = () => {
                        if (game && game.techManager && game.techManager.canResearch(tech.id)) {
                            const id = `tech-${tech.id}`;
                            techItem.id = id;
                            game.techManager.startResearch(tech.id);
                            renderTechTree();
                        }
                    };

                    techItem.onclick = handleResearch;
                    techItem.onkeydown = (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleResearch();
                        }
                    };
                } else if (status.unaffordable) {
                    // Palette: Feedback for unaffordable items
                    const handleUnaffordable = (e) => {
                        // Animation feedback
                        techItem.classList.remove('shake');
                        void techItem.offsetWidth; // Force reflow
                        techItem.classList.add('shake');

                        // Sound feedback
                        if (typeof soundManager !== 'undefined') {
                            soundManager.play('error');
                        }

                        // Identify missing resources
                        const missing = [];
                        if (game && game.resources && tech.cost) {
                            for (const [res, amount] of Object.entries(tech.cost)) {
                                if (game.resources[res] < amount) {
                                    // Translate
                                    let name = res;
                                    if (name === 'food') name = 'Comida';
                                    else if (name === 'wood') name = 'Madera';
                                    else if (name === 'gold') name = 'Oro';
                                    else if (name === 'stone') name = 'Piedra';

                                    const diff = Math.ceil(amount - game.resources[res]);
                                    missing.push(`${name} (${diff})`);
                                }
                            }
                        }

                        const msg = missing.length > 0
                            ? `Falta: ${missing.join(', ')}`
                            : 'Recursos insuficientes';

                        if (game) {
                            if (game.showNotification) {
                                game.showNotification(msg, 'error');
                            }

                            // Palette: Visual feedback for missing resources
                            if (game.flashResource) {
                                for (const [res, amount] of Object.entries(tech.cost)) {
                                    if (game.resources && game.resources[res] < amount) {
                                        game.flashResource(res);
                                    }
                                }
                            }
                        }
                    };

                    techItem.onclick = handleUnaffordable;
                    techItem.onkeydown = (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleUnaffordable();
                        }
                    };
                }
            }

            gridDiv.appendChild(techItem);
        }

        catDiv.appendChild(gridDiv);
        content.appendChild(catDiv);
    }
}

/**
 * Renderiza el árbol de tecnologías (estático, sin juego activo)
 */
function renderStaticTechTree() {
    renderTechTreeCommon(false);
}

/**
 * Renderiza el árbol de tecnologías con estado del juego
 */
function renderTechTree() {
    renderTechTreeCommon(true);
}

/**
 * Cierra el menú de construcción
 */
window.closeBuildMenu = function () {
    if (window.game) {
        window.game.closeBuildMenu();
    }
};

/**
 * Inicia una nueva partida
 */
function startGame(civId, mapConfig) {
    debugLogger.start('Iniciando nuevo juego', 'game');
    debugLogger.info(`Civilización: ${civId}`, 'game');
    debugLogger.info(`Mapa: ${mapConfig.name || 'Normal'}`, 'game');

    // Iniciar música
    if (typeof soundManager !== 'undefined') {
        soundManager.startMusic();
    }

    // Crear instancia del juego
    // Ocultar pantallas de selección y mostrar la pantalla de juego primero
    document.getElementById('civSelectionScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('mapSizeScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    // Crear instancia del juego ahora que el contenedor es visible
    game = new Game(civId, mapConfig);

    // Exponer game globalmente para compatibilidad con HTML (onclick handlers)
    window.game = game;

    // Forzar un resize inmediato por si el render inicial se hizo antes de que
    // el layout estuviera listo en algunos navegadores
    try {
        if (typeof game.resizeCanvas === 'function') {
            // Ejecutar en el siguiente tick para asegurar que estilos se apliquen
            setTimeout(() => game.resizeCanvas(), 0);
        }
    } catch (e) {
        debugLogger.error('Error forzando resize del canvas', 'game', e);
    }

    // Iniciar game loop
    let lastTime = performance.now();

    function gameLoop(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000; // Convertir a segundos
        lastTime = currentTime;

        // Actualizar y renderizar
        game.update(deltaTime);
        game.render();

        // Continuar el loop
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

    debugLogger.success('Juego iniciado correctamente', 'game');
}


// ===== FUNCIONES DE INICIALIZACIÓN =====

/**
 * Inicializa las partículas de fondo (embers)
 * Palette UX Enhancement
 */
function initStartScreenParticles() {
    const container = document.getElementById('particlesBg');
    if (!container) return;

    // Clear any existing (just in case)
    container.innerHTML = '';

    // Create ~30 embers
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'ember';

        // Random horizontal position
        p.style.left = Math.random() * 100 + '%';

        // Random animation duration (5-10s)
        p.style.animationDuration = (Math.random() * 5 + 5) + 's';

        // Random delay (0-10s) so they don't all start at once
        p.style.animationDelay = (Math.random() * 10) + 's';

        // Random size variation
        const scale = Math.random() * 0.5 + 0.8;
        // Note: transform is controlled by animation, so we set size instead
        const size = 3 * scale;
        p.style.width = size + 'px';
        p.style.height = size + 'px';

        container.appendChild(p);
    }

    debugLogger.info('Partículas de fondo inicializadas', 'ui');
}

/**
 * Inicializa los manejadores para cerrar modales al hacer click en el fondo
 * Palette: "Click outside to close" pattern
 */
function initModalBackdropHandlers() {
    const modalMap = {
        'techTreeScreen': window.hideTechTree,
        'settingsScreen': window.hideSettings,
        'shortcutsScreen': window.hideShortcuts,
        'buildMenu': window.closeBuildMenu,
        'confirmationModal': () => {
            // Para confirmación, click en fondo actúa como "Cancelar"
            const noBtn = document.getElementById('confirmNoBtn');
            if (noBtn) noBtn.click();
            else document.getElementById('confirmationModal').classList.add('hidden');
        }
    };

    for (const [id, closeAction] of Object.entries(modalMap)) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener('click', (e) => {
                // Solo cerrar si se clickea el fondo (overlay), no el contenido
                if (e.target === modal) {
                    debugLogger.info(`Cerrando modal ${id} por click en fondo`, 'ui');
                    if (typeof closeAction === 'function') {
                        closeAction();
                    }
                }
            });
        }
    }
    debugLogger.info('Manejadores de fondo de modales inicializados', 'ui');
}

/**
 * Genera dinámicamente las opciones de tamaño de mapa
 */
function populateMapSizes() {
    const mapSizeGrid = document.getElementById('mapSizeGrid');
    if (!mapSizeGrid) return;

    mapSizeGrid.textContent = ''; // Limpiar contenido existente de forma segura

    // Generar botones desde MAP_SIZES
    for (let [key, mapData] of Object.entries(MAP_SIZES)) {
        const option = document.createElement('div');
        option.className = 'map-size-option';
        option.dataset.size = key;
        option.setAttribute('role', 'button');
        option.setAttribute('tabindex', '0');
        option.setAttribute('aria-label', `${mapData.name} - ${mapData.width}x${mapData.height}`);

        // Icono seguro usando DOM (Palette: Visual Grid)
        const iconDiv = document.createElement('div');
        iconDiv.className = 'size-icon';

        // Determinar densidad del grid visual (2x2 hasta 8x8)
        let gridDensity = 4; // Default normal
        let recommendedText = '2-4 Jugadores';

        // Defensive check: use tiles property or fallback to width calculation
        // TILE_SIZE is 32, so width/32 should give tile count if tiles prop is missing
        const tileCount = mapData.tiles || (mapData.width / 32);

        if (tileCount <= 120) { gridDensity = 2; recommendedText = 'Duel (1v1)'; }
        else if (tileCount <= 144) { gridDensity = 3; recommendedText = '2 Jugadores'; }
        else if (tileCount <= 168) { gridDensity = 4; recommendedText = '2-4 Jugadores'; }
        else if (tileCount <= 200) { gridDensity = 5; recommendedText = '4-6 Jugadores'; }
        else if (tileCount <= 220) { gridDensity = 6; recommendedText = '6-8 Jugadores'; }
        else { gridDensity = 7; recommendedText = '8+ Jugadores'; }

        const mapVisual = document.createElement('div');
        mapVisual.className = 'map-visual';
        // Inline styles for grid visualization (Palette philosophy: avoid new CSS files if possible for small tweaks)
        mapVisual.style.cssText = `
            width: 48px;
            height: 48px;
            margin: 0 auto 12px;
            display: grid;
            grid-template-columns: repeat(${gridDensity}, 1fr);
            grid-template-rows: repeat(${gridDensity}, 1fr);
            gap: 2px;
            padding: 2px;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 4px;
        `;

        const totalCells = gridDensity * gridDensity;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            // Random opacity to simulate terrain/density
            const opacity = 0.3 + Math.random() * 0.5;
            cell.style.background = `rgba(72, 187, 120, ${opacity})`;
            cell.style.borderRadius = '1px';
            mapVisual.appendChild(cell);
        }

        iconDiv.appendChild(mapVisual);

        const nameDiv = document.createElement('div');
        nameDiv.className = 'size-name';
        nameDiv.textContent = mapData.name;
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = '#d4af37';

        const descDiv = document.createElement('div');
        descDiv.className = 'size-desc';
        descDiv.textContent = `${mapData.width}×${mapData.height}`;
        descDiv.style.fontSize = '0.85rem';
        descDiv.style.color = '#a0aec0';

        const recDiv = document.createElement('div');
        recDiv.className = 'size-rec';
        recDiv.textContent = recommendedText;
        recDiv.style.fontSize = '0.75rem';
        recDiv.style.color = '#48bb78';
        recDiv.style.marginTop = '4px';

        option.appendChild(iconDiv);
        option.appendChild(nameDiv);
        option.appendChild(descDiv);
        option.appendChild(recDiv);

        // Accessibility attributes
        option.setAttribute('role', 'button');
        option.setAttribute('tabindex', '0');
        option.setAttribute('aria-label', `Seleccionar mapa ${mapData.name}`); // Concise label

        // Palette: Generate unique ID for description
        const tooltipId = `map-tooltip-${key}`;
        option.setAttribute('aria-describedby', tooltipId);

        // Tooltip description (preserved from legacy logic)
        let sizeDesc = '';
        if (mapData.width * mapData.height <= 144 * 144) sizeDesc = 'Mapa rápido para partidas cortas.';
        else if (mapData.width * mapData.height <= 200 * 200) sizeDesc = 'Tamaño estándar equilibrado.';
        else sizeDesc = 'Mapa extenso para partidas largas.';

        // Palette: Rich Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'card-tooltip';
        tooltip.id = tooltipId;

        const tipHeader = document.createElement('div');
        tipHeader.style.fontWeight = 'bold';
        tipHeader.style.marginBottom = '4px';
        tipHeader.textContent = mapData.name;
        tooltip.appendChild(tipHeader);

        const tipDetails = document.createElement('div');
        tipDetails.style.fontSize = '0.85rem';
        tipDetails.textContent = `${mapData.width}x${mapData.height} casillas`;
        tooltip.appendChild(tipDetails);

        const tipDesc = document.createElement('div');
        tipDesc.style.fontSize = '0.8rem';
        tipDesc.style.fontStyle = 'italic';
        tipDesc.style.margin = '6px 0';
        tipDesc.textContent = sizeDesc;
        tooltip.appendChild(tipDesc);

        const tipRec = document.createElement('div');
        tipRec.style.fontSize = '0.75rem';
        tipRec.style.color = '#48bb78';
        tipRec.textContent = `Recomendado: ${recommendedText}`;
        tooltip.appendChild(tipRec);

        option.appendChild(tooltip);

        // Agregar event listener al crear el elemento
        const selectMapSize = () => {
            selectedMapSize = key;
            debugLogger.info(`Tamaño de mapa seleccionado: ${key}`, 'ui');

            // Ir a selección de civilización
            document.getElementById('mapSizeScreen').classList.add('hidden');
            document.getElementById('civSelectionScreen').classList.remove('hidden');

            // Focus management: focus first element in next screen
            setTimeout(() => {
                const civScreen = document.getElementById('civSelectionScreen');
                FocusManager.focusFirst(civScreen);
            }, 50);
        };

        option.addEventListener('click', selectMapSize);
        // Palette: Restore Keyboard Accessibility
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectMapSize();
            }
        });

        mapSizeGrid.appendChild(option);
    }

    debugLogger.info(`${Object.keys(MAP_SIZES).length} tamaños de mapa generados`, 'ui');
}

/**
 * Helper function to create an icon element safely (DOM node)
 * @param {string} iconPath - The icon path or emoji
 * @param {string} alt - Alt text for the image
 * @param {string} size - Size of the icon (default 64px)
 * @returns {HTMLElement} DOM Element
 */
function createSafeIconElement(iconPath, alt = '', size = '64px') {
    if (!iconPath) {
        const placeholder = document.createElement('div');
        placeholder.className = 'civ-icon-placeholder';
        placeholder.style.cssText = `font-size:30px;line-height:${size};text-align:center;width:${size};height:${size};`;
        placeholder.textContent = alt.substring(0, 1);
        return placeholder;
    }

    // Check if it's an image path (contains / or . typical of file paths)
    if (iconPath.includes('/') || iconPath.includes('.png') || iconPath.includes('.jpg') || iconPath.includes('.svg')) {
        const wrapper = document.createElement('div');
        // Usar display inline-block para comportarse como imagen en flujo
        wrapper.style.display = 'inline-block';

        const img = document.createElement('img');
        img.src = iconPath;
        img.alt = alt;
        img.className = 'civ-icon-img';
        img.style.cssText = `width:${size};height:${size};object-fit:contain;`;

        const fallback = document.createElement('span');
        fallback.style.cssText = 'display:none;font-size:30px;';
        fallback.textContent = alt.substring(0, 1);

        img.onerror = () => {
            img.style.display = 'none';
            fallback.style.display = 'block';
        };

        wrapper.appendChild(img);
        wrapper.appendChild(fallback);
        return wrapper;
    }

    // Return as-is for emojis (wrapped in span)
    const span = document.createElement('span');
    span.style.fontSize = '48px';
    span.textContent = iconPath;
    return span;
}

/**
 * Genera dinamicamente las opciones de civilizacion
 */
function populateCivilizations() {
    const civGrid = document.getElementById('civGrid');
    if (!civGrid || typeof dataLoader === 'undefined') {
        debugLogger.warn('No se puede popular civilizaciones - civGrid o dataLoader no disponibles', 'ui');
        return;
    }

    civGrid.textContent = ''; // Limpiar contenido existente de forma segura

    const civilizations = dataLoader.getAllCivilizations();

    if (!civilizations || civilizations.length === 0) {
        debugLogger.warn('No hay civilizaciones disponibles', 'data');
        const errorMsg = document.createElement('p');
        errorMsg.style.cssText = 'color: white; text-align: center;';
        errorMsg.textContent = 'No se pudieron cargar las civilizaciones.';
        civGrid.appendChild(errorMsg);
        return;
    }

    // Palette: Random Civilization Option
    const randomOption = document.createElement('div');
    randomOption.className = 'civ-option';
    randomOption.dataset.civ = 'random';
    randomOption.setAttribute('role', 'button');
    randomOption.setAttribute('tabindex', '0');
    randomOption.setAttribute('aria-label', 'Seleccionar civilización aleatoria');

    const randomIconDiv = document.createElement('div');
    randomIconDiv.className = 'civ-icon';
    randomIconDiv.appendChild(createSafeIconElement('🎲', 'Aleatorio', '80px'));

    const randomNameDiv = document.createElement('div');
    randomNameDiv.className = 'civ-name';
    randomNameDiv.textContent = 'Aleatorio';

    const randomDescDiv = document.createElement('div');
    randomDescDiv.className = 'civ-desc';
    randomDescDiv.textContent = 'Selecciona una civilización al azar para un desafío extra.';

    randomOption.appendChild(randomIconDiv);
    randomOption.appendChild(randomNameDiv);
    randomOption.appendChild(randomDescDiv);

    // Palette: Tooltip for Random
    const randomTooltipId = 'civ-tooltip-random';
    randomOption.setAttribute('aria-describedby', randomTooltipId);

    const randomTooltip = document.createElement('div');
    randomTooltip.className = 'card-tooltip';
    randomTooltip.id = randomTooltipId;

    const randomTipHeader = document.createElement('div');
    randomTipHeader.className = 'tooltip-header';
    randomTipHeader.textContent = 'Aleatorio';
    randomTooltip.appendChild(randomTipHeader);

    const randomTipDesc = document.createElement('div');
    randomTipDesc.className = 'tooltip-desc';
    randomTipDesc.style.fontStyle = 'italic';
    randomTipDesc.textContent = '¿Indeciso? Deja que el destino decida tu civilización.';
    randomTooltip.appendChild(randomTipDesc);

    randomOption.appendChild(randomTooltip);

    const selectRandomCiv = () => {
        if (randomOption.classList.contains('loading')) return;

        randomOption.classList.add('loading');
        randomOption.setAttribute('aria-busy', 'true');
        randomOption.style.cursor = 'wait';

        const spinner = document.createElement('span');
        spinner.className = 'spinner';
        spinner.style.width = '0.8em';
        spinner.style.height = '0.8em';
        spinner.style.marginLeft = '8px';
        spinner.style.borderWidth = '2px';
        spinner.style.borderTopColor = 'var(--gold)';

        const nameEl = randomOption.querySelector('.civ-name');
        if (nameEl) nameEl.appendChild(spinner);

        const grid = document.getElementById('civGrid');
        if (grid) grid.style.pointerEvents = 'none';

        // Logic to pick random civ
        const randomIndex = Math.floor(Math.random() * civilizations.length);
        const randomCiv = civilizations[randomIndex];
        selectedCivilization = randomCiv.civilizationId;

        debugLogger.info(`Civilización aleatoria seleccionada: ${randomCiv.civilizationId}`, 'ui');

        setTimeout(() => {
            const mapConfig = MAP_SIZES[selectedMapSize] || MAP_SIZES.normal;
            startGame(randomCiv.civilizationId, {
                ...mapConfig,
                seed: Date.now(),
                numPlayers: 2
                // biome and style handled by ProceduralMapGenerator defaults
            });

            if (grid) grid.style.pointerEvents = '';
            randomOption.classList.remove('loading');
            randomOption.removeAttribute('aria-busy');
            if (nameEl && nameEl.contains(spinner)) nameEl.removeChild(spinner);
        }, 50);
    };

    randomOption.addEventListener('click', selectRandomCiv);
    randomOption.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectRandomCiv();
        }
    });

    civGrid.appendChild(randomOption);

    civilizations.forEach(civ => {
        const option = document.createElement('div');
        option.className = 'civ-option';
        option.dataset.civ = civ.civilizationId;
        option.setAttribute('role', 'button');
        option.setAttribute('tabindex', '0');
        option.setAttribute('aria-label', `Seleccionar civilización ${civ.name}`);

        const iconDiv = document.createElement('div');
        iconDiv.className = 'civ-icon';
        iconDiv.appendChild(createSafeIconElement(civ.icon, civ.name, '80px'));

        const nameDiv = document.createElement('div');
        nameDiv.className = 'civ-name';
        nameDiv.textContent = civ.name;

        const descDiv = document.createElement('div');
        descDiv.className = 'civ-desc';
        descDiv.textContent = civ.description;

        option.appendChild(iconDiv);
        option.appendChild(nameDiv);
        option.appendChild(descDiv);

        // Accessibility attributes
        option.setAttribute('role', 'button');
        option.setAttribute('tabindex', '0');
        option.setAttribute('aria-label', `Seleccionar civilización ${civ.name}`);

        // Palette: Generate unique ID for description
        const tooltipId = `civ-tooltip-${civ.civilizationId}`;
        option.setAttribute('aria-describedby', tooltipId);

        // Palette: Rich HTML Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'card-tooltip';
        tooltip.id = tooltipId;
        tooltip.style.width = '240px'; // Slightly wider for bonuses

        // Header
        const tipHeader = document.createElement('div');
        tipHeader.style.fontWeight = 'bold';
        tipHeader.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
        tipHeader.style.paddingBottom = '4px';
        tipHeader.style.marginBottom = '4px';
        tipHeader.textContent = civ.name;
        tooltip.appendChild(tipHeader);

        // Description
        const tipDesc = document.createElement('div');
        tipDesc.style.fontSize = '0.85rem';
        tipDesc.style.fontStyle = 'italic';
        tipDesc.style.marginBottom = '8px';
        tipDesc.textContent = civ.description.length > 100 ? civ.description.substring(0, 100) + '...' : civ.description;
        tooltip.appendChild(tipDesc);

        // Bonuses Section
        if (civ.bonuses) {
            const bonusesDiv = document.createElement('div');
            bonusesDiv.style.fontSize = '0.8rem';

            const bonusTitle = document.createElement('div');
            bonusTitle.textContent = 'Bonificaciones:';
            bonusTitle.style.color = '#d4af37';
            bonusesDiv.appendChild(bonusTitle);

            const ul = document.createElement('ul');
            ul.style.paddingLeft = '16px';
            ul.style.margin = '2px 0';

            const bonusMap = {
                buildSpeed: 'Construcción',
                buildingHp: 'Salud edificios',
                infantryAttack: 'Ataque infantería',
                unitSpeed: 'Velocidad unidades',
                gatherBonus: 'Recolección',
                startingResources: 'Recursos extra'
            };

            for (const [key, value] of Object.entries(civ.bonuses)) {
                if (!bonusMap[key]) continue;

                let textVal = '';
                if (key === 'startingResources') {
                    const res = Object.entries(value).filter(([_, v]) => v > 0).map(([k, v]) => `+${v} ${k}`).join(', ');
                    if (!res) continue;
                    textVal = res;
                } else if (typeof value === 'number') {
                    if (value === 1) continue;
                    const percent = Math.round((Math.abs(1 - value)) * 100);
                    textVal = (value > 1 ? '+' : '-') + percent + '%';
                }

                const li = document.createElement('li');
                li.textContent = `${bonusMap[key]}: `;
                const valSpan = document.createElement('span');
                valSpan.style.color = '#48bb78';
                valSpan.textContent = textVal;
                li.appendChild(valSpan);
                ul.appendChild(li);
            }
            bonusesDiv.appendChild(ul);
            tooltip.appendChild(bonusesDiv);
        }

        // Unique Unit
        if (civ.uniqueUnit) {
            const uniqueDiv = document.createElement('div');
            uniqueDiv.style.marginTop = '8px';
            uniqueDiv.style.fontSize = '0.8rem';

            // Sentinel: Secure rendering to prevent XSS
            const prefix = document.createTextNode('Unidad Única: ');
            const span = document.createElement('span');
            span.style.color = '#d4af37';
            span.textContent = civ.uniqueUnit.name;

            uniqueDiv.appendChild(prefix);
            uniqueDiv.appendChild(span);
            tooltip.appendChild(uniqueDiv);
        }

        option.appendChild(tooltip);

        // Keyboard support
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                option.click();
            }
        });

        // Agregar event listener al crear el elemento
        const selectCiv = () => {
            // Palette: Immediate visual feedback
            if (option.classList.contains('loading')) return;

            // Visual State
            option.classList.add('loading');
            option.setAttribute('aria-busy', 'true');
            option.style.cursor = 'wait';

            // Add spinner to name
            const spinner = document.createElement('span');
            spinner.className = 'spinner';
            spinner.style.width = '0.8em';
            spinner.style.height = '0.8em';
            spinner.style.marginLeft = '8px';
            spinner.style.borderWidth = '2px';
            spinner.style.borderTopColor = 'var(--gold)'; // Ensure visibility

            // Find name div to append spinner
            const nameEl = option.querySelector('.civ-name');
            if (nameEl) nameEl.appendChild(spinner);

            // Disable other interactions in the grid
            const grid = document.getElementById('civGrid');
            if (grid) grid.style.pointerEvents = 'none';

            selectedCivilization = civ.civilizationId;
            debugLogger.info(`Civilizacion seleccionada: ${civ.civilizationId}`, 'ui');

            // Defer execution to allow UI update paint
            setTimeout(() => {
                // Obtener configuracion del mapa
                const mapConfig = MAP_SIZES[selectedMapSize] || MAP_SIZES.normal;

                // Iniciar juego
                startGame(civ.civilizationId, {
                    ...mapConfig,
                    seed: Date.now(),
                    numPlayers: 2,
                    biome: 'grassland',
                    style: 'continental'
                });

                // Cleanup if needed (though screen changes)
                if (grid) grid.style.pointerEvents = '';
                option.classList.remove('loading');
                option.removeAttribute('aria-busy');
                if (nameEl && nameEl.contains(spinner)) nameEl.removeChild(spinner);
            }, 50);
        };

        option.addEventListener('click', selectCiv);
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectCiv();
            }
        });

        civGrid.appendChild(option);
    });

    debugLogger.success(`${civilizations.length} civilizaciones cargadas`, 'ui');
}


// ===== EVENT LISTENERS =====

/**
 * Palette: Copy Map Seed to Clipboard
 */
window.copyMapSeed = function () {
    const seedEl = document.getElementById('mapSeedValue');
    if (!seedEl || seedEl.textContent === '-') return;

    const seed = seedEl.textContent;
    const btn = document.getElementById('copySeedBtn');

    // Helper to show visual feedback
    const showFeedback = () => {
        if (!btn) return;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copiado!';
        btn.style.borderColor = '#48bb78'; // Green
        btn.style.color = '#48bb78';

        if (typeof soundManager !== 'undefined') {
            soundManager.play('click');
        }

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 2000);
    };

    // Try Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(seed).then(() => {
            showFeedback();
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopy(seed, showFeedback);
        });
    } else {
        fallbackCopy(seed, showFeedback);
    }
};

function fallbackCopy(text, onSuccess) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Ensure it's not visible but part of DOM
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            onSuccess();
        } else {
            if (window.game && window.game.showNotification) {
                window.game.showNotification('Error al copiar semilla', 'error');
            }
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

const initApp = async () => {
    debugLogger.info('DOM cargado, inicializando juego...', 'game');

    // Palette: Initialize background particles
    initStartScreenParticles();

    // Palette: Initialize modal backdrop handlers
    initModalBackdropHandlers();

    // Generar opciones de tamaño de mapa dinámicamente
    populateMapSizes();

    // Inicializar dataLoader y cargar civilizaciones
    try {
        if (typeof dataLoader !== 'undefined') {
            debugLogger.info('Inicializando dataLoader...', 'data');
            await dataLoader.initialize();

            // Crear civilizationManager compatibility layer
            window.civilizationManager = {
                getCivilization: (civilizationId) => dataLoader.getCivilizationData(civilizationId),
                getStartingResources: (civilizationId) => {
                    const civ = dataLoader.getCivilizationData(civilizationId);
                    return civ?.startingResources || {};
                },
                applyBuildingBonuses: (building, civilizationId) => {
                    // Por ahora no hace nada, se implementará más adelante
                    return building;
                },
                applyUnitBonuses: (unit, civilizationId) => {
                    const civ = dataLoader.getCivilizationData(civilizationId);
                    if (civ && civ.bonuses) {
                        // Aplicar bonificaciones si existen
                        if (civ.bonuses.unitSpeed) {
                            unit.speed = (unit.speed || 100) * civ.bonuses.unitSpeed;
                        }
                    }
                    return unit;
                },
                getTeamColor: (civilizationId, team) => {
                    const civ = dataLoader.getCivilizationData(civilizationId);
                    return civ?.color || '#4169E1';
                },
                getBuildSpeed: (civilizationId) => {
                    const civ = dataLoader.getCivilizationData(civilizationId);
                    return civ?.bonuses?.buildSpeed || 1;
                }
            };

            populateCivilizations();
        } else {
            debugLogger.warn('dataLoader no disponible, reintentando...', 'data');
            // Fallback: Si dataLoader aún no está cargado, esperar un poco
            setTimeout(async () => {
                if (typeof dataLoader !== 'undefined') {
                    await dataLoader.initialize();

                    // Crear civilizationManager compatibility layer
                    window.civilizationManager = {
                        getCivilization: (civilizationId) => dataLoader.getCivilizationData(civilizationId),
                        getStartingResources: (civilizationId) => {
                            const civ = dataLoader.getCivilizationData(civilizationId);
                            return civ?.startingResources || {};
                        },
                        applyBuildingBonuses: (building, civilizationId) => building,
                        applyUnitBonuses: (unit, civilizationId) => {
                            const civ = dataLoader.getCivilizationData(civilizationId);
                            if (civ && civ.bonuses) {
                                if (civ.bonuses.unitSpeed) {
                                    unit.speed = (unit.speed || 100) * civ.bonuses.unitSpeed;
                                }
                            }
                            return unit;
                        },
                        getTeamColor: (civilizationId) => {
                            const civ = dataLoader.getCivilizationData(civilizationId);
                            return civ?.color || '#4169E1';
                        },
                        getBuildSpeed: (civilizationId) => {
                            const civ = dataLoader.getCivilizationData(civilizationId);
                            return civ?.bonuses?.buildSpeed || 1;
                        }
                    };

                    populateCivilizations();
                } else {
                    debugLogger.error('dataLoader no se pudo cargar', 'data');
                }
            }, 200);
        }
    } catch (error) {
        debugLogger.error('Error inicializando dataLoader', 'data', error);
    }

    // Botón de inicio - ir a selección de tamaño de mapa
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', (e) => {
            // Prevenir múltiples clics
            if (startButton.classList.contains('btn-loading')) return;

            // Guardar contenido original (nodos) para evitar XSS con innerHTML
            const originalChildren = [];
            while (startButton.firstChild) {
                originalChildren.push(startButton.firstChild);
                startButton.removeChild(startButton.firstChild);
            }

            // Estado de carga
            startButton.classList.add('btn-loading');
            startButton.setAttribute('aria-busy', 'true');
            startButton.disabled = true;

            const spinner = document.createElement('span');
            spinner.className = 'spinner';
            const loadingText = document.createTextNode(' Cargando...');

            startButton.appendChild(spinner);
            startButton.appendChild(loadingText);

            debugLogger.info('Mostrando selección de tamaño de mapa', 'ui');

            // Simular carga breve para feedback visual (UX)
            setTimeout(() => {
                document.getElementById('startScreen').classList.add('hidden');
                const mapScreen = document.getElementById('mapSizeScreen');
                mapScreen.classList.remove('hidden');

                // Restaurar botón (por si el usuario vuelve atrás)
                startButton.classList.remove('btn-loading');
                startButton.removeAttribute('aria-busy');
                startButton.disabled = false;

                // Limpiar estado de carga y restaurar nodos originales
                startButton.textContent = '';
                originalChildren.forEach(child => startButton.appendChild(child));

                // Move focus with a small tick to ensure visibility
                setTimeout(() => FocusManager.focusFirst(mapScreen), 0);
            }, 600);
        });
    }

    // Botón de volver al inicio desde selección de mapa
    const backToStartButton = document.getElementById('backToStartButton');
    if (backToStartButton) {
        backToStartButton.addEventListener('click', () => {
            document.getElementById('mapSizeScreen').classList.add('hidden');
            document.getElementById('startScreen').classList.remove('hidden');

            // Palette: Restore focus to Start Button
            const startBtn = document.getElementById('startButton');
            if (startBtn) setTimeout(() => startBtn.focus(), 50);
        });
    }

    // Botón de volver a selección de mapa desde civilización
    const backToMapSizeButton = document.getElementById('backToMapSizeButton');
    if (backToMapSizeButton) {
        backToMapSizeButton.addEventListener('click', () => {
            document.getElementById('civSelectionScreen').classList.add('hidden');
            document.getElementById('mapSizeScreen').classList.remove('hidden');

            // Palette: Restore focus to Map Size options
            // Try to focus the selected option, or fallback to container
            let targetFocus = null;
            if (typeof selectedMapSize !== 'undefined') {
                targetFocus = document.querySelector(`.map-size-option[data-size="${selectedMapSize}"]`);
            }
            if (!targetFocus) {
                targetFocus = document.getElementById('mapSizeScreen');
            }

            if (targetFocus) {
                if (targetFocus.classList.contains('map-size-option')) {
                    setTimeout(() => targetFocus.focus(), 50);
                } else {
                    setTimeout(() => FocusManager.focusFirst(targetFocus), 50);
                }
            }
        });
    }

    // Botón de volver al menú desde game over
    const returnMenuButton = document.getElementById('returnMenuButton');
    if (returnMenuButton) {
        returnMenuButton.addEventListener('click', () => {
            loadMainMenu();
        });
    }

    // Botón de jugar de nuevo desde game over
    const playAgainButton = document.getElementById('playAgainButton');
    if (playAgainButton) {
        playAgainButton.addEventListener('click', () => {
            playAgain();
        });
    }

    // Cargar assets en background
    debugLogger.info('Iniciando carga de assets...', 'assets');
    assetLoader.loadAll().then(() => {
        debugLogger.success('Todos los assets cargados', 'assets');
        // Repopulate civs to update icons if they were loaded after initial population
        populateCivilizations();
        // Update tech tree if visible
        const techScreen = document.getElementById('techTreeScreen');
        if (techScreen && !techScreen.classList.contains('hidden')) {
            if (game) renderTechTree(); else renderStaticTechTree();
        }
    }).catch(err => {
        debugLogger.error('Error cargando assets', 'assets', err);
    });

    // Inicializar sonidos si soundManager está disponible
    if (typeof soundManager !== 'undefined') {
        debugLogger.info('Inicializando sistema de sonido...', 'sound');
        if (typeof soundManager.init === 'function') {
            soundManager.init();
        }
    }

    // Global Keydown Handler for Escape (UX Improvement)
    document.addEventListener('keydown', (e) => {
        // Toggle Shortcuts Help
        if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
            // Check if no other modal is open
            const settings = document.getElementById('settingsScreen');
            const techTree = document.getElementById('techTreeScreen');
            const shortcuts = document.getElementById('shortcutsScreen');

            if (shortcuts && !shortcuts.classList.contains('hidden')) {
                hideShortcuts();
            } else if ((!settings || settings.classList.contains('hidden')) &&
                (!techTree || techTree.classList.contains('hidden'))) {
                showShortcuts();
            }
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        if (e.key === 'Escape') {
            const settings = document.getElementById('settingsScreen');
            const techTree = document.getElementById('techTreeScreen');
            const shortcuts = document.getElementById('shortcutsScreen');
            const mapSize = document.getElementById('mapSizeScreen');
            const civSelection = document.getElementById('civSelectionScreen');
            const gameScreen = document.getElementById('gameScreen');

            // 1. Close Modals (Settings, Tech Tree, Shortcuts)
            if (shortcuts && !shortcuts.classList.contains('hidden')) {
                hideShortcuts();
                e.stopImmediatePropagation();
                return;
            }
            if (settings && !settings.classList.contains('hidden')) {
                hideSettings();
                e.stopImmediatePropagation();
                return;
            }
            if (techTree && !techTree.classList.contains('hidden')) {
                hideTechTree();
                e.stopImmediatePropagation();
                return;
            }

            // 2. Navigation Back (Only if NOT in game)
            if (gameScreen && gameScreen.classList.contains('hidden')) {
                if (civSelection && !civSelection.classList.contains('hidden')) {
                    // Back to Map Size
                    const backBtn = document.getElementById('backToMapSizeButton');
                    if (backBtn) backBtn.click();
                    e.stopImmediatePropagation();
                    return;
                }
                if (mapSize && !mapSize.classList.contains('hidden')) {
                    // Back to Start
                    const backBtn = document.getElementById('backToStartButton');
                    if (backBtn) backBtn.click();
                    e.stopImmediatePropagation();
                    return;
                }
            }
        }
    });

    // Renderizar tech tree estático para preview
    renderStaticTechTree();

    debugLogger.success('Inicialización completada', 'game');
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ===== EXPORTS (para debugging en consola) =====
window.debugLogger = debugLogger;
window.CONFIG = CONFIG;
window.TILE_SIZE = TILE_SIZE;
window.MAP_SIZES = MAP_SIZES;
window.TERRAIN_TYPES = TERRAIN_TYPES;

debugLogger.info('main.js cargado correctamente', 'game');
