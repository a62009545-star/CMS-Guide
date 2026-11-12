import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
  if (node.tagName === 'IMG') node.setAttribute('loading', 'lazy');
});

/** Renders rich text. Content is sanitized on the server; DOMPurify here is defence in depth. */
export function RichContent({ html, className }: { html: string; className?: string }) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html ?? '', { ADD_ATTR: ['data-callout', 'target'], FORBID_TAGS: ['style', 'form', 'input'] }),
    [html],
  );
  if (!clean) return null;
  return <div className={cn('rich', className)} dangerouslySetInnerHTML={{ __html: clean }} />;
}
