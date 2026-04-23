import { useEffect, useState } from 'preact/hooks';
import { supabase } from './supabase';

export interface Section {
  id: string;
  user_id: string;
  name: string;
  position: number;
}

export function useSections(userId: string) {
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('sections')
      .select('*')
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('sections fetch', error);
        else setSections((data ?? []) as Section[]);
      });

    const ch = supabase
      .channel('sections-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sections', filter: `user_id=eq.${userId}` },
        (payload) => {
          setSections((prev) => {
            if (payload.eventType === 'INSERT') return [...prev, payload.new as Section].sort((a, b) => a.position - b.position);
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

  async function addSection(name: string) {
    const position = sections.length > 0 ? Math.max(...sections.map((s) => s.position)) + 1 : 0;
    const { error } = await supabase.from('sections').insert({ user_id: userId, name, position });
    if (error) console.error('addSection', error);
  }

  async function renameSection(id: string, name: string) {
    const { error } = await supabase.from('sections').update({ name }).eq('id', id);
    if (error) console.error('renameSection', error);
  }

  async function deleteSection(id: string) {
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (error) console.error('deleteSection', error);
  }

  return { sections, addSection, renameSection, deleteSection };
}
