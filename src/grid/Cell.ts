export enum CellType {
  Empty = 'empty',
  Building = 'building',
  Road = 'road',
  Connection = 'connection'
}

export interface CellData {
  type: CellType;
  buildingInstanceId?: string;
  color?: string;
}

export class Cell {
  data: CellData;

  constructor(type: CellType = CellType.Empty) {
    this.data = { type };
  }

  isEmpty(): boolean {
    return this.data.type === CellType.Empty;
  }

  isConnection(): boolean {
    return this.data.type === CellType.Connection;
  }

  setBuilding(buildingInstanceId: string, color: string): void {
    this.data.type = CellType.Building;
    this.data.buildingInstanceId = buildingInstanceId;
    this.data.color = color;
  }

  setRoad(): void {
    this.data.type = CellType.Road;
  }

  clear(): void {
    this.data = { type: CellType.Empty };
  }
}
