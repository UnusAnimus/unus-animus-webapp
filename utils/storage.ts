import { INITIAL_USER_STATE } from '../constants';
import { UserProgress } from '../types';

const STORAGE_KEY = 'kybalion_user_progress';

export const loadProgress = (): UserProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...INITIAL_USER_STATE, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }
  return INITIAL_USER_STATE;
};

export const saveProgress = (progress: UserProgress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
};
