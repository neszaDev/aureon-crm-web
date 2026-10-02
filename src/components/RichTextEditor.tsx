'use client';

import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { cn } from 'cn';
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  Redo2Icon,
  RemoveFormattingIcon,
  SquareCodeIcon,
  StrikethroughIcon,
  UnderlineIcon,
  Undo2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';

// Printed-page styles for the editing area (the editor's HTML has no classes of its own).
const CONTENT_CLASS = cn(
  'px-4 py-3 text-[0.9375rem] leading-relaxed text-ink-900 outline-none',
  '[&_a]:font-medium [&_a]:text-folder [&_a]:underline [&_a]:underline-offset-4',
  '[&_blockquote]:my-3 [&_blockquote]:border-l-[3px] [&_blockquote]:border-ink-300 [&_blockquote]:pl-4 [&_blockquote]:text-ink-700',
  '[&_code]:rounded-sm [&_code]:bg-ink-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.8125rem]',
  '[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-[-0.02em] [&_h1]:text-ink-950',
  '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink-950',
  '[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink-950',
  '[&_hr]:my-4 [&_hr]:border-ink-300',
  '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_p]:my-2',
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-ink-950 [&_pre]:p-3 [&_pre]:text-folder-ink [&_pre_code]:bg-transparent [&_pre_code]:p-0',
);

const readToolbarState = (editor: Editor) => ({
  bold: editor.isActive('bold'),
  italic: editor.isActive('italic'),
  underline: editor.isActive('underline'),
  strike: editor.isActive('strike'),
  code: editor.isActive('code'),
  heading1: editor.isActive('heading', { level: 1 }),
  heading2: editor.isActive('heading', { level: 2 }),
  heading3: editor.isActive('heading', { level: 3 }),
  bulletList: editor.isActive('bulletList'),
  orderedList: editor.isActive('orderedList'),
  blockquote: editor.isActive('blockquote'),
  codeBlock: editor.isActive('codeBlock'),
  link: editor.isActive('link'),
  canUndo: editor.can().undo(),
  canRedo: editor.can().redo(),
});

type ToolbarState = ReturnType<typeof readToolbarState>;

const Separator = () => <span aria-hidden="true" className="mx-1 h-5 w-px bg-ink-200" />;

const LinkButton = (props: { editor: Editor; active: boolean }) => {
  const t = useTranslations('RichTextEditor');
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  const apply = () => {
    const chain = props.editor.chain().focus().extendMarkRange('link');
    if (url.trim() === '') {
      chain.unsetLink().run();
    } else {
      chain.setLink({ href: url.trim() }).run();
    }
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          const href: unknown = props.editor.getAttributes('link').href;
          setUrl(typeof href === 'string' ? href : '');
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Toggle size="sm" pressed={props.active} aria-label={t('link')} title={t('link')}>
          <LinkIcon aria-hidden="true" />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="rich-text-link">{t('link_url')}</Label>
            <Input
              id="rich-text-link"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={url}
              onChange={(event) => {
                setUrl(event.currentTarget.value);
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            {props.active && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  props.editor.chain().focus().extendMarkRange('link').unsetLink().run();
                  setOpen(false);
                }}
              >
                {t('remove_link')}
              </Button>
            )}
            <Button type="submit" size="sm">
              {t('apply_link')}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};

