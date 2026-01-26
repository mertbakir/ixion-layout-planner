import { Building } from './Building';

export class BuildingInstance {
  id: string;
  building: Building;
  row: number;
  col: number;
  rotation: number; // 0, 1, 2, 3 (for 0°, 90°, 180°, 270°)

  constructor(
    id: string,
    building: Building,
    row: number,
    col: number,
    rotation: number = 0
  ) {
    this.id = id;
    this.building = building;
    this.row = row;
    this.col = col;
    this.rotation = rotation % 4;
  }

  rotate(): void {
    this.rotation = (this.rotation + 1) % 4;
  }

  getAdjacency(): number[][] {
    return this.building.getAdjacencyAtRotation(this.rotation);
  }

  getDimensions(): [number, number] {
    return this.building.getDimensions(this.rotation);
  }

  getOccupiedCells(): Array<[number, number]> {
    const [height, width] = this.getDimensions();
    const cells: Array<[number, number]> = [];

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        cells.push([this.row + r, this.col + c]);
      }
    }

    return cells;
  }

  getConnectionCells(): Array<[number, number]> {
    const adjacency = this.getAdjacency();
    const [height, width] = this.getDimensions();
    const cells: Array<[number, number]> = [];

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (adjacency[r][c] === 1) {
          cells.push([this.row + r, this.col + c]);
        }
      }
    }

    return cells;
  }
}
