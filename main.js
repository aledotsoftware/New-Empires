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

// ===== FUNCIONES DE UI (expuestas globalmente) =====

/**
 * Muestra el árbol de tecnologías
 */
window.showTechTree = function () {
    debugLogger.info('Abriendo árbol de tecnologías', 'ui');
    const screen = document.getElementById('techTreeScreen');
    screen.classList.remove('hidden');

    // Renderizar tech tree si el juego está activo
    if (game && game.techManager) {
        renderTechTree();
    } else {
        renderStaticTechTree();
    }
};

/**
 * Oculta el árbol de tecnologías
 */
window.hideTechTree = function () {
    debugLogger.info('Cerrando árbol de tecnologías', 'ui');
    document.getElementById('techTreeScreen').classList.add('hidden');
};

/**
 * Muestra la pantalla de configuración
 */
window.showSettings = function () {
    debugLogger.info('Abriendo configuración', 'ui');
    document.getElementById('settingsScreen').classList.remove('hidden');
};

/**
 * Oculta la pantalla de configuración
 */
window.hideSettings = function () {
    debugLogger.info('Cerrando configuración', 'ui');
    document.getElementById('settingsScreen').classList.add('hidden');
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
 * Regresa al menú principal
 */
window.loadMainMenu = function () {
    debugLogger.info('Volviendo al menú principal', 'ui');

    // Ocultar todas las pantallas
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('settingsScreen').classList.add('hidden');
    document.getElementById('techTreeScreen').classList.add('hidden');
    document.getElementById('mapSizeScreen').classList.add('hidden');
    document.getElementById('civSelectionScreen').classList.add('hidden');

    // Mostrar pantalla de inicio
    document.getElementById('startScreen').classList.remove('hidden');

    // Limpiar el juego si existe
    if (game) {
        game = null;
    }
};

/**
 * Renderiza el árbol de tecnologías (estático, sin juego activo)
 */
function renderStaticTechTree() {
    const content = document.getElementById('techTreeContent');
    if (!content) return;

    // Verificar si TECHNOLOGIES está disponible y es iterable
    if (typeof TECHNOLOGIES === 'undefined' || !Array.isArray(TECHNOLOGIES)) {
        content.innerHTML = '<p style="text-align: center; color: #999;">Árbol de tecnologías no disponible</p>';
        return;
    }

    // Agrupar por categoría
    const categories = {
        economy: [],
        military: [],
        defense: []
    };

    for (let tech of TECHNOLOGIES) {
        if (categories[tech.category]) {
            categories[tech.category].push(tech);
        }
    }

    let html = '';

    // Renderizar cada categoría
    for (let [category, techs] of Object.entries(categories)) {
        if (techs.length === 0) continue;

        const categoryNames = {
            economy: '💰 Economía',
            military: '⚔️ Militar',
            defense: '🛡️ Defensa'
        };

        html += `<div class="tech-category">`;
        html += `<h3>${categoryNames[category]}</h3>`;
        html += `<div class="tech-grid">`;

        for (let tech of techs) {
            html += `
                <div class="tech-item locked">
                    <div class="tech-icon">${tech.icon || '🔬'}</div>
                    <div class="tech-name">${tech.name}</div>
                    <div class="tech-desc">${tech.description}</div>
                    <div class="tech-cost">
                        ${Object.entries(tech.cost).map(([res, amount]) => {
                const icons = { food: '🌾', wood: '🪵', gold: '💰', stone: '🪨' };
                return `${icons[res] || res}: ${amount}`;
            }).join(' | ')}
                    </div>
                </div>
            `;
        }

        html += `</div></div>`;
    }

    content.innerHTML = html;
}

/**
 * Renderiza el árbol de tecnologías con estado del juego
 */
function renderTechTree() {
    const content = document.getElementById('techTreeContent');
    if (!content || !game || !game.techManager) return;

    const categories = {
        economy: [],
        military: [],
        defense: []
    };

    for (let tech of TECHNOLOGIES) {
        if (categories[tech.category]) {
            categories[tech.category].push(tech);
        }
    }

    let html = '';

    for (let [category, techs] of Object.entries(categories)) {
        if (techs.length === 0) continue;

        const categoryNames = {
            economy: '💰 Economía',
            military: '⚔️ Militar',
            defense: '🛡️ Defensa'
        };

        html += `<div class="tech-category">`;
        html += `<h3>${categoryNames[category]}</h3>`;
        html += `<div class="tech-grid">`;

        for (let tech of techs) {
            const status = game.techManager.getResearchStatus(tech.id);
            const canResearch = game.techManager.canResearch(tech.id);

            let statusClass = 'locked';
            if (status.researched) statusClass = 'researched';
            else if (status.researching) statusClass = 'researching';
            else if (canResearch) statusClass = 'available';

            html += `
                <div class="tech-item ${statusClass}" 
                     onclick="if(game && game.techManager && game.techManager.canResearch('${tech.id}')) { game.techManager.startResearch('${tech.id}'); renderTechTree(); }">
                    <div class="tech-icon">${tech.icon || '🔬'}</div>
                    <div class="tech-name">${tech.name}</div>
                    <div class="tech-desc">${tech.description}</div>
                    <div class="tech-cost">
                        ${Object.entries(tech.cost).map(([res, amount]) => {
                const icons = { food: '🌾', wood: '🪵', gold: '💰', stone: '🪨' };
                return `${icons[res] || res}: ${amount}`;
            }).join(' | ')}
                    </div>
                    ${status.researching ? `<div class="tech-progress">Investigando...</div>` : ''}
                </div>
            `;
        }

        html += `</div></div>`;
    }

    content.innerHTML = html;
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

    // Crear instancia del juego
    game = new Game(civId, mapConfig);

    // Exponer game globalmente para compatibilidad con HTML (onclick handlers)
    window.game = game;

    // Ocultar pantallas de selección
    document.getElementById('civSelectionScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('mapSizeScreen').classList.add('hidden');

    // Mostrar pantalla de juego
    document.getElementById('gameScreen').classList.remove('hidden');

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
 * Genera dinámicamente las opciones de tamaño de mapa
 */
function populateMapSizes() {
    const mapSizeGrid = document.getElementById('mapSizeGrid');
    if (!mapSizeGrid) return;

    mapSizeGrid.innerHTML = ''; // Limpiar contenido existente

    // Generar botones desde MAP_SIZES
    for (let [key, mapData] of Object.entries(MAP_SIZES)) {
        const option = document.createElement('div');
        option.className = 'map-size-option';
        option.dataset.size = key;

        option.innerHTML = `
            <div class="size-icon">🗺️</div>
            <div class="size-name">${mapData.name}</div>
            <div class="size-desc">${mapData.width}×${mapData.height}</div>
        `;

        // Agregar event listener al crear el elemento
        option.addEventListener('click', () => {
            selectedMapSize = key;
            debugLogger.info(`Tamaño de mapa seleccionado: ${key}`, 'ui');

            // Ir a selección de civilización
            document.getElementById('mapSizeScreen').classList.add('hidden');
            document.getElementById('civSelectionScreen').classList.remove('hidden');
        });

        mapSizeGrid.appendChild(option);
    }

    debugLogger.info(`${Object.keys(MAP_SIZES).length} tamaños de mapa generados`, 'ui');
}

/**
 * Genera dinámicamente las opciones de civilización
 */
function populateCivilizations() {
    const civGrid = document.getElementById('civGrid');
    if (!civGrid || typeof dataLoader === 'undefined') {
        debugLogger.warn('No se puede popular civilizaciones - civGrid o dataLoader no disponibles', 'ui');
        return;
    }

    civGrid.innerHTML = ''; // Limpiar contenido existente

    const civilizations = dataLoader.getAllCivilizations();

    if (!civilizations || civilizations.length === 0) {
        debugLogger.warn('No hay civilizaciones disponibles', 'data');
        civGrid.innerHTML = '<p style="color: white; text-align: center;">No se pudieron cargar las civilizaciones.</p>';
        return;
    }

    civilizations.forEach(civ => {
        const option = document.createElement('div');
        option.className = 'civ-option';
        option.dataset.civ = civ.id;

        option.innerHTML = `
            <div class="civ-icon">${civ.icon}</div>
            <div class="civ-name">${civ.name}</div>
            <div class="civ-desc">${civ.description}</div>
        `;

        // Agregar event listener al crear el elemento
        option.addEventListener('click', () => {
            selectedCivilization = civ.id;
            debugLogger.info(`Civilización seleccionada: ${civ.id}`, 'ui');

            // Obtener configuración del mapa
            const mapConfig = MAP_SIZES[selectedMapSize] || MAP_SIZES.normal;

            // Iniciar juego
            startGame(civ.id, {
                ...mapConfig,
                seed: Date.now(),
                numPlayers: 2,
                biome: 'grassland',
                style: 'continental'
            });
        });

        civGrid.appendChild(option);
    });

    debugLogger.success(`${civilizations.length} civilizaciones cargadas`, 'ui');
}

/**
 * Genera dinámicamente las opciones de civilización
 */
function populateCivilizations() {
    const civGrid = document.getElementById('civGrid');
    if (!civGrid || typeof dataLoader === 'undefined') return;

    civGrid.innerHTML = ''; // Limpiar contenido existente

    const civilizations = dataLoader.getAllCivilizations();

    civilizations.forEach(civ => {
        const option = document.createElement('div');
        option.className = 'civ-option';
        option.dataset.civ = civ.id;

        option.innerHTML = `
            <div class="civ-icon">${civ.icon}</div>
            <div class="civ-name">${civ.name}</div>
            <div class="civ-desc">${civ.description}</div>
        `;

        civGrid.appendChild(option);
    });
}


// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', async () => {
    debugLogger.info('DOM cargado, inicializando juego...', 'game');

    // Generar opciones de tamaño de mapa dinámicamente
    populateMapSizes();

    // Inicializar dataLoader y cargar civilizaciones
    try {
        if (typeof dataLoader !== 'undefined') {
            debugLogger.info('Inicializando dataLoader...', 'data');
            await dataLoader.initialize();
            populateCivilizations();
        } else {
            debugLogger.warn('dataLoader no disponible, reintentando...', 'data');
            // Fallback: Si dataLoader aún no está cargado, esperar un poco
            setTimeout(async () => {
                if (typeof dataLoader !== 'undefined') {
                    await dataLoader.initialize();
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
        startButton.addEventListener('click', () => {
            debugLogger.info('Mostrando selección de tamaño de mapa', 'ui');
            document.getElementById('startScreen').classList.add('hidden');
            document.getElementById('mapSizeScreen').classList.remove('hidden');
        });
    }

    // Botón de volver al inicio desde selección de mapa
    const backToStartButton = document.getElementById('backToStartButton');
    if (backToStartButton) {
        backToStartButton.addEventListener('click', () => {
            document.getElementById('mapSizeScreen').classList.add('hidden');
            document.getElementById('startScreen').classList.remove('hidden');
        });
    }

    // Botón de volver a selección de mapa desde civilización
    const backToMapSizeButton = document.getElementById('backToMapSizeButton');
    if (backToMapSizeButton) {
        backToMapSizeButton.addEventListener('click', () => {
            document.getElementById('civSelectionScreen').classList.add('hidden');
            document.getElementById('mapSizeScreen').classList.remove('hidden');
        });
    }

    // Botón de reiniciar desde game over
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            loadMainMenu();
        });
    }

    // Cargar assets en background
    debugLogger.info('Iniciando carga de assets...', 'assets');
    assetLoader.loadAll().then(() => {
        debugLogger.success('Todos los assets cargados', 'assets');
    }).catch(err => {
        debugLogger.error('Error cargando assets', 'assets', err);
    });

    // Inicializar sonidos si soundManager está disponible
    if (typeof soundManager !== 'undefined' && typeof soundManager.init === 'function') {
        debugLogger.info('Inicializando sistema de sonido...', 'sound');
        soundManager.init();
    }

    // Renderizar tech tree estático para preview
    renderStaticTechTree();

    debugLogger.success('Inicialización completada', 'game');
});

// ===== EXPORTS (para debugging en consola) =====
window.debugLogger = debugLogger;
window.CONFIG = CONFIG;
window.TILE_SIZE = TILE_SIZE;
window.MAP_SIZES = MAP_SIZES;
window.TERRAIN_TYPES = TERRAIN_TYPES;

debugLogger.info('main.js cargado correctamente', 'game');
