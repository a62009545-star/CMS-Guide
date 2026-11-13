import type { AuditAction, CalloutType, EntityType, Faq, FlowStep, Guideline, MediaType, Role, Section, Status } from '@cms/shared';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  bookmarks: { entityType: 'module' | 'subtask'; entityId: string }[];
  readSubTasks: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface Media {
  _id: string;
  url: string;
  type: MediaType;
  s3Key?: string | null;
  caption: string;
  altText: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
}

export interface RichText {
  html: string;
  json?: unknown;
}

export interface ModuleListItem {
  _id: string;
  title: string;
  slug: string;
  section: Section;
  icon: string;
  summary: string;
  order: number;
  status: Status;
  updatedAt: string;
  updatedByName: string | null;
  subTaskCount: number;
  hasPendingDraft: boolean;
  flowSteps: { title: string }[];
}

export interface SubTaskCard {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  order: number;
  status: Status;
  stepCount: number;
  updatedAt: string;
  hasPendingDraft: boolean;
}

interface NavLink {
  _id: string;
  title: string;
  slug: string;
  order?: number;
}

export interface ModuleDetail {
  _id: string;
  title: string;
  slug: string;
  section: Section;
  icon: string;
  summary: string;
  order: number;
  status: Status;
  e2eContent: RichText;
  flowSteps: FlowStep[];
  heroMedia: Media | null;
  guidelines: Guideline[];
  faqs: Faq[];
  subTasks: SubTaskCard[];
  updatedAt: string;
  updatedByName: string | null;
  hasPendingDraft: boolean;
  pendingDraftByName: string | null;
  isPreview: boolean;
  prev: NavLink | null;
  next: NavLink | null;
}

export interface WalkthroughStep {
  _id: string;
  order: number;
  title: string;
  content: RichText;
  media: Media[];
  callout: { type: CalloutType; text: string } | null;
}

export interface SubTaskDetail {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  order: number;
  status: Status;
  prerequisites: string[];
  expectedOutcome: string;
  steps: WalkthroughStep[];
  module: { _id: string; title: string; slug: string; order: number; icon: string; status: Status; section?: Section };
  related: { _id: string; title: string; slug: string; summary: string; moduleSlug?: string; moduleTitle?: string; path?: string }[];
  prev: NavLink | null;
  next: NavLink | null;
  updatedAt: string;
  updatedByName: string | null;
  hasPendingDraft: boolean;
  pendingDraftByName: string | null;
  isPreview: boolean;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuditEntry {
  _id: string;
  userId?: string;
  userName: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  entityTitle: string;
  path?: string;
  timestamp: string;
  visibleToViewers?: boolean;
  meta?: Record<string, unknown> | null;
}

export interface Version {
  _id: string;
  entityType: EntityType;
  entityId: string;
  versionNumber: number;
  snapshot?: Record<string, unknown>;
  changedFields: string[];
  changedByName: string;
  changedAt: string;
  changeNote: string;
  entityTitle?: string;
}

export type SearchDocType = 'module' | 'subtask' | 'step' | 'guideline' | 'faq';

export interface SearchDoc {
  id: string;
  type: SearchDocType;
  title: string;
  text: string;
  moduleId: string;
  moduleTitle: string;
  breadcrumb: string[];
  path: string;
  status?: string;
}

export interface ModuleEditPayload {
  _id: string;
  status: Status;
  updatedAt: string;
  updatedByName: string | null;
  hasPendingDraft: boolean;
  pendingDraftByName: string | null;
  snapshot: {
    title: string;
    slug: string;
    section: Section;
    icon: string;
    summary: string;
    e2eContent: RichText;
    flowSteps: FlowStep[];
    heroMedia: string | null;
    guidelines: Guideline[];
    faqs: Faq[];
  };
  heroMediaDoc: Media | null;
}

export interface SubTaskEditPayload {
  _id: string;
  status: Status;
  module: { _id: string; title: string; slug: string; section?: string };
  updatedAt: string;
  updatedByName: string | null;
  hasPendingDraft: boolean;
  pendingDraftByName: string | null;
  snapshot: {
    moduleId: string;
    title: string;
    slug: string;
    summary: string;
    prerequisites: string[];
    expectedOutcome: string;
    steps: { title: string; content: RichText; media: string[]; callout: { type: CalloutType; text: string } | null }[];
    relatedSubTaskIds: string[];
  };
  mediaDocs: Record<string, Media>;
}
