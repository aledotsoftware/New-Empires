const GameMock = {
    fow: { invTileSize: 0.05, isVisible: () => true },
    enemies: Array.from({length: 1000}, (_, i) => ({
        x: i * 10, y: i * 10, _lastGridCol: -1, _lastGridRow: -1
    })),
    minimapCtx: {
        fillStyle: '',
        beginPath: () => {},
        rect: () => {},
        fill: () => {}
    }
};

const scale = 0.1;

console.time("enemies loop");
for(let iter=0; iter<10000; iter++) {
    GameMock.minimapCtx.fillStyle = '#c53030';
    GameMock.minimapCtx.beginPath();
    const enemiesLen = GameMock.enemies.length;

    const fow = GameMock.fow;
    const invTileSize = fow.invTileSize;

    for (let i = 0; i < enemiesLen; i++) {
        const enemy = GameMock.enemies[i];
        const col = (enemy._lastGridCol !== -1) ? enemy._lastGridCol : (enemy.x * invTileSize) | 0;
        const row = (enemy._lastGridRow !== -1) ? enemy._lastGridRow : (enemy.y * invTileSize) | 0;

        if (!fow.isVisible(col, row)) {
            continue;
        }

        const x = (enemy.x * scale) | 0;
        const y = (enemy.y * scale) | 0;
        GameMock.minimapCtx.rect(x - 1, y - 1, 2, 2);
    }
    GameMock.minimapCtx.fill();
}
console.timeEnd("enemies loop");
