import { useEffect } from 'react';

export function useDocumentTitle(title: string, suffix: boolean = true) {
  useEffect(() => {
    const prevTitle = document.title;
    const fullTitle = suffix ? `${title} — NextEra Coders` : title;
    document.title = fullTitle;

    return () => {
      document.title = prevTitle;
    };
  }, [title, suffix]);
}
