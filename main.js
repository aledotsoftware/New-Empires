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

    // Mover foco al modal
    setTimeout(() => FocusManager.focusFirst(screen), 50);
};

/**
 * Oculta el árbol de tecnologías
 */
window.hideTechTree = function () {
    debugLogger.info('Cerrando árbol de tecnologías', 'ui');
    document.getElementById('techTreeScreen').classList.add('hidden');
    FocusManager.restoreFocus();
};

/**
 * Muestra la pantalla de configuración
 */
window.showSettings = function () {
    debugLogger.info('Abriendo configuración', 'ui');
    FocusManager.saveFocus();

    const screen = document.getElementById('settingsScreen');
    screen.classList.remove('hidden');

    // Mover foco al modal (botón cerrar o primer input)
    setTimeout(() => FocusManager.focusFirst(screen), 50);
};

/**
 * Oculta la pantalla de configuración
 */
window.hideSettings = function () {
    debugLogger.info('Cerrando configuración', 'ui');
    document.getElementById('settingsScreen').classList.add('hidden');
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
            economy: 'Economía',
            military: 'Militar',
            defense: 'Defensa'
        };

        html += `<div class="tech-category">`;
        html += `<h3>${categoryNames[category]}</h3>`;
        html += `<div class="tech-grid">`;

        for (let tech of techs) {
            // Helper for resources icons
            const getResIcon = (res) => {
                if (assetLoader && assetLoader.getSrc) {
                    const src = assetLoader.getSrc(res);
                    if (src) return `<img src="${src}" style="width:16px;height:16px;vertical-align:middle;margin-right:2px;">`;
                }
                // fallback if assetLoader not ready (unlikely here) or no asset
                return `<span style="font-size:10px">${res.substring(0, 1)}</span>`;
            };

            const techIcon = (assetLoader && assetLoader.getSrc && assetLoader.getSrc(tech.id))
                ? `<img src="${assetLoader.getSrc(tech.id)}" class="tech-icon-img">`
                : `<div class="tech-icon-placeholder">T</div>`;

            html += `
                <div class="tech-item locked">
                    <div class="tech-icon">${techIcon}</div>
                    <div class="tech-name">${tech.name}</div>
                    <div class="tech-desc">${tech.description}</div>
                    <div class="tech-cost">
                        ${Object.entries(tech.cost).map(([res, amount]) => {
                return `<span style="display:inline-flex;align-items:center;margin-right:5px;">${amount}${getResIcon(res)}</span>`;
            }).join(' ')}
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
            economy: 'Economía',
            military: 'Militar',
            defense: 'Defensa'
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

            // Helper for resources icons
            const getResIcon = (res) => {
                if (assetLoader && assetLoader.getSrc) {
                    const src = assetLoader.getSrc(res);
                    if (src) return `<img src="${src}" style="width:16px;height:16px;vertical-align:middle;margin-right:2px;">`;
                }
                return `<span style="font-size:10px">${res.substring(0, 1)}</span>`;
            };

            const techIcon = (assetLoader && assetLoader.getSrc && assetLoader.getSrc(tech.id))
                ? `<img src="${assetLoader.getSrc(tech.id)}" class="tech-icon-img">`
                : `<div class="tech-icon-placeholder">T</div>`;


            html += `
                <div class="tech-item ${statusClass}" 
                     onclick="if(game && game.techManager && game.techManager.canResearch('${tech.id}')) { game.techManager.startResearch('${tech.id}'); renderTechTree(); }">
                    <div class="tech-icon">${techIcon}</div>
                    <div class="tech-name">${tech.name}</div>
                    <div class="tech-desc">${tech.description}</div>
                    <div class="tech-cost">
                        ${Object.entries(tech.cost).map(([res, amount]) => {
                return `<span style="display:inline-flex;align-items:center;margin-right:5px;">${amount}${getResIcon(res)}</span>`;
            }).join(' ')}
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

        // Icono seguro usando DOM
        const iconDiv = document.createElement('div');
        iconDiv.className = 'size-icon';

        const mapIconDiv = document.createElement('div');
        mapIconDiv.style.cssText = 'width:40px;height:40px;background:#444;border:1px solid #666;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;color:#888;';
        mapIconDiv.textContent = 'Map';
        iconDiv.appendChild(mapIconDiv);

        const nameDiv = document.createElement('div');
        nameDiv.className = 'size-name';
        nameDiv.textContent = mapData.name;

        const descDiv = document.createElement('div');
        descDiv.className = 'size-desc';
        descDiv.textContent = `${mapData.width}×${mapData.height}`;

        option.appendChild(iconDiv);
        option.appendChild(nameDiv);
        option.appendChild(descDiv);

        // Accessibility attributes
        option.setAttribute('role', 'button');
        option.setAttribute('tabindex', '0');
        option.setAttribute('aria-label', `Seleccionar mapa ${mapData.name} (${mapData.width} por ${mapData.height} casillas)`);

        // Tooltip description
        let sizeDesc = '';
        if (mapData.width * mapData.height <= 144 * 144) sizeDesc = 'Mapa rápido para partidas cortas.';
        else if (mapData.width * mapData.height <= 200 * 200) sizeDesc = 'Tamaño estándar equilibrado.';
        else sizeDesc = 'Mapa extenso para partidas largas.';

        option.title = `${mapData.name}: ${mapData.width}x${mapData.height} casillas.\n${sizeDesc}`;

        // Keyboard support
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                option.click();
            }
        });

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
        option.title = `${civ.name}\n${civ.description.substring(0, 100)}${civ.description.length > 100 ? '...' : ''}`;

        // Keyboard support
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                option.click();
            }
        });

        // Agregar event listener al crear el elemento
        const selectCiv = () => {
            selectedCivilization = civ.civilizationId;
            debugLogger.info(`Civilizacion seleccionada: ${civ.civilizationId}`, 'ui');

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

const initApp = async () => {
    debugLogger.info('DOM cargado, inicializando juego...', 'game');

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
        startButton.addEventListener('click', () => {
            debugLogger.info('Mostrando selección de tamaño de mapa', 'ui');
            document.getElementById('startScreen').classList.add('hidden');
            const mapScreen = document.getElementById('mapSizeScreen');
            mapScreen.classList.remove('hidden');

            // Move focus
            setTimeout(() => FocusManager.focusFirst(mapScreen), 50);
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
