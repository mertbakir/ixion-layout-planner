import { SavedLayout } from './LayoutStorage';

export class RepositoryLayoutLoader {
  private static layoutCache: Map<string, SavedLayout> = new Map();

  static async loadAllLayouts(): Promise<SavedLayout[]> {
    try {
      // Dynamically import all .json files from the layouts directory
      const layoutModules = import.meta.glob<SavedLayout>('/public/layouts/*.json', {
        eager: true,
        import: 'default'
      });

      const layouts: SavedLayout[] = [];

      for (const [path, module] of Object.entries(layoutModules)) {
        try {
          // Skip manifest.json
          if (path.includes('manifest.json')) {
            continue;
          }

          const layout = module as SavedLayout;

          // Validate layout structure
          if (!layout.metadata || !layout.metadata.id || !layout.data) {
            console.error(`Invalid layout structure in ${path}`);
            continue;
          }

          layouts.push(layout);
        } catch (e) {
          console.error(`Error processing layout ${path}:`, e);
        }
      }

      // Sort alphabetically by name
      layouts.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));

      return layouts;
    } catch (e) {
      console.error('Error loading repository layouts:', e);
      return [];
    }
  }

  static clearCache(): void {
    this.layoutCache.clear();
  }
}
