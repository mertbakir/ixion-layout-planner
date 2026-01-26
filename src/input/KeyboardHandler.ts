import { AppState, PlacementMode } from '../state/AppState';
import { BackgroundMusic } from '../audio/BackgroundMusic';
import { LayoutStorage } from '../storage/LayoutStorage';
import { NameGenerator } from '../utils/NameGenerator';

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

    // Save layout (S)
    this.handlers.set('s', () => {
      this.showSaveLayoutModal();
    });
    this.handlers.set('S', () => {
      this.showSaveLayoutModal();
    });

    // Load layout (L)
    this.handlers.set('l', () => {
      this.showLoadLayoutModal();
    });
    this.handlers.set('L', () => {
      this.showLoadLayoutModal();
    });
  }

  private attachListeners(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // If a modal is open, let its own handler deal with it, but stop further propagation.
      if (this.appState.isModalOpen) {
        e.stopImmediatePropagation();
        return;
      }

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
      // If a modal is open, do nothing.
      if (this.appState.isModalOpen) {
        return;
      }

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
    this.appState.isModalOpen = true;
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('confirmation-title');
    const modalMessage = document.getElementById('confirmation-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    if (!modal || !modalTitle || !modalMessage || !confirmYes || !confirmNo) {
      this.appState.isModalOpen = false;
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
      this.appState.isModalOpen = false;
      modal.classList.add('hidden');
      confirmYes.removeEventListener('click', handleYes);
      confirmNo.removeEventListener('click', handleNo);
      document.removeEventListener('keydown', handleEscape, true);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeModal();
      }
    };

    confirmYes.addEventListener('click', handleYes);
    confirmNo.addEventListener('click', handleNo);
    document.addEventListener('keydown', handleEscape, true); // Use capture phase

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

  private showSaveLayoutModal(): void {
    this.appState.isModalOpen = true;
    const modal = document.getElementById('save-layout-modal');
    const input = document.getElementById('layout-name-input') as HTMLInputElement;
    const cancelBtn = document.getElementById('save-cancel');
    const confirmBtn = document.getElementById('save-confirm');

    if (!modal || !input || !cancelBtn || !confirmBtn) {
      this.appState.isModalOpen = false;
      return;
    }

    const defaultName = NameGenerator.generate();
    input.value = '';
    input.placeholder = defaultName;
    input.focus(); // Autofocus the input

    const handleConfirm = () => {
      const name = input.value.trim() || defaultName;
      if (name) {
        this.appState.saveLayout(name);
        closeModal();
      }
    };

    const handleCancel = () => {
      closeModal();
    };

    const closeModal = () => {
      this.appState.isModalOpen = false;
      modal.classList.add('hidden');
      cancelBtn.removeEventListener('click', handleCancel);
      confirmBtn.removeEventListener('click', handleConfirm);
      document.removeEventListener('keydown', handleKeydown, true);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      e.stopPropagation(); // Stop event from bubbling to global listener
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'Enter') {
        handleConfirm();
      }
    };

    cancelBtn.addEventListener('click', handleCancel);
    confirmBtn.addEventListener('click', handleConfirm);
    document.addEventListener('keydown', handleKeydown, true); // Use capture phase

    modal.classList.remove('hidden');
    input.focus(); // Re-focus just in case
  }

  private showLoadLayoutModal(): void {
    this.appState.isModalOpen = true;
    const modal = document.getElementById('load-layout-modal');
    const listDiv = document.getElementById('layouts-list');
    const closeBtn = document.getElementById('load-close');

    if (!modal || !listDiv || !closeBtn) {
      this.appState.isModalOpen = false;
      return;
    }

    const renderList = () => {
      // Fetch fresh data each time the list is rendered
      const layouts = LayoutStorage.getLayoutMetadata();
      listDiv.innerHTML = '';

      if (layouts.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-message';
        empty.textContent = 'No saved layouts yet';
        listDiv.appendChild(empty);
        return;
      }

      for (const layout of layouts) {
        const item = document.createElement('div');
        item.className = 'layout-item';

        const info = document.createElement('div');
        info.className = 'layout-info';

        const name = document.createElement('div');
        name.className = 'layout-name';
        name.textContent = layout.name;

        const date = document.createElement('div');
        date.className = 'layout-date';
        date.textContent = new Date(layout.timestamp).toLocaleString();

        info.appendChild(name);
        info.appendChild(date);

        const actions = document.createElement('div');
        actions.className = 'layout-actions';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'layout-button layout-load';
        loadBtn.textContent = 'Load';
        loadBtn.addEventListener('click', () => {
          // Close the current modal before showing the confirmation
          closeModal();
          this.loadLayoutWithConfirmation(layout.id);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'layout-button layout-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
          LayoutStorage.deleteLayout(layout.id);
          renderList(); // Re-render the list with fresh data
        });

        actions.appendChild(loadBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(info);
        item.appendChild(actions);

        listDiv.appendChild(item);
      }
    };

    const handleClose = () => {
      closeModal();
    };

    const closeModal = () => {
      this.appState.isModalOpen = false;
      modal.classList.add('hidden');
      closeBtn.removeEventListener('click', handleClose);
      document.removeEventListener('keydown', handleKeydown, true);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    closeBtn.addEventListener('click', handleClose);
    document.addEventListener('keydown', handleKeydown, true); // Use capture phase

    renderList();
    modal.classList.remove('hidden');
  }

  private loadLayoutWithConfirmation(layoutId: string): void {
    this.showConfirmationModal(
      'Load Layout',
      'Load this layout? This will replace your current layout.',
      () => {
        this.appState.loadLayout(layoutId);
      }
    );
  }
}
