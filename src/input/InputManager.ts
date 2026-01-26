import { AppState } from '../state/AppState';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { KeyboardHandler } from './KeyboardHandler';
import { MouseHandler } from './MouseHandler';
import { SoundManager } from '../audio/SoundManager';
import { BackgroundMusic } from '../audio/BackgroundMusic';

export class InputManager {
  private keyboardHandler: KeyboardHandler;
  private mouseHandler: MouseHandler;
  private soundManager: SoundManager;
  private backgroundMusic: BackgroundMusic;

  constructor(appState: AppState, renderer: CanvasRenderer) {
    this.soundManager = new SoundManager();
    this.backgroundMusic = new BackgroundMusic();
    this.keyboardHandler = new KeyboardHandler(appState, this.backgroundMusic);
    this.mouseHandler = new MouseHandler(appState, renderer, this.soundManager);
  }

  getMouseGridPos() {
    return this.mouseHandler.getMouseGridPos();
  }
}
