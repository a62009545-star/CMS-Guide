import { Node, mergeAttributes } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  MessageSquareWarning,
  Quote,
  Redo2,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { RichText } from '@/api/types';
import { cn } from '@/lib/utils';
import { MediaPicker } from './MediaPicker';

/** Callout box node: <div data-callout="info|tip|warning|error">…</div> */
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (el) => el.getAttribute('data-callout') ?? 'info',
        renderHTML: (attrs) => ({ 'data-callout': attrs.type }),
      },
    };
  },
  parseHTML: () => [{ tag: 'div[data-callout]' }],
  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes), 0],
});

function Btn({ on, label, onClick, children, disabled }: { on?: boolean; label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={on}
      title={label}
      className={cn('grid h-8 w-8 place-items-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink disabled:opacity-40', on && 'bg-surface-sunken text-ink')}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [picker, setPicker] = useState(false);
  const sep = <span className="mx-1 h-5 w-px bg-line" aria-hidden />;
  const inTable = editor.isActive('table');
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link address (https://…)', prev ?? 'https://');
    if (url === null) return;
    if (url === '' || url === 'https://') return editor.chain().focus().unsetLink().run();
    if (!/^(https?:|mailto:)/i.test(url)) return window.alert('Use an https:// or mailto: link');
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };
  const toggleCallout = (type: string) => {
    if (editor.isActive('callout')) {
      if (editor.getAttributes('callout').type === type) return editor.chain().focus().lift('callout').run();
      return editor.chain().focus().updateAttributes('callout', { type }).run();
    }
    editor.chain().focus().wrapIn('callout', { type }).run();
  };
  return (
    <div className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-line bg-surface px-1.5 py-1" role="toolbar" aria-label="Formatting">
      <Btn label="Heading" on={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </Btn>
      <Btn label="Subheading" on={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-4 w-4" />
      </Btn>
      {sep}
      <Btn label="Bold" on={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn label="Italic" on={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn label="Underline" on={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon className="h-4 w-4" />
      </Btn>
      <Btn label="Link" on={editor.isActive('link')} onClick={setLink}>
        <Link2 className="h-4 w-4" />
      </Btn>
      {sep}
      <Btn label="Bulleted list" on={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Btn>
      <Btn label="Numbered list" on={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Btn>
      <Btn label="Quote" on={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </Btn>
      {sep}
      <Btn label="Insert table" on={inTable} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: false }).run()}>
        <TableIcon className="h-4 w-4" />
      </Btn>
      {inTable && (
        <span className="flex items-center gap-0.5 text-xs">
          <button type="button" className="rounded px-1.5 py-1 hover:bg-surface-sunken" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</button>
          <button type="button" className="rounded px-1.5 py-1 hover:bg-surface-sunken" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Col</button>
          <button type="button" className="rounded px-1.5 py-1 hover:bg-surface-sunken" onClick={() => editor.chain().focus().deleteRow().run()}>− Row</button>
          <button type="button" className="rounded px-1.5 py-1 hover:bg-surface-sunken" onClick={() => editor.chain().focus().deleteColumn().run()}>− Col</button>
          <button type="button" className="rounded px-1.5 py-1 text-brand-fg hover:bg-surface-sunken" onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</button>
        </span>
      )}
      <Btn label="Insert image" onClick={() => setPicker(true)}>
        <ImagePlus className="h-4 w-4" />
      </Btn>
      <span className="ml-0.5 flex items-center gap-1 rounded-md pl-1">
        <MessageSquareWarning className="h-4 w-4 text-ink-subtle" aria-hidden />
        <select
          aria-label="Callout box"
          value={editor.isActive('callout') ? (editor.getAttributes('callout').type as string) : ''}
          onChange={(e) => (e.target.value ? toggleCallout(e.target.value) : editor.isActive('callout') && editor.chain().focus().lift('callout').run())}
          className="h-7 rounded border border-line bg-surface px-1 text-xs text-ink-muted"
        >
          <option value="">Callout…</option>
          <option value="info">Info</option>
          <option value="tip">Tip</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </span>
      <span className="ml-auto flex">
        <Btn label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="h-4 w-4" />
        </Btn>
        <Btn label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="h-4 w-4" />
        </Btn>
      </span>
      <MediaPicker
        open={picker}
        onClose={() => setPicker(false)}
        accept={['image']}
        onPick={(items) => {
          for (const m of items) editor.chain().focus().setImage({ src: m.url, alt: m.altText, title: m.caption }).run();
          setPicker(false);
        }}
      />
    </div>
  );
}

/** TipTap rich-text editor. Emits sanitized-on-server HTML plus the TipTap JSON document. */
export function RichEditor({ value, onChange, placeholder, label }: { value: RichText; onChange: (v: RichText) => void; placeholder?: string; label: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, protocols: ['https', 'mailto'] }),
      Image.configure({ inline: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Callout,
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
    ],
    content: (value.json as object) ?? value.html ?? '',
    editorProps: { attributes: { class: 'rich max-w-none', 'aria-label': label, role: 'textbox', 'aria-multiline': 'true' } },
    onUpdate: ({ editor }) => onChange({ html: editor.getHTML(), json: editor.getJSON() }),
  });

  // Keep the editor in sync if the value is replaced from outside (e.g. version restore).
  useEffect(() => {
    if (!editor) return;
    const incoming = value.html ?? '';
    if (incoming !== editor.getHTML() && !editor.isFocused) editor.commands.setContent((value.json as object) ?? incoming, false);
  }, [editor, value.html, value.json]);

  return (
    <div className="rounded-lg border border-line bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
