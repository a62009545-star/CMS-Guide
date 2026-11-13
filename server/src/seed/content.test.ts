import assert from 'node:assert/strict';
import { test } from 'node:test';
import { moduleInputSchema, subTaskInputSchema } from '@cms/shared';
import { configurationModules } from './configuration.js';
import { modules as lifecycleModules } from './content.js';

// Seed content must pass the same validation as the editor, so admins can re-save any page.
const all = [...lifecycleModules, ...configurationModules];
const fakeId = '0'.repeat(24);

test('every seed module and walkthrough passes editor validation', () => {
  for (const m of all) {
    const mod = moduleInputSchema.safeParse({
      title: m.title,
      slug: m.slug,
      section: m.section ?? 'lifecycle',
      icon: m.icon,
      summary: m.summary,
      e2eContent: { html: m.e2e },
      flowSteps: m.flow.map(([title, description]) => ({ title, description })),
      heroMedia: null,
      guidelines: m.guidelines.map(([type, text]) => ({ type, text })),
      faqs: m.faqs.map(([q, a]) => ({ q, a })),
    });
    assert.ok(mod.success, `${m.slug}: ${JSON.stringify(mod.error?.issues)}`);
    for (const s of m.subTasks) {
      const sub = subTaskInputSchema.safeParse({
        moduleId: fakeId,
        title: s.title,
        slug: s.slug,
        summary: s.summary,
        prerequisites: s.prerequisites,
        expectedOutcome: s.expectedOutcome,
        steps: s.steps.map((st) => ({ title: st.title, content: { html: st.html }, media: [], callout: st.callout ?? null })),
        relatedSubTaskIds: [],
      });
      assert.ok(sub.success, `${m.slug}/${s.slug}: ${JSON.stringify(sub.error?.issues)}`);
    }
  }
});

test('slugs are unique and related links resolve', () => {
  const modSlugs = all.map((m) => m.slug);
  assert.equal(new Set(modSlugs).size, modSlugs.length);
  const subSlugs = all.flatMap((m) => m.subTasks.map((s) => s.slug));
  assert.equal(new Set(subSlugs).size, subSlugs.length);
  for (const m of all) for (const s of m.subTasks) for (const r of s.related ?? []) assert.ok(subSlugs.includes(r), `${s.slug} -> ${r}`);
});

test('configuration content is in the configuration section with real screenshots', () => {
  for (const m of configurationModules) {
    assert.equal(m.section, 'configuration');
    assert.ok(m.hero?.src.startsWith('/sop/'));
    for (const s of m.subTasks) for (const st of s.steps) for (const sh of st.shots ?? []) assert.ok(sh.alt.length > 10, `${s.slug}: alt text`);
  }
});
