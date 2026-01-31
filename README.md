# Blackbox

A Next.js implementation of the classic BASIC game "Blackbox".

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Game Rules

- **Goal**: Find the hidden atoms in the 8x8 grid.
- **Rays**: Shoot rays into the box by clicking the numbered borders.
- **Feedback**:
  - **Absorbed (A)**: The ray hit an atom head-on.
  - **Reflected (R)**: The ray was reflected back to its entry point.
  - **Exit Number**: The ray exited at the indicated number.
- **Scoring**:
  - Ray Absorbed/Reflected: 1 point.
  - Ray Exit: 2 points.
  - Wrong Guess: 5 points penalty.
  - Lower score is better!