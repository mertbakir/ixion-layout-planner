import { SavedLayout, SerializedBuilding, SerializedSector } from '../storage/LayoutStorage';

export class LayoutPreviewGenerator {
  private static readonly PREVIEW_WIDTH = 600;
  private static readonly PREVIEW_HEIGHT = 100;
  private static readonly SECTOR_WIDTH = 100;
  private static readonly CELL_SIZE = 10;
  private static readonly GRID_SIZE = 10; // 10x10 cells per sector

  private static previewCache: Map<string, string> = new Map();

  static generatePreview(layout: SavedLayout): string {
    const layoutId = layout.metadata.id;

    // Return cached preview if available
    if (this.previewCache.has(layoutId)) {
      return this.previewCache.get(layoutId)!;
    }

    // Create off-screen canvas
    const canvas = document.createElement('canvas');
    canvas.width = this.PREVIEW_WIDTH;
    canvas.height = this.PREVIEW_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.PREVIEW_WIDTH, this.PREVIEW_HEIGHT);

    // Draw each sector side-by-side
    for (let i = 0; i < layout.data.sectors.length; i++) {
      const sector = layout.data.sectors[i];
      const offsetX = i * this.SECTOR_WIDTH;
      this.drawSector(ctx, sector, offsetX, 0);
    }

    const dataUrl = canvas.toDataURL();
    this.previewCache.set(layoutId, dataUrl);

    return dataUrl;
  }

  private static drawSector(ctx: CanvasRenderingContext2D, sector: SerializedSector, offsetX: number, offsetY: number): void {
    // Draw grid background
    ctx.fillStyle = '#111';
    ctx.fillRect(offsetX, offsetY, this.SECTOR_WIDTH, this.PREVIEW_HEIGHT);

    // Draw grid lines
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.GRID_SIZE; i++) {
      const x = offsetX + (i * this.CELL_SIZE);
      const y = offsetY + (i * this.CELL_SIZE);

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, offsetY + this.PREVIEW_HEIGHT);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + this.SECTOR_WIDTH, y);
      ctx.stroke();
    }

    // Draw roads
    ctx.fillStyle = '#444';
    for (const road of sector.roads) {
      const x = offsetX + (road.col * this.CELL_SIZE);
      const y = offsetY + (road.row * this.CELL_SIZE);
      ctx.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
    }

    // Draw buildings
    for (const building of sector.buildings) {
      this.drawBuilding(ctx, building, offsetX, offsetY);
    }
  }

  private static drawBuilding(
    ctx: CanvasRenderingContext2D,
    building: SerializedBuilding,
    offsetX: number,
    offsetY: number
  ): void {
    // Use different colors for different building categories (simplified)
    const colors: { [key: string]: string } = {
      housing: '#e74c3c',
      industry: '#f39c12',
      service: '#3498db',
      culture: '#9b59b6',
      governance: '#1abc9c',
      food: '#27ae60',
    };

    // Extract category from building name or use a default
    let color = '#95a5a6';
    for (const [category, categoryColor] of Object.entries(colors)) {
      if (building.buildingName.toLowerCase().includes(category)) {
        color = categoryColor;
        break;
      }
    }

    const x = offsetX + (building.col * this.CELL_SIZE);
    const y = offsetY + (building.row * this.CELL_SIZE);

    // Draw building rectangle (scaled to single cell)
    ctx.fillStyle = color;
    ctx.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);

    // Add border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
  }

  static clearCache(): void {
    this.previewCache.clear();
  }

  static getCacheSize(): number {
    return this.previewCache.size;
  }
}
