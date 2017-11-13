const makeGrid = () => {
    const grid = [];

    const nW = Math.ceil((env.right - env.left) / env.re);
    const nH = Math.ceil((env.bottom - env.top) / env.re);

    for (let i = 0; i < nW; i++) {
        const po = [];
        for (let j = 0; j < nH; j++) {
            po.push([]);
        }
        grid.push(po);
    }

    grid.clear = () => {
        for (let i = 0; i < nW; i++) {
            for (let j = 0; j < nH; j++) {
                grid[i][j] = [];
            }
        }
    };
    grid.register = (o) => {
        const nx = Math.max(0, Math.min(nW-1, Math.floor((o.pos.x - env.left) / env.re)));
        const ny = Math.max(0, Math.min(nH-1, Math.floor((o.pos.y - env.top) / env.re)));
        grid[nx][ny].push(o);
    };

    grid.getNears = o => {
        const nx = Math.max(0, Math.min(nW-1, Math.floor((o.pos.x - env.left) / env.re)));
        const ny = Math.max(0, Math.min(nH-1, Math.floor((o.pos.y - env.top) / env.re)));
        const nears = [];
        for (let i = -1; i <= 1; i++) {
            if (nx+i < 0) continue;
            if (nx+i >= nW) continue;
            for (let j = -1; j <= 1; j++) {
                if (ny+j < 0) continue;
                if (ny+j >= nH) continue;
                grid[nx+i][ny+j].forEach(p => {
                    if (o == p) return;
                    if (distance(o,p) > env.re) return;
                    nears.push(p);
                });
            }
        }
        return nears;
    };

    return grid;
};
