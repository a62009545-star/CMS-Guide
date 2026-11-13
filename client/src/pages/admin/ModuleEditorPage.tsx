import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { GUIDELINE_TYPES, SECTIONS, SECTION_LABEL, moduleInputSchema, modulePath, withPreview, type Section } from '@cms/shared';
import { errorMessage, get, patch, post, put } from '@/api/client';
import type { Media, ModuleEditPayload } from '@/api/types';
import { MediaView } from '@/components/content/Media';
import { MediaPicker } from '@/components/editor/MediaPicker';
import { RichEditor } from '@/components/editor/RichEditor';
import { SortableList, newId, stripIds, withIds } from '@/components/editor/SortableList';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { MODULE_ICONS, ModuleIcon } from '@/components/ui/Icon';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn, slugify } from '@/lib/utils';
import { EditorHeader, EditorSection, RemoveButton, SaveBar, useSectionScroll, useUnsavedWarning, zodErrors, type Errors } from './EditorParts';

type Snap = ModuleEditPayload['snapshot'];
type Form = Omit<Snap, 'flowSteps' | 'guidelines' | 'faqs'> & {
  flowSteps: (Snap['flowSteps'][number] & { id: string })[];
  guidelines: (Snap['guidelines'][number] & { id: string })[];
  faqs: (Snap['faqs'][number] & { id: string })[];
};

const empty: Snap = { title: '', slug: '', section: 'lifecycle', icon: 'box', summary: '', e2eContent: { html: '' }, flowSteps: [], heroMedia: null, guidelines: [], faqs: [] };

const toForm = (s: Snap): Form => ({
  ...s,
  flowSteps: withIds(s.flowSteps.map(({ title, description }) => ({ title, description: description ?? '' }))),
  guidelines: withIds(s.guidelines.map(({ type, text }) => ({ type, text }))),
  faqs: withIds(s.faqs.map(({ q, a }) => ({ q, a }))),
});
const toPayload = (f: Form) => ({ ...f, flowSteps: stripIds(f.flowSteps), guidelines: stripIds(f.guidelines), faqs: stripIds(f.faqs) });

