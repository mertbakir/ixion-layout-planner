import { Grid } from '../grid/Grid';
import { BuildingInstance } from '../buildings/BuildingInstance';
import { Building } from '../buildings/Building';
import { GridRenderer } from './GridRenderer';
import { BuildingRenderer } from './BuildingRenderer';
import { RoadRenderer } from './RoadRenderer';

const BACKGROUND_COLOR = '#000000';

export class CanvasRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cellSize: number;
  offsetX: number;
  offsetY: number;

  gridRenderer: GridRenderer;
  buildingRenderer: BuildingRenderer;
  roadRenderer: RoadRenderer;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas element with id ${canvasId} not found`);
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;

    this.gridRenderer = new GridRenderer();
    this.buildingRenderer = new BuildingRenderer();
    this.roadRenderer = new RoadRenderer();

    this.cellSize = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;

    // Set logical size
    const logicalWidth = window.innerWidth;
    const logicalHeight = window.innerHeight - 80; // Subtract header height

    // Reset transform before scaling
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Set physical canvas size
    this.canvas.width = logicalWidth * dpr;
    this.canvas.height = logicalHeight * dpr;

    // Scale context to match physical size
    this.ctx.scale(dpr, dpr);

    // Set CSS size to match logical size
    this.canvas.style.width = logicalWidth + 'px';
    this.canvas.style.height = logicalHeight + 'px';

    // Calculate cell size to fit grid on screen
    const maxCellWidth = (logicalWidth - 40) / 56; // 56 columns + padding
    const maxCellHeight = (logicalHeight - 40) / 30; // 30 rows + padding
    this.cellSize = Math.floor(Math.min(maxCellWidth, maxCellHeight));

    // Center the grid
    const gridWidth = 56 * this.cellSize;
    const gridHeight = 30 * this.cellSize;
    this.offsetX = (logicalWidth - gridWidth) / 2;
    this.offsetY = (logicalHeight - gridHeight) / 2;
  }

  clear(): void {
    const logicalWidth = window.innerWidth;
    const logicalHeight = window.innerHeight - 80;
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  }

  render(grid: Grid, buildings: BuildingInstance[], showInactiveIndicators: boolean = false): void {
    this.clear();

    this.gridRenderer.render(
      this.ctx,
      grid,
      this.cellSize,
      this.offsetX,
      this.offsetY
    );

    this.roadRenderer.render(
      this.ctx,
      grid,
      this.cellSize,
      this.offsetX,
      this.offsetY
    );

    // Render buildings
    for (const building of buildings) {
      this.buildingRenderer.renderInstance(
        this.ctx,
        building,
        this.cellSize,
        this.offsetX,
        this.offsetY,
        false,
        grid,
        showInactiveIndicators
      );
    }
  }

  renderGhostBuilding(
    building: Building,
    row: number,
    col: number,
    rotation: number,
    grid?: Grid
  ): void {
    this.buildingRenderer.renderPreview(
      this.ctx,
      building,
      row,
      col,
      rotation,
      this.cellSize,
      this.offsetX,
      this.offsetY,
      true,
      grid
    );
  }

  renderInvalidPreview(
    building: Building,
    row: number,
    col: number,
    rotation: number,
    grid?: Grid
  ): void {
    this.buildingRenderer.renderPreview(
      this.ctx,
      building,
      row,
      col,
      rotation,
      this.cellSize,
      this.offsetX,
      this.offsetY,
      false,
      grid
    );
  }

  renderRoadPreview(
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    isDelete: boolean = false
  ): void {
    this.roadRenderer.renderRoadPreview(
      this.ctx,
      startRow,
      startCol,
      endRow,
      endCol,
      this.cellSize,
      this.offsetX,
      this.offsetY,
      isDelete
    );
  }

  screenToGrid(screenX: number, screenY: number): [number, number] | null {
    const col = Math.floor((screenX - this.offsetX) / this.cellSize);
    const row = Math.floor((screenY - this.offsetY) / this.cellSize);

    if (row >= 0 && row < 30 && col >= 0 && col < 56) {
      return [row, col];
    }
    return null;
  }

  getCanvasOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }

  getCellSize(): number {
    return this.cellSize;
  }
}
