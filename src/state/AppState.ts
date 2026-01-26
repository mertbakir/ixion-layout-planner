import { Building } from '../buildings/Building';
import { BuildingInstance } from '../buildings/BuildingInstance';
import { Sector } from '../grid/Sector';
import { ConfigData } from '../config/types';
import { CellType } from '../grid/Cell';

export enum PlacementMode {
  View = 'view',
  Placing = 'placing',
  Deleting = 'deleting',
  RoadPlacing = 'roadPlacing',
  RoadDeleting = 'roadDeleting'
}

export class AppState {
  private static instance: AppState;

  sector: Sector;
  buildings: Map<string, Building>;
  buildingsByCategory: Record<string, Building[]>;
  mode: PlacementMode;
  selectedBuildingName: string | null;
  selectedRotation: number;
  highlightedBuildingId: string | null;
  roadStartPos: { row: number; col: number } | null;
  showInactiveIndicators: boolean = false;

  // Sector transition animation
  isTransitioning: boolean = false;
  transitionDirection: 'left' | 'right' | null = null;
  transitionProgress: number = 0;
  transitionStartTime: number = 0;
  nextSectorNumber: number = 0;
  private transitionDuration: number = 300; // milliseconds

  private constructor() {
    this.sector = new Sector();
    this.buildings = new Map();
    this.buildingsByCategory = {};
    this.mode = PlacementMode.View;
    this.selectedBuildingName = null;
    this.selectedRotation = 0;
    this.highlightedBuildingId = null;
    this.roadStartPos = null;
  }

  // Getter for placed buildings in current sector
  get placedBuildings(): BuildingInstance[] {
    return this.sector.getCurrentBuildings();
  }

