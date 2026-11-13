import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ImagePlus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { subTaskInputSchema, type CalloutType } from '@cms/shared';
import { errorMessage, get, patch, post, put } from '@/api/client';
import { useModules } from '@/api/queries';
import type { Media, RichText, SubTaskEditPayload } from '@/api/types';
import { MediaPicker, MediaThumb } from '@/components/editor/MediaPicker';
import { RichEditor } from '@/components/editor/RichEditor';
import { SortableList, newId, withIds } from '@/components/editor/SortableList';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn, slugify } from '@/lib/utils';
import { EditorHeader, EditorSection, RemoveButton, SaveBar, StringList, useSectionScroll, useUnsavedWarning, zodErrors, type Errors } from './EditorParts';

interface StepForm {
  id: string;
  title: string;
  content: RichText;
  media: (Media & { id: string })[];
  callout: { type: CalloutType; text: string } | null;
}

interface Form {
  moduleId: string;
  title: string;
  slug: string;
  summary: string;
  prerequisites: string[];
  expectedOutcome: string;
  steps: StepForm[];
  relatedSubTaskIds: string[];
}

const blankStep = (): StepForm => ({ id: newId(), title: '', content: { html: '' }, media: [], callout: null });

function toPayload(f: Form) {
  return {
    ...f,
    prerequisites: f.prerequisites.map((p) => p.trim()).filter(Boolean),
    steps: f.steps.map((s) => ({
      title: s.title,
      content: s.content,
      media: s.media.map((m) => m._id),
      callout: s.callout && s.callout.text.trim() ? s.callout : null,
    })),
  };
}

