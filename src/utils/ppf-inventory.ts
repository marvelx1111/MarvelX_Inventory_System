import type { PPFJobCard, PPFRoll } from '@/types';

export type PPFRollInventoryStatus = 'in_stock' | 'assigned';

export interface PPFRollInventoryMeta {
  status: PPFRollInventoryStatus;
  job: PPFJobCard | null;
}

export function getPPFJobForRoll(rollId: string, jobs: PPFJobCard[]): PPFJobCard | null {
  return jobs.find((job) => job.roll_id === rollId) ?? null;
}

export function getPPFRollInventoryMeta(rollId: string, jobs: PPFJobCard[]): PPFRollInventoryMeta {
  const job = getPPFJobForRoll(rollId, jobs);
  return {
    status: job ? 'assigned' : 'in_stock',
    job,
  };
}

export function isPPFRollAvailable(rollId: string, jobs: PPFJobCard[]): boolean {
  return getPPFJobForRoll(rollId, jobs) === null;
}

export function getAvailablePPFRolls(rolls: PPFRoll[], jobs: PPFJobCard[]): PPFRoll[] {
  return rolls.filter((roll) => isPPFRollAvailable(roll.roll_id, jobs));
}