  static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }
    return AppState.instance;
  }

  loadConfig(config: ConfigData): void {
    this.buildings.clear();
    this.buildingsByCategory = {};
    // Buildings are organized by category, flatten them into a map keyed by building name
    for (const [category, buildingsList] of Object.entries(config.buildings)) {
      this.buildingsByCategory[category] = [];
      for (const buildingConfig of buildingsList) {
        const building = new Building(buildingConfig.name, buildingConfig);
        this.buildings.set(buildingConfig.name, building);
        this.buildingsByCategory[category].push(building);
      }
    }
  }

  switchSector(sectorNumber: number): void {
    // Determine direction for animation (reversed for Q/E intuitive navigation)
    const currentSector = this.getSector();
    let direction: 'left' | 'right' = 'right';

    // Handle wrap-around (reversed: lower sector = right slide, higher sector = left slide)
    if (sectorNumber > currentSector) {
      direction = 'left';
    } else if (sectorNumber < currentSector) {
      direction = 'right';
    } else {
      return; // Same sector, no animation needed
    }

    // Start transition animation
    this.isTransitioning = true;
    this.transitionDirection = direction;
    this.transitionProgress = 0;
    this.transitionStartTime = Date.now();
    this.nextSectorNumber = sectorNumber;

    // Reset gameplay state
    this.mode = PlacementMode.View;
    this.selectedBuildingName = null;
    this.selectedRotation = 0;
  }

  updateTransitionProgress(): void {
    if (!this.isTransitioning) return;

    const elapsed = Date.now() - this.transitionStartTime;
    this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);

    // If animation is complete, finish the transition
    if (this.transitionProgress >= 1) {
      this.sector.switchSector(this.nextSectorNumber - 1);
      this.isTransitioning = false;
      this.transitionDirection = null;
      this.transitionProgress = 0;
    }
  }

  getSector(): number {
    return this.sector.getSectorNumber();
  }

  startPlacing(buildingName: string): void {
    if (this.buildings.has(buildingName)) {
      this.mode = PlacementMode.Placing;
      this.selectedBuildingName = buildingName;
      this.selectedRotation = 0;
    }
  }

  getSelectedBuilding(): Building | null {
    if (this.selectedBuildingName && this.buildings.has(this.selectedBuildingName)) {
      return this.buildings.get(this.selectedBuildingName)!;
    }
    return null;
  }

  rotateSelectedBuilding(): void {
    this.selectedRotation = (this.selectedRotation + 1) % 4;
  }

  cancelPlacement(): void {
    this.mode = PlacementMode.View;
    this.selectedBuildingName = null;
    this.selectedRotation = 0;
  }

  canPlaceBuilding(row: number, col: number): boolean {
    const building = this.getSelectedBuilding();
    if (!building) return false;

    const [height, width] = building.getDimensions(this.selectedRotation);

    // Check bounds
    if (row + height > 30 || col + width > 56) {
      return false;
    }

    // Check wall requirement: building's bottom edge must be on a wall
    if (building.requiresWall) {
      // Columns 25-32 (1-indexed in HTML view) = 24-31 (0-indexed) do not accept wall-required buildings
      if (col <= 31 && col + width > 24) {
        return false;
      }

      if (this.selectedRotation === 0) {
        // Rotation 0 (0°): Bottom edge at bottom wall (row 29)
        if (row + height - 1 !== 29) {
          return false;
        }
      } else if (this.selectedRotation === 2) {
        // Rotation 2 (180°): Bottom edge at top wall (row 0)
        if (row !== 0) {
          return false;
        }
      } else {
        // Rotations 1 (90°) and 3 (270°) not allowed for wall-required buildings
        return false;
      }
    }

    const grid = this.sector.getCurrentGrid();

    // Check for overlaps with existing buildings and roads
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        // Check existing buildings
        for (const placedBuilding of this.placedBuildings) {
          const occupiedCells = placedBuilding.getOccupiedCells();
          if (occupiedCells.some(([pr, pc]) => pr === r && pc === c)) {
            return false;
          }
        }

        // Check roads
        if (grid.cells[r][c].data.type === CellType.Road) {
          return false;
        }
      }
    }

    return true;
  }

  placeBuilding(row: number, col: number): BuildingInstance | null {
    if (!this.canPlaceBuilding(row, col)) {
      return null;
    }

    const building = this.getSelectedBuilding();
    if (!building) return null;

    const id = `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const instance = new BuildingInstance(
      id,
      building,
      row,
      col,
      this.selectedRotation
    );

    this.sector.addBuilding(instance);
    return instance;
  }

  deleteBuilding(buildingId: string): boolean {
    this.sector.deleteBuilding(buildingId);
    return true;
  }

  getBuildingAt(row: number, col: number): BuildingInstance | null {
    for (const building of this.placedBuildings) {
      const occupiedCells = building.getOccupiedCells();
      if (occupiedCells.some(([r, c]) => r === row && c === col)) {
        return building;
      }
    }
    return null;
  }

  clear(): void {
    this.mode = PlacementMode.View;
    this.selectedBuildingName = null;
    this.selectedRotation = 0;
    this.roadStartPos = null;
  }

  clearCurrentSector(): void {
    // Delete all buildings in current sector
    const buildingIds = this.placedBuildings.map(b => b.id);
    for (const id of buildingIds) {
      this.deleteBuilding(id);
    }

    // Clear all roads in current sector
    const grid = this.sector.getCurrentGrid();
    for (let r = 0; r < 30; r++) {
      for (let c = 0; c < 56; c++) {
        if (grid.cells[r][c].data.type === CellType.Road) {
          grid.cells[r][c].clear();
        }
      }
    }
  }

  startRoadPlacing(): void {
    this.mode = PlacementMode.RoadPlacing;
    this.roadStartPos = null;
  }

  startRoadDeleting(): void {
    this.mode = PlacementMode.RoadDeleting;
    this.roadStartPos = null;
  }

  canPlaceRoad(startRow: number, startCol: number, endRow: number, endCol: number): boolean {
    const cells = this.getRoadCells(startRow, startCol, endRow, endCol);

    for (const [r, c] of cells) {
      if (r < 0 || r >= 30 || c < 0 || c >= 56) {
        return false; // Out of bounds
      }

      // Check if any building occupies this cell
      for (const building of this.placedBuildings) {
        const occupiedCells = building.getOccupiedCells();
        if (occupiedCells.some(([br, bc]) => br === r && bc === c)) {
          return false; // Building occupies this cell
        }
      }
    }
    return true;
  }

  placeRoad(startRow: number, startCol: number, endRow: number, endCol: number): void {
    if (!this.canPlaceRoad(startRow, startCol, endRow, endCol)) {
      return;
    }

    const grid = this.sector.getCurrentGrid();
    const cells = this.getRoadCells(startRow, startCol, endRow, endCol);

    for (const [r, c] of cells) {
      if (r >= 0 && r < 30 && c >= 0 && c < 56) {
        grid.cells[r][c].setRoad();
      }
    }
  }

  hasRoadsInLine(startRow: number, startCol: number, endRow: number, endCol: number): boolean {
    const grid = this.sector.getCurrentGrid();
    const cells = this.getRoadCells(startRow, startCol, endRow, endCol);

    for (const [r, c] of cells) {
      if (r >= 0 && r < 30 && c >= 0 && c < 56) {
        if (grid.cells[r][c].data.type === CellType.Road) {
          return true;
        }
      }
    }
    return false;
  }

  deleteRoad(startRow: number, startCol: number, endRow: number, endCol: number): void {
    const grid = this.sector.getCurrentGrid();
    const cells = this.getRoadCells(startRow, startCol, endRow, endCol);

    for (const [r, c] of cells) {
      if (r >= 0 && r < 30 && c >= 0 && c < 56) {
        const cell = grid.cells[r][c];
        if (cell.data.type === CellType.Road) {
          cell.clear();
        }
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
