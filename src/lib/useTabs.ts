import { useEffect, useState } from 'preact/hooks';

export interface ChromeTab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

export function useTabs(): ChromeTab[] {
  const [tabs, setTabs] = useState<ChromeTab[]>([]);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    function load() {
      chrome.tabs.query({}, (results) => {
        const visible = results
          .filter((t) => !!t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'))
          .map((t) => ({
            id: t.id!,
            title: t.title ?? t.url ?? '(제목 없음)',
            url: t.url!,
            favIconUrl: t.favIconUrl,
          }));
        setTabs(visible);
      });
    }

    load();

    chrome.tabs.onCreated.addListener(load);
    chrome.tabs.onRemoved.addListener(load);
    chrome.tabs.onUpdated.addListener(load);

    return () => {
      chrome.tabs.onCreated.removeListener(load);
      chrome.tabs.onRemoved.removeListener(load);
      chrome.tabs.onUpdated.removeListener(load);
    };
  }, []);

  return tabs;
}
