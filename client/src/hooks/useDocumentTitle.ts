import { useEffect } from 'react';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} – CMS Process Guide` : 'CMS Process Guide';
  }, [title]);
}
