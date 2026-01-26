import { Grid } from '../grid/Grid';
import { CellType } from '../grid/Cell';

const GRID_LINE_COLOR = '#333';
const CONNECTION_COLOR = '#4a7c59';
const CONNECTION_BORDER_WIDTH = 2;
const RESTRICTED_COLOR = '#cc0000';
const GRID_LINE_WIDTH = 1;
const LABEL_COLOR = '#888';
const CONNECTION_LABEL_COLOR = '#00cc44';
const RESTRICTED_LABEL_COLOR = '#ff0000';
const LABEL_FONT_SIZE = 10;

export class GridRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    grid: Grid,
    cellSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    this.renderCells(ctx, grid, cellSize, offsetX, offsetY);
    this.renderGridLines(ctx, grid, cellSize, offsetX, offsetY);
    this.renderLabels(ctx, grid, cellSize, offsetX, offsetY);
  }

  private renderCells(
    ctx: CanvasRenderingContext2D,
    grid: Grid,
    cellSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    // Connection cells are now indicated by borders and colored labels, not cell coloring
  }

  private renderGridLines(
    ctx: CanvasRenderingContext2D,
    grid: Grid,
    cellSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = GRID_LINE_WIDTH;

    // Vertical lines
    for (let col = 0; col <= grid.width; col++) {
      const x = offsetX + col * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, offsetY + grid.height * cellSize);
      ctx.stroke();
    }

    // Horizontal lines
    for (let row = 0; row <= grid.height; row++) {
      const y = offsetY + row * cellSize;
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + grid.width * cellSize, y);
      ctx.stroke();
    }

    // Connection row borders (left and right)
    const connectionRows = [4, 13, 16, 25]; // 0-indexed: rows 5, 14, 17, 26
    ctx.strokeStyle = CONNECTION_COLOR;
    ctx.lineWidth = CONNECTION_BORDER_WIDTH;

    for (const row of connectionRows) {
      if (row >= 0 && row < grid.height) {
        const y = offsetY + row * cellSize;

        // Left border
        ctx.beginPath();
        ctx.moveTo(offsetX, y);
        ctx.lineTo(offsetX, y + cellSize);
        ctx.stroke();

        // Right border
        ctx.beginPath();
        ctx.moveTo(offsetX + grid.width * cellSize, y);
        ctx.lineTo(offsetX + grid.width * cellSize, y + cellSize);
        ctx.stroke();
      }
    }

    // Restricted column borders (top and bottom) - columns 25-32 (0-indexed: 24-31)
    const restrictedColStart = 24; // 0-indexed: column 25
    const restrictedColEnd = 31; // 0-indexed: column 32
    ctx.strokeStyle = RESTRICTED_COLOR;
    ctx.lineWidth = CONNECTION_BORDER_WIDTH;

    // Top border
    ctx.beginPath();
    ctx.moveTo(offsetX + restrictedColStart * cellSize, offsetY);
    ctx.lineTo(offsetX + (restrictedColEnd + 1) * cellSize, offsetY);
    ctx.stroke();

    // Bottom border
    ctx.beginPath();
    ctx.moveTo(offsetX + restrictedColStart * cellSize, offsetY + grid.height * cellSize);
    ctx.lineTo(offsetX + (restrictedColEnd + 1) * cellSize, offsetY + grid.height * cellSize);
    ctx.stroke();
  }

  private renderLabels(
    ctx: CanvasRenderingContext2D,
    grid: Grid,
    cellSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    ctx.save();
    ctx.font = `${LABEL_FONT_SIZE}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const connectionRows = [4, 13, 16, 25]; // 0-indexed: rows 5, 14, 17, 26
    const restrictedColStart = 24; // 0-indexed: column 25
    const restrictedColEnd = 31; // 0-indexed: column 32

    // Column numbers (top) - 1 to 56
    for (let col = 0; col < grid.width; col++) {
      const x = offsetX + col * cellSize + cellSize / 2;
      const y = offsetY - cellSize / 2;
      ctx.fillStyle = (col >= restrictedColStart && col <= restrictedColEnd) ? RESTRICTED_LABEL_COLOR : LABEL_COLOR;
      ctx.fillText((col + 1).toString(), x, y);
    }

    // Column numbers (bottom) - 56 to 1 (reversed)
    for (let col = 0; col < grid.width; col++) {
      const x = offsetX + col * cellSize + cellSize / 2;
      const y = offsetY + grid.height * cellSize + cellSize / 2;
      ctx.fillStyle = (col >= restrictedColStart && col <= restrictedColEnd) ? RESTRICTED_LABEL_COLOR : LABEL_COLOR;
      ctx.fillText((grid.width - col).toString(), x, y);
    }

    // Row numbers (left) - 1 to 30 with connection row coloring
    for (let row = 0; row < grid.height; row++) {
      const x = offsetX - cellSize / 2;
      const y = offsetY + row * cellSize + cellSize / 2;
      ctx.fillStyle = connectionRows.includes(row) ? CONNECTION_LABEL_COLOR : LABEL_COLOR;
      ctx.fillText((row + 1).toString(), x, y);
    }

    // Row numbers (right) - 30 to 1 (reversed) with connection row coloring
    for (let row = 0; row < grid.height; row++) {
      const x = offsetX + grid.width * cellSize + cellSize / 2;
      const y = offsetY + row * cellSize + cellSize / 2;
      ctx.fillStyle = connectionRows.includes(row) ? CONNECTION_LABEL_COLOR : LABEL_COLOR;
      ctx.fillText((grid.height - row).toString(), x, y);
    }

    ctx.restore();
  }
}
