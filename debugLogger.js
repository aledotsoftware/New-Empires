// ==========================================
// DEBUG LOGGER - Sistema centralizado de logging
// ==========================================

class DebugLogger {
    constructor() {
        // Configuración de debug (puede ser modificada desde la consola)
        this.config = {
            enabled: true,           // Habilitar/deshabilitar logs
            showTimestamp: true,     // Mostrar timestamp en logs
            showStackTrace: false,   // Mostrar stack trace en errores
            logLevel: 'info',        // 'debug', 'info', 'warn', 'error'
            categories: {
                game: true,
                assets: true,
                sound: true,
                data: true,
                ui: true,
                performance: true
            }
        };

        // Niveles de log (para filtrado)
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };

        // Estadísticas de errores
        this.stats = {
            errors: 0,
            warnings: 0,
            lastError: null,
            errorHistory: []
        };

        // Cargar configuración desde localStorage si existe
        this.loadConfig();
    }

    /**
     * Carga la configuración de debug desde localStorage
     */
    loadConfig() {
        try {
            const saved = localStorage.getItem('debugConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(this.config, parsed);
            }
        } catch (e) {
            // Ignorar errores de localStorage
        }
    }

    /**
     * Guarda la configuración actual en localStorage
     */
    saveConfig() {
        try {
            localStorage.setItem('debugConfig', JSON.stringify(this.config));
        } catch (e) {
            // Ignorar errores de localStorage
        }
    }

    /**
     * Verifica si un log debe mostrarse según el nivel y categoría
     */
    shouldLog(level, category) {
        if (!this.config.enabled) return false;
        if (category && !this.config.categories[category]) return false;
        return this.levels[level] >= this.levels[this.config.logLevel];
    }

    /**
     * Formatea el mensaje con timestamp y categoría
     */
    formatMessage(level, category, message) {
        let prefix = '';

        if (this.config.showTimestamp) {
            const now = new Date();
            const time = now.toLocaleTimeString('es-AR', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                fractionalSecondDigits: 3
            });
            prefix += `[${time}]`;
        }

        if (category) {
            prefix += `[${category.toUpperCase()}]`;
        }

        return `${prefix} ${message}`;
    }

    /**
     * Log de debug (nivel más bajo)
     */
    debug(message, category = null, data = null) {
        if (!this.shouldLog('debug', category)) return;

        const formatted = this.formatMessage('debug', category, message);
        console.log(`🔍 ${formatted}`, data || '');
    }

    /**
     * Log de información
     */
    info(message, category = null, data = null) {
        if (!this.shouldLog('info', category)) return;

        const formatted = this.formatMessage('info', category, message);
        console.log(`ℹ️ ${formatted}`, data || '');
    }

    /**
     * Log de advertencia
     */
    warn(message, category = null, data = null) {
        if (!this.shouldLog('warn', category)) return;

        this.stats.warnings++;
        const formatted = this.formatMessage('warn', category, message);
        console.warn(`⚠️ ${formatted}`, data || '');
    }

    /**
     * Log de error con información detallada
     */
    error(message, category = null, error = null, context = null) {
        if (!this.shouldLog('error', category)) return;

        this.stats.errors++;
        this.stats.lastError = {
            message,
            category,
            timestamp: Date.now(),
            error: error?.message || null,
            context
        };

        // Mantener historial de últimos 10 errores
        this.stats.errorHistory.unshift(this.stats.lastError);
        if (this.stats.errorHistory.length > 10) {
            this.stats.errorHistory.pop();
        }

        const formatted = this.formatMessage('error', category, message);

        if (error) {
            console.error(`❌ ${formatted}`, {
                error: error.message,
                stack: this.config.showStackTrace ? error.stack : undefined,
                context
            });
        } else {
            console.error(`❌ ${formatted}`, context || '');
        }
    }

    /**
     * Log de éxito (operación completada)
     */
    success(message, category = null, data = null) {
        if (!this.shouldLog('info', category)) return;

        const formatted = this.formatMessage('info', category, message);
        console.log(`✅ ${formatted}`, data || '');
    }

    /**
     * Log de inicio de operación
     */
    start(message, category = null) {
        if (!this.shouldLog('info', category)) return;

        const formatted = this.formatMessage('info', category, message);
        console.log(`🔄 ${formatted}`);
    }

    /**
     * Medir rendimiento de una operación
     */
    time(label, category = 'performance') {
        if (!this.shouldLog('debug', category)) return;
        console.time(`⏱️ [${category.toUpperCase()}] ${label}`);
    }

    /**
     * Finalizar medición de rendimiento
     */
    timeEnd(label, category = 'performance') {
        if (!this.shouldLog('debug', category)) return;
        console.timeEnd(`⏱️ [${category.toUpperCase()}] ${label}`);
    }

    /**
     * Agrupa logs relacionados
     */
    group(label, category = null) {
        if (!this.shouldLog('info', category)) return;
        const formatted = this.formatMessage('info', category, label);
        console.group(formatted);
    }

    /**
     * Cierra grupo de logs
     */
    groupEnd() {
        console.groupEnd();
    }

    /**
     * Muestra estadísticas de debug
     */
    showStats() {
        console.log('📊 Estadísticas de Debug:', {
            errores: this.stats.errors,
            advertencias: this.stats.warnings,
            ultimoError: this.stats.lastError,
            configuracion: this.config
        });
    }

    /**
     * Muestra el historial de errores
     */
    showErrorHistory() {
        console.table(this.stats.errorHistory);
    }

    /**
     * Habilita/deshabilita una categoría específica
     */
    toggleCategory(category, enabled = null) {
        if (this.config.categories.hasOwnProperty(category)) {
            this.config.categories[category] = enabled !== null ? enabled : !this.config.categories[category];
            this.saveConfig();
            console.log(`📝 Categoría '${category}' ${this.config.categories[category] ? 'habilitada' : 'deshabilitada'}`);
        }
    }

    /**
     * Establece el nivel de log
     */
    setLogLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.config.logLevel = level;
            this.saveConfig();
            console.log(`📝 Nivel de log establecido a: ${level}`);
        }
    }

    /**
     * Habilita/deshabilita el sistema de debug
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        this.saveConfig();
        console.log(`📝 Sistema de debug ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }

    /**
     * Reinicia las estadísticas
     */
    resetStats() {
        this.stats = {
            errors: 0,
            warnings: 0,
            lastError: null,
            errorHistory: []
        };
        console.log('🔄 Estadísticas reiniciadas');
    }
}

// Instancia global del logger
const debugLogger = new DebugLogger();

// Exponer en window para acceso desde consola
window.debugLogger = debugLogger;

// Comandos de consola útiles
console.log(`
🎮 Sistema de Debug Inicializado
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Comandos disponibles en consola:

  debugLogger.showStats()              - Mostrar estadísticas
  debugLogger.showErrorHistory()       - Ver historial de errores
  debugLogger.setLogLevel('debug')     - Cambiar nivel (debug/info/warn/error)
  debugLogger.toggleCategory('sound')  - Activar/desactivar categoría
  debugLogger.setEnabled(false)        - Deshabilitar todo el logging
  debugLogger.resetStats()             - Reiniciar estadísticas

Categorías: game, assets, sound, data, ui, performance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
