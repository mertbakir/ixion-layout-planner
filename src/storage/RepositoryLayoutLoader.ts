import { SavedLayout } from './LayoutStorage';

interface LayoutManifest {
  layouts: string[];
}

export class RepositoryLayoutLoader {
  private static readonly MANIFEST_URL = '/layouts/manifest.json';
  private static layoutCache: Map<string, SavedLayout> = new Map();

  static async loadManifest(): Promise<LayoutManifest | null> {
    try {
      const response = await fetch(this.MANIFEST_URL);
      if (!response.ok) {
        console.error(`Failed to load manifest: ${response.status}`);
        return null;
      }
      return await response.json() as LayoutManifest;
    } catch (e) {
      console.error('Error loading manifest:', e);
      return null;
    }
  }

  static async loadLayout(filename: string): Promise<SavedLayout | null> {
    try {
      const response = await fetch(`/layouts/${filename}`);
      if (!response.ok) {
        console.error(`Failed to load layout ${filename}: ${response.status}`);
        return null;
      }
      const layout = await response.json() as SavedLayout;

      // Validate layout structure
      if (!layout.metadata || !layout.metadata.id || !layout.data) {
        console.error(`Invalid layout structure in ${filename}`);
        return null;
      }

      // Ensure source is marked as repository
      layout.metadata.source = 'repository';

      return layout;
    } catch (e) {
      console.error(`Error loading layout ${filename}:`, e);
      return null;
    }
  }

  static async loadAllLayouts(): Promise<SavedLayout[]> {
    const manifest = await this.loadManifest();
    if (!manifest) {
      return [];
    }

    const layouts: SavedLayout[] = [];

    // Load all layouts in parallel
    const loadPromises = manifest.layouts.map(filename => this.loadLayout(filename));
    const results = await Promise.all(loadPromises);

    // Filter out null values and add to results
    for (const layout of results) {
      if (layout) {
        layouts.push(layout);
      }
    }

    return layouts;
  }

  static clearCache(): void {
    this.layoutCache.clear();
  }
}
