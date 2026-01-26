import { Grid } from './Grid';
import { BuildingInstance } from '../buildings/BuildingInstance';

const SECTOR_COUNT = 6;

export class Sector {
  grids: Grid[];
  placedBuildings: BuildingInstance[][];
  currentSector: number;

  constructor() {
    this.grids = [];
    this.placedBuildings = [];
    this.currentSector = 0;
    for (let i = 0; i < SECTOR_COUNT; i++) {
      this.grids.push(new Grid());
      this.placedBuildings.push([]);
    }
  }

  getCurrentGrid(): Grid {
    return this.grids[this.currentSector];
  }

  getCurrentBuildings(): BuildingInstance[] {
    return this.placedBuildings[this.currentSector];
  }

  addBuilding(building: BuildingInstance): void {
    this.placedBuildings[this.currentSector].push(building);
  }

  deleteBuilding(buildingId: string): void {
    const idx = this.placedBuildings[this.currentSector].findIndex(
      b => b.id === buildingId
    );
    if (idx >= 0) {
      this.placedBuildings[this.currentSector].splice(idx, 1);
    }
  }

  clearBuildings(): void {
    this.placedBuildings[this.currentSector] = [];
  }

  switchSector(sectorNumber: number): boolean {
    if (sectorNumber >= 0 && sectorNumber < SECTOR_COUNT) {
      this.currentSector = sectorNumber;
      return true;
    }
    return false;
  }

  getSectorNumber(): number {
    return this.currentSector + 1; // 1-indexed for display
  }
}
