# Ixion Layout Planner

A web-based TypeScript application for planning building layouts across 6 sectors in the game Ixion. Each sector is a 30×56 grid with connection points at rows 5, 14, 17, 26.

## Core Features

### Grid & Sectors
- 6 independent 30×56 grids (spreadsheets)
- Switch between sectors via `1-6` keys or arrow keys (←/→)
- Visual sector indicator (donut compass) in header
- Row/column labels on all sides (1-30 rows, 1-56 columns)
- Green borders on connection rows for road attachment points

### Buildings
- Load from `config.yaml` organized by category (Space, Maintenance, etc.)
- Support rotation (0°, 90°, 180°, 270°)
- Each building has adjacency config (t/l/r/b edges) for connection points
- Size format: "RxC" (rows × columns) per mathematical notation
- Display small green triangular arrows on entry points during placement
- Prevents placement overlaps with other buildings or roads

### Placement System
- Press `C` to open building menu with tabbed categories
- Click building to select, `R` to rotate, click grid to place
- Ghost preview shows placement validity (white = valid, red = invalid)
- Real-time arrow indicators show connections and rotation direction

### Road System
- Press `R` (without building selected) to build roads
- Click start point, move mouse to preview line, click end point to confirm
- Stays in road placing mode after each road (press ESC to exit)
- Roads only work in straight lines (horizontal/vertical)
- Multiple roads can overlap without issue
- Prevents placement on top of buildings

### Deletion Mode
- Press `X` (short) to enter delete/eraser mode (cursor changes to eraser icon)
- Long-press `X` (1+ second) to show confirmation modal for clearing entire sector
- Click building to delete immediately
- Click two points to delete road segment between them
- Supports both single-click building deletion and two-point road deletion
- Exit with ESC only (X is one-way entry)

### User Interface
- Pure black theme (space-like aesthetic)
- Construction menu positioned at bottom center with 110x110px square building icons
- Menu items sorted alphabetically by building name
- Sector compass (6-piece donut chart) in top-right showing current sector
- Real-time mode indicator showing current action
- Building name text displayed centered in each building (scales with building size)
- Soft pastel colors for buildings with auto-contrasting text (black/white based on brightness)
- Adjacency connection indicators: auto-hidden when connected, manually toggleable with `T` key
  - Dark gray dots = disconnected (hidden by default once any connection exists)
  - Darker green dots = road-connected
- Smooth sector transitions with left/right slide animations
- Scrollable canvas when content exceeds screen size
- Background music with mute/unmute toggle
- Sound effects on building/road placement and deletion

## Key Bindings

| Key | Action |
|-----|--------|
| `1-6` | Switch to sector 1-6 |
| `←/→` or `Q/E` | Navigate to adjacent sectors (wraps around) |
| `C` | Toggle construction menu |
| `R` | Rotate building (if placing) or start road building |
| `X` (short) | Enter delete mode (stays active for multiple deletions) |
| `X` (long press) | Show confirmation to clear entire sector while in delete mode |
| `T` | Toggle display of inactive adjacency connection indicators |
| `ESC` | Cancel current operation, exit delete mode, clear menu selection |
| `M` | Toggle background music mute/unmute |
| `S` | Save current layout |
| `L` | Load a saved layout |

## Project Structure

```
ixion-layout/
├── config.yaml                 # Building definitions by category
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── styles/
│   └── main.css
└── src/
    ├── main.ts                 # Application entry point
    ├── config/
    │   ├── loader.ts           # YAML parser
    │   └── types.ts            # Config interfaces
    ├── grid/
    │   ├── Cell.ts             # Cell representation
    │   ├── Grid.ts             # 30×56 grid
    │   └── Sector.ts           # 6 sectors manager + building storage
    ├── buildings/
    │   ├── Building.ts         # Building definition & rotation
    │   ├── BuildingInstance.ts # Placed building instance
    │   └── rotation.ts         # Rotation utilities
    ├── renderer/
    │   ├── CanvasRenderer.ts   # Main renderer
    │   ├── GridRenderer.ts     # Grid drawing
    │   ├── BuildingRenderer.ts # Building & arrows drawing
    │   └── RoadRenderer.ts     # Road drawing
    ├── input/
    │   ├── KeyboardHandler.ts  # Keyboard events
    │   ├── MouseHandler.ts     # Mouse events
    │   └── InputManager.ts     # Input coordination
    ├── state/
    │   └── AppState.ts         # Central state + sector transition animation
    ├── audio/
    │   ├── SoundManager.ts      # Building/road action sound effects
    │   └── BackgroundMusic.ts   # Background music looping & mute toggle
    └── ui/
        ├── ConstructionMenu.ts # Building menu UI
        └── SectorIndicator.ts  # Sector compass UI
```

