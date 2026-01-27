import { AppState, PlacementMode } from '../state/AppState';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { SoundManager } from '../audio/SoundManager';

export class MouseHandler {
  private appState: AppState;
  private renderer: CanvasRenderer;
  private canvas: HTMLCanvasElement;
  private soundManager: SoundManager;
  private lastMousePos: { x: number; y: number } | null = null;

  constructor(appState: AppState, renderer: CanvasRenderer, soundManager: SoundManager) {
    this.appState = appState;
    this.renderer = renderer;
    this.canvas = renderer.canvas;
    this.soundManager = soundManager;
    this.attachListeners();
  }

  private attachListeners(): void {
    this.canvas.addEventListener('click', (e: MouseEvent) => {
      this.handleClick(e);
    });

    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      this.handleMouseMove(e);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.lastMousePos = null;
    });
  }

  private handleClick(e: MouseEvent): void {
    if (this.appState.isModalOpen) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridPos = this.renderer.screenToGrid(x, y);
    if (!gridPos) return;

    const [row, col] = gridPos;

    if (this.appState.mode === PlacementMode.Placing) {
      const instance = this.appState.placeBuilding(row, col);
      if (instance) {
        // Successfully placed, can place another or cancel
        // Keep the same building selected for now
        this.soundManager.playSound();
      }
    } else if (this.appState.mode === PlacementMode.RoadPlacing) {
      if (!this.appState.roadStartPos) {
        this.appState.roadStartPos = { row, col };
      } else {
        const snappedEnd = this.appState.snapRoadEnd(
          this.appState.roadStartPos.row,
          this.appState.roadStartPos.col,
          row,
          col
        );
        this.appState.placeRoad(
          this.appState.roadStartPos.row,
          this.appState.roadStartPos.col,
          snappedEnd.row,
          snappedEnd.col
        );
        this.soundManager.playSound();
        // Reset road start position but stay in road placing mode
        this.appState.roadStartPos = null;
      }
    } else if (this.appState.mode === PlacementMode.RoadDeleting) {
      // Check if clicked on a building
      const building = this.appState.getBuildingAt(row, col);
      if (building) {
        this.appState.deleteBuilding(building.id);
        this.soundManager.playSound();
        // Stay in delete mode to allow deleting multiple buildings
        return;
      }

      // Otherwise, handle road deletion with two-point system
      if (!this.appState.roadStartPos) {
        this.appState.roadStartPos = { row, col };
      } else {
        const snappedEnd = this.appState.snapRoadEnd(
          this.appState.roadStartPos.row,
          this.appState.roadStartPos.col,
          row,
          col
        );
        this.appState.deleteRoad(
          this.appState.roadStartPos.row,
          this.appState.roadStartPos.col,
          snappedEnd.row,
          snappedEnd.col
        );
        this.soundManager.playSound();
        // Reset road start position but stay in delete mode
        this.appState.roadStartPos = null;
      }
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.appState.isModalOpen) {
      this.lastMousePos = null;
      this.appState.highlightedBuildingId = null;
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridPos = this.renderer.screenToGrid(x, y);
    if (gridPos) {
      const [row, col] = gridPos;
      this.lastMousePos = { x: col, y: row };

      // Highlight building under mouse
      const building = this.appState.getBuildingAt(row, col);
      this.appState.highlightedBuildingId = building?.id || null;
    }
  }

  getMouseGridPos(): { row: number; col: number } | null {
    if (this.lastMousePos) {
      return { row: this.lastMousePos.y, col: this.lastMousePos.x };
    }
    return null;
  }
}
