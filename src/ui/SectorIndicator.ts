export class SectorIndicator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentSector: number = 1;
  private logicalWidth: number = 0;
  private logicalHeight: number = 0;

  constructor() {
    this.canvas = document.getElementById('sector-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Sector canvas element not found');
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;

    this.setupHighDpi();
  }

  private setupHighDpi(): void {
    const dpr = window.devicePixelRatio || 1;

    // Get the logical size from the existing canvas size
    this.logicalWidth = this.canvas.width;
    this.logicalHeight = this.canvas.height;

    // Set physical canvas size
    this.canvas.width = this.logicalWidth * dpr;
    this.canvas.height = this.logicalHeight * dpr;

    // Scale context to match physical size
    this.ctx.scale(dpr, dpr);

    // Set CSS size to match logical size
    this.canvas.style.width = this.logicalWidth + 'px';
    this.canvas.style.height = this.logicalHeight + 'px';
  }

  setSector(sector: number): void {
    this.currentSector = sector;
    this.draw();
  }

  private draw(): void {
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    const centerX = w / 2;
    const centerY = h / 2;
    const outerRadius = w / 2.4;
    const innerRadius = w / 4;

    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, w, h);

    // Draw 6 sectors, each 60 degrees
    const sectorAngle = (Math.PI * 2) / 6; // 60 degrees in radians
    // Shift by -30 degrees to center sector 1 at top (12 o'clock)
    const startOffset = (Math.PI * 3) / 2 - Math.PI / 6; // 270° - 30°

    for (let i = 1; i <= 6; i++) {
      const startAngle = startOffset + (i - 1) * sectorAngle;
      const endAngle = startAngle + sectorAngle;

      // Draw sector
      this.ctx.save();

      // Set color - highlight current sector
      if (i === this.currentSector) {
        this.ctx.fillStyle = '#00cc44'; // Green for active sector
      } else {
        this.ctx.fillStyle = '#333'; // Dark gray for inactive
      }

      // Draw outer arc
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      this.ctx.lineTo(
        centerX + Math.cos(endAngle) * innerRadius,
        centerY + Math.sin(endAngle) * innerRadius
      );

      // Draw inner arc (backwards to create donut)
      this.ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      this.ctx.closePath();
      this.ctx.fill();

      // Draw border
      this.ctx.strokeStyle = '#222';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Draw sector number
      const midAngle = startAngle + sectorAngle / 2;
      const labelRadius = (outerRadius + innerRadius) / 2;
      const labelX = centerX + Math.cos(midAngle) * labelRadius;
      const labelY = centerY + Math.sin(midAngle) * labelRadius;

      this.ctx.fillStyle = i === this.currentSector ? '#000' : '#aaa';
      this.ctx.font = 'bold 11px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(i.toString(), labelX, labelY);

      this.ctx.restore();
    }
  }
}
