export class SoundManager {
  private audio: HTMLAudioElement;
  private soundPath: string = '/assets/sound/build.wav';

  constructor() {
    this.audio = new Audio();
    this.audio.src = this.soundPath;
    this.audio.volume = 0.3;
  }

  playSound(): void {
    // Reset and play
    this.audio.currentTime = 0;
    this.audio.play().catch((error) => {
      console.warn('Could not play sound:', error);
    });
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }
}
