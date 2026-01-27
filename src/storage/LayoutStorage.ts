export interface SerializedBuilding {
  id: string;
  buildingName: string;
  row: number;
  col: number;
  rotation: number;
}

export interface SerializedSector {
  buildings: SerializedBuilding[];
  roads: Array<{ row: number; col: number }>;
}

export interface SerializedStation {
  sectors: SerializedSector[];
  currentSector: number;
}

export interface SavedLayoutMetadata {
  id: string;
  name: string;
  timestamp: number;
  source?: 'repository' | 'user';
  author?: string;
  description?: string;
}

export interface SavedLayout {
  metadata: SavedLayoutMetadata;
  data: SerializedStation;
}

const STORAGE_KEY = 'ixion-layouts';
const AUTOSAVE_KEY = 'ixion-layout-autosave';

export class LayoutStorage {
  static saveCurrentState(data: SerializedStation): void {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving autosave:', e);
    }
  }

  static loadCurrentState(): SerializedStation | null {
    try {
      const data = localStorage.getItem(AUTOSAVE_KEY);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as SerializedStation;
    } catch (e) {
      console.error('Error loading autosave:', e);
      return null;
    }
  }

  static saveLayout(name: string, data: SerializedStation): void {
    try {
      const layouts = this.getAllLayouts();
      const id = `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newLayout: SavedLayout = {
        metadata: {
          id,
          name,
          timestamp: Date.now()
        },
        data
      };

      layouts.push(newLayout);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
      } else {
        console.error('Error saving layout:', e);
      }
    }
  }

  static loadLayout(id: string): SavedLayout | null {
    try {
      const layouts = this.getAllLayouts();
      const layout = layouts.find(l => l.metadata.id === id);
      return layout || null;
    } catch (e) {
      console.error('Error loading layout:', e);
      return null;
    }
  }

  static getAllLayouts(): SavedLayout[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }

      const layouts = JSON.parse(data) as SavedLayout[];
      return layouts.filter(layout => {
        // Validate layout structure
        return layout.metadata && layout.metadata.id && layout.data;
      });
    } catch (e) {
      console.error('Error reading layouts from storage:', e);
      return [];
    }
  }

  static deleteLayout(id: string): void {
    try {
      const layouts = this.getAllLayouts();
      const filtered = layouts.filter(l => l.metadata.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error deleting layout:', e);
    }
  }

  static getLayoutMetadata(): SavedLayoutMetadata[] {
    return this.getAllLayouts().map(l => l.metadata);
  }

  static exportLayoutAsJSON(layoutId: string): void {
    const layout = this.loadLayout(layoutId);
    if (!layout) return;

    // Add export metadata
    const exportData: SavedLayout = {
      ...layout,
      metadata: {
        ...layout.metadata,
        source: 'user',
        exportedAt: Date.now()
      } as SavedLayoutMetadata & { exportedAt?: number }
    };

    // Create blob and trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layout.metadata.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
