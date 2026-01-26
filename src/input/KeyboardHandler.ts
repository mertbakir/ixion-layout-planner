import { AppState, PlacementMode } from '../state/AppState';
import { BackgroundMusic } from '../audio/BackgroundMusic';

type KeyHandler = () => void;

const LONG_PRESS_DURATION = 1000; // milliseconds

export class KeyboardHandler {
  private handlers: Map<string, KeyHandler>;
  private appState: AppState;
  private backgroundMusic: BackgroundMusic;
  private xPressStartTime: number | null = null;

  constructor(appState: AppState, backgroundMusic: BackgroundMusic) {
    this.appState = appState;
    this.backgroundMusic = backgroundMusic;
    this.handlers = new Map();
    this.setupHandlers();
    this.attachListeners();
  }

  private setupHandlers(): void {
    // Sector switching (1-6)
    for (let i = 1; i <= 6; i++) {
      this.handlers.set(String(i), () => {
        this.appState.switchSector(i);
      });
    }

    // Construction menu (C)
    this.handlers.set('c', () => {
      this.toggleConstructionMenu();
    });
    this.handlers.set('C', () => {
      this.toggleConstructionMenu();
    });

    // Rotate building or build road (R)
    this.handlers.set('r', () => {
      if (this.appState.mode === PlacementMode.Placing) {
        this.appState.rotateSelectedBuilding();
      } else if (this.appState.mode !== PlacementMode.RoadPlacing && this.appState.mode !== PlacementMode.RoadDeleting) {
        this.appState.startRoadPlacing();
      }
    });
    this.handlers.set('R', () => {
      if (this.appState.mode === PlacementMode.Placing) {
        this.appState.rotateSelectedBuilding();
      } else if (this.appState.mode !== PlacementMode.RoadPlacing && this.appState.mode !== PlacementMode.RoadDeleting) {
        this.appState.startRoadPlacing();
      }
    });

    // Cancel (ESC)
    this.handlers.set('Escape', () => {
      this.appState.cancelPlacement();
      this.appState.mode = PlacementMode.View;
      this.appState.roadStartPos = null;
      this.clearMenuSelection();
      this.closeConstructionMenu();
    });

    // Delete mode (X) - one way, only exit with ESC
    // X is handled in keydown/keyup listeners for long-press detection

    // Arrow keys for sector navigation
    this.handlers.set('ArrowLeft', () => {
      this.navigateToAdjacentSector('left');
    });

    this.handlers.set('ArrowRight', () => {
      this.navigateToAdjacentSector('right');
    });

    // Q/E as aliases for left/right sector navigation
    this.handlers.set('q', () => {
      this.navigateToAdjacentSector('left');
    });
    this.handlers.set('Q', () => {
      this.navigateToAdjacentSector('left');
    });
    this.handlers.set('e', () => {
      this.navigateToAdjacentSector('right');
    });
    this.handlers.set('E', () => {
      this.navigateToAdjacentSector('right');
    });

    // Mute/unmute background music (M)
    this.handlers.set('m', () => {
      this.backgroundMusic.toggleMute();
    });
    this.handlers.set('M', () => {
      this.backgroundMusic.toggleMute();
    });

    // Toggle inactive adjacency indicators (T)
    this.handlers.set('t', () => {
      this.appState.showInactiveIndicators = !this.appState.showInactiveIndicators;
    });
    this.handlers.set('T', () => {
      this.appState.showInactiveIndicators = !this.appState.showInactiveIndicators;
    });
  }

  private attachListeners(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Skip if any modifier keys are pressed
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // Track X press for long-press clear sector
      if ((e.key === 'x' || e.key === 'X') && !this.xPressStartTime) {
        this.xPressStartTime = Date.now();
        // Don't execute handler yet, wait to see if it's a long press
        e.preventDefault();
        return;
      }

      const handler = this.handlers.get(e.key);
      if (handler) {
        e.preventDefault();
        handler();
      }
    });

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.key === 'x' || e.key === 'X') {
        if (this.xPressStartTime) {
          const pressDuration = Date.now() - this.xPressStartTime;
          if (pressDuration >= LONG_PRESS_DURATION) {
            // Long press: show confirmation modal for clearing sector (stay in delete mode)
            this.showConfirmationModal(
              'Clear Sector',
              'Clear all buildings and roads in the current sector?',
              () => this.appState.clearCurrentSector()
            );
          } else {
            // Short press: enter delete mode (one-way, ESC to exit)
            if (this.appState.mode !== PlacementMode.RoadPlacing && this.appState.mode !== PlacementMode.Placing) {
              this.appState.startRoadDeleting();
            }
          }
          this.xPressStartTime = null;
        }
      }
    });
  }

  private showConfirmationModal(title: string, message: string, onConfirm: () => void): void {
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('confirmation-title');
    const modalMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    if (!modal || !modalTitle || !modalMessage || !confirmYes || !confirmNo) {
      return;
    }

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    const handleYes = () => {
      onConfirm();
      closeModal();
    };

    const handleNo = () => {
      closeModal();
    };

    const closeModal = () => {
      modal.classList.add('hidden');
      confirmYes.removeEventListener('click', handleYes);
      confirmNo.removeEventListener('click', handleNo);
      document.removeEventListener('keydown', handleEscape);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    confirmYes.addEventListener('click', handleYes);
    confirmNo.addEventListener('click', handleNo);
    document.addEventListener('keydown', handleEscape);

    modal.classList.remove('hidden');
  }

  private toggleConstructionMenu(): void {
    const menu = document.getElementById('construction-menu');
    if (menu?.classList.contains('hidden')) {
      menu.classList.remove('hidden');
    } else {
      menu?.classList.add('hidden');
    }
  }

  private closeConstructionMenu(): void {
    const menu = document.getElementById('construction-menu');
    menu?.classList.add('hidden');
  }

  private clearMenuSelection(): void {
    document.querySelectorAll('.building-item.selected').forEach(el => {
      el.classList.remove('selected');
    });
  }

  private navigateToAdjacentSector(direction: 'left' | 'right'): void {
    const currentSector = this.appState.getSector();
    const nextSector =
      direction === 'left'
        ? currentSector === 1 ? 6 : currentSector - 1
        : currentSector === 6 ? 1 : currentSector + 1;
    this.appState.switchSector(nextSector);
  }
}
