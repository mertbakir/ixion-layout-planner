import { AppState } from '../state/AppState';
import { Building } from '../buildings/Building';

export class ConstructionMenu {
  private appState: AppState;
  private container: HTMLElement | null;
  private tabsContainer: HTMLElement | null;
  private currentCategory: string | null = null;

  constructor(appState: AppState) {
    this.appState = appState;
    this.container = document.getElementById('buildings-list');
    this.tabsContainer = document.getElementById('menu-tabs');
  }

  populate(): void {
    if (!this.tabsContainer || !this.container) return;

    // Clear existing tabs and buildings
    this.tabsContainer.innerHTML = '';
    this.container.innerHTML = '';

    // Get categories and sort them
    const categories = Object.keys(this.appState.buildingsByCategory);

    // Create tabs
    for (const category of categories) {
      const tab = document.createElement('button');
      tab.className = 'menu-tab';
      tab.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      tab.dataset.category = category;

      tab.addEventListener('click', () => {
        this.switchCategory(category, tab);
      });

      this.tabsContainer.appendChild(tab);
    }

    // Select first category by default
    if (categories.length > 0) {
      const firstTab = this.tabsContainer.querySelector(`[data-category="${categories[0]}"]`) as HTMLElement;
      if (firstTab) {
        this.switchCategory(categories[0], firstTab);
      }
    }
  }

  private switchCategory(category: string, tabElement: HTMLElement): void {
    this.currentCategory = category;

    // Update active tab
    document.querySelectorAll('.menu-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    tabElement.classList.add('active');

    // Clear buildings list
    if (!this.container) return;
    this.container.innerHTML = '';

    // Add buildings for this category, sorted alphabetically
    const buildings = (this.appState.buildingsByCategory[category] || []).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (const building of buildings) {
      const item = this.createBuildingItem(building.name, building);
      this.container.appendChild(item);
    }
  }

  private createBuildingItem(name: string, building: Building): HTMLElement {
    const div = document.createElement('div');
    div.className = 'building-item';
    div.dataset.building = name;

    const color = document.createElement('div');
    color.className = 'building-color';
    color.style.backgroundColor = building.color;

    const info = document.createElement('div');
    info.className = 'building-info';

    const buildingName = document.createElement('div');
    buildingName.className = 'building-name';
    buildingName.textContent = name;

    const buildingSize = document.createElement('div');
    buildingSize.className = 'building-size';
    buildingSize.textContent = building.getSize(0);

    info.appendChild(buildingName);
    info.appendChild(buildingSize);

    div.appendChild(color);
    div.appendChild(info);

    div.addEventListener('click', () => {
      this.selectBuilding(name, div);
    });

    return div;
  }

  private selectBuilding(name: string, element: HTMLElement): void {
    // Remove previous selection
    document.querySelectorAll('.building-item.selected').forEach(el => {
      el.classList.remove('selected');
    });

    // Add selection to clicked item
    element.classList.add('selected');

    // Start placing mode
    this.appState.startPlacing(name);
  }

  clearSelection(): void {
    document.querySelectorAll('.building-item.selected').forEach(el => {
      el.classList.remove('selected');
    });
  }

  close(): void {
    const menu = document.getElementById('construction-menu');
    menu?.classList.add('hidden');
  }
}
