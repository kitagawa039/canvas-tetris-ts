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
    private nextBlockCanvas: HTMLCanvasElement;
    private nextBlockCtx: CanvasRenderingContext2D;
    private grid: number[][];
    private currentPiece: { shape: number[][]; x: number; y: number; type: string } = {
        shape: [],
        x: 0,
        y: 0,
        type: ''
    };
    private nextPiece: { shape: number[][]; type: string } = {
        shape: [],
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
        this.nextBlockCanvas = document.getElementById('next-block') as HTMLCanvasElement;
        this.nextBlockCtx = this.nextBlockCanvas.getContext('2d')!;
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

    private generateRandomPiece(): { shape: number[][]; type: string } {
        const types = Object.keys(SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            shape: SHAPES[type as keyof typeof SHAPES],
            type
        };
    }

    private spawnPiece(): void {
        if (!this.nextPiece.shape.length) {
            this.nextPiece = this.generateRandomPiece();
        }
        
        this.currentPiece = {
            shape: this.nextPiece.shape,
            x: Math.floor((10 - this.nextPiece.shape[0].length) / 2),
            y: 0,
            type: this.nextPiece.type
        };
        
        this.nextPiece = this.generateRandomPiece();

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

                    // boardX >= 10 を boardX >= this.grid[0].length に変更
                    // boardY >= 20 を boardY >= this.grid.length に変更
                    if (
                        boardX < 0 ||
                        boardX >= this.grid[0].length ||
                        boardY >= this.grid.length ||
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
                        this.grid[boardY][boardX] = this.currentPiece.type as any;
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

    private drawGrid(): void {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        
        for (let y = 0; y <= this.grid.length; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }
        
        for (let x = 0; x <= 10; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
    }

    private drawNextBlock(): void {
        this.nextBlockCtx.clearRect(0, 0, this.nextBlockCanvas.width, this.nextBlockCanvas.height);
        
        this.nextBlockCtx.fillStyle = '#1a1a1a';
        this.nextBlockCtx.fillRect(0, 0, this.nextBlockCanvas.width, this.nextBlockCanvas.height);
        
        this.nextBlockCtx.fillStyle = '#fff';
        this.nextBlockCtx.font = '16px Arial';
        this.nextBlockCtx.fillText('Next Block', 20, 20);
        
        if (this.nextPiece && this.nextPiece.shape.length) {
            const blockSize = 20;
            const offsetX = (this.nextBlockCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextBlockCanvas.height - this.nextPiece.shape.length * blockSize) / 2 + 10;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.nextBlockCtx.fillStyle = COLORS[this.nextPiece.type as keyof typeof COLORS];
                        this.nextBlockCtx.fillRect(
                            offsetX + x * blockSize,
                            offsetY + y * blockSize,
                            blockSize - 1,
                            blockSize - 1
                        );
                    }
                }
            }
        }
    }

    private draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();

        // グリッドの描画
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x]) {
                    const pieceType = this.grid[y][x] as unknown as string;
                    const color = pieceType && COLORS[pieceType as keyof typeof COLORS] ? 
                                COLORS[pieceType as keyof typeof COLORS] : '#555';
                    this.drawBlock(x, y, color);
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
        
        this.drawNextBlock();

        // スコアの表示
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, 50);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
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