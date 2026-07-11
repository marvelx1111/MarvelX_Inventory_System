import type { PPFJobCard, PPFRoll } from '@/types';

/** A roll is in stock when it has not been assigned to any vehicle job yet. */
export function getPPFJobForRoll(rollId: string, jobs: PPFJobCard[]): PPFJobCard | null {
  return jobs.find((job) => job.roll_id === rollId) ?? null;
}

export function isPPFRollInStock(rollId: string, jobs: PPFJobCard[]): boolean {
  return getPPFJobForRoll(rollId, jobs) === null;
}

export function getInStockPPFRolls(rolls: PPFRoll[], jobs: PPFJobCard[]): PPFRoll[] {
  return rolls.filter((roll) => isPPFRollInStock(roll.roll_id, jobs));
}

/** @deprecated Use getInStockPPFRolls */
export function getAvailablePPFRolls(rolls: PPFRoll[], jobs: PPFJobCard[]): PPFRoll[] {
  return getInStockPPFRolls(rolls, jobs);
}

export function isPPFRollAvailable(rollId: string, jobs: PPFJobCard[]): boolean {
  return isPPFRollInStock(rollId, jobs);
}

export function formatPPFStockChange(lengthChange: number): string {
  if (lengthChange === 1) return '+1 roll';
  if (lengthChange === -1) return '-1 roll (used on job)';
  if (lengthChange > 0) return `+${lengthChange}`;
  return String(lengthChange);
}