const Toolbar = (props: { editor: Editor; state: ToolbarState }) => {
  const t = useTranslations('RichTextEditor');
  const run = (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) =>
    command(props.editor.chain().focus()).run();

  const toggles = [
    {
      key: 'bold',
      label: t('bold'),
      pressed: props.state.bold,
      icon: BoldIcon,
      toggle: () => run((c) => c.toggleBold()),
    },
    {
      key: 'italic',
      label: t('italic'),
      pressed: props.state.italic,
      icon: ItalicIcon,
      toggle: () => run((c) => c.toggleItalic()),
    },
    {
      key: 'underline',
      label: t('underline'),
      pressed: props.state.underline,
      icon: UnderlineIcon,
      toggle: () => run((c) => c.toggleUnderline()),
    },
    {
      key: 'strike',
      label: t('strike'),
      pressed: props.state.strike,
      icon: StrikethroughIcon,
      toggle: () => run((c) => c.toggleStrike()),
    },
    {
      key: 'code',
      label: t('code'),
      pressed: props.state.code,
      icon: CodeIcon,
      toggle: () => run((c) => c.toggleCode()),
    },
  ] as const;
  const blocks = [
    {
      key: 'heading_1',
      label: t('heading_1'),
      pressed: props.state.heading1,
      icon: Heading1Icon,
      toggle: () => run((c) => c.toggleHeading({ level: 1 })),
    },
    {
      key: 'heading_2',
      label: t('heading_2'),
      pressed: props.state.heading2,
      icon: Heading2Icon,
      toggle: () => run((c) => c.toggleHeading({ level: 2 })),
    },
    {
      key: 'heading_3',
      label: t('heading_3'),
      pressed: props.state.heading3,
      icon: Heading3Icon,
      toggle: () => run((c) => c.toggleHeading({ level: 3 })),
    },
    {
      key: 'bullet_list',
      label: t('bullet_list'),
      pressed: props.state.bulletList,
      icon: ListIcon,
      toggle: () => run((c) => c.toggleBulletList()),
    },
    {
      key: 'ordered_list',
      label: t('ordered_list'),
      pressed: props.state.orderedList,
      icon: ListOrderedIcon,
      toggle: () => run((c) => c.toggleOrderedList()),
    },
    {
      key: 'blockquote',
      label: t('blockquote'),
      pressed: props.state.blockquote,
      icon: QuoteIcon,
      toggle: () => run((c) => c.toggleBlockquote()),
    },
    {
      key: 'code_block',
      label: t('code_block'),
      pressed: props.state.codeBlock,
      icon: SquareCodeIcon,
      toggle: () => run((c) => c.toggleCodeBlock()),
    },
  ] as const;

  return (
    <div
      role="toolbar"
      aria-label={t('toolbar_label')}
      className="flex flex-wrap items-center gap-0.5 border-b border-ink-200 bg-paper-card px-2 py-1.5"
    >
      {toggles.map((item) => (
        <Toggle
          key={item.key}
          size="sm"
          pressed={item.pressed}
          onPressedChange={() => item.toggle()}
          aria-label={item.label}
          title={item.label}
        >
          <item.icon aria-hidden="true" />
        </Toggle>
      ))}
      <LinkButton editor={props.editor} active={props.state.link} />
      <Separator />
      {blocks.map((item) => (
        <Toggle
          key={item.key}
          size="sm"
          pressed={item.pressed}
          onPressedChange={() => item.toggle()}
          aria-label={item.label}
          title={item.label}
        >
          <item.icon aria-hidden="true" />
        </Toggle>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={t('horizontal_rule')}
        title={t('horizontal_rule')}
        onClick={() => run((c) => c.setHorizontalRule())}
      >
        <MinusIcon aria-hidden="true" />
      </Button>
      <Separator />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={t('undo')}
        title={t('undo')}
        disabled={!props.state.canUndo}
        onClick={() => run((c) => c.undo())}
      >
        <Undo2Icon aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={t('redo')}
        title={t('redo')}
        disabled={!props.state.canRedo}
        onClick={() => run((c) => c.redo())}
      >
        <Redo2Icon aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={t('clear_formatting')}
        title={t('clear_formatting')}
        onClick={() => run((c) => c.unsetAllMarks().clearNodes())}
      >
        <RemoveFormattingIcon aria-hidden="true" />
      </Button>
    </div>
  );
};

/**
 * A rich text editor (Tiptap with the starter kit) on the white ply, with a toolbar for marks
 * (bold, italic, underline, strike, code, link), blocks (headings, lists, quote, code block,
 * rule), undo/redo and clearing the formatting.
 * @param props Component props.
 * @param props.content Initial HTML.
 * @param props.label Accessible name of the editing area.
 * @param props.onChange Called with the HTML after every change.
 * @param props.size `sm` for a short field (a few lines), `default` for a page of text.
 * @param props.className Extra classes for the frame.
 * @returns The editor.
 */
export const RichTextEditor = (props: {
  content: string;
  label: string;
  onChange?: (html: string) => void;
  size?: 'default' | 'sm';
  className?: string;
}) => {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content: props.content,
    // Rendered on the client only: the server has no DOM for ProseMirror.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(CONTENT_CLASS, props.size === 'sm' ? 'min-h-28' : 'min-h-64'),
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': props.label,
      },
    },
    onUpdate: (event) => props.onChange?.(event.editor.getHTML()),
  });
  const tracked = useEditorState({
    editor,
    selector: (snapshot) => (snapshot.editor ? readToolbarState(snapshot.editor) : undefined),
  });
  // The tracked state only arrives with the first transaction; read it directly until then.
  const state = tracked ?? (editor ? readToolbarState(editor) : undefined);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border border-ink-300 bg-ply shadow-ply focus-within:border-folder focus-within:ring-3 focus-within:ring-folder/20',
        props.className,
      )}
    >
      {editor && state ? (
        <Toolbar editor={editor} state={state} />
      ) : (
        <div aria-hidden="true" className="h-10 border-b border-ink-200 bg-paper-card" />
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
