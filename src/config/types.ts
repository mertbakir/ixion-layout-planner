export type AdjacencyEdge = number | number[];

export interface AdjacencyConfig {
  t: AdjacencyEdge;
  l: AdjacencyEdge;
  r: AdjacencyEdge;
  b: AdjacencyEdge;
}

export interface BuildingConfig {
  name: string;
  size: string; // Format: "WxH" e.g., "3x3", "4x4"
  adjacency: AdjacencyConfig;
  color: string;
  'requires-wall'?: boolean; // If true, building must be placed flush against top or bottom edge
}

export interface ConfigData {
  buildings: Record<string, BuildingConfig[]>; // category -> list of buildings
}
