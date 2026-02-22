import type { Dialogue } from '@/types';

/**
 * Estimate reading/display duration for a dialogue text in milliseconds.
 *
 * Mirrors useTypewriter timing:
 * - 40 ms/character (typewriter speed)
 * - 400 ms pause for . ! ?
 * - 150 ms pause for , ; :
 * - 250 ms pause for newline
 * - 1 500 ms extra reading pause after completion
 *
 * Clamped: [1 500 ms … 20 000 ms]
 */
export function estimateDialogueDuration(text: string): number {
  if (!text) return 1500;

  const charMs         = text.length * 40;
  const sentenceMs     = (text.match(/[.!?]/g) || []).length * 400;
  const clauseMs       = (text.match(/[,;:]/g) || []).length * 150;
  const newlineMs      = (text.match(/\n/g)    || []).length * 250;
  const readingPauseMs = 1500; // viewer reads the completed line

  return Math.max(1500, Math.min(20000, charMs + sentenceMs + clauseMs + newlineMs + readingPauseMs));
}

/**
 * Cumulative start times in seconds for each dialogue.
 * times[i] = elapsed seconds before dialogue i starts.
 */
export function getDialogueCumulativeTimes(dialogues: Dialogue[]): number[] {
  const times: number[] = [];
  let cursor = 0;
  for (const d of dialogues) {
    times.push(cursor);
    cursor += estimateDialogueDuration(d.text || '') / 1000;
  }
  return times;
}

/**
 * Total scene duration in seconds (sum of all dialogue durations).
 */
export function getSceneDuration(dialogues: Dialogue[]): number {
  return dialogues.reduce(
    (sum, d) => sum + estimateDialogueDuration(d.text || '') / 1000,
    0
  );
}

/**
 * Returns the dialogue index that should be playing at `time` seconds.
 * Picks the last dialogue whose start time is ≤ time.
 */
export function getDialogueIndexAtTime(dialogues: Dialogue[], time: number): number {
  if (dialogues.length === 0) return 0;
  const times = getDialogueCumulativeTimes(dialogues);
  let idx = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] <= time) idx = i;
    else break;
  }
  return idx;
}
