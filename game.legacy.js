// Legacy shim: expone la clase `Game` como global para scripts antiguos
(async function () {
    try {
        const mod = await import('./js/core/Game.js');
        if (mod && mod.Game) {
            window.Game = mod.Game;
            console.log('✅ game.legacy.js: Game exportado como global');
        } else {
            console.warn('⚠️ game.legacy.js: módulo Game no tiene export llamado Game');
        }
    } catch (err) {
        console.error('❌ game.legacy.js: error importando js/core/Game.js', err);
    }
})();
