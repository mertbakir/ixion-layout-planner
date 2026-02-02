/**
 * ShortcutsModal - Manages the keyboard shortcuts modal display
 */
export class ShortcutsModal {
  private modal: HTMLElement;
  private isOpen = false;

  constructor() {
    this.modal = document.getElementById('shortcuts-modal')!;
    if (!this.modal) {
      console.error('Shortcuts modal element not found');
    }
    this.setupEscapeHandler();
  }

  private setupEscapeHandler(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(): void {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.isOpen = true;
  }

  close(): void {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    this.isOpen = false;
    // Clear any visual feedback
    this.clearAllVisualFeedback();
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Update visual feedback for key presses when modal is open
   */
  updateKeyVisualFeedback(key: string, active: boolean): void {
    if (!this.modal || !this.isOpen) return;

    // Map KeyboardEvent.key to data-key attribute values
    let dataKey = key;
    if (key === 'Escape') dataKey = 'Esc';
    if (key === ' ') dataKey = 'Space';
    if (key === 'ArrowLeft') dataKey = '←';
    if (key === 'ArrowRight') dataKey = '→';
    
    // Letters should be uppercase
    if (key.length === 1 && key !== ' ' && key !== '?') {
      dataKey = key.toUpperCase();
    }

    const keyElements = this.modal.querySelectorAll(`.key[data-key="${dataKey}"]`);
    keyElements.forEach(el => {
      if (active) {
        el.classList.add('simulated-hover');
      } else {
        el.classList.remove('simulated-hover');
      }
    });
  }

  private clearAllVisualFeedback(): void {
    if (!this.modal) return;
    this.modal.querySelectorAll('.key.simulated-hover').forEach(el => {
      el.classList.remove('simulated-hover');
    });
  }
}
