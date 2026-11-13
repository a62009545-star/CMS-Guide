import { z } from 'zod';

/* ───────────── Enums ───────────── */

export const ROLES = ['viewer', 'editor', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ['draft', 'published'] as const;
export type Status = (typeof STATUSES)[number];

/** Where a module appears: the 7-stage CMS lifecycle, or the configuration & management area. */
export const SECTIONS = ['lifecycle', 'configuration'] as const;
export type Section = (typeof SECTIONS)[number];
export const SECTION_LABEL: Record<Section, string> = {
  lifecycle: 'CMS lifecycle',
  configuration: 'Configuration & management',
};

/** Each section lives under its own address. */
export const SECTION_BASE: Record<Section, string> = { lifecycle: '/modules', configuration: '/configuration' };

/**
 * Page address of a module, or of a sub-task when `subSlug` is given.
 * A lifecycle stage is shown on the CMS lifecycle page (/lifecycle?stage=…); its walkthroughs keep
 * their own pages under /modules/<stage>/<walkthrough>.
 */
export function modulePath(section: string | null | undefined, slug: string, subSlug?: string) {
  if (section === 'configuration') return `${SECTION_BASE.configuration}/${slug}${subSlug ? `/${subSlug}` : ''}`;
  if (!subSlug) return `/lifecycle?stage=${encodeURIComponent(slug)}`;
  return `${SECTION_BASE.lifecycle}/${slug}/${subSlug}`;
}

/** Add ?preview=1 (or &preview=1) to a page address, keeping any #anchor. */
export function withPreview(path: string, on = true) {
  if (!on) return path;
  const [base, hash] = path.split('#');
  return `${base}${base.includes('?') ? '&' : '?'}preview=1${hash ? `#${hash}` : ''}`;
}

export const GUIDELINE_TYPES = ['must', 'should', 'note'] as const;
export type GuidelineType = (typeof GUIDELINE_TYPES)[number];

export const CALLOUT_TYPES = ['tip', 'warning', 'error'] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

export const MEDIA_TYPES = ['image', 'video', 'embed'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const ENTITY_TYPES = ['module', 'subtask', 'media', 'user'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'publish',
  'unpublish',
  'restore',
  'reorder',
  'submit',
  'login',
  'role_change',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/* ───────────── Limits ───────────── */

export const MEDIA_LIMITS = {
  image: { maxBytes: 10 * 1024 * 1024, mime: ['image/jpeg', 'image/png', 'image/webp'] },
  video: { maxBytes: 500 * 1024 * 1024, mime: ['video/mp4'] },
} as const;

/** Hosts allowed for embedded video. Anything else is rejected server-side. */
export const EMBED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'vimeo.com',
  'player.vimeo.com',
  'sharepoint.com',
];

export function isAllowedEmbedHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return EMBED_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  } catch {
    return false;
  }
}

/** Turn a watch/share URL into an iframe-able URL. Returns null when unsupported. */
export function toEmbedUrl(url: string): string | null {
  if (!isAllowedEmbedHost(url)) return null;
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    if (u.pathname.startsWith('/embed/')) return `https://www.youtube-nocookie.com${u.pathname}`;
    const id = u.searchParams.get('v');
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === 'player.vimeo.com') return u.toString();
  if (host === 'vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (host.endsWith('sharepoint.com')) {
    // SharePoint/Stream: embed links already carry "embed" in the path or action=embedview
    if (!u.searchParams.has('action') && !u.pathname.includes('embed')) u.searchParams.set('action', 'embedview');
    return u.toString();
  }
  return null;
}

/* ───────────── Primitives ───────────── */

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens');

/** Rich text travels as HTML (sanitized server-side) plus the optional TipTap JSON document. */
export const richTextSchema = z.object({
  html: z.string().max(200_000).default(''),
  json: z.any().optional().nullable(),
});
export type RichText = z.infer<typeof richTextSchema>;

export const flowStepSchema = z.object({
  _id: z.string().optional(),
  title: z.string().trim().min(1, 'Title is required').max(80),
  description: z.string().trim().max(280).default(''),
});
export type FlowStep = z.infer<typeof flowStepSchema>;

