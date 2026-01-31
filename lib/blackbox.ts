export const GRID_SIZE = 8;
// Internal grid is 10x10 to include borders (indices 0 and 9)
const INTERNAL_SIZE = 10;

export type RayResultType = 'ABSORBED' | 'REFLECTED' | 'EXIT';

export interface RayResult {
  type: RayResultType;
  entryRayId: number;
  exitRayId?: number; // Only for EXIT
  path?: { x: number; y: number }[]; // Optional: for visualization if we want
}

export type Grid = number[][]; // 0 or 1

export function createEmptyGrid(): Grid {
  return Array(INTERNAL_SIZE).fill(0).map(() => Array(INTERNAL_SIZE).fill(0));
}

export function placeAtoms(grid: Grid, count: number): Grid {
  const newGrid = grid.map(row => [...row]);
  let placed = 0;
  while (placed < count) {
    const x = Math.floor(Math.random() * GRID_SIZE) + 1;
    const y = Math.floor(Math.random() * GRID_SIZE) + 1;
    if (newGrid[x][y] === 0) {
      newGrid[x][y] = 1;
      placed++;
    }
  }
  return newGrid;
}

export function shootRay(grid: Grid, rayId: number): RayResult {
  let x = 0, y = 0, u = 0, v = 0;

  // 210-270: Determine entry point and direction
  if (rayId >= 1 && rayId <= 8) {
    // Left side
    x = 0;
    y = rayId;
    u = 1;
    v = 0;
  } else if (rayId >= 9 && rayId <= 16) {
    // Bottom side
    x = rayId - 8;
    y = 9;
    u = 0;
    v = -1;
  } else if (rayId >= 17 && rayId <= 24) {
    // Right side
    x = 9;
    y = 25 - rayId;
    u = -1;
    v = 0;
  } else if (rayId >= 25 && rayId <= 32) {
    // Top side
    x = 33 - rayId;
    y = 0;
    u = 0;
    v = 1;
  } else {
    throw new Error('Invalid Ray ID');
  }

  const path: { x: number, y: number }[] = [{x, y}];

  // Loop (280 onwards)
  while (true) {
    const x1 = x + u;
    const y1 = y + v;

    // Check bounds immediately?
    // BASIC code checks bounds at 380 after the move/deflection logic.
    // However, if we enter the grid, we check interaction.
    // If we leave the grid (x1,y1 is 0 or 9), that's an exit (unless deflected back immediately).
    
    // BASIC logic calculates interaction BEFORE moving the "current" coordinates X,Y to X1,Y1 fully.
    
    // 290-300: Identify flanks
    let x2 = 0, y2 = 0, x3 = 0, y3 = 0;
    if (u === 0) {
      // Vertical movement
      x2 = x1 - 1; x3 = x1 + 1;
      y2 = y1; y3 = y1;
    } else {
      // Horizontal movement
      y2 = y1 - 1; y3 = y1 + 1;
      x2 = x1; x3 = x1;
    }

    // 310: Logic Table
    // Check if we are inside the 'interaction zone'. 
    // The atoms are at indices 1..8. 
    // Interactions only happen if x1,y1 is within 1..8 OR if we are checking flanks that are 1..8?
    // The BASIC code checks B(X,Y). Since the border B is 0, interaction logic works even at edges?
    // But if X1 is 0 or 9, we shouldn't be checking interaction, we should be exiting.
    // Let's see BASIC line 380. It handles exit checking.
    // BUT the logic table is checked BEFORE checking exit.
    // Wait, B(0,...) and B(9,...) are 0. So no atoms there.
    // So if X1 is 9, B(9, Y1) is 0. Flanks B(9, Y1+/-1) are 0.
    // So logic table (0 + 0 + 0 + 1) = 1 -> Goto 330 (Move forward).
    // Then 330: X=X1, Y=Y1.
    // Then 380 checks X/Y boundaries.
    // So yes, we can run interaction logic even on the step that exits the board.

    const bHead = grid[x1]?.[y1] ?? 0;
    const bLeft = grid[x2]?.[y2] ?? 0;
    const bRight = grid[x3]?.[y3] ?? 0;

    const condition = 8 * bHead + bLeft + 2 * bRight + 1;
    
    // 310 ON ... GOTO 330, 340, 350, 340
    // 1 -> 330 (Continue)
    // 2 -> 340 (Deflect Left/Back)
    // 3 -> 350 (Deflect Right/Back)
    // 4 -> 340 (Deflect Left/Back - Funnel case)
    // >=9 -> 320 (Absorbed)

    if (condition >= 9) {
      return { type: 'ABSORBED', entryRayId: rayId, path };
    }

    if (condition === 1) {
      // Continue straight
      x = x1;
      y = y1;
    } else {
      // Deflection
      let z = 0;
      if (condition === 2 || condition === 4) {
        z = 1; // 340
      } else if (condition === 3) {
        z = -1; // 350
      }

      // 360-370: Apply deflection
      if (u === 0) {
        u = z;
        v = 0;
      } else {
        u = 0;
        v = z;
      }
      // Note: BASIC code at 360/370 goes to 380 (Check Exit) immediately WITHOUT updating X,Y to X1,Y1.
      // Wait. 330 updates X=X1, Y=Y1 then goes to 380.
      // 360/370 update U,V then go to 380. X,Y remain at previous position.
      // This means the ray turns "in place" before entering the blocked cell?
      // Yes. If blocked/deflected, we don't step onto X1,Y1. We change direction from X,Y.
    }
    
    path.push({x, y});

    // 380: Check for exit
    // (X+15)/8 ... logic checks if X is out of bounds (0 or 9).
    // But wait, the BASIC indices for X are 0..9. 
    // 1..8 is inside.
    // If X=0 (Left Edge) -> (0+15)/8 = 1.8 -> 1 (Go to 420).
    // If X=9 (Right Edge) -> (9+15)/8 = 3.0 -> 3 (Go to 430).
    // If X=1..8 -> 2 (Go to 400 - Check Y).
    
    // My JS Logic:
    if (x === 0 || x === 9 || y === 0 || y === 9) {
      // It has exited (or reflected back to start).
      
      // Calculate Exit ID Z
      let z = 0;
      if (x === 0) { // Left Edge
        // 420 Z=Y
        z = y;
      } else if (x === 9) { // Right Edge
        // 430 Z=25-Y
        z = 25 - y;
      } else if (y === 0) { // Top Edge
        // 440 Z=33-X
        z = 33 - x;
      } else if (y === 9) { // Bottom Edge
        // 450 Z=8+X
        z = 8 + x;
      }

      if (z === rayId) {
        return { type: 'REFLECTED', entryRayId: rayId, path };
      } else {
        return { type: 'EXIT', entryRayId: rayId, exitRayId: z, path };
      }
    }
    
    // Safety break for infinite loops (shouldn't happen in standard Blackbox but good practice)
    if (path.length > 200) {
      console.warn("Infinite loop detected");
      return { type: 'ABSORBED', entryRayId: rayId, path };
    }
  }
}
