import * as YAML from 'js-yaml';
import { ConfigData, BuildingConfig } from './types';

export class ConfigLoader {
  static async load(url: string): Promise<ConfigData> {
    const response = await fetch(url);
    const text = await response.text();
    const rawData = YAML.load(text) as any;

    console.log('Raw YAML data:', rawData);

    if (!rawData || !rawData.buildings) {
      throw new Error('Invalid config: no buildings found');
    }

    // Buildings are organized by category, each containing a list
    const buildings: Record<string, BuildingConfig[]> = {};

    for (const [category, buildingsList] of Object.entries(rawData.buildings)) {
      if (!Array.isArray(buildingsList)) continue;

      buildings[category] = [];
      for (const buildingData of buildingsList) {
        if (typeof buildingData === 'object' && buildingData !== null) {
          buildings[category].push(buildingData as BuildingConfig);
          console.log(`Loaded building: ${buildingData.name} in category ${category}`);
        }
      }
    }

    if (Object.keys(buildings).length === 0) {
      throw new Error('No buildings found in config');
    }

    console.log('Buildings loaded by category:', buildings);
    return { buildings };
  }
}
