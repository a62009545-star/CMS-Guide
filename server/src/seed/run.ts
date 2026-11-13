import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { AuditLog, Media, Migration, Module, SubTask, User, Version, type UserDoc } from '../models/index.js';
import { moduleSearchText, subTaskSearchText, subTaskToSnapshot, type ModuleSnapshot, type SubTaskSnapshot } from '../services/content.js';
import { configurationModules } from './configuration.js';
import { modules as lifecycleModules, type SeedModule, type Shot } from './content.js';

/**
 * Insert seed modules with their sub-tasks, media, initial versions and "published" audit entries.
 * Lifecycle content uses placeholder mock-ups; configuration content uses real SOP screenshots.
 */
async function seedModules(seeds: SeedModule[], admin: UserDoc) {
  // Placeholder screens are shared by the lifecycle modules' steps.
  let placeholders: Types.ObjectId[] = [];
  if (seeds.some((m) => m.subTasks.some((s) => s.steps.some((st) => st.images)))) {
    const docs = await Media.insertMany(
      Array.from({ length: 8 }, (_, i) => ({
        url: `/placeholders/screen-${i + 1}.svg`,
        type: 'image',
        caption: `Placeholder screenshot ${i + 1}`,
        altText: 'Placeholder screenshot of the CMS interface',
        mimeType: 'image/svg+xml',
        uploadedBy: admin._id,
      })),
    );
    placeholders = docs.map((d) => d._id);
  }
  let placeholderIdx = 0;

  // One media record per distinct screenshot path, reused wherever the same image appears.
  const shotIds = new Map<string, Types.ObjectId>();
  const mediaFor = async (s: Shot) => {
    const known = shotIds.get(s.src);
    if (known) return known;
    const doc = await Media.create({ url: s.src, type: 'image', caption: s.caption ?? '', altText: s.alt, mimeType: 'image/webp', uploadedBy: admin._id });
    shotIds.set(s.src, doc._id);
    return doc._id;
  };

  const slugToId = new Map((await SubTask.find().select('slug').lean()).map((s) => [s.slug, s._id as Types.ObjectId]));
  const pendingRelated: { id: Types.ObjectId; related: string[] }[] = [];
  const created: Types.ObjectId[] = [];
  const now = Date.now();

  for (const m of seeds) {
    const section = m.section ?? 'lifecycle';
    const last = await Module.findOne({ section }).sort({ order: -1 }).select('order').lean();
    const order = (last?.order ?? 0) + 1;
    const hero = m.hero
      ? await mediaFor(m.hero)
      : (
          await Media.create({
            url: `/placeholders/hero-${((order - 1) % 3) + 1}.svg`,
            type: 'image',
            caption: `${m.title} overview`,
            altText: `Illustration for ${m.title}`,
            mimeType: 'image/svg+xml',
            uploadedBy: admin._id,
          })
        )._id;

    const snap: ModuleSnapshot = {
      title: m.title,
      slug: m.slug,
      section,
      icon: m.icon,
      summary: m.summary,
      e2eContent: { html: m.e2e.trim(), json: null },
      flowSteps: m.flow.map(([title, description]) => ({ title, description })),
      heroMedia: String(hero),
      guidelines: m.guidelines.map(([type, text]) => ({ type, text })),
      faqs: m.faqs.map(([q, a]) => ({ q, a })),
    };
    const mod = await Module.create({
      ...snap,
      heroMedia: hero,
      order,
      status: 'published',
      publishedAt: new Date(),
      updatedBy: admin._id,
      searchText: moduleSearchText(snap),
    });
    await Version.create({ entityType: 'module', entityId: mod._id, versionNumber: 1, snapshot: snap, changedFields: Object.keys(snap), changedBy: admin._id, changedByName: admin.name, changeNote: 'Initial content' });

    for (const [si, s] of m.subTasks.entries()) {
      const steps = [];
      for (const st of s.steps) {
        const media: string[] = [];
        for (let i = 0; i < (st.images ?? 0); i++) media.push(String(placeholders[placeholderIdx++ % placeholders.length]));
        for (const sh of st.shots ?? []) media.push(String(await mediaFor(sh)));
        steps.push({ title: st.title, content: { html: st.html, json: null }, media, callout: st.callout ?? null });
      }
      const sSnap: SubTaskSnapshot = {
        moduleId: String(mod._id),
        title: s.title,
        slug: s.slug,
        summary: s.summary,
        prerequisites: s.prerequisites,
        expectedOutcome: s.expectedOutcome,
        steps,
        relatedSubTaskIds: [],
      };
      const sub = await SubTask.create({
        ...sSnap,
        moduleId: mod._id,
        steps: steps.map((st, i) => ({ ...st, order: i + 1, media: st.media.map((x) => new Types.ObjectId(x)) })),
        order: si + 1,
        status: 'published',
        publishedAt: new Date(),
        updatedBy: admin._id,
        searchText: subTaskSearchText(sSnap),
      });
      slugToId.set(s.slug, sub._id);
      created.push(sub._id);
      if (s.related?.length) pendingRelated.push({ id: sub._id, related: s.related });
      await AuditLog.create({ userId: admin._id, userName: admin.name, action: 'publish', entityType: 'subtask', entityId: sub._id, entityTitle: sub.title, path: `/modules/${mod.slug}/${sub.slug}`, visibleToViewers: true, timestamp: new Date(now - (seeds.length - order) * 60_000 + si * 1_000) });
    }
    await AuditLog.create({ userId: admin._id, userName: admin.name, action: 'publish', entityType: 'module', entityId: mod._id, entityTitle: mod.title, path: `/modules/${mod.slug}`, visibleToViewers: true, timestamp: new Date(now - (seeds.length - order) * 60_000) });
  }

  // Related sub-tasks need every sub-task id, so link them in a second pass, then version them.
  for (const { id, related } of pendingRelated) {
    const ids = related.map((r) => slugToId.get(r)).filter(Boolean) as Types.ObjectId[];
    await SubTask.updateOne({ _id: id }, { $set: { relatedSubTaskIds: ids } });
  }
  for (const sub of await SubTask.find({ _id: { $in: created } }).lean()) {
    await Version.create({
      entityType: 'subtask',
      entityId: sub._id,
      versionNumber: 1,
      snapshot: subTaskToSnapshot(sub),
      changedFields: ['title', 'summary', 'steps'],
      changedBy: admin._id,
      changedByName: admin.name,
      changeNote: 'Initial content',
    });
  }
  await Promise.all([Module.syncIndexes(), SubTask.syncIndexes()]);
  return created.length;
}

