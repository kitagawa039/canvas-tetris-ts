// テトリミノの形状定義
const SHAPES = {
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

// 色の定義
const COLORS = {
    T: '#800080',
    O: '#FFFF00',
    I: '#00FFFF',
    L: '#FFA500',
    J: '#0000FF',
    S: '#00FF00',
    Z: '#FF0000'
};

class Tetris {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private grid: number[][];
    private currentPiece: { shape: number[][]; x: number; y: number; type: string } = {
        shape: [],
        x: 0,
        y: 0,
        type: ''
    };
    private score: number;
    private gameOver: boolean;
    private blockSize: number;
    private dropInterval: number;
    private lastDrop: number;

    constructor() {
        this.canvas = document.getElementById('tetris') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.blockSize = 20;
        this.grid = Array(20).fill(null).map(() => Array(10).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.dropInterval = 1000;
        this.lastDrop = 0;

        this.init();
    }

    private init(): void {
        this.spawnPiece();
        this.setupControls();
        this.gameLoop();
    }

    private spawnPiece(): void {
        const types = Object.keys(SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        this.currentPiece = {
            shape: SHAPES[type as keyof typeof SHAPES],
            x: Math.floor((10 - SHAPES[type as keyof typeof SHAPES][0].length) / 2),
            y: 0,
            type
        };

        if (this.checkCollision()) {
            this.gameOver = true;
        }
    }

    private setupControls(): void {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;

            switch (e.key) {
                case 'ArrowLeft':
                    this.move(-1);
                    break;
                case 'ArrowRight':
                    this.move(1);
                    break;
                case 'ArrowDown':
                    this.softDrop();
                    break;
                case 'ArrowUp':
                    this.rotate();
                    break;
            }
        });
    }

    private move(dx: number): void {
        this.currentPiece.x += dx;
        if (this.checkCollision()) {
            this.currentPiece.x -= dx;
        }
    }

    private rotate(): void {
        const originalShape = this.currentPiece.shape;
        const rows = originalShape.length;
        const cols = originalShape[0].length;
        const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = originalShape[y][x];
            }
        }

        this.currentPiece.shape = rotated;
        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }
    }

    private softDrop(): void {
        this.currentPiece.y++;
        if (this.checkCollision()) {
            this.currentPiece.y--;
            this.lockPiece();
            this.clearLines();
            this.spawnPiece();
        }
    }

    private checkCollision(): boolean {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;

                    if (
                        boardX < 0 ||
                        boardX >= 10 ||
                        boardY >= 20 ||
                        (boardY >= 0 && this.grid[boardY][boardX])
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private lockPiece(): void {
        const shape = this.currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.grid[boardY][boardX] = 1;
                    }
                }
            }
        }
    }

    private clearLines(): void {
        for (let y = this.grid.length - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell === 1)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(10).fill(0));
                this.score += 100;
            }
        }
    }

    private draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // グリッドの描画
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x]) {
                    this.drawBlock(x, y, '#333');
                }
            }
        }

        // 現在のピースの描画
        if (this.currentPiece) {
            const shape = this.currentPiece.shape;
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            COLORS[this.currentPiece.type as keyof typeof COLORS]
                        );
                    }
                }
            }
        }

        // スコアの表示
        this.ctx.fillStyle = '#000';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.fillText('GAME OVER', 50, this.canvas.height / 2);
        }
    }

    private drawBlock(x: number, y: number, color: string): void {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 1,
            this.blockSize - 1
        );
    }

    private gameLoop(timestamp: number = 0): void {
        if (!this.gameOver) {
            if (timestamp - this.lastDrop > this.dropInterval) {
                this.softDrop();
                this.lastDrop = timestamp;
            }
        }
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// ゲームの開始
new Tetris(); 