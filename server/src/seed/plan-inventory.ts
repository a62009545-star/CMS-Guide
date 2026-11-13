/*
 * Stage 1 of the CMS lifecycle, written from the "Scheduler Workflow" SOP: Plan & Inventory is the
 * first stage of the CHM CRQ Workflow. Screenshots are in client/public/sop/crq-workflow/.
 */
import type { SeedModule, Shot } from './content.js';

const shot = (name: string, alt: string): Shot => ({ src: `/sop/crq-workflow/${name}.webp`, alt });
const TEAM_PATH = 'Vertical › Team Function › Domain › Sub Domain';
const SIGNED_IN = 'Signed in to CHM (see “Sign in to CHM” in Configuration & management)';

const facts = (rows: [string, string][]) =>
  `<table><tbody>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;
const callout = (type: 'tip' | 'warning' | 'info', html: string) => `<div data-callout="${type}"><p>${html}</p></div>`;

export const planInventoryModule: SeedModule = {
  title: 'Plan & Inventory Validation',
  slug: 'plan-inventory-validation',
  section: 'lifecycle',
  icon: 'clipboard-check',
  summary:
    'The first stage of every CRQ. In the CHM CRQ Workflow you start the stage, bring in the plan’s NE and interface data, review it, update attributes and submit validation.',
  hero: shot('crq-workflow-list', 'CRQ Workflow showing the stage bar from Plan & Inventory to Task closure and the list of plans'),
  e2e: `
