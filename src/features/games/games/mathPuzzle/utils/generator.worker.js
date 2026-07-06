import { generatePuzzle } from './generator';

self.onmessage = (e) => {
  const { difficulty } = e.data;
  try {
    const puzzle = generatePuzzle(difficulty);
    self.postMessage({ success: true, puzzle });
  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};
