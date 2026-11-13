import type { Role } from '@cms/shared';

/**
 * What the guide says on each page.
 *
 * Rules for this file:
 * - The guide only explains reading features every role has: navigating the lifecycle, reading
 *   modules and walkthroughs, search, bookmarks, "mark as read" and What's new.
 * - It never points at or explains admin or editor functionality (editing, publishing, drafts,
 *   the Admin area). Targets inside [data-staff-only] are skipped at runtime as a safeguard, and
 *   the guide is not shown at all under /admin.
 * - `roles` limits a step to certain roles; omit it for everyone.
 */

export interface TourStep {
  /** CSS selector of the element to highlight. Omit for a step with no highlight. */
  target?: string;
  title: string;
  text: string;
  roles?: Role[];
}

export interface PageGuide {
  /** Stable key, used to remember which pages the reader has already been shown. */
  key: string;
  greeting: string;
  steps: TourStep[];
}

const header: TourStep[] = [
  { target: '[data-guide="search"]', title: 'Search everything', text: 'Press Ctrl K (⌘ K on a Mac) from any page. Search covers steps, guidelines and FAQs, and spelling mistakes are fine.' },
  { target: '[data-guide="whats-new"]', title: 'What’s new', text: 'The bell shows recent changes to the guide. Pages you have open update by themselves when content changes.' },
];

export function guideFor(pathname: string): PageGuide | null {
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'admin') return null; // admin features are not guided

  if (parts.length === 0) {
    return {
      key: 'home',
      greeting: 'Hi, I’m Relay. I can show you how this guide works. It takes about a minute.',
      steps: [
        { target: '[data-guide="lifecycle"]', title: 'The CMS lifecycle', text: 'Every change goes through these seven stages in order. Open a stage to see what it does, who is involved and how to do each task.' },
        { target: '[data-guide="sidebar"]', title: 'Stages, always at hand', text: 'The seven stages stay in this sidebar while you read the lifecycle. The red line shows how far along you are.' },
        { target: '[data-guide="menu"]', title: 'Stages, always at hand', text: 'Open this menu for the seven stages on any page.' },
        ...header,
        { target: '[data-guide="areas"]', title: 'Configuration & management', text: 'How to use CHM itself, such as signing in, Team Management, the activity database and the roster, is in its own area. Switch to it here.' },
        { target: '[data-guide="recent"]', title: 'Recently updated', text: 'Walkthroughs that changed lately. Worth a look if you used them before.' },
        { target: '[data-guide="bookmarked"]', title: 'Your bookmarks', text: 'Bookmark any stage or walkthrough and it appears here, so the ones you use most are one click away.' },
        { title: 'Something out of date?', text: 'If a step no longer matches what you see in CMS, tell your CMS admin so they can update the guide.', roles: ['viewer'] },
        { title: 'That’s it', text: 'Click me any time for tips about the page you are on.' },
      ],
    };
  }

  if (parts[0] === 'configuration' && parts.length === 1) {
    return {
      key: 'configuration',
      greeting: 'This area explains how to use CHM itself: teams, plan types and rosters. Shall I show you around?',
      steps: [
        { target: '[data-guide="areas"]', title: 'Two separate areas', text: 'Switch between the CMS lifecycle and Configuration & management here. Each has its own pages and sidebar.' },
        { target: '[data-guide="config-start"]', title: 'Start here', text: 'If you have not used CHM before, begin with signing in. Every other walkthrough assumes you are signed in.' },
        { target: '[data-guide="config-topics"]', title: 'Topics', text: 'Each topic explains one part of CHM, with guidelines, FAQs and step-by-step walkthroughs.' },
      ],
    };
  }

  if (((parts[0] === 'modules' || parts[0] === 'configuration') && parts.length === 2) || parts[0] === 'lifecycle') {
    return {
      key: 'module',
      greeting: 'This page explains one part of CMS: a lifecycle stage or a configuration topic. Want a quick tour of how it’s laid out?',
      steps: [
        { target: '#overview', title: 'How it works', text: 'What this part of CMS does, where to find it, who is involved and what you need to know. Start here if it is new to you.' },
        { target: '#flow', title: 'Process flow', text: 'The main steps at a glance, in the order things happen.' },
        { target: '#guidelines', title: 'Guidelines', text: '“Must” is a rule you have to follow. “Should” is strongly recommended. “Note” is useful background.' },
        { target: '#walkthroughs', title: 'Walkthroughs', text: 'Step-by-step instructions for each task, with screenshots. A green tick means you have marked it as read.' },
        { target: '#faqs', title: 'FAQs', text: 'Common questions. Click a question to see the answer.' },
        { target: '[data-guide="bookmark"]', title: 'Bookmark this page', text: 'Save it to your bookmarks on the home page.' },
        { target: '[data-guide="stage-nav"]', title: 'Previous and next', text: 'Move to the neighbouring stage or topic without going back to the home page.' },
      ],
    };
  }

  if ((parts[0] === 'modules' || parts[0] === 'configuration') && parts.length === 3) {
    return {
      key: 'walkthrough',
      greeting: 'This is a step-by-step walkthrough. Shall I show you how to follow it?',
      steps: [
        { target: '[data-guide="prereq"]', title: 'Before you start', text: 'Check you have everything on this list, such as the right CMS role, before step 1.' },
        { target: '[data-guide="step-rail"]', title: 'Your progress', text: 'All the steps, with the one you are reading highlighted. The bar fills as you scroll through. Click a step to jump to it.' },
        { target: '[data-guide="step-list-mobile"]', title: 'Your progress', text: 'Tap here to see all the steps and jump to any of them.' },
        { target: '#step-1', title: 'Each step', text: 'Do what the step says, then move on. Click a screenshot to enlarge it; use the arrow keys to flip through.' },
        { target: '[data-guide="callout"]', title: 'Tips and warnings', text: 'Green boxes are tips. Amber boxes are warnings. Red boxes describe a common error and how to fix it.' },
        { target: '[data-guide="step-bar"]', title: 'Previous and next step', text: 'Move one step at a time without scrolling. You can share a link to any step.' },
        { target: '[data-guide="mark-read"]', title: 'Mark as read', text: 'When you are done, mark the walkthrough as read. It gets a green tick on the stage page.' },
      ],
    };
  }

  if (parts[0] === 'search') {
    return {
      key: 'search',
      greeting: 'Looking for something? I can show you how to narrow down results.',
      steps: [
        { target: '[data-guide="search-input"]', title: 'Type what you’re looking for', text: 'A word or two works best. Spelling mistakes are fine: “rolback” finds “rollback”.' },
        { target: '[data-guide="module-filter"]', title: 'One stage only', text: 'Limit results to a single stage of the lifecycle.' },
        { target: '[data-guide="type-filters"]', title: 'Kind of result', text: 'Show only steps, guidelines, FAQs and so on. Clicking a step opens the walkthrough at that exact step.' },
      ],
    };
  }

  if (parts[0] === 'bookmarks') {
    return {
      key: 'bookmarks',
      greeting: 'Your bookmarks live here. Use the Bookmark button on any stage or walkthrough to add one.',
      steps: [],
    };
  }

  return null;
}

export const stepsForRole = (guide: PageGuide, role?: Role) => guide.steps.filter((s) => !s.roles || (role && s.roles.includes(role)));
