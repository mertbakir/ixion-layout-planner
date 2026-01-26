import { BuildingConfig, AdjacencyConfig, AdjacencyEdge } from '../config/types';
import { rotateNTimes, getMatrixDimensions } from './rotation';

export class Building {
  name: string;
  baseAdjacency: AdjacencyConfig;
  width: number;
  height: number;
  color: string;
  requiresWall: boolean;

  constructor(name: string, config: BuildingConfig) {
    this.name = name;
    this.baseAdjacency = config.adjacency;
    this.color = config.color;
    this.requiresWall = config['requires-wall'] ?? false;

    // Parse size from "RxC" format (rows x columns, mathematical notation)
    const [rows, cols] = config.size.toLowerCase().split('x').map(s => parseInt(s, 10));
    this.height = rows || 1;  // rows = height
    this.width = cols || 1;   // columns = width
  }

  private edgeToArray(edge: AdjacencyEdge, length: number): number[] {
    if (Array.isArray(edge)) {
      return edge;
    }
    // Single value (0 or 1) applies to all cells
    return Array(length).fill(edge);
  }

  private convertToMatrix(rotation: number): number[][] {
    const adj = this.rotateAdjacency(this.baseAdjacency, rotation);
    const [h, w] = this.getDimensions(rotation);

    const matrix: number[][] = [];
    for (let r = 0; r < h; r++) {
      matrix[r] = Array(w).fill(0);
    }

    // Top edge
    const tArr = this.edgeToArray(adj.t, w);
    for (let c = 0; c < w; c++) {
      matrix[0][c] = Math.max(matrix[0][c], tArr[c] ?? 0);
    }

    // Bottom edge
    if (h > 1) {
      const bArr = this.edgeToArray(adj.b, w);
      for (let c = 0; c < w; c++) {
        matrix[h - 1][c] = Math.max(matrix[h - 1][c], bArr[c] ?? 0);
      }
    }

    // Left edge
    const lArr = this.edgeToArray(adj.l, h);
    for (let r = 0; r < h; r++) {
      matrix[r][0] = Math.max(matrix[r][0], lArr[r] ?? 0);
    }

    // Right edge
    if (w > 1) {
      const rArr = this.edgeToArray(adj.r, h);
      for (let r = 0; r < h; r++) {
        matrix[r][w - 1] = Math.max(matrix[r][w - 1], rArr[r] ?? 0);
      }
    }

    return matrix;
  }

  private rotateAdjacency(adj: AdjacencyConfig, rotation: number): AdjacencyConfig {
    let result = adj;
    const rotationNorm = rotation % 4;

    for (let i = 0; i < rotationNorm; i++) {
      // Rotate 90° clockwise: t→r, r→b, b→l, l→t
      // Reverse arrays when rotating because the direction is reversed
      const reverseIfArray = (edge: AdjacencyEdge): AdjacencyEdge => {
        if (Array.isArray(edge)) {
          return [...edge].reverse();
        }
        return edge;
      };

      result = {
        t: reverseIfArray(result.l),
        r: reverseIfArray(result.t),
        b: reverseIfArray(result.r),
        l: reverseIfArray(result.b),
      };
    }
    return result;
  }

  getRotatedAdjacency(rotation: number): AdjacencyConfig {
    return this.rotateAdjacency(this.baseAdjacency, rotation);
  }

  getAdjacencyAtRotation(rotation: number): number[][] {
    return this.convertToMatrix(rotation);
  }

  getDimensions(rotation: number): [number, number] {
    const rotationNorm = rotation % 4;
    // Dimensions swap on 90° and 270° rotations
    if (rotationNorm === 1 || rotationNorm === 3) {
      return [this.width, this.height];
    }
    return [this.height, this.width];
  }

  getSize(rotation: number): string {
    const [height, width] = this.getDimensions(rotation);
    return `${height}×${width}`;
  }
}
