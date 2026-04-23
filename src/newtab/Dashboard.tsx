import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';
import { useBookmarks } from '../lib/useBookmarks';
import { useSections } from '../lib/useSections';

interface Props {
  session: Session;
}

export function Dashboard({ session }: Props) {
  const userId = session.user.id;
  const { sections, addSection, renameSection, deleteSection } = useSections(userId);
  const { bookmarks, addBookmark, deleteBookmark } = useBookmarks(userId);
  const [query, setQuery] = useState('');

  const filtered = (sectionId: string) =>
    bookmarks.filter(
      (b) =>
        b.section_id === sectionId &&
        (!query ||
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          b.url.toLowerCase().includes(query.toLowerCase())),
    );

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handleAddSection() {
    const name = prompt('새 섹션 이름');
    if (!name) return;
    await addSection(name.trim());
  }

  async function handleAddBookmark(sectionId: string) {
    const title = prompt('북마크 제목');
    if (!title) return;
    const url = prompt('URL (https://…)');
    if (!url) return;
    await addBookmark({ sectionId, title: title.trim(), url: url.trim() });
  }

  return (
    <div class="dashboard">
      <header>
        <h1>달그미데스크</h1>
        <div class="user">
          <input
            type="search"
            placeholder="검색"
            value={query}
            onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
          />
          <span class="email">{session.user.email}</span>
          <button type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <main>
        {sections.length === 0 ? (
          <div class="empty">
            아직 섹션이 없습니다. 아래 "+ 섹션 추가" 버튼으로 시작해 주세요.
          </div>
        ) : (
          <div class="sections">
            {sections.map((s) => (
              <section key={s.id}>
                <h2>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={async () => {
                      const name = prompt('섹션 이름 변경', s.name);
                      if (name && name.trim()) await renameSection(s.id, name.trim());
                    }}
                  >
                    {s.name}
                  </span>
                  <button
                    type="button"
                    class="ghost"
                    onClick={() => {
                      if (confirm(`"${s.name}" 섹션을 삭제할까요? (북마크도 함께 삭제)`))
                        deleteSection(s.id);
                    }}
                  >
                    ×
                  </button>
                </h2>
                <ul>
                  {filtered(s.id).map((b) => (
                    <li key={b.id}>
                      <a href={b.url} target="_blank" rel="noopener noreferrer">
                        {b.title}
                      </a>
                      <button
                        type="button"
                        class="ghost"
                        onClick={() => {
                          if (confirm(`"${b.title}" 북마크를 삭제할까요?`))
                            deleteBookmark(b.id);
                        }}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" class="add" onClick={() => handleAddBookmark(s.id)}>
                  + 북마크 추가
                </button>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer>
        <button type="button" onClick={handleAddSection}>
          + 섹션 추가
        </button>
      </footer>
    </div>
  );
}