<p>Every change request (CRQ) starts with Plan &amp; Inventory Validation. You check that the network elements (NEs) and interfaces in the plan are right before anyone works on impact or procedure. In CHM this is the first stage of the <strong>CRQ Workflow</strong>, under the Scheduler.</p>
${facts([
  ['Where in CHM', 'Left menu › <strong>Scheduler</strong> (clock icon) › <strong>CRQ Workflow</strong>, Plan &amp; Inventory stage'],
  ['Find CRQs with', `${TEAM_PATH}, or search for a CRQ number directly`],
  ['Inputs', 'A CRQ with its plan, and the NE and interface data held in Planning'],
  ['What you do', 'Start the stage, fetch and sync the plan data, review it, pass or fail each checkpoint, update attributes and submit validation'],
  ['Outputs', 'Plan and inventory reviewed, attributes updated and an outcome of Pass, Failed or Cancelled'],
  ['Comes before', 'Impact Analysis'],
])}
<h3>The CRQ Workflow page</h3>
<ol>
<li>Team filters: Vertical, Team Function, Domain and Sub Domain.</li>
<li>Global CRQ search: find a CRQ by number without choosing a team.</li>
<li>The stage bar: Plan &amp; Inventory, Impact analysis, MOP creation, MOP validation, Scheduling, Network execution and Task closure. These match the stages in this guide.</li>
<li>The toolbar: Change Impact filter, task search, View Selected CRQ, Review Plan &amp; Inventory, PDF View and the total CRQ count.</li>
</ol>
${callout('warning', 'Click Fetch Plan Data and then Sync Plan Data before Review Plan &amp; Inventory. Otherwise the NE and interface data will not be there to review.')}
`,
  flow: [
    ['Find the CRQ', 'Team filters or CRQ search'],
    ['Start stage', 'View Selected CRQ › Start Stage'],
    ['Fetch and sync', 'NE and interface data from Planning'],
    ['Review', 'View data, pass or fail checkpoints'],
    ['Update attributes', 'Attributes from Remedy'],
    ['Submit validation', 'Pass, Failed or Cancelled'],
  ],
  guidelines: [
    ['must', 'Click Start Stage before working on the CRQ. The CRQ status changes when the stage starts.'],
    ['must', 'Click Fetch Plan Data and Sync Plan Data before Review Plan & Inventory, or no NE and interface data will be available.'],
    ['must', 'Update the attributes from Remedy and save them before you pass and submit validation.'],
    ['should', 'Check the plan PDF before starting, and download it if you need it offline.'],
    ['note', 'Attribute Update is available at every stage from Validation to Task closure, not only here.'],
  ],
  faqs: [
    ['Can I find a CRQ without choosing the team?', 'Yes. Type the CRQ number into the global CRQ search at the top right. You do not need to select a domain or sub domain.'],
    ['Why is there no data in Review Plan & Inventory?', 'Fetch Plan Data and Sync Plan Data have not been run for the CRQ. Run them from the CRQ, then open Review Plan & Inventory again.'],
    ['What do Fetch Plan Data and Sync Plan Data do?', 'Fetch Plan Data brings the NE and interface details in from Planning. Sync Plan Data checks the node and interface data in the plan.'],
    ['Which outcomes can I choose?', 'Pass, Failed or Cancelled. Choose Cancelled when the change was cancelled before it was completed.'],
  ],
  subTasks: [
    {
      title: 'Find a CRQ',
      slug: 'find-a-crq',
      summary: 'Open CRQ Workflow, select your team or search by CRQ number, and expand a plan to see its CRQs.',
      prerequisites: [SIGNED_IN],
      expectedOutcome: 'The CRQ you need is listed with its dates and status.',
      steps: [
        {
          title: 'Open CRQ Workflow',
          html: '<p>Move the cursor over the <strong>Scheduler</strong> icon (the clock) in the left menu. Four options appear: CRQ Workflow, Plan, CRQ Journey and Cancelled CRQs. Click <strong>CRQ Workflow</strong>.</p>',
          shots: [shot('scheduler-menu', 'Scheduler menu with CRQ Workflow, Plan, CRQ Journey and Cancelled CRQs')],
        },
        {
          title: 'Select your team or search for the CRQ',
          html: `<p>Select <strong>${TEAM_PATH}</strong> to list every CRQ assigned to the team. To go straight to one CRQ, type its number into the <strong>global CRQ search</strong> instead; you do not need to select the team first.</p>`,
          shots: [shot('crq-workflow-list', 'CRQ Workflow with team filters, stage bar, toolbar and the list of plans')],
          callout: { type: 'tip', text: 'Use the Change Impact filter and the task search in the toolbar to narrow down a long list.' },
        },
        {
          title: 'Expand a plan to see its CRQs',
          html: '<p>Click the down arrow next to a <strong>plan number</strong>. The CRQs under that plan appear with their CRQ number, start and end dates, CRQ status and review status.</p>',
          shots: [shot('crq-expanded', 'A plan expanded to show its CRQ with start date, end date and status')],
        },
      ],
      related: ['start-plan-inventory-stage'],
    },
    {
      title: 'Start the stage and fetch plan data',
      slug: 'start-plan-inventory-stage',
      summary: 'Select the CRQ, start the Plan & Inventory stage, fetch and sync the plan data, and check the plan PDF.',
      prerequisites: [SIGNED_IN, 'The CRQ is listed in CRQ Workflow (see “Find a CRQ”)'],
      expectedOutcome: 'The stage is started and the plan’s NE and interface data is fetched and synced, ready for review.',
      steps: [
        {
          title: 'Select the CRQ',
          html: '<p>Tick the checkbox next to the CRQ. Three toolbar buttons become available: <strong>View Selected CRQ</strong>, <strong>Review Plan &amp; Inventory</strong> and <strong>PDF View</strong>.</p>',
          shots: [shot('crq-selected', 'A CRQ selected with View Selected CRQ, Review Plan & Inventory and PDF View available')],
        },
        {
          title: 'View the CRQ and start the stage',
          html: '<p>Click <strong>View Selected CRQ</strong> to see its details, such as circle, description and plan type. Click <strong>Start Stage</strong>. The CRQ’s status changes to show the stage has started.</p>',
          shots: [shot('start-stage', 'Selected CRQ details with Fetch Plan Data, Sync Plan Data, CRQ Details and Start Stage')],
        },
        {
          title: 'Fetch and sync the plan data',
          html: '<p>Click <strong>Fetch Plan Data</strong> to bring in the NE and interface details from Planning. Then click <strong>Sync Plan Data</strong> to check the node and interface data in the plan. Click <strong>CRQ Details</strong> for the full CRQ information.</p>',
          shots: [shot('crq-details', 'CRQ Details panel with CRQ status, plan details, schedule and location')],
          callout: { type: 'warning', text: 'Do both before Review Plan & Inventory. Without them, no NE or interface data is available to review.' },
        },
        {
          title: 'Check the plan PDF',
          html: '<p>Click <strong>PDF View</strong> to read the plan report on the same page. Click <strong>Download</strong> to save a copy to your computer.</p>',
          shots: [shot('plan-pdf', 'Plan report PDF preview with the Download button')],
        },
      ],
      related: ['review-plan-inventory-and-submit', 'find-a-crq'],
    },
    {
      title: 'Review plan & inventory and submit validation',
      slug: 'review-plan-inventory-and-submit',
      summary: 'Review the NE and interface data, pass or fail each checkpoint, update attributes and submit the outcome.',
      prerequisites: [SIGNED_IN, 'Plan data fetched and synced for the CRQ (see “Start the stage and fetch plan data”)'],
      expectedOutcome: 'The Plan & Inventory review is submitted with its outcome, and the CRQ can move on to Impact Analysis.',
      steps: [
        {
          title: 'Open the review and view the data',
          html: '<p>With the CRQ selected, click <strong>Review Plan &amp; Inventory</strong>. When the fetch shows as complete, click <strong>View data</strong> to see the data for each checkpoint.</p>',
          shots: [shot('crq-review', 'CRQ Review with the checkpoint summary, View data, Mark PASS and Mark FAIL')],
        },
        {
          title: 'Mark each checkpoint pass or fail',
          html: '<p>Check each checkpoint’s data. Click <strong>Mark PASS</strong> if it is correct or <strong>Mark FAIL</strong> if something is wrong.</p>',
        },
        {
          title: 'Update the attributes',
          html: '<p>Click <strong>Attribute Update</strong>. Update the attributes that come from Remedy, such as status and support group details, then click <strong>Save</strong>.</p>',
          shots: [shot('attribute-update', 'Attribute Update window with Remedy Console and CAB Form attributes and the Save button')],
          callout: { type: 'tip', text: 'Attribute Update is available at every stage from Validation to Task closure, so you can keep attributes current as the CRQ moves through the lifecycle.' },
        },
        {
          title: 'Choose the outcome and submit',
          html: '<p>Under <strong>Select outcome</strong>, choose <strong>Pass</strong>, <strong>Failed</strong> or <strong>Cancelled</strong>. Then click <strong>Submit Validation</strong>.</p>',
          shots: [shot('crq-review', 'Select outcome with Pass, Failed and Cancelled, and the Submit Validation button')],
        },
      ],
      related: ['start-plan-inventory-stage', 'trace-affected-services'],
    },
  ],
};
