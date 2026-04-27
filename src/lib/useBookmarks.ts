import { useEffect, useState } from 'preact/hooks';
import { supabase } from './supabase';
import { cacheKey, loadCache, saveCache } from './cache';

export interface Bookmark {
  id: string;
  user_id: string;
  section_id: string;
  title: string;
  url: string;
  favicon_url: string | null;
  position: number;
  updated_at: string;
}

export function useBookmarks(userId: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadCache<Bookmark[]>(cacheKey.bookmarks(userId)).then((cached) => {
      if (cancelled) return;
      if (cached) setBookmarks(cached);
      setHydrated(true);
    });

    supabase
      .from('bookmarks')
      .select('*')
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('bookmarks fetch', error);
          return;
        }
        setBookmarks((data ?? []) as Bookmark[]);
      });

    const ch = supabase
      .channel('bookmarks-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${userId}` },
        (payload) => {
          setBookmarks((prev) => {
            if (payload.eventType === 'INSERT') return [...prev, payload.new as Bookmark];
            if (payload.eventType === 'UPDATE')
              return prev.map((b) => (b.id === (payload.new as Bookmark).id ? (payload.new as Bookmark) : b));
            if (payload.eventType === 'DELETE')
              return prev.filter((b) => b.id !== (payload.old as Bookmark).id);
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
    saveCache(cacheKey.bookmarks(userId), bookmarks);
  }, [bookmarks, hydrated, userId]);

  async function addBookmark(input: { sectionId: string; title: string; url: string }) {
    const inSection = bookmarks.filter((b) => b.section_id === input.sectionId);
    const position = inSection.length > 0 ? Math.max(...inSection.map((b) => b.position)) + 1 : 0;
    const faviconUrl = deriveFavicon(input.url);
    const { error } = await supabase.from('bookmarks').insert({
      user_id: userId,
      section_id: input.sectionId,
      title: input.title,
      url: input.url,
      favicon_url: faviconUrl,
      position,
    });
    if (error) throw error;
  }

  async function deleteBookmark(id: string) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) throw error;
  }

  async function updateBookmark(id: string, changes: { title: string; url: string }) {
    const favicon_url = deriveFavicon(changes.url);
    const { error } = await supabase
      .from('bookmarks')
      .update({ title: changes.title, url: changes.url, favicon_url })
      .eq('id', id);
    if (error) throw error;
  }

  async function moveBookmark(id: string, targetSectionId: string) {
    const { error } = await supabase
      .from('bookmarks')
      .update({ section_id: targetSectionId })
      .eq('id', id);
    if (error) throw error;
  }

  return { bookmarks, addBookmark, deleteBookmark, updateBookmark, moveBookmark };
}

function deriveFavicon(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return null;
  }
}
