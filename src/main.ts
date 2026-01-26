import { ConfigLoader } from './config/loader';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { AppState, PlacementMode } from './state/AppState';
import { InputManager } from './input/InputManager';
import { ConstructionMenu } from './ui/ConstructionMenu';
import { SectorIndicator } from './ui/SectorIndicator';
import { LayoutStorage } from './storage/LayoutStorage';

let appState: AppState;
let renderer: CanvasRenderer;
let inputManager: InputManager;
let constructionMenu: ConstructionMenu;
let sectorIndicator: SectorIndicator;
let gameLoopId: number;

async function init(): Promise<void> {
  try {
    // Initialize app state
    appState = AppState.getInstance();

    // Load configuration
    console.log('Loading config...');
    const config = await ConfigLoader.load('/config.yaml');
    console.log('Config loaded:', config);
    appState.loadConfig(config);
    console.log('Buildings loaded:', appState.buildings);

    // Restore autosaved state
    const autosave = LayoutStorage.loadCurrentState();
    if (autosave) {
      console.log('Restoring autosaved state...');
      appState.loadStationData(autosave);
    }

    // Initialize renderer
    renderer = new CanvasRenderer('canvas');

    // Initialize input
    inputManager = new InputManager(appState, renderer);

    // Initialize construction menu
    constructionMenu = new ConstructionMenu(appState);
    constructionMenu.populate();

    // Setup menu close button
    const closeBtn = document.getElementById('menu-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        constructionMenu.close();
      });
    }

    // Initialize sector indicator
    sectorIndicator = new SectorIndicator();
    sectorIndicator.setSector(appState.getSector());

    // Start game loop
    startGameLoop();
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Failed to initialize app: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function startGameLoop(): void {
  function update(): void {
    render();
    gameLoopId = requestAnimationFrame(update);
  }
  update();
}

function render(): void {
  // Update sector transition animation
  appState.updateTransitionProgress();

  // Handle sector transition animation
  if (appState.isTransitioning) {
    renderWithTransition();
  } else {
    renderNormal();
  }

  // Update sector indicator
  updateUI();
}

function renderNormal(): void {
  const grid = appState.sector.getCurrentGrid();

  // Clear and render base grid
  renderer.render(grid, appState.placedBuildings, appState.showInactiveIndicators);

  // Render placement preview if placing
  if (appState.mode === PlacementMode.Placing) {
    const selectedBuilding = appState.getSelectedBuilding();
    const mousePos = inputManager.getMouseGridPos();

    if (selectedBuilding && mousePos) {
      const isValid = appState.canPlaceBuilding(mousePos.row, mousePos.col);

      if (isValid) {
        renderer.renderGhostBuilding(
          selectedBuilding,
          mousePos.row,
          mousePos.col,
          appState.selectedRotation,
          grid
        );
      } else {
        renderer.renderInvalidPreview(
          selectedBuilding,
          mousePos.row,
          mousePos.col,
          appState.selectedRotation,
          grid
        );
      }
    }
  } else if (appState.mode === PlacementMode.RoadPlacing && appState.roadStartPos) {
    const mousePos = inputManager.getMouseGridPos();
    if (mousePos) {
      const canPlace = appState.canPlaceRoad(
        appState.roadStartPos.row,
        appState.roadStartPos.col,
        mousePos.row,
        mousePos.col
      );
      renderer.renderRoadPreview(
        appState.roadStartPos.row,
        appState.roadStartPos.col,
        mousePos.row,
        mousePos.col,
        false
      );
    }
  } else if (appState.mode === PlacementMode.RoadDeleting && appState.roadStartPos) {
    const mousePos = inputManager.getMouseGridPos();
    if (mousePos) {
      renderer.renderRoadPreview(
        appState.roadStartPos.row,
        appState.roadStartPos.col,
        mousePos.row,
        mousePos.col,
        true
      );
    }
  }
}

function renderWithTransition(): void {
  const canvas = renderer.canvas;
  const ctx = canvas.getContext('2d')!;
  const progress = appState.transitionProgress;
  const direction = appState.transitionDirection;

  // Get logical canvas dimensions
  const logicalWidth = window.innerWidth;
  const logicalHeight = window.innerHeight - 80;
  const dpr = window.devicePixelRatio || 1;

  // Calculate slide offset
  const slideAmount = logicalWidth * progress;
  const offset = direction === 'left' ? -slideAmount : slideAmount;

  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Get current sector info before transition
  const currentSectorNum = appState.getSector();

  // Render old sector (sliding out)
  ctx.save();
  ctx.globalAlpha = 1 - (progress * 0.2); // Slight fade
  ctx.translate(offset, 0);
  const currentGrid = appState.sector.getCurrentGrid();
  const currentBuildings = appState.placedBuildings;
  renderer.render(currentGrid, currentBuildings, appState.showInactiveIndicators);
  ctx.restore();

  // Render new sector (sliding in)
  ctx.save();
  ctx.globalAlpha = progress * 0.8 + 0.2; // Fade in
  const newSectorOffset = direction === 'left' ? logicalWidth : -logicalWidth;
  ctx.translate(offset + newSectorOffset, 0);

  // Temporarily switch to new sector to get its data
  appState.sector.switchSector(appState.nextSectorNumber - 1);
  const newGrid = appState.sector.getCurrentGrid();
  const newBuildings = appState.placedBuildings;
  renderer.render(newGrid, newBuildings, appState.showInactiveIndicators);

  // Switch back to current sector
  appState.sector.switchSector(currentSectorNum - 1);
  ctx.restore();
}

function updateUI(): void {
  // Update sector indicator compass
  sectorIndicator.setSector(appState.getSector());

  const modeIndicator = document.getElementById('mode-indicator');
  if (modeIndicator) {
    if (appState.mode === PlacementMode.Placing) {
      modeIndicator.textContent = `Placing: ${appState.selectedBuildingName} (Rotation: ${appState.selectedRotation * 90}°)`;
      modeIndicator.style.display = 'inline';
    } else if (appState.mode === PlacementMode.RoadPlacing) {
      if (appState.roadStartPos) {
        modeIndicator.textContent = `Building road - Click end point`;
      } else {
        modeIndicator.textContent = `Building road - Click start point`;
      }
      modeIndicator.style.display = 'inline';
    } else if (appState.mode === PlacementMode.RoadDeleting) {
      if (appState.roadStartPos) {
        modeIndicator.textContent = `Delete - Click building or end point for road`;
      } else {
        modeIndicator.textContent = `Delete - Click building or road start point`;
      }
      modeIndicator.style.display = 'inline';
    } else {
      modeIndicator.style.display = 'none';
    }
  }

  // Update cursor based on mode
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (canvas) {
    if (appState.mode === PlacementMode.RoadDeleting) {
      canvas.style.cursor = 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNmZjY2NjYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PGxpbmUgeDE9IjYiIHkxPSI2IiB4Mj0iMTgiIHkyPSIxOCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=") 12 12, auto';
    } else if (appState.mode === PlacementMode.Placing || appState.mode === PlacementMode.RoadPlacing) {
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = 'auto';
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init().catch(err => {
    console.error('Failed to initialize app:', err);
  });
}
