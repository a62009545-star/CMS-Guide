import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { AuditLog, Media, Module, SubTask, User, Version } from '../models/index.js';
import { moduleSearchText, subTaskSearchText, subTaskToSnapshot, type ModuleSnapshot, type SubTaskSnapshot } from '../services/content.js';
import { modules } from './content.js';

/** Create the admin account and sample content. Expects an open database connection. */
export async function runSeed({ reset = false }: { reset?: boolean } = {}) {

  // Admin account
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
    await Promise.all([Module.deleteMany({}), SubTask.deleteMany({}), Media.deleteMany({}), Version.deleteMany({}), AuditLog.deleteMany({})]);
    console.log('Cleared existing content');
  } else if (await Module.estimatedDocumentCount()) {
    console.log('Content already present. Run with --reset to replace it.');
    return;
  }

  // Placeholder media (SVG mock-ups shipped with the client under /placeholders)
  const screens = await Media.insertMany(
    Array.from({ length: 8 }, (_, i) => ({
      url: `/placeholders/screen-${i + 1}.svg`,
      type: 'image',
      caption: `Placeholder screenshot ${i + 1}`,
      altText: 'Placeholder screenshot of the CMS interface',
      mimeType: 'image/svg+xml',
      uploadedBy: admin._id,
    })),
  );
  const heroes = await Media.insertMany(
    modules.map((m, i) => ({
      url: `/placeholders/hero-${(i % 3) + 1}.svg`,
      type: 'image',
      caption: `${m.title} overview`,
      altText: `Illustration for ${m.title}`,
      mimeType: 'image/svg+xml',
      uploadedBy: admin._id,
    })),
  );

  const slugToId = new Map<string, Types.ObjectId>();
  const pendingRelated: { id: Types.ObjectId; related: string[] }[] = [];
  let screenIdx = 0;
  const now = Date.now();

  for (const [mi, m] of modules.entries()) {
    const snap: ModuleSnapshot = {
      title: m.title,
      slug: m.slug,
      icon: m.icon,
      summary: m.summary,
      e2eContent: { html: m.e2e.trim(), json: null },
      flowSteps: m.flow.map(([title, description]) => ({ title, description })),
      heroMedia: String(heroes[mi]._id),
      guidelines: m.guidelines.map(([type, text]) => ({ type, text })),
      faqs: m.faqs.map(([q, a]) => ({ q, a })),
    };
    const mod = await Module.create({
      ...snap,
      heroMedia: heroes[mi]._id,
      order: mi + 1,
      status: 'published',
      publishedAt: new Date(),
      updatedBy: admin._id,
      searchText: moduleSearchText(snap),
    });
    await Version.create({ entityType: 'module', entityId: mod._id, versionNumber: 1, snapshot: snap, changedFields: Object.keys(snap), changedBy: admin._id, changedByName: admin.name, changeNote: 'Initial content' });

    for (const [si, s] of m.subTasks.entries()) {
      const steps = s.steps.map((st) => {
        const media = Array.from({ length: st.images ?? 0 }, () => String(screens[screenIdx++ % screens.length]._id));
        return { title: st.title, content: { html: st.html, json: null }, media, callout: st.callout ?? null };
      });
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
      if (s.related?.length) pendingRelated.push({ id: sub._id, related: s.related });
      await AuditLog.create({ userId: admin._id, userName: admin.name, action: 'publish', entityType: 'subtask', entityId: sub._id, entityTitle: sub.title, path: `/modules/${mod.slug}/${sub.slug}`, visibleToViewers: true, timestamp: new Date(now - (modules.length - mi) * 3_600_000 + si * 60_000) });
    }
    await AuditLog.create({ userId: admin._id, userName: admin.name, action: 'publish', entityType: 'module', entityId: mod._id, entityTitle: mod.title, path: `/modules/${mod.slug}`, visibleToViewers: true, timestamp: new Date(now - (modules.length - mi) * 3_600_000) });
  }

  // Related sub-tasks need every sub-task id, so link them in a second pass, then version them.
  for (const { id, related } of pendingRelated) {
    const ids = related.map((r) => slugToId.get(r)).filter(Boolean) as Types.ObjectId[];
    await SubTask.updateOne({ _id: id }, { $set: { relatedSubTaskIds: ids } });
  }
  for (const sub of await SubTask.find().lean()) {
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
  console.log(`Seeded ${modules.length} modules and ${slugToId.size} sub-tasks`);
}
