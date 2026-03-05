import { useState, useEffect, useCallback } from 'react';
import { Activity } from '@/types/activity';

const STORAGE_KEY = 'lucsquestions_activities';

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Activity[];
        setActivities(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  const persist = useCallback((list: Activity[]) => {
    setActivities(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const addActivity = useCallback((activity: Activity) => {
    persist([activity, ...activities]);
    setActiveId(activity.id);
  }, [activities, persist]);

  const updateActivity = useCallback((updated: Activity) => {
    persist(activities.map(a => a.id === updated.id ? updated : a));
  }, [activities, persist]);

  const deleteActivity = useCallback((id: string) => {
    persist(activities.filter(a => a.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activities, activeId, persist]);

  const active = activities.find(a => a.id === activeId) ?? null;

  return { activities, active, activeId, setActiveId, addActivity, updateActivity, deleteActivity };
}
