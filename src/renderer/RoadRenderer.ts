import { Grid } from '../grid/Grid';
import { CellType } from '../grid/Cell';

const ROAD_COLOR = '#B8B8A8';
const ROAD_PREVIEW_COLOR = 'rgba(184, 184, 168, 0.5)';
const ROAD_DELETE_PREVIEW_COLOR = 'rgba(255, 100, 100, 0.5)';

export class RoadRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    grid: Grid,
    cellSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    for (let row = 0; row < grid.height; row++) {
      for (let col = 0; col < grid.width; col++) {
        const cell = grid.cells[row][col];
        if (cell.data.type === CellType.Road) {
          const x = offsetX + col * cellSize;
          const y = offsetY + row * cellSize;

          ctx.fillStyle = ROAD_COLOR;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }

  renderRoadPreview(
    ctx: CanvasRenderingContext2D,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    cellSize: number,
    offsetX: number,
    offsetY: number,
    isDelete: boolean = false
  ): void {
    const cells = this.getRoadCells(startRow, startCol, endRow, endCol);
    ctx.fillStyle = isDelete ? ROAD_DELETE_PREVIEW_COLOR : ROAD_PREVIEW_COLOR;

    for (const [r, c] of cells) {
      if (r >= 0 && r < 30 && c >= 0 && c < 56) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }

  private getRoadCells(startRow: number, startCol: number, endRow: number, endCol: number): Array<[number, number]> {
    const cells: Array<[number, number]> = [];

    if (startRow === endRow) {
      // Horizontal road
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      for (let c = minCol; c <= maxCol; c++) {
        cells.push([startRow, c]);
      }
    } else if (startCol === endCol) {
      // Vertical road
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      for (let r = minRow; r <= maxRow; r++) {
        cells.push([r, startCol]);
      }
    }

    return cells;
  }
}