export const guidelineSchema = z.object({
  _id: z.string().optional(),
  type: z.enum(GUIDELINE_TYPES),
  text: z.string().trim().min(1, 'Guideline text is required').max(600),
});
export type Guideline = z.infer<typeof guidelineSchema>;

export const faqSchema = z.object({
  _id: z.string().optional(),
  q: z.string().trim().min(1, 'Question is required').max(300),
  a: z.string().trim().min(1, 'Answer is required').max(4000),
});
export type Faq = z.infer<typeof faqSchema>;

export const calloutSchema = z
  .object({
    type: z.enum(CALLOUT_TYPES),
    text: z.string().trim().max(800),
  })
  .nullable()
  .optional();

export const walkthroughStepSchema = z.object({
  _id: z.string().optional(),
  title: z.string().trim().min(1, 'Step title is required').max(140),
  content: richTextSchema,
  media: z.array(objectId).max(20).default([]),
  callout: calloutSchema,
});
export type WalkthroughStepInput = z.infer<typeof walkthroughStepSchema>;

/* ───────────── Module ───────────── */

export const moduleInputSchema = z.object({
  title: z.string().trim().min(2).max(100),
  slug: slugSchema,
  section: z.enum(SECTIONS).default('lifecycle'),
  icon: z.string().trim().min(1).max(40).default('box'),
  summary: z.string().trim().min(1).max(400),
  e2eContent: richTextSchema,
  flowSteps: z.array(flowStepSchema).max(15).default([]),
  heroMedia: objectId.nullable().optional(),
  guidelines: z.array(guidelineSchema).max(50).default([]),
  faqs: z.array(faqSchema).max(50).default([]),
  changeNote: z.string().trim().max(200).optional(),
});
export type ModuleInput = z.infer<typeof moduleInputSchema>;

/* ───────────── Sub-task ───────────── */

export const subTaskInputSchema = z.object({
  moduleId: objectId,
  title: z.string().trim().min(2).max(120),
  slug: slugSchema,
  summary: z.string().trim().min(1).max(400),
  prerequisites: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
  expectedOutcome: z.string().trim().max(1000).default(''),
  steps: z.array(walkthroughStepSchema).max(40).default([]),
  relatedSubTaskIds: z.array(objectId).max(10).default([]),
  changeNote: z.string().trim().max(200).optional(),
});
export type SubTaskInput = z.infer<typeof subTaskInputSchema>;

/* ───────────── Misc requests ───────────── */

export const reorderSchema = z.object({ ids: z.array(objectId).min(1).max(200) });
export const statusSchema = z.object({ status: z.enum(STATUSES) });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export const passwordSchema = z
  .string()
  .min(10, 'At least 10 characters')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/\d/, 'Include a number');

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  role: z.enum(ROLES).default('viewer'),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  role: z.enum(ROLES).optional(),
  password: passwordSchema.optional(),
});

export const mediaPresignSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string(),
  size: z.number().int().positive(),
});

export const mediaCreateSchema = z.object({
  type: z.enum(MEDIA_TYPES),
  /** For uploads the server derives the URL from s3Key; for embeds this is the external link. */
  url: z.string().max(2000).default(''),
  s3Key: z.string().max(500).optional(),
  caption: z.string().trim().max(300).default(''),
  altText: z.string().trim().max(300).default(''),
  mimeType: z.string().max(100).optional(),
  size: z.number().int().nonnegative().optional(),
});

export const mediaUpdateSchema = z.object({
  caption: z.string().trim().max(300).optional(),
  altText: z.string().trim().max(300).optional(),
  url: z.string().max(2000).optional(),
  s3Key: z.string().max(500).optional(),
  mimeType: z.string().max(100).optional(),
  size: z.number().int().nonnegative().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/* ───────────── Realtime ───────────── */

export interface ContentEvent {
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  title: string;
  slug?: string;
  moduleSlug?: string;
  by: { id: string; name: string };
  at: string;
  /** Whether viewers can see the change (published content). */
  visibleToViewers: boolean;
}

export const REALTIME_EVENT = 'content:changed';