export function ModuleEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'module-edit', id],
    queryFn: () => get<ModuleEditPayload>(`/modules/id/${id}/edit`),
    enabled: !isNew,
  });
  const [form, setForm] = useState<Form>(() => toForm({ ...empty, section: params.get('section') === 'configuration' ? 'configuration' : 'lifecycle' }));
  const [baseline, setBaseline] = useState('');
  const [hero, setHero] = useState<Media | null>(null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Errors>({});
  const [note, setNote] = useState('');
  const [picker, setPicker] = useState(false);
  useDocumentTitle(isNew ? 'New module' : `Edit ${data?.snapshot.title ?? ''}`);

  useEffect(() => {
    if (!data) return;
    const f = toForm({ ...data.snapshot, section: data.snapshot.section ?? 'lifecycle' });
    setForm(f);
    setBaseline(JSON.stringify(toPayload(f)));
    setHero(data.heroMediaDoc);
  }, [data]);
  useSectionScroll(!!data);

  const dirty = useMemo(() => JSON.stringify(toPayload(form)) !== baseline, [form, baseline]);
  useUnsavedWarning(dirty);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async (publish: boolean) => {
      const payload = { ...toPayload(form), changeNote: note || undefined };
      const parsed = moduleInputSchema.safeParse(payload);
      if (!parsed.success) {
        setErrors(zodErrors(parsed.error));
        throw new Error('Some fields need attention');
      }
      setErrors({});
      let targetId = id;
      let pending = false;
      if (isNew) {
        const r = await post<{ _id: string }>('/modules', parsed.data);
        targetId = r._id;
      } else if (dirty || !publish) {
        const r = await put<{ pending: boolean }>(`/modules/${id}`, parsed.data);
        pending = r.pending;
      }
      if (publish) await patch(`/modules/${targetId}/status`, { status: 'published' });
      return { targetId, pending, publish };
    },
    onSuccess: ({ targetId, pending, publish }) => {
      toast.success(publish ? 'Published' : pending ? 'Submitted for review' : isNew ? 'Draft created' : 'Changes saved');
      setNote('');
      setBaseline(JSON.stringify(toPayload(form)));
      qc.invalidateQueries();
      if (isNew) navigate(`/admin/modules/${targetId}`, { replace: true });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!isNew && isLoading) return <PageSkeleton />;
  const err = (k: string) => errors[k];

  return (
    <div>
      <EditorHeader
        title={isNew ? 'New module' : form.title || 'Untitled module'}
        back={form.section === 'configuration' ? { to: '/admin/configuration', label: SECTION_LABEL.configuration } : { to: '/admin/modules', label: 'Modules' }}
        status={data?.status}
        pending={data?.hasPendingDraft}
        pendingBy={data?.pendingDraftByName}
        updatedAt={data?.updatedAt}
        updatedBy={data?.updatedByName}
        historyPath={isNew ? undefined : `/admin/versions/module/${id}`}
        viewPath={isNew || !data ? undefined : withPreview(modulePath(data.snapshot.section, data.snapshot.slug), data.hasPendingDraft)}
      />

      <div className="space-y-6">
        <EditorSection id="details" title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="m-title" error={err('title')}>
              <Input
                id="m-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))}
              />
            </Field>
            <Field label="Address" htmlFor="m-slug" hint={modulePath(form.section, form.slug || '…')} error={err('slug')}>
              <Input
                id="m-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="Section" htmlFor="m-section" className="sm:col-span-2" hint="Lifecycle stages are numbered and drawn as the route on the home page. Configuration topics are listed separately.">
              <Select id="m-section" value={form.section} onChange={(e) => set('section', e.target.value as Section)}>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {SECTION_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Summary" htmlFor="m-summary" className="sm:col-span-2" error={err('summary')} hint="One or two sentences shown on cards and at the top of the page.">
              <Textarea id="m-summary" value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={2} maxLength={400} />
            </Field>
            <div className="sm:col-span-2">
              <span className="label">Icon</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Icon">
                {Object.keys(MODULE_ICONS).map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={form.icon === name}
                    aria-label={name}
                    onClick={() => set('icon', name)}
                    className={cn('grid h-10 w-10 place-items-center rounded-lg border', form.icon === name ? 'border-brand bg-brand-soft text-brand-fg' : 'border-line text-ink-muted hover:border-ink-subtle')}
                  >
                    <ModuleIcon name={name} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </EditorSection>

        <EditorSection
          id="hero"
          title="Hero media"
          description="Optional image or video shown under the page title."
          action={
            <div className="flex gap-2">
              {hero && (
                <Button size="sm" variant="ghost" onClick={() => { setHero(null); set('heroMedia', null); }}>
                  Remove
                </Button>
              )}
              <Button size="sm" onClick={() => setPicker(true)}>
                <ImagePlus className="h-4 w-4" /> {hero ? 'Replace' : 'Add media'}
              </Button>
            </div>
          }
        >
          {hero ? <MediaView media={hero} className="max-w-xl [&_img]:max-h-64" /> : <p className="text-sm text-ink-muted">No hero media.</p>}
          <MediaPicker
            open={picker}
            multiple={false}
            onClose={() => setPicker(false)}
            onPick={([m]) => {
              setHero(m);
              set('heroMedia', m._id);
              setPicker(false);
            }}
          />
        </EditorSection>

        <EditorSection id="overview" title="How it works" description="What the module does, its inputs and outputs, roles, SLAs, and the stages before and after it.">
          <RichEditor label="How it works" value={form.e2eContent} onChange={(v) => set('e2eContent', v)} />
        </EditorSection>

        <EditorSection
          id="flow"
          title="Process flow"
          description="The steps drawn as a flow diagram. Keep titles short."
          action={
            <Button size="sm" onClick={() => set('flowSteps', [...form.flowSteps, { id: newId(), title: '', description: '' }])}>
              <Plus className="h-4 w-4" /> Add step
            </Button>
          }
        >
          {form.flowSteps.length === 0 && <p className="text-sm text-ink-muted">No flow steps yet.</p>}
          <SortableList
            items={form.flowSteps}
            onReorder={(v) => set('flowSteps', v)}
            className="space-y-2"
            render={(s, i, handle) => (
              <div className="flex items-start gap-2 rounded-lg border border-line bg-surface p-2">
                {handle}
                <span className="tabular mt-2 w-5 text-center text-sm text-ink-muted">{i + 1}</span>
                <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_2fr]">
                  <Input
                    value={s.title}
                    placeholder="Step title"
                    aria-label={`Flow step ${i + 1} title`}
                    aria-invalid={!!err(`flowSteps.${i}.title`)}
                    onChange={(e) => set('flowSteps', form.flowSteps.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))}
                  />
                  <Input
                    value={s.description}
                    placeholder="Short description"
                    aria-label={`Flow step ${i + 1} description`}
                    onChange={(e) => set('flowSteps', form.flowSteps.map((x) => (x.id === s.id ? { ...x, description: e.target.value } : x)))}
                  />
                </div>
                <RemoveButton label={`Remove flow step ${i + 1}`} onClick={() => set('flowSteps', form.flowSteps.filter((x) => x.id !== s.id))} />
              </div>
            )}
          />
        </EditorSection>

        <EditorSection
          id="guidelines"
          title="Guidelines"
          description="Rules marked Must, Should or Note."
          action={
            <Button size="sm" onClick={() => set('guidelines', [...form.guidelines, { id: newId(), type: 'must', text: '' }])}>
              <Plus className="h-4 w-4" /> Add guideline
            </Button>
          }
        >
          {form.guidelines.length === 0 && <p className="text-sm text-ink-muted">No guidelines yet.</p>}
          <SortableList
            items={form.guidelines}
            onReorder={(v) => set('guidelines', v)}
            className="space-y-2"
            render={(g, i, handle) => (
              <div className="flex items-start gap-2 rounded-lg border border-line bg-surface p-2">
                {handle}
                <Select
                  value={g.type}
                  className="w-28 shrink-0"
                  aria-label={`Guideline ${i + 1} type`}
                  onChange={(e) => set('guidelines', form.guidelines.map((x) => (x.id === g.id ? { ...x, type: e.target.value as typeof g.type } : x)))}
                >
                  {GUIDELINE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t[0].toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </Select>
                <Textarea
                  value={g.text}
                  rows={1}
                  className="min-h-[40px]"
                  aria-label={`Guideline ${i + 1} text`}
                  aria-invalid={!!err(`guidelines.${i}.text`)}
                  onChange={(e) => set('guidelines', form.guidelines.map((x) => (x.id === g.id ? { ...x, text: e.target.value } : x)))}
                />
                <RemoveButton label={`Remove guideline ${i + 1}`} onClick={() => set('guidelines', form.guidelines.filter((x) => x.id !== g.id))} />
              </div>
            )}
          />
        </EditorSection>

        <EditorSection
          id="faqs"
          title="FAQs"
          action={
            <Button size="sm" onClick={() => set('faqs', [...form.faqs, { id: newId(), q: '', a: '' }])}>
              <Plus className="h-4 w-4" /> Add FAQ
            </Button>
          }
        >
          {form.faqs.length === 0 && <p className="text-sm text-ink-muted">No FAQs yet.</p>}
          <SortableList
            items={form.faqs}
            onReorder={(v) => set('faqs', v)}
            className="space-y-2"
            render={(f, i, handle) => (
              <div className="flex items-start gap-2 rounded-lg border border-line bg-surface p-2">
                {handle}
                <div className="flex-1 space-y-2">
                  <Input
                    value={f.q}
                    placeholder="Question"
                    aria-label={`FAQ ${i + 1} question`}
                    aria-invalid={!!err(`faqs.${i}.q`)}
                    onChange={(e) => set('faqs', form.faqs.map((x) => (x.id === f.id ? { ...x, q: e.target.value } : x)))}
                  />
                  <Textarea
                    value={f.a}
                    placeholder="Answer"
                    rows={2}
                    aria-label={`FAQ ${i + 1} answer`}
                    aria-invalid={!!err(`faqs.${i}.a`)}
                    onChange={(e) => set('faqs', form.faqs.map((x) => (x.id === f.id ? { ...x, a: e.target.value } : x)))}
                  />
                </div>
                <RemoveButton label={`Remove FAQ ${i + 1}`} onClick={() => set('faqs', form.faqs.filter((x) => x.id !== f.id))} />
              </div>
            )}
          />
        </EditorSection>
      </div>

      <SaveBar
        isNew={isNew}
        dirty={dirty}
        saving={save.isPending && !save.variables}
        publishing={save.isPending && !!save.variables}
        onSave={() => save.mutate(false)}
        onPublish={() => save.mutate(true)}
        status={data?.status}
        pending={data?.hasPendingDraft}
        changeNote={note}
        onChangeNote={setNote}
        errorCount={Object.keys(errors).length}
      />
    </div>
  );
}
