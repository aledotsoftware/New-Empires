// Legacy shim: el juego usa game.js directamente (archivo raíz)
// El módulo js/core/Game.js está en desarrollo y tiene errores de sintaxis
// Por ahora, la clase Game ya está definida globalmente en game.js
// Este archivo solo confirma que Game está disponible

(function () {
    // Verificar que Game esté disponible después de que game.js se cargue
    const checkGame = () => {
        if (typeof Game !== 'undefined') {
            window.Game = Game;
            console.log('✅ game.legacy.js: Game disponible globalmente');
        } else {
            console.log('ℹ️ game.legacy.js: Game se cargará desde game.js');
        }
    };

    // Ejecutar después de que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkGame);
    } else {
        setTimeout(checkGame, 100);
    }
})();
