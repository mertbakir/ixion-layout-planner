import { Cell, CellType } from './Cell';

const GRID_WIDTH = 56;
const GRID_HEIGHT = 30;

// Connection points at rows 5, 14, 17, 26 (0-indexed: 4, 13, 16, 25)
// and columns 1 and 56 (0-indexed: 0 and 55)
const CONNECTION_ROWS = [4, 13, 16, 25];
const CONNECTION_COLS = [0, 55];

export class Grid {
  cells: Cell[][];
  width: number;
  height: number;

  constructor() {
    this.width = GRID_WIDTH;
    this.height = GRID_HEIGHT;
    this.cells = [];
    this.initialize();
  }

  private initialize(): void {
    for (let row = 0; row < this.height; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.width; col++) {
        const isConnection =
          CONNECTION_ROWS.includes(row) && CONNECTION_COLS.includes(col);
        const cellType = isConnection ? CellType.Connection : CellType.Empty;
        this.cells[row][col] = new Cell(cellType);
      }
    }
  }

  getCell(row: number, col: number): Cell | null {
    if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
      return null;
    }
    return this.cells[row][col];
  }

  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.height && col >= 0 && col < this.width;
  }

  clear(): void {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (this.cells[row][col].isConnection()) {
          this.cells[row][col].data.type = CellType.Connection;
        } else {
          this.cells[row][col].clear();
        }
      }
    }
  }
}
