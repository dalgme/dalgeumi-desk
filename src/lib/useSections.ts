import { useEffect, useState } from 'preact/hooks';
import { supabase } from './supabase';
import { cacheKey, loadCache, saveCache } from './cache';

export interface Section {
  id: string;
  user_id: string;
  name: string;
  position: number;
}

export function useSections(userId: string) {
  const [sections, setSections] = useState<Section[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadCache<Section[]>(cacheKey.sections(userId)).then((cached) => {
      if (cancelled) return;
      if (cached) setSections(cached);
      setHydrated(true);
    });

    supabase
      .from('sections')
      .select('*')
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('sections fetch', error);
          return;
        }
        setSections((data ?? []) as Section[]);
      });

    const ch = supabase
      .channel('sections-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sections', filter: `user_id=eq.${userId}` },
        (payload) => {
          setSections((prev) => {
            if (payload.eventType === 'INSERT')
              return [...prev, payload.new as Section].sort((a, b) => a.position - b.position);
            if (payload.eventType === 'UPDATE')
              return prev.map((s) => (s.id === (payload.new as Section).id ? (payload.new as Section) : s));
            if (payload.eventType === 'DELETE')
              return prev.filter((s) => s.id !== (payload.old as Section).id);
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [userId]);

  useEffect(() => {
    if (!hydrated) return;
    saveCache(cacheKey.sections(userId), sections);
  }, [sections, hydrated, userId]);

  async function addSection(name: string) {
    const position = sections.length > 0 ? Math.max(...sections.map((s) => s.position)) + 1 : 0;
    const { error } = await supabase.from('sections').insert({ user_id: userId, name, position });
    if (error) throw error;
  }

  async function renameSection(id: string, name: string) {
    const { error } = await supabase.from('sections').update({ name }).eq('id', id);
    if (error) throw error;
  }

  async function deleteSection(id: string) {
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (error) throw error;
  }

  async function reorderSections(orderedIds: string[]) {
    setSections((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      return orderedIds.map((id, idx) => ({ ...map.get(id)!, position: idx }));
    });
    const results = await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from('sections').update({ position: idx }).eq('id', id),
      ),
    );
    const err = results.find((r) => r.error)?.error;
    if (err) throw err;
  }

  return { sections, addSection, renameSection, deleteSection, reorderSections };
}
