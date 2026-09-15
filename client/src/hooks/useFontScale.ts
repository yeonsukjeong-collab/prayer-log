import { useEffect, useState } from "react";

const STORAGE_KEY = "prayer-log-font-scale";
const SCALES = [87.5, 100, 112.5, 125, 137.5];
const DEFAULT_INDEX = 1;

function readStoredIndex(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const index = raw ? Number(raw) : DEFAULT_INDEX;
    return SCALES[index] ? index : DEFAULT_INDEX;
  } catch {
    return DEFAULT_INDEX;
  }
}

export function useFontScale() {
  const [index, setIndex] = useState(readStoredIndex);

  useEffect(() => {
    document.documentElement.style.fontSize = `${SCALES[index]}%`;
    try {
      localStorage.setItem(STORAGE_KEY, String(index));
    } catch {
      // ignore storage failures (e.g. private browsing)
    }
  }, [index]);

  return {
    canDecrease: index > 0,
    canIncrease: index < SCALES.length - 1,
    decrease: () => setIndex((i) => Math.max(0, i - 1)),
    increase: () => setIndex((i) => Math.min(SCALES.length - 1, i + 1)),
  };
}
