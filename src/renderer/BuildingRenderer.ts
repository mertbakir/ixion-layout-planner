import { BuildingInstance } from '../buildings/BuildingInstance';
import { Building } from '../buildings/Building';
import { Grid } from '../grid/Grid';
import { CellType } from '../grid/Cell';
import { AdjacencyConfig } from '../config/types';

const BUILDING_BORDER_WIDTH = 2;
const BUILDING_OPACITY = 1;
const GHOST_OPACITY = 0.5;
const INVALID_COLOR = '#ff4444';
const ARROW_COLOR_DEFAULT = '#ffff00'; // Yellow
const ARROW_COLOR_CONNECTED = '#00cc44'; // Green
const ARROW_SIZE = 1 / 5; // Relative to cell size
const TEXT_COLOR_LIGHT = '#000000';
const TEXT_COLOR_DARK = '#ffffff';
const TEXT_SHADOW_COLOR = 'rgba(0, 0, 0, 0.3)';
const ADJACENCY_INDICATOR_INACTIVE = '#444444'; // Dark gray
const ADJACENCY_INDICATOR_ACTIVE = '#00aa22'; // Darker green
const ADJACENCY_INDICATOR_SIZE = 0.15; // Relative to cell size

function darkenColor(hexColor: string, percent: number = 0.35): string {
  const hex = hexColor.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.max(0, Math.floor(r * (1 - percent)));
  g = Math.max(0, Math.floor(g * (1 - percent)));
  b = Math.max(0, Math.floor(b * (1 - percent)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export class BuildingRenderer {
  renderInstance(
    ctx: CanvasRenderingContext2D,
    instance: BuildingInstance,
    cellSize: number,
    offsetX: number,
    offsetY: number,
    isGhost: boolean = false,
    grid?: Grid,
    showInactiveIndicators: boolean = false
  ): void {
    const [height, width] = instance.getDimensions();
    const x = offsetX + instance.col * cellSize;
    const y = offsetY + instance.row * cellSize;

    ctx.save();
    ctx.globalAlpha = isGhost ? GHOST_OPACITY : BUILDING_OPACITY;

    ctx.fillStyle = instance.building.color;
    ctx.fillRect(x, y, width * cellSize, height * cellSize);

    ctx.strokeStyle = darkenColor(instance.building.color);
    ctx.lineWidth = BUILDING_BORDER_WIDTH;
    ctx.strokeRect(x, y, width * cellSize, height * cellSize);

    ctx.restore();

    // Render building name text
    this.renderBuildingText(
      ctx,
      instance,
      x,
      y,
      width,
      height,
      cellSize,
      isGhost
    );

    // Render adjacency indicators
    if (!isGhost && grid) {
      this.renderAdjacencyIndicators(ctx, instance, x, y, cellSize, grid, showInactiveIndicators);
    }

    // Render entry points
    this.renderEntryPoints(
      ctx,
      instance,
      cellSize,
      offsetX,
      offsetY,
      isGhost
    );
  }

  renderPreview(
    ctx: CanvasRenderingContext2D,
    building: Building,
    row: number,
    col: number,
    rotation: number,
    cellSize: number,
    offsetX: number,
    offsetY: number,
    isValid: boolean = true,
    grid?: Grid
  ): void {
    const [height, width] = building.getDimensions(rotation);
    const x = offsetX + col * cellSize;
    const y = offsetY + row * cellSize;

    ctx.save();
    ctx.globalAlpha = GHOST_OPACITY;

    ctx.fillStyle = isValid ? building.color : INVALID_COLOR;
    ctx.fillRect(x, y, width * cellSize, height * cellSize);

    ctx.strokeStyle = darkenColor(isValid ? building.color : INVALID_COLOR);
    ctx.lineWidth = BUILDING_BORDER_WIDTH;
    ctx.strokeRect(x, y, width * cellSize, height * cellSize);

    ctx.restore();

    // Render building name text on preview
    this.renderBuildingTextForPreview(
      ctx,
      building,
      x,
      y,
      width,
      height,
      cellSize
    );

    // Render entry points for preview
    this.renderPreviewEntryPoints(
      ctx,
      building,
      row,
      col,
      rotation,
      cellSize,
      offsetX,
      offsetY,
      grid
    );
  }

  private renderPreviewEntryPoints(
    ctx: CanvasRenderingContext2D,
    building: Building,
    row: number,
    col: number,
    rotation: number,
    cellSize: number,
    offsetX: number,
    offsetY: number,
    grid?: Grid
  ): void {
    const [height, width] = building.getDimensions(rotation);
    const adjacency = building.getRotatedAdjacency(rotation);
    const arrowSize = cellSize * ARROW_SIZE;

    // Helper to convert edge value to array
    const edgeToArray = (edge: any, length: number): number[] => {
      if (Array.isArray(edge)) {
        return edge;
      }
      return Array(length).fill(edge);
    };

    // Top edge
    const tArr = edgeToArray(adjacency.t, width);
    for (let c = 0; c < width; c++) {
      if (tArr[c] === 1) {
        const x = offsetX + (col + c) * cellSize + cellSize / 2;
        const y = offsetY + row * cellSize - arrowSize / 2;
        const color = this.checkAdjacentRoad(grid, row - 1, col + c)
          ? ARROW_COLOR_CONNECTED
          : ARROW_COLOR_DEFAULT;
        this.drawOutwardArrow(ctx, x, y, arrowSize, 'up', color);
      }
    }

    // Bottom edge
    const bArr = edgeToArray(adjacency.b, width);
    for (let c = 0; c < width; c++) {
      if (bArr[c] === 1) {
        const x = offsetX + (col + c) * cellSize + cellSize / 2;
        const y = offsetY + (row + height) * cellSize + arrowSize / 2;
        const color = this.checkAdjacentRoad(grid, row + height, col + c)
          ? ARROW_COLOR_CONNECTED
          : ARROW_COLOR_DEFAULT;
        this.drawOutwardArrow(ctx, x, y, arrowSize, 'down', color);
      }
    }

    // Left edge
    const lArr = edgeToArray(adjacency.l, height);
    for (let r = 0; r < height; r++) {
      if (lArr[r] === 1) {
        const x = offsetX + col * cellSize - arrowSize / 2;
        const y = offsetY + (row + r) * cellSize + cellSize / 2;
        const color = this.checkAdjacentRoad(grid, row + r, col - 1)
          ? ARROW_COLOR_CONNECTED
          : ARROW_COLOR_DEFAULT;
        this.drawOutwardArrow(ctx, x, y, arrowSize, 'left', color);
      }
    }

    // Right edge
    const rArr = edgeToArray(adjacency.r, height);
    for (let r = 0; r < height; r++) {
      if (rArr[r] === 1) {
        const x = offsetX + (col + width) * cellSize + arrowSize / 2;
        const y = offsetY + (row + r) * cellSize + cellSize / 2;
        const color = this.checkAdjacentRoad(grid, row + r, col + width)
          ? ARROW_COLOR_CONNECTED
          : ARROW_COLOR_DEFAULT;
        this.drawOutwardArrow(ctx, x, y, arrowSize, 'right', color);
      }
    }
  }

  private checkAdjacentRoad(grid: Grid | undefined, row: number, col: number): boolean {
    if (!grid || row < 0 || row >= grid.height || col < 0 || col >= grid.width) {
      return false;
    }
    const cell = grid.cells[row][col];
    return cell.data.type === CellType.Road;
  }

  private renderEntryPoints(
    ctx: CanvasRenderingContext2D,
    instance: BuildingInstance,
    cellSize: number,
    offsetX: number,
    offsetY: number,
    isGhost: boolean
  ): void {
    // Don't render entry points for placed buildings
    return;
  }

  private drawOutwardArrow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    direction: 'up' | 'down' | 'left' | 'right',
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    ctx.translate(x, y);

    // Rotate based on direction
    const rotations: Record<string, number> = {
      up: 0,
      right: Math.PI / 2,
      down: Math.PI,
      left: (3 * Math.PI) / 2,
    };
    ctx.rotate(rotations[direction]);

    // Draw isosceles triangle pointing up after rotation
    // Wide base (2x height), pointing upward
    ctx.beginPath();
    ctx.moveTo(0, -size); // Top point
    ctx.lineTo(2 * size, size); // Bottom right (wide)
    ctx.lineTo(-2 * size, size); // Bottom left (wide)
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private isColorLight(hexColor: string): boolean {
    // Parse hex color and calculate luminance
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance using standard formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxHeight: number,
    initialFontSize: number
  ): { lines: string[]; fontSize: number } {
    let fontSize = initialFontSize;
    const minFontSize = 10;

    while (fontSize >= minFontSize) {
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;

      // Split by spaces and hyphens to get words
      const words = text.split(/[\s-]+/).filter(w => w.length > 0);

      if (words.length === 0) {
        return { lines: [], fontSize };
      }

      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      // Check if the text fits in the available height
      const lineHeight = fontSize * 1.2;
      const totalHeight = lines.length * lineHeight;

      if (totalHeight <= maxHeight) {
        return { lines, fontSize };
      }

      fontSize *= 0.9;
    }

    return { lines: [], fontSize: minFontSize };
  }

  private renderBuildingText(
    ctx: CanvasRenderingContext2D,
    instance: BuildingInstance,
    x: number,
    y: number,
    width: number,
    height: number,
    cellSize: number,
    isGhost: boolean = false
  ): void {
    const buildingName = instance.building.name;
    const buildingColor = instance.building.color;

    const centerX = x + (width * cellSize) / 2;
    const centerY = y + (height * cellSize) / 2;

    const maxWidth = width * cellSize - 8;
    const maxHeight = height * cellSize - 8;
    const initialFontSize = cellSize * 0.55;

    const { lines, fontSize } = this.wrapText(
      ctx,
      buildingName,
      maxWidth,
      maxHeight,
      initialFontSize
    );

    if (lines.length === 0) {
      return;
    }

    ctx.save();

    // Apply ghost opacity if needed
    if (isGhost) {
      ctx.globalAlpha = GHOST_OPACITY;
    }

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.isColorLight(buildingColor) ? TEXT_COLOR_LIGHT : TEXT_COLOR_DARK;

    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = centerY - totalHeight / 2;

    for (let i = 0; i < lines.length; i++) {
      const lineY = startY + i * lineHeight + lineHeight / 2;
      ctx.fillText(lines[i], centerX, lineY);
    }

    ctx.restore();
  }

  private renderBuildingTextForPreview(
    ctx: CanvasRenderingContext2D,
    building: Building,
    x: number,
    y: number,
    width: number,
    height: number,
    cellSize: number
  ): void {
    const buildingName = building.name;
    const buildingColor = building.color;

    const centerX = x + (width * cellSize) / 2;
    const centerY = y + (height * cellSize) / 2;

    const maxWidth = width * cellSize - 8;
    const maxHeight = height * cellSize - 8;
    const initialFontSize = cellSize * 0.55;

    const { lines, fontSize } = this.wrapText(
      ctx,
      buildingName,
      maxWidth,
      maxHeight,
      initialFontSize
    );

    if (lines.length === 0) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = GHOST_OPACITY;

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.isColorLight(buildingColor) ? TEXT_COLOR_LIGHT : TEXT_COLOR_DARK;

    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = centerY - totalHeight / 2;

    for (let i = 0; i < lines.length; i++) {
      const lineY = startY + i * lineHeight + lineHeight / 2;
      ctx.fillText(lines[i], centerX, lineY);
    }

    ctx.restore();
  }

  private renderAdjacencyIndicators(
    ctx: CanvasRenderingContext2D,
    instance: BuildingInstance,
    x: number,
    y: number,
    cellSize: number,
    grid: Grid,
    showInactiveIndicators: boolean
  ): void {
    const adjacency = instance.getAdjacency();
    const [height, width] = instance.getDimensions();
    const indicatorRadius = cellSize * ADJACENCY_INDICATOR_SIZE;

    // First pass: check if there's at least one active indicator
    let hasActiveIndicator = false;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (adjacency[r][c] === 1) {
          const worldRow = instance.row + r;
          const worldCol = instance.col + c;
          if (this.hasAdjacentRoad(grid, worldRow, worldCol, r, c, height, width)) {
            hasActiveIndicator = true;
            break;
          }
        }
      }
      if (hasActiveIndicator) break;
    }

    // Second pass: render indicators
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        // Only render indicators for cells with adjacency
        if (adjacency[r][c] === 1) {
          const worldRow = instance.row + r;
          const worldCol = instance.col + c;
          const cellX = x + c * cellSize + cellSize / 2;
          const cellY = y + r * cellSize + cellSize / 2;

          // Check if adjacent to a road
          const isConnected = this.hasAdjacentRoad(grid, worldRow, worldCol, r, c, height, width);

          // Decide whether to render this indicator
          let shouldRender = false;
          if (isConnected) {
            // Always render active indicators
            shouldRender = true;
          } else if (!hasActiveIndicator) {
            // If no active indicators exist, show all inactive (auto-show)
            shouldRender = true;
          } else if (showInactiveIndicators) {
            // If there are active indicators but user toggled T, show inactive too
            shouldRender = true;
          }

          if (shouldRender) {
            const color = isConnected ? ADJACENCY_INDICATOR_ACTIVE : ADJACENCY_INDICATOR_INACTIVE;

            // Draw indicator dot
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cellX, cellY, indicatorRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  private hasAdjacentRoad(
    grid: Grid,
    worldRow: number,
    worldCol: number,
    cellRow: number,
    cellCol: number,
    buildingHeight: number,
    buildingWidth: number
  ): boolean {
    const cellType = CellType.Road;

    // Check top edge - look above building
    if (cellRow === 0) {
      if (worldRow > 0 && grid.cells[worldRow - 1][worldCol].data.type === cellType) {
        return true;
      }
    }

    // Check bottom edge - look below building
    if (cellRow === buildingHeight - 1) {
      if (worldRow < grid.height - 1 && grid.cells[worldRow + 1][worldCol].data.type === cellType) {
        return true;
      }
    }

    // Check left edge - look left of building
    if (cellCol === 0) {
      if (worldCol > 0 && grid.cells[worldRow][worldCol - 1].data.type === cellType) {
        return true;
      }
    }

    // Check right edge - look right of building
    if (cellCol === buildingWidth - 1) {
      if (worldCol < grid.width - 1 && grid.cells[worldRow][worldCol + 1].data.type === cellType) {
        return true;
      }
    }

    return false;
  }
}
