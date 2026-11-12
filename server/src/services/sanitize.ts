import sanitizeHtml from 'sanitize-html';

const CALLOUT_VALUES = new Set(['tip', 'warning', 'error', 'info', 'note']);

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'code', 'pre', 'blockquote',
    'ul', 'ol', 'li', 'a', 'br', 'hr', 'img', 'div', 'span',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    div: ['data-callout'],
    th: ['colspan', 'rowspan', 'colwidth'],
    td: ['colspan', 'rowspan', 'colwidth'],
    ol: ['start'],
    col: ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['https', 'http'] },
  allowedStyles: { col: { 'min-width': [/^\d+px$/], width: [/^\d+px$/] } },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' },
    }),
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
    div: (tagName, attribs) => {
      const v = attribs['data-callout'];
      const out: Record<string, string> = {};
      if (v && CALLOUT_VALUES.has(v)) out['data-callout'] = v;
      return { tagName, attribs: out };
    },
  },
};

/** Sanitize rich-text HTML coming from the TipTap editor. Strips scripts, handlers, unknown attributes. */
export function sanitizeRich(html: string | undefined | null): string {
  return sanitizeHtml(html ?? '', options).trim();
}

export function htmlToText(html: string | undefined | null): string {
  const spaced = (html ?? '').replace(/<(\/?)(p|h[1-6]|li|div|br|td|th|tr|blockquote|pre)\b[^>]*>/gi, ' ');
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
