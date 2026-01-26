export class BackgroundMusic {
  private audio: HTMLAudioElement;
  private musicPath: string = '/assets/music/background.mp3';
  private isMuted: boolean = false;

  constructor() {
    this.audio = new Audio();
    this.audio.src = this.musicPath;
    this.audio.loop = true;
    this.audio.volume = 0.3;
    this.startMusic();
  }

  private startMusic(): void {
    this.audio.play().catch((error) => {
      console.warn('Could not play background music:', error);
    });
  }

  toggleMute(): void {
    if (this.isMuted) {
      this.audio.volume = 0.3;
      this.isMuted = false;
    } else {
      this.audio.volume = 0;
      this.isMuted = true;
    }
  }

  setVolume(volume: number): void {
    if (!this.isMuted) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  isMusicMuted(): boolean {
    return this.isMuted;
  }
}