/** Content added after the first release. Each runs once per database; a deleted module is not re-added. */
const MIGRATIONS: { name: string; run: (admin: UserDoc) => Promise<void> }[] = [
  {
    name: '2026-11-modules-section-field',
    run: async () => {
      await Module.updateMany({ section: { $exists: false } }, { $set: { section: 'lifecycle' } });
    },
  },
  {
    name: '2026-11-configuration-section',
    run: async (admin) => {
      const existing = new Set((await Module.find({ slug: { $in: configurationModules.map((m) => m.slug) } }).select('slug').lean()).map((m) => m.slug));
      const missing = configurationModules.filter((m) => !existing.has(m.slug));
      if (!missing.length) return;
      const n = await seedModules(missing, admin);
      console.log(`Added Configuration & management: ${missing.length} topics, ${n} walkthroughs`);
    },
  },
];

/** Run pending migrations. Safe to call on every start. */
export async function runMigrations() {
  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  if (!admin) return; // nothing seeded yet; runSeed handles a fresh database
  const done = new Set((await Migration.find().lean()).map((m) => m.name));
  for (const m of MIGRATIONS) {
    if (done.has(m.name)) continue;
    await m.run(admin);
    await Migration.create({ name: m.name });
    console.log(`Migration applied: ${m.name}`);
  }
}

/** Create the admin account and sample content. Expects an open database connection. */
export async function runSeed({ reset = false }: { reset?: boolean } = {}) {
  let admin = await User.findOne({ email: env.SEED_ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      name: 'CMS Admin',
      email: env.SEED_ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12),
      role: 'admin',
    });
    console.log(`Created admin ${env.SEED_ADMIN_EMAIL}`);
  } else {
    console.log(`Admin ${env.SEED_ADMIN_EMAIL} already exists`);
  }

  if (reset) {
    await Promise.all([Module.deleteMany({}), SubTask.deleteMany({}), Media.deleteMany({}), Version.deleteMany({}), AuditLog.deleteMany({}), Migration.deleteMany({})]);
    console.log('Cleared existing content');
  } else if (await Module.estimatedDocumentCount()) {
    console.log('Content already present. Applying any pending content updates; run with --reset to replace everything.');
    await runMigrations();
    return;
  }

  const n = await seedModules([...lifecycleModules, ...configurationModules], admin);
  // Fresh content already includes everything the migrations would add.
  await Migration.insertMany(MIGRATIONS.map((m) => ({ name: m.name })));
  console.log(`Seeded ${lifecycleModules.length + configurationModules.length} modules and ${n} walkthroughs`);
}
