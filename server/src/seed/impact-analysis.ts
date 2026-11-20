/*
 * Stage 2 of the CRQ lifecycle, written from the team's steps for loading impact analysis data in
 * the CHM CRQ Workflow. Screenshots are added by the team through the admin editor.
 */
import type { SeedModule } from './content.js';

const SIGNED_IN = 'Signed in to CHM (see “Sign in to CHM” under Getting started with CHM)';

const facts = (rows: [string, string][]) =>
  `<table><tbody>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;
const callout = (type: 'tip' | 'warning' | 'info', html: string) => `<div data-callout="${type}"><p>${html}</p></div>`;

export const impactAnalysisModule: SeedModule = {
  title: 'Impact Analysis',
  slug: 'impact-analysis',
  section: 'lifecycle',
  icon: 'activity',
  summary:
    'See what the CRQ affects. In the CHM CRQ Workflow you fetch and sync the plan’s node and interface data, check it in Review Plan & Inventory, then load the impact data in Review Impact Analysis.',
  hero: null,
  e2e: `
<p>Impact Analysis shows what a change request (CRQ) will affect. The impact data is built from the node and interface data in the CRQ’s plan, so that data has to be fetched and synced first. You do this in the CHM <strong>CRQ Workflow</strong>, under the Scheduler.</p>
${facts([
  ['Where in CHM', 'Left menu › <strong>Scheduler</strong> (clock icon) › <strong>CRQ Workflow</strong>, then select the CRQ'],
  ['Needs first', 'Node and interface data fetched and synced for the CRQ in Plan &amp; Inventory Validation'],
  ['What you do', 'Fetch Plan Data, Sync Plan Data, view the data in Review Plan &amp; Inventory, then view the data in Review Impact Analysis'],
  ['Mandatory steps', '<strong>Fetch Plan Data</strong> and <strong>Sync Plan Data</strong>'],
  ['Comes after / before', 'Plan &amp; Inventory Validation › MOP Creation'],
])}
${callout('warning', 'Impact Analysis data loads only for CRQs whose node and interface data was fetched in the Plan &amp; Inventory Validation stage. If you see no data, fetch and sync the plan data first.')}
`,
  flow: [
    ['Fetch Plan Data', 'Mandatory: NE and interface from Planning'],
    ['Sync Plan Data', 'Mandatory: check node and interface data'],
    ['Review Plan & Inventory', 'Open the review'],
    ['View Data', 'Plan and inventory data'],
    ['Review Impact Analysis', 'Open the review'],
    ['View Data', 'Impact analysis data'],
  ],
  guidelines: [
    ['must', 'Click Fetch Plan Data (under View Selected CRQ) to fetch the NE and interface data from Planning. This step is mandatory.'],
    ['must', 'Click Sync Plan Data to check the node and interface data in the plan. This step is mandatory.'],
    ['must', 'Impact Analysis data loads only for CRQs whose node and interface data was fetched in the Plan & Inventory Validation stage.'],
    ['should', 'Check the data under Review Plan & Inventory › View Data before opening Review Impact Analysis.'],
    ['note', 'Fetch Plan Data is under View Selected CRQ, after you select the CRQ in the CRQ Workflow.'],
  ],
  faqs: [
    [
      'Why is no Impact Analysis data showing?',
      'The CRQ’s node and interface data has not been fetched. Impact Analysis data loads only for CRQs whose node and interface data was fetched in the Plan & Inventory Validation stage. Click Fetch Plan Data and Sync Plan Data, then try View Data again.',
    ],
    ['Can I skip Fetch Plan Data or Sync Plan Data?', 'No. Both are mandatory. Without them there is no node and interface data, so no impact analysis data either.'],
    ['Where do I find Fetch Plan Data?', 'In the CRQ Workflow, select the CRQ and open View Selected CRQ. Fetch Plan Data and Sync Plan Data are there.'],
  ],
  subTasks: [
    {
      title: 'Review impact analysis data',
      slug: 'review-impact-analysis-data',
      summary: 'Fetch and sync the plan data, check it in Review Plan & Inventory, then load the impact data in Review Impact Analysis.',
      prerequisites: [SIGNED_IN, 'The CRQ is selected in the CRQ Workflow (see “Find a CRQ” in Plan & Inventory Validation)'],
      expectedOutcome: 'The Impact Analysis data for the CRQ is loaded and can be reviewed.',
      steps: [
        {
          title: 'Click Fetch Plan Data',
          html: '<p>Under <strong>View Selected CRQ</strong>, click <strong>Fetch Plan Data</strong>. This fetches the NE and interface data from Planning.</p>',
          callout: { type: 'warning', text: 'Mandatory. Without it, no node and interface data is available, and Impact Analysis data will not load.' },
        },
        {
          title: 'Click Sync Plan Data',
          html: '<p>Select <strong>Sync Plan Data</strong> to check the node and interface data in the plan.</p>',
          callout: { type: 'warning', text: 'Mandatory. Do this after Fetch Plan Data.' },
        },
        {
          title: 'Click Review Plan & Inventory',
          html: '<p>Click <strong>Review Plan &amp; Inventory</strong>.</p>',
        },
        {
          title: 'Click View Data under Review Plan & Inventory',
          html: '<p>Under <strong>Review Plan &amp; Inventory</strong>, click <strong>View Data</strong> to see the plan and inventory data.</p>',
        },
        {
          title: 'Click Review Impact Analysis',
          html: '<p>Click <strong>Review Impact Analysis</strong>.</p>',
        },
        {
          title: 'Click View Data under Review Impact Analysis',
          html: '<p>Under <strong>Review Impact Analysis</strong>, click <strong>View Data</strong>. The Impact Analysis data for the CRQ loads.</p>',
          callout: {
            type: 'error',
            text: 'No data? Impact Analysis data loads only for CRQs whose node and interface data was fetched in the Plan & Inventory Validation stage. Go back to steps 1 and 2.',
          },
        },
      ],
      related: ['start-plan-inventory-stage', 'review-plan-inventory-and-submit'],
    },
  ],
};