function StepEditor({ step, index, handle, onChange, onRemove, errors, defaultOpen }: { step: StepForm; index: number; handle: React.ReactNode; onChange: (s: StepForm) => void; onRemove: () => void; errors: Errors; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [picker, setPicker] = useState(false);
  const hasErr = Object.keys(errors).some((k) => k.startsWith(`steps.${index}.`));
  useEffect(() => {
    if (hasErr) setOpen(true);
  }, [hasErr]);
  return (
    <div id={`step-${index + 1}`} className={cn('scroll-mt-24 rounded-lg border bg-surface', hasErr ? 'border-brand' : 'border-line')}>
      <div className="flex items-center gap-2 p-2">
        {handle}
        <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white">{index + 1}</span>
        <Input
          value={step.title}
          onChange={(e) => onChange({ ...step, title: e.target.value })}
          placeholder="Step title"
          aria-label={`Step ${index + 1} title`}
          aria-invalid={!!errors[`steps.${index}.title`]}
          className="flex-1"
        />
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="grid h-8 w-8 place-items-center rounded-md text-ink-muted hover:bg-surface-sunken" aria-label={open ? `Collapse step ${index + 1}` : `Expand step ${index + 1}`}>
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>
        <RemoveButton label={`Remove step ${index + 1}`} onClick={onRemove} />
      </div>
      {open && (
        <div className="space-y-5 border-t border-line p-4">
          <div>
            <span className="label">Instructions</span>
            <RichEditor label={`Step ${index + 1} instructions`} value={step.content} onChange={(content) => onChange({ ...step, content })} placeholder="What should the reader do in this step?" />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label mb-0">Media</span>
              <Button size="sm" onClick={() => setPicker(true)}>
                <ImagePlus className="h-4 w-4" /> Add media
              </Button>
            </div>
            {step.media.length === 0 ? (
              <p className="text-sm text-ink-muted">No screenshots or videos. Drag to reorder once added.</p>
            ) : (
              <SortableList
                grid
                items={step.media}
                onReorder={(media) => onChange({ ...step, media })}
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                render={(m, i, h) => (
                  <div className="overflow-hidden rounded-lg border border-line bg-surface">
                    <div className="aspect-video">
                      <MediaThumb m={m} />
                    </div>
                    <div className="flex items-center gap-1 p-1">
                      {h}
                      <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">{m.caption || m.altText || `Item ${i + 1}`}</span>
                      <RemoveButton label={`Remove media ${i + 1}`} onClick={() => onChange({ ...step, media: step.media.filter((x) => x.id !== m.id) })} />
                    </div>
                  </div>
                )}
              />
            )}
            <MediaPicker
              open={picker}
              onClose={() => setPicker(false)}
              onPick={(items) => {
                onChange({ ...step, media: [...step.media, ...items.filter((m) => !step.media.some((x) => x._id === m._id)).map((m) => ({ ...m, id: newId() }))] });
                setPicker(false);
              }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <Field label="Callout" htmlFor={`co-${step.id}`}>
              <Select
                id={`co-${step.id}`}
                value={step.callout?.type ?? ''}
                onChange={(e) => onChange({ ...step, callout: e.target.value ? { type: e.target.value as CalloutType, text: step.callout?.text ?? '' } : null })}
              >
                <option value="">None</option>
                <option value="tip">Tip</option>
                <option value="warning">Warning</option>
                <option value="error">Common error</option>
              </Select>
            </Field>
            {step.callout && (
              <Field label="Callout text" htmlFor={`cot-${step.id}`}>
                <Textarea id={`cot-${step.id}`} rows={2} value={step.callout.text} onChange={(e) => onChange({ ...step, callout: { ...step.callout!, text: e.target.value } })} />
              </Field>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SubTaskEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const modules = useModules();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subtask-edit', id],
    queryFn: () => get<SubTaskEditPayload>(`/subtasks/id/${id}/edit`),
    enabled: !isNew,
  });
  const options = useQuery({
    queryKey: ['admin', 'subtask-options'],
    queryFn: () => get<{ items: { _id: string; title: string; moduleTitle?: string }[] }>('/subtasks/options'),
  });
  const [form, setForm] = useState<Form>({
    moduleId: params.get('module') ?? '',
    title: '',
    slug: '',
    summary: '',
    prerequisites: [],
    expectedOutcome: '',
    steps: [blankStep()],
    relatedSubTaskIds: [],
  });
  const [baseline, setBaseline] = useState('');
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Errors>({});
  const [note, setNote] = useState('');
  const sectionParam = params.get('section');
  useDocumentTitle(isNew ? 'New sub-task' : `Edit ${data?.snapshot.title ?? ''}`);

  useEffect(() => {
    if (!isNew || form.moduleId || !modules.data?.length) return;
    setForm((f) => ({ ...f, moduleId: modules.data![0]._id }));
  }, [isNew, modules.data, form.moduleId]);

  useEffect(() => {
    if (!data) return;
    const s = data.snapshot;
    const f: Form = {
      ...s,
      steps: s.steps.map((st) => ({
        id: newId(),
        title: st.title,
        content: st.content,
        media: withIds(st.media.map((mid) => data.mediaDocs[mid]).filter(Boolean)),
        callout: st.callout?.type ? { type: st.callout.type, text: st.callout.text ?? '' } : null,
      })),
    };
    setForm(f);
    setBaseline(JSON.stringify(toPayload(f)));
  }, [data]);
  useSectionScroll(!!data);

  const dirty = useMemo(() => JSON.stringify(toPayload(form)) !== baseline, [form, baseline]);
  useUnsavedWarning(dirty);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async (publish: boolean) => {
      const payload = { ...toPayload(form), changeNote: note || undefined };
      const parsed = subTaskInputSchema.safeParse(payload);
      if (!parsed.success) {
        setErrors(zodErrors(parsed.error));
        throw new Error('Some fields need attention');
      }
      setErrors({});
      let targetId = id;
      let pending = false;
      if (isNew) targetId = (await post<{ _id: string }>('/subtasks', parsed.data))._id;
      else if (dirty || !publish) pending = (await put<{ pending: boolean }>(`/subtasks/${id}`, parsed.data)).pending;
      if (publish) await patch(`/subtasks/${targetId}/status`, { status: 'published' });
      return { targetId, pending, publish };
    },
    onSuccess: ({ targetId, pending, publish }) => {
      toast.success(publish ? 'Published' : pending ? 'Submitted for review' : isNew ? 'Draft created' : 'Changes saved');
      setNote('');
      setBaseline(JSON.stringify(toPayload(form)));
      qc.invalidateQueries();
      if (isNew) navigate(`/admin/subtasks/${targetId}`, { replace: true });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!isNew && isLoading) return <PageSkeleton />;
  const err = (k: string) => errors[k];
  const currentModule = modules.data?.find((m) => m._id === form.moduleId);

  return (
    <div>
      <EditorHeader
        title={isNew ? 'New sub-task' : form.title || 'Untitled sub-task'}
        back={{ to: `/admin/subtasks${form.moduleId ? `?module=${form.moduleId}` : ''}`, label: 'Sub-tasks' }}
        status={data?.status}
        pending={data?.hasPendingDraft}
        pendingBy={data?.pendingDraftByName}
        updatedAt={data?.updatedAt}
        updatedBy={data?.updatedByName}
        historyPath={isNew ? undefined : `/admin/versions/subtask/${id}`}
        viewPath={isNew || !data?.module ? undefined : `/modules/${data.module.slug}/${data.snapshot.slug}${data.hasPendingDraft ? '?preview=1' : ''}`}
      />

      <div className="space-y-6">
        <EditorSection id="details" title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Module" htmlFor="s-mod" error={err('moduleId')}>
              <Select id="s-mod" value={form.moduleId} onChange={(e) => set('moduleId', e.target.value)}>
                {modules.data?.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.section === 'configuration' ? `Configuration: ${m.title}` : `${m.order}. ${m.title}`}
                  </option>
                ))}
              </Select>
            </Field>
            <div />
            <Field label="Title" htmlFor="s-title" error={err('title')}>
              <Input id="s-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))} />
            </Field>
            <Field label="Address" htmlFor="s-slug" hint={`/modules/${currentModule?.slug ?? '…'}/${form.slug || '…'}`} error={err('slug')}>
              <Input
                id="s-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="Summary" htmlFor="s-sum" className="sm:col-span-2" error={err('summary')}>
              <Textarea id="s-sum" rows={2} value={form.summary} onChange={(e) => set('summary', e.target.value)} maxLength={400} />
            </Field>
            <div className="sm:col-span-2">
              <span className="label">Prerequisites</span>
              <StringList items={form.prerequisites} onChange={(v) => set('prerequisites', v)} placeholder="e.g. Planner role in CMS" label="Prerequisite" />
            </div>
            <Field label="Expected outcome" htmlFor="s-out" className="sm:col-span-2" error={err('expectedOutcome')}>
              <Textarea id="s-out" rows={2} value={form.expectedOutcome} onChange={(e) => set('expectedOutcome', e.target.value)} />
            </Field>
          </div>
        </EditorSection>

        <EditorSection
          id="steps"
          title="Walkthrough steps"
          description="Drag the handle to reorder. Each step can have instructions, screenshots or videos, and one callout."
          action={
            <Button size="sm" onClick={() => set('steps', [...form.steps, blankStep()])}>
              <Plus className="h-4 w-4" /> Add step
            </Button>
          }
        >
          <SortableList
            items={form.steps}
            onReorder={(v) => set('steps', v)}
            className="space-y-3"
            render={(s, i, handle) => (
              <StepEditor
                step={s}
                index={i}
                handle={handle}
                errors={errors}
                defaultOpen={isNew || sectionParam === `step-${i + 1}` || form.steps.length <= 2}
                onChange={(next) => set('steps', form.steps.map((x) => (x.id === s.id ? next : x)))}
                onRemove={() => set('steps', form.steps.filter((x) => x.id !== s.id))}
              />
            )}
          />
          <Button size="sm" className="mt-3" onClick={() => set('steps', [...form.steps, blankStep()])}>
            <Plus className="h-4 w-4" /> Add step
          </Button>
        </EditorSection>

        <EditorSection id="related" title="Related sub-tasks" description="Shown as links at the end of the walkthrough.">
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
            {options.data?.items
              .filter((o) => o._id !== id)
              .map((o) => (
                <label key={o._id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-surface-sunken">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[rgb(var(--brand))]"
                    checked={form.relatedSubTaskIds.includes(o._id)}
                    onChange={(e) =>
                      set('relatedSubTaskIds', e.target.checked ? [...form.relatedSubTaskIds, o._id] : form.relatedSubTaskIds.filter((x) => x !== o._id))
                    }
                  />
                  <span className="flex-1">{o.title}</span>
                  <span className="text-xs text-ink-muted">{o.moduleTitle}</span>
                </label>
              ))}
          </div>
          {err('relatedSubTaskIds') && <p className="mt-1 text-xs text-brand-fg">{err('relatedSubTaskIds')}</p>}
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
