import type { Session } from '@supabase/supabase-js';
import { useState, useRef } from 'preact/hooks';
import { supabase } from '../lib/supabase';
import { useBookmarks, type Bookmark } from '../lib/useBookmarks';
import { useSections } from '../lib/useSections';
import { useOnlineStatus } from '../lib/useOnlineStatus';
import { useTabs } from '../lib/useTabs';

interface Props {
  session: Session;
}

type DragPayload =
  | { type: 'tab'; title: string; url: string; favIconUrl?: string }
  | { type: 'bookmark'; id: string; fromSectionId: string };

export function Dashboard({ session }: Props) {
  const userId = session.user.id;
  const { sections, addSection, renameSection, deleteSection } = useSections(userId);
  const { bookmarks, addBookmark, deleteBookmark, updateBookmark, moveBookmark } = useBookmarks(userId);
  const tabs = useTabs();
  const online = useOnlineStatus();

  const [query, setQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<string | null>(null);

  const dragPayload = useRef<DragPayload | null>(null);

  function filteredBookmarks(sectionId: string) {
    return bookmarks.filter(
      (b) =>
        b.section_id === sectionId &&
        (!query ||
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          b.url.toLowerCase().includes(query.toLowerCase())),
    );
  }

  async function handle<T>(fn: () => Promise<T>) {
    setErrorMsg(null);
    try {
      await fn();
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      setErrorMsg(online ? msg : '오프라인 상태입니다. 온라인 복귀 후 다시 시도해 주세요.');
    }
  }

  async function handleAddSection() {
    const name = prompt('새 섹션 이름');
    if (!name) return;
    await handle(() => addSection(name.trim()));
  }

  async function handleAddBookmark(sectionId: string) {
    const title = prompt('북마크 제목');
    if (!title) return;
    const url = prompt('URL (https://…)');
    if (!url) return;
    await handle(() => addBookmark({ sectionId, title: title.trim(), url: url.trim() }));
  }

  function startEdit(b: Bookmark) {
    setEditingId(b.id);
    setEditTitle(b.title);
    setEditUrl(b.url);
  }

  async function saveEdit() {
    if (!editingId) return;
    await handle(() => updateBookmark(editingId, { title: editTitle.trim(), url: editUrl.trim() }));
    setEditingId(null);
  }

  function onTabDragStart(tab: { title: string; url: string; favIconUrl?: string }) {
    dragPayload.current = { type: 'tab', ...tab };
  }

  function onBookmarkDragStart(b: Bookmark) {
    dragPayload.current = { type: 'bookmark', id: b.id, fromSectionId: b.section_id };
  }

  function onSectionDragOver(e: Event, sectionId: string) {
    (e as DragEvent).preventDefault();
    setDragOverSection(sectionId);
  }

  function onSectionDragLeave() {
    setDragOverSection(null);
  }

  async function onSectionDrop(e: Event, sectionId: string) {
    (e as DragEvent).preventDefault();
    setDragOverSection(null);
    const p = dragPayload.current;
    dragPayload.current = null;
    if (!p) return;

    if (p.type === 'tab') {
      await handle(() => addBookmark({ sectionId, title: p.title, url: p.url }));
    } else if (p.type === 'bookmark' && p.fromSectionId !== sectionId) {
      await handle(() => moveBookmark(p.id, sectionId));
    }
  }

  return (
    <div class="dashboard">
      <header>
        <h1>
          달그미데스크
          {!online && <span class="offline-badge">오프라인</span>}
        </h1>
        <div class="user">
          <input
            type="search"
            placeholder="북마크 검색"
            value={query}
            onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
          />
          <span class="email">{session.user.email}</span>
          <button type="button" onClick={() => supabase.auth.signOut()}>
            로그아웃
          </button>
        </div>
      </header>

      {errorMsg && <div class="error-banner">{errorMsg}</div>}

      <div class="layout">
        {/* 좌측: 열린 탭 패널 */}
        <aside class="tab-panel">
          <div class="panel-title">
            열린 탭 <span class="count">{tabs.length}</span>
          </div>
          {tabs.length === 0 ? (
            <p class="panel-empty">탭 없음</p>
          ) : (
            <ul class="tab-list">
              {tabs.map((tab) => (
                <li
                  key={tab.id}
                  class="tab-item"
                  draggable
                  onDragStart={() => onTabDragStart(tab)}
                  title={tab.url}
                >
                  {tab.favIconUrl ? (
                    <img src={tab.favIconUrl} alt="" width={14} height={14} class="tab-favicon" />
                  ) : (
                    <span class="favicon-fallback sm">{tab.title.charAt(0).toUpperCase()}</span>
                  )}
                  <span class="tab-title">{tab.title}</span>
                </li>
              ))}
            </ul>
          )}
          <p class="panel-hint">탭을 섹션으로 드래그 → 북마크 추가</p>
        </aside>

        {/* 우측: 섹션 영역 */}
        <main class="sections-area">
          {sections.length === 0 ? (
            <div class="empty">
              섹션이 없습니다. 아래 <strong>+ 섹션 추가</strong> 버튼으로 시작하세요.
            </div>
          ) : (
            <div class="sections">
              {sections.map((s) => (
                <section
                  key={s.id}
                  class={`section-card${dragOverSection === s.id ? ' drag-over' : ''}`}
                  onDragOver={(e) => onSectionDragOver(e, s.id)}
                  onDragLeave={onSectionDragLeave}
                  onDrop={(e) => onSectionDrop(e, s.id)}
                >
                  <div class="section-header">
                    <span
                      role="button"
                      tabIndex={0}
                      class="section-name"
                      title="클릭하여 이름 변경"
                      onClick={async () => {
                        const name = prompt('섹션 이름 변경', s.name);
                        if (name && name.trim()) await handle(() => renameSection(s.id, name.trim()));
                      }}
                    >
                      {s.name}
                    </span>
                    {confirmDeleteSectionId === s.id ? (
                      <>
                        <button
                          type="button"
                          class="ghost del-confirm"
                          onClick={() => { setConfirmDeleteSectionId(null); handle(() => deleteSection(s.id)); }}
                        >
                          확인
                        </button>
                        <button
                          type="button"
                          class="ghost"
                          onClick={() => setConfirmDeleteSectionId(null)}
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        class="ghost"
                        title="섹션 삭제"
                        onClick={() => setConfirmDeleteSectionId(s.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <ul class="bookmark-list">
                    {filteredBookmarks(s.id).map((b) =>
                      editingId === b.id ? (
                        <li key={b.id} class="bookmark-item editing">
                          <div class="edit-fields">
                            <input
                              type="text"
                              value={editTitle}
                              onInput={(e) => setEditTitle((e.currentTarget as HTMLInputElement).value)}
                              placeholder="제목"
                              autoFocus
                            />
                            <input
                              type="url"
                              value={editUrl}
                              onInput={(e) => setEditUrl((e.currentTarget as HTMLInputElement).value)}
                              placeholder="https://..."
                            />
                          </div>
                          <div class="edit-actions">
                            <button type="button" class="save-btn" onClick={saveEdit} title="저장">
                              ✓
                            </button>
                            <button
                              type="button"
                              class="ghost"
                              onClick={() => setEditingId(null)}
                              title="취소"
                            >
                              ✗
                            </button>
                          </div>
                        </li>
                      ) : (
                        <li
                          key={b.id}
                          class="bookmark-item"
                          draggable
                          onDragStart={() => onBookmarkDragStart(b)}
                          title="드래그하여 다른 섹션으로 이동"
                        >
                          {b.favicon_url ? (
                            <img src={b.favicon_url} alt="" width={14} height={14} loading="lazy" class="tab-favicon" />
                          ) : (
                            <span class="favicon-fallback sm">{b.title.charAt(0).toUpperCase()}</span>
                          )}
                          <a href={b.url} target="_blank" rel="noopener noreferrer" class="bookmark-title">
                            {b.title}
                          </a>
                          <div class="bookmark-actions">
                            <button
                              type="button"
                              class="ghost"
                              title="수정"
                              onClick={() => startEdit(b)}
                            >
                              ✏️
                            </button>
                            {confirmDeleteId === b.id ? (
                              <>
                                <button
                                  type="button"
                                  class="ghost del-confirm"
                                  onClick={() => { setConfirmDeleteId(null); handle(() => deleteBookmark(b.id)); }}
                                >
                                  확인
                                </button>
                                <button
                                  type="button"
                                  class="ghost"
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  취소
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                class="ghost"
                                title="삭제"
                                onClick={() => setConfirmDeleteId(b.id)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </li>
                      ),
                    )}
                  </ul>

                  <button type="button" class="add" onClick={() => handleAddBookmark(s.id)}>
                    + 북마크 추가
                  </button>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>

      <footer>
        <button type="button" onClick={handleAddSection}>
          + 섹션 추가
        </button>
      </footer>
    </div>
  );
}
