'use client';

import React, { useState, useEffect } from 'react';
import { 
  createEmptyGrid, 
  placeAtoms, 
  shootRay, 
  Grid, 
  RayResult 
} from '@/lib/blackbox';
import CreditsOverlay from './CreditsOverlay';

type GameState = 'SETUP' | 'PLAYING' | 'GAMEOVER';

interface Guess {
  x: number;
  y: number;
}

const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500',
  'bg-violet-500', 'bg-fuchsia-500', 'bg-rose-500', 'bg-sky-500'
];

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('SETUP');
  const [atomCount, setAtomCount] = useState(4);
  const [grid, setGrid] = useState<Grid>(createEmptyGrid());
  const [rays, setRays] = useState<RayResult[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [score, setScore] = useState(0);
  const [showCredits, setShowCredits] = useState(false);

  // Initialize game
  const startGame = () => {
    let newGrid = createEmptyGrid();
    newGrid = placeAtoms(newGrid, atomCount);
    setGrid(newGrid);
    setRays([]);
    setGuesses([]);
    setScore(0);
    setGameState('PLAYING');
  };

  const handleFireRay = (rayId: number) => {
    // Check if ray already fired
    if (rays.some(r => r.entryRayId === rayId)) return;

    const result = shootRay(grid, rayId);
    setRays([...rays, result]);
  };

  const toggleGuess = (x: number, y: number) => {
    if (gameState !== 'PLAYING') return;
    
    const exists = guesses.find(g => g.x === x && g.y === y);
    if (exists) {
      setGuesses(guesses.filter(g => g !== exists));
    } else {
      if (guesses.length < atomCount) {
        setGuesses([...guesses, { x, y }]);
      }
    }
  };

  const submitGuesses = () => {
    // Calculate score
    let currentScore = 0;
    
    // Ray scores
    rays.forEach(r => {
      if (r.type === 'ABSORBED') currentScore += 1;
      else if (r.type === 'REFLECTED') currentScore += 1;
      else if (r.type === 'EXIT') currentScore += 2;
    });

    // Guess scores
    let correctGuesses = 0;
    guesses.forEach(g => {
      if (grid[g.x][g.y] === 1) {
        correctGuesses++;
      } else {
        currentScore += 5; // Penalty for wrong guess
      }
    });
    
    // Check for missed atoms (optional penalty? BASIC code just says "You guessed C out of N")
    // BASIC code penalizes wrong guesses (line 530: S=S+5).
    // It doesn't seem to penalize missed atoms explicitly, but the goal is to minimize score.
    // Wait, usually score is bad (lower is better).
    // Ray costs: 1 (Absorbed/Reflected), 2 (Exit).
    // Guess penalty: 5 (Wrong guess).
    
    setScore(currentScore);
    setGameState('GAMEOVER');
  };

  // Helper to get ray info for a border cell
  const getRayInfo = (x: number, y: number) => {
    // Convert x,y to RayID
    let rayId = 0;
    if (x === 0 && y >= 1 && y <= 8) rayId = y; // Left 1-8
    else if (y === 9 && x >= 1 && x <= 8) rayId = 8 + x; // Bottom 9-16
    else if (x === 9 && y >= 1 && y <= 8) rayId = 25 - y; // Right 17-24
    else if (y === 0 && x >= 1 && x <= 8) rayId = 33 - x; // Top 25-32

    if (rayId === 0) return null;

    const firedRay = rays.find(r => r.entryRayId === rayId);
    const exitRay = rays.find(r => r.exitRayId === rayId);

    return { rayId, firedRay, exitRay };
  };

  // Render Grid Cell
  const renderCell = (x: number, y: number) => {
    // Corners
    if ((x === 0 || x === 9) && (y === 0 || y === 9)) {
      return <div key={`${x}-${y}`} className="w-8 h-8 or w-10 h-10"></div>;
    }

    // Border (Ray Entry/Exit)
    if (x === 0 || x === 9 || y === 0 || y === 9) {
      const info = getRayInfo(x, y);
      if (!info) return <div key={`${x}-${y}`} />;

      const { rayId, firedRay, exitRay } = info;
      
      let bgClass = "bg-gray-200 hover:bg-gray-300";
      let text = `${rayId}`;
      let cursor = "cursor-pointer";

      // If this specific ray was fired
      if (firedRay) {
        cursor = "cursor-default";
        if (firedRay.type === 'ABSORBED') {
          bgClass = "bg-gray-800 text-white";
          text = "A";
        } else if (firedRay.type === 'REFLECTED') {
          bgClass = "bg-yellow-400";
          text = "R";
        } else if (firedRay.type === 'EXIT') {
           // Find index of this ray in the rays array to assign a consistent color
           const index = rays.indexOf(firedRay);
           bgClass = COLORS[index % COLORS.length];
           text = `${index + 1}`;
        }
      } 
      // If this is an exit point for ANOTHER ray
      else if (exitRay) {
        cursor = "cursor-default";
         const index = rays.indexOf(exitRay);
         bgClass = COLORS[index % COLORS.length];
         text = `${index + 1}`;
      }

      return (
        <div 
          key={`${x}-${y}`} 
          onClick={() => !firedRay && !exitRay && gameState === 'PLAYING' && handleFireRay(rayId)}
          className={`w-10 h-10 flex items-center justify-center border border-gray-400 text-xs font-bold ${bgClass} ${cursor}`}
        >
          {text}
        </div>
      );
    }

    // Inner Grid
    const isAtom = grid[x][y] === 1;
    const isGuessed = guesses.some(g => g.x === x && g.y === y);
    const showAtom = gameState === 'GAMEOVER' && isAtom;
    
    let cellBg = "bg-white";
    
    if (gameState === 'GAMEOVER') {
        if (isAtom && isGuessed) {
            cellBg = "bg-green-600 text-white"; // Correctly guessed atom
        } else if (isAtom && !isGuessed) {
            cellBg = "bg-black text-white"; // Missed atom
        } else if (!isAtom && isGuessed) {
            cellBg = "bg-red-400"; // Wrong guess
        }
    } else {
        if (isGuessed) cellBg = "bg-blue-200"; // Guess marked during play
    }

    return (
      <div 
        key={`${x}-${y}`}
        onClick={() => toggleGuess(x, y)}
        className={`w-10 h-10 border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100 ${cellBg}`}
      >
        {showAtom && <span className="text-xl">●</span>}
        {!showAtom && isGuessed && <span className="text-blue-600 text-xl">?</span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <h1 className="text-3xl font-bold font-mono">BLACKBOX</h1>
      
      {gameState === 'SETUP' && (
        <div className="flex flex-col items-center gap-4 border p-6 rounded shadow-lg">
          <label className="flex flex-col items-center gap-2">
            <span className="font-semibold">Number of Atoms:</span>
            <input 
              type="number" 
              value={atomCount} 
              onChange={(e) => setAtomCount(Number(e.target.value))}
              min={1} 
              max={10}
              className="border p-2 rounded w-20 text-center"
            />
          </label>
          <button 
            onClick={startGame}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
          >
            Start Game
          </button>
        </div>
      )}

      {(gameState === 'PLAYING' || gameState === 'GAMEOVER') && (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-4">
            {/* Grid Container */}
            <div className="relative">
              <div className="grid grid-cols-10 gap-0 border-4 border-gray-800 bg-gray-300 p-2 relative z-10">
                {/* Generate 10x10 cells. x=0..9 (col), y=0..9 (row) */}
                {/* Wait, CSS Grid is Row-Major usually. Map Rows (y), then Cols (x). */}
                {Array.from({ length: 10 }).map((_, y) => (
                  <React.Fragment key={y}>
                    {Array.from({ length: 10 }).map((_, x) => renderCell(x, y))}
                  </React.Fragment>
                ))}
              </div>
              
              {/* Ray Paths Overlay */}
              {gameState === 'GAMEOVER' && (
                <svg className="absolute top-2 left-2 w-[400px] h-[400px] pointer-events-none z-20 overflow-visible">
                  {rays.map((ray, i) => {
                    if (!ray.path || ray.path.length === 0) return null;
                    
                    // Determine color based on ray type
                    let strokeColor = "black";
                    if (ray.type === 'ABSORBED') strokeColor = "black";
                    else if (ray.type === 'REFLECTED') strokeColor = "#facc15"; // yellow-400
                    else if (ray.type === 'EXIT') {
                      // Extract color from Tailwind class (rough approximation for SVG)
                      // COLORS is like 'bg-red-500'. We map index to a hex or similar.
                      // Simpler: Use a mapped array of hex colors or currentcolor with a class?
                      // SVG stroke doesn't support Tailwind bg- classes directly without 'stroke-current' and 'text-xxx'.
                      // Let's use a helper or just mapping.
                      const TAILWIND_COLORS_HEX = [
                        '#ef4444', '#3b82f6', '#22c55e', '#eab308', 
                        '#a855f7', '#ec4899', '#6366f1', '#14b8a6',
                        '#f97316', '#06b6d4', '#84cc16', '#10b981',
                        '#8b5cf6', '#d946ef', '#f43f5e', '#0ea5e9'
                      ];
                      strokeColor = TAILWIND_COLORS_HEX[i % TAILWIND_COLORS_HEX.length];
                    }

                    // Convert grid coordinates to pixels
                    // Cell size is 40px (w-10). Center is at 20px.
                    const points = ray.path.map(p => `${p.x * 40 + 20},${p.y * 40 + 20}`).join(' ');

                    return (
                      <polyline 
                        key={i} 
                        points={points} 
                        fill="none" 
                        stroke={strokeColor} 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.6"
                      />
                    );
                  })}
                </svg>
              )}
            </div>

            {gameState === 'PLAYING' && (
              <div className="flex gap-4">
                 <div className="text-sm font-mono">
                   Guesses: {guesses.length}/{atomCount}
                 </div>
                 <button 
                   onClick={submitGuesses}
                   disabled={guesses.length !== atomCount}
                   className={`px-4 py-2 rounded text-white ${guesses.length === atomCount ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                 >
                   Submit Guesses
                 </button>
              </div>
            )}
          </div>

          <div className="w-64 flex flex-col gap-4">
            <div className="bg-gray-100 p-4 rounded shadow font-mono text-sm h-96 overflow-y-auto">
              <h3 className="font-bold border-b mb-2">Log</h3>
              <ul className="space-y-1">
                {rays.map((r, i) => (
                  <li key={i}>
                    <span className="font-bold">Ray {r.entryRayId}:</span>{' '}
                    {r.type === 'ABSORBED' && 'Absorbed'}
                    {r.type === 'REFLECTED' && 'Reflected'}
                    {r.type === 'EXIT' && `Exit at ${r.exitRayId}`}
                  </li>
                ))}
              </ul>
            </div>
            
            {gameState === 'GAMEOVER' && (
              <div className="bg-black text-white p-4 rounded text-center">
                <h2 className="text-xl font-bold text-yellow-400">GAME OVER</h2>
                <p className="mt-2 text-2xl">Score: {score}</p>
                <p className="text-sm text-gray-400">(Lower is better)</p>
                <button 
                  onClick={() => setGameState('SETUP')}
                  className="mt-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-200 w-full font-bold"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 max-w-lg text-center font-mono mt-8">
        <p>Instructions: Shoot rays into the box to find the atoms.</p>
        <p>A: Absorbed (Hit atom head-on)</p>
        <p>R: Reflected (Reflected back to start)</p>
        <p>Numbers/Colors: Ray entered and exited elsewhere.</p>
        <p>Mark atom locations by clicking cells.</p>
      </div>

      <button
        onClick={() => setShowCredits(true)}
        className="text-xs text-gray-400 hover:text-gray-600 underline mt-2"
      >
        Credits & Source
      </button>

      {showCredits && <CreditsOverlay onClose={() => setShowCredits(false)} />}
    </div>
  );
}