## Configuration Format

Buildings are defined in `config.yaml` by category:

```yaml
buildings:
  space:
    - name: Probe Launcher
      size: 9x12              # rows × columns
      requires-wall: true     # for wall-based buildings
      adjacency:
        t: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0]  # top: specific cells
        l: 0                  # left: all cells same (0 or 1)
        r: 0                  # right: all cells same
        b: 0                  # bottom: all cells same
      color: "#8FA3D1"        # hex color (soft pastel palette)

  maintenance:
    - name: Stockpile
      size: 4x4
      adjacency:
        t: 1
        l: 0
        r: 0
        b: 0
      color: "#C9B299"
```

**Adjacency format**:
- Single `1` = all cells on that edge have connections
- Single `0` = no cells on that edge have connections
- Array `[1, 0, 1]` = specific cells (index matches row/column position)

**Color format**:
- Hex color codes (e.g., `"#8FA3D1"`) for soft pastel aesthetic
- Building borders auto-darken by 35% of the building color
- Text color auto-selects black/white based on brightness contrast

## State Management

- **AppState** (singleton): Central state for buildings, mode, rotation, sector
- **Sector**: Manages 6 independent grids and placed buildings per sector
- **Per-sector storage**: Buildings/roads are isolated to current sector

## Development

### Setup
```bash
npm install
npm run dev     # Start dev server at http://localhost:5173
npm run build   # Build for production
```

### Audio Files
- **Sound effects**: `/assets/sound/build.wav` (placement/deletion)
- **Background music**: Place royalty-free audio as `/assets/music/background.mp3` (loops automatically, mute with M)

### Tech Stack
- TypeScript
- HTML Canvas (high-DPI aware rendering)
- Vite + Unocss
- js-yaml (config parsing)
- Poppins font (Google Fonts)

## Recent Changes (Latest Session)

- ✅ Fixed layout spacing (removed header gap, added scrolling support)
- ✅ Soft pastel color palette for all buildings with consistent brightness
- ✅ Auto-contrasting text color (black on light backgrounds, white on dark)
- ✅ Thin borders with darker shade of building color
- ✅ Road placing stays active after placement (press ESC to exit)
- ✅ Darker green adjacency indicators for better visibility
- ✅ Auto-hide inactive adjacency dots when connected (toggle with T key)
- ✅ One-way delete mode (X to enter, ESC to exit only)
- ✅ Long-press X to clear sector with confirmation modal
- ✅ Normal cursor in view mode, crosshair when placing/building roads
- ✅ Confirmation modal UI for destructive actions

## TODO

- [ ] Export/import layouts as JSON
- [ ] Undo/redo functionality
- [ ] Browser local storage persistence
- [ ] Metrics display (total buildings, road length, etc.)
- [ ] Keyboard shortcuts overlay
- [ ] Settings panel (volume control, animation speed, etc.)

## Notes for Next Developer

- **Sector independence**: All 6 sectors are completely isolated - buildings and roads don't affect other sectors
- **State management**: AppState is a singleton holding current sector and transition animation state
- **Canvas rendering**: High-DPI aware with `devicePixelRatio` scaling - always use logical dimensions, not physical
- **Adjacency**: Rotation reverses arrays per clockwise 90° rule. Check `Building.rotateAdjacency()` for details
- **Text rendering**: Building names auto-scale/wrap. Font size = `cellSize * 0.55`, minimum 10px. Text color uses `isColorLight()` to auto-select black/white for contrast
- **Adjacency indicators**: Dark gray (inactive) dots are auto-hidden when any connection exists. Toggled via `showInactiveIndicators` in AppState
- **Audio setup**: Background music expects `/assets/music/background.mp3` - gracefully skips if missing
- **Delete mode**: One-way entry (X to enter), exit only with ESC. Long-press X shows sector clear confirmation modal
- **Road placement**: Stays in road mode after placement, only ESC returns to view mode
- **Colors**: All building colors are designed with consistent perceptual brightness (OKLCH-inspired). Building borders are darkened by 35% of the building color
- **Sector animation**: Q/E directions are reversed from arrow keys for intuitive feel (Q pushes right, E pushes left)
