/* Placeholder content for the seven CMS lifecycle modules. Replace with your organisation's real process. */

type Callout = { type: 'tip' | 'warning' | 'error'; text: string } | null;

/** A real screenshot shipped with the client under /public (e.g. /sop/roster/roster-weekly.webp). */
export interface Shot {
  src: string;
  alt: string;
  caption?: string;
}

export interface SeedStep {
  title: string;
  html: string;
  images?: number; // how many placeholder screenshots to attach
  shots?: Shot[];
  callout?: Callout;
}

export interface SeedSubTask {
  title: string;
  slug: string;
  summary: string;
  prerequisites: string[];
  expectedOutcome: string;
  steps: SeedStep[];
  related?: string[]; // slugs of related sub-tasks (any module)
}

export interface SeedModule {
  title: string;
  slug: string;
  section?: 'lifecycle' | 'configuration';
  hero?: Shot;
  icon: string;
  summary: string;
  e2e: string;
  flow: [string, string][];
  guidelines: ['must' | 'should' | 'note', string][];
  faqs: [string, string][];
  subTasks: SeedSubTask[];
}

const facts = (rows: [string, string][]) =>
  `<table><tbody>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;

const callout = (type: 'tip' | 'warning' | 'info', html: string) => `<div data-callout="${type}"><p>${html}</p></div>`;

export const modules: SeedModule[] = [
  {
    title: 'Plan & Inventory Validation',
    slug: 'plan-inventory-validation',
    icon: 'clipboard-check',
    summary:
      'Raise the change request and confirm that every network element it touches exists, is correctly recorded in inventory and is free of conflicting work.',
    e2e: `
<p>Every change starts here. The Requester raises a Change Request (CR) in CMS, and the Planner checks it against the live network inventory before anyone spends time on impact or procedure. A change that fails inventory validation never reaches the later stages, which keeps bad data out of the MOP and out of the maintenance window.</p>
<h3>What this module does</h3>
<ul><li>Captures the business reason, scope and target date of the change.</li><li>Matches each node, link and circuit in scope against the inventory system of record.</li><li>Flags overlapping CRs on the same elements in the same window (collision check).</li></ul>
<h3>At a glance</h3>
${facts([
  ['Inputs', 'Change request form, list of affected network elements (NE IDs, circuit IDs), proposed window'],
  ['Outputs', 'Validated CR with inventory snapshot attached; status <strong>Inventory Validated</strong>'],
  ['Roles', 'Requester (raises CR), Planner (validates), Inventory SPOC (fixes data mismatches)'],
  ['SLA', 'Planner validation within 1 business day of submission; 4 hours for Emergency CRs'],
  ['Comes before', 'Impact Analysis'],
])}
${callout('info', 'Emergency CRs follow the same path but with compressed SLAs. They still need inventory validation — only the approval stages are shortened.')}
`,
    flow: [
      ['Raise CR', 'Requester fills in scope, reason and proposed window'],
      ['Auto inventory match', 'CMS looks up every NE and circuit ID'],
      ['Resolve mismatches', 'Inventory SPOC corrects missing or stale records'],
      ['Collision check', 'Detect overlapping changes on the same elements'],
      ['Validate', 'Planner marks the CR as Inventory Validated'],
    ],
    guidelines: [
      ['must', 'Every network element in scope must be identified by its inventory NE ID, not by hostname alone.'],
      ['must', 'Do not move a CR past this stage while any inventory mismatch is open.'],
      ['should', 'Raise standard changes at least 5 business days before the proposed window.'],
      ['should', 'Group changes to the same site into one CR where the work shares a window.'],
      ['note', 'The inventory snapshot attached at validation is what later stages compare against.'],
    ],
    faqs: [
      ['What if a node is missing from inventory?', 'Use the "Report mismatch" action on the CR. It creates a ticket for the Inventory SPOC and pauses the CR until the record is fixed.'],
      ['Can I edit the scope after validation?', 'Yes, but adding or removing elements sends the CR back to validation so the inventory check runs again.'],
      ['How does the collision check decide on a conflict?', 'Two CRs conflict when they share at least one NE ID or circuit and their proposed windows overlap by any amount.'],
    ],
    subTasks: [
      {
        title: 'Raise a Change Request',
        slug: 'raise-change-request',
        summary: 'Create a new CR with the correct change type, scope and proposed window.',
        prerequisites: ['CMS access with the Requester role', 'NE IDs or circuit IDs for every element in scope', 'Business justification approved by your line manager'],
        expectedOutcome: 'A CR in Submitted status with a unique CR number, visible to the Planner queue.',
        steps: [
          { title: 'Open the new CR form', html: '<p>From the CMS home page select <strong>Create › Change Request</strong>. The form opens with your name pre-filled as Requester.</p>', images: 1 },
          { title: 'Choose the change type', html: '<p>Select <strong>Standard</strong>, <strong>Normal</strong> or <strong>Emergency</strong>. The type decides which approvals and SLAs apply later in the lifecycle.</p><ul><li><strong>Standard</strong> — pre-approved, repeatable, low risk</li><li><strong>Normal</strong> — needs full impact analysis and approval</li><li><strong>Emergency</strong> — service is down or at imminent risk</li></ul>', callout: { type: 'warning', text: 'Emergency CRs are audited weekly. Use them only for live service impact.' } },
          { title: 'Add the elements in scope', html: '<p>Paste NE IDs or circuit IDs, one per line, into <strong>Affected elements</strong>. CMS validates the format as you type.</p>', images: 1, callout: { type: 'tip', text: 'You can paste up to 500 IDs at once straight from a spreadsheet column.' } },
          { title: 'Set the proposed window and submit', html: '<p>Pick a start and end time in IST. Add the business justification, then select <strong>Submit</strong>. Note the CR number shown in the confirmation banner.</p>', images: 1 },
        ],
        related: ['run-inventory-check'],
      },
      {
        title: 'Run the inventory check',
        slug: 'run-inventory-check',
        summary: 'Match every element in the CR against inventory and resolve mismatches.',
        prerequisites: ['Planner role', 'CR in Submitted status'],
        expectedOutcome: 'All elements show a green "Matched" badge and the inventory snapshot is attached to the CR.',
        steps: [
          { title: 'Pick the CR from your queue', html: '<p>Open <strong>My Queue › Awaiting validation</strong> and select the CR. The Inventory tab shows the automatic match result for each element.</p>', images: 1 },
          { title: 'Review mismatches', html: '<p>Elements are tagged <strong>Matched</strong>, <strong>Not found</strong> or <strong>Attribute mismatch</strong>. Open each non-matched row to see which attribute differs.</p>', callout: { type: 'error', text: '"NE decommissioned" means the element is retired in inventory. Confirm with the Requester before raising a mismatch — the ID is often a typo.' } },
          { title: 'Raise mismatch tickets', html: '<p>Select the affected rows and choose <strong>Report mismatch</strong>. The CR moves to <em>On hold — inventory</em> until the Inventory SPOC closes every ticket.</p>', images: 1 },
          { title: 'Attach the snapshot', html: '<p>When all rows are matched, select <strong>Attach inventory snapshot</strong>. CMS stores a read-only copy of the element records at this moment.</p>' },
        ],
        related: ['run-collision-check'],
      },
      {
        title: 'Run the collision check',
        slug: 'run-collision-check',
        summary: 'Detect other changes touching the same elements in an overlapping window.',
        prerequisites: ['Inventory check complete'],
        expectedOutcome: 'No unresolved collisions; the CR is marked Inventory Validated.',
        steps: [
          { title: 'Start the collision check', html: '<p>On the CR, open the <strong>Collisions</strong> tab and select <strong>Run check</strong>. Results appear in under a minute for most CRs.</p>', images: 1 },
          { title: 'Resolve each collision', html: '<p>For each conflicting CR, either agree a new window with its owner or merge the work into one CR. Record the decision in the collision comment field.</p>', callout: { type: 'tip', text: 'Use "Message owner" to open a chat thread pre-filled with both CR numbers.' } },
          { title: 'Mark as validated', html: '<p>Select <strong>Mark Inventory Validated</strong>. The CR moves to the Impact Analysis queue automatically.</p>' },
        ],
      },
    ],
  },
  {
    title: 'Impact Analysis',
    slug: 'impact-analysis',
    icon: 'activity',
    summary: 'Work out which services, customers and dependent elements the change could affect, and rate its risk.',
    e2e: `
<p>Impact Analysis turns a validated list of elements into a clear picture of who and what could be affected. The Planner traces downstream services from the inventory snapshot, estimates outage duration and assigns a risk rating that decides how much scrutiny the change gets in MOP Validation and approval.</p>
<h3>At a glance</h3>
${facts([
  ['Inputs', 'Inventory-validated CR and its snapshot'],
  ['Outputs', 'Impact report (services, customers, sites), risk rating, expected outage duration'],
  ['Roles', 'Planner (prepares), Transport/Core/RAN SMEs (review), Service Assurance (customer impact)'],
  ['SLA', '2 business days for Normal CRs; 2 hours for Emergency'],
  ['Comes after / before', 'Plan &amp; Inventory Validation › MOP Creation'],
])}
<h3>Risk rating</h3>
<ul><li><strong>Low</strong> — no customer-facing impact, full redundancy in place</li><li><strong>Medium</strong> — degraded service or redundancy lost during the window</li><li><strong>High</strong> — outage for enterprise customers or more than 10 sites</li><li><strong>Critical</strong> — core or national-level service at risk</li></ul>
`,
    flow: [
      ['Trace dependencies', 'Walk downstream services from each element'],
      ['Identify customers', 'List enterprise circuits and consumer sites affected'],
      ['Estimate outage', 'Expected duration and whether redundancy holds'],
      ['Rate risk', 'Low, Medium, High or Critical'],
      ['SME review', 'Domain experts confirm the analysis'],
    ],
    guidelines: [
      ['must', 'Every High or Critical rating must be reviewed by at least one domain SME.'],
      ['must', 'List enterprise customers by their account ID so Impacted Party Approval can notify them.'],
      ['should', 'Assume redundancy fails unless it was tested in the last 90 days.'],
      ['note', 'The risk rating can only be lowered by an SME, never by the Planner who set it.'],
    ],
    faqs: [
      ['Where does the dependency trace come from?', 'From the service topology linked to the inventory snapshot. If a service is missing, raise it with the Inventory SPOC — the trace is only as good as the topology.'],
      ['Do I need to list consumer customers individually?', 'No. Consumer impact is reported as a count of sites and subscribers per circle.'],
    ],
    subTasks: [
      {
        title: 'Trace affected services',
        slug: 'trace-affected-services',
        summary: 'Generate and review the downstream service map for every element in scope.',
        prerequisites: ['CR in Inventory Validated status'],
        expectedOutcome: 'A reviewed list of affected services attached to the impact report.',
        steps: [
          { title: 'Generate the service map', html: '<p>On the CR, open <strong>Impact › Service map</strong> and select <strong>Generate</strong>.</p>', images: 1 },
          { title: 'Review protected paths', html: '<p>Services with a protected path are shown with a dashed line. Confirm the protection path does not also pass through an element in scope.</p>', callout: { type: 'warning', text: 'A protection path that shares a fibre duct with the working path is not real redundancy.' } },
          { title: 'Export to the impact report', html: '<p>Select <strong>Add to impact report</strong>. The services appear in the report with their customer counts.</p>' },
        ],
        related: ['assign-risk-rating'],
      },
      {
        title: 'Assign the risk rating',
        slug: 'assign-risk-rating',
        summary: 'Rate the change and request SME review where needed.',
        prerequisites: ['Service map added to the impact report'],
        expectedOutcome: 'Risk rating set and, for High or Critical, SME review requested.',
        steps: [
          { title: 'Answer the risk questions', html: '<p>The Risk tab asks five questions about redundancy, customer type and rollback time. CMS proposes a rating from the answers.</p>', images: 1 },
          { title: 'Confirm or raise the rating', html: '<p>You can raise the proposed rating but not lower it. Add a reason if you raise it.</p>' },
          { title: 'Request SME review', html: '<p>For High or Critical, choose the domain (Transport, Core, RAN, IT) and select <strong>Request review</strong>.</p>', callout: { type: 'tip', text: 'Add the SME as a watcher so they see later changes to the MOP too.' } },
        ],
      },
    ],
  },
  {
    title: 'MOP Creation',
    slug: 'mop-creation',
    icon: 'file-text',
    summary: 'Write the Method of Procedure: the exact commands, checks and rollback steps the engineer will follow.',
    e2e: `
<p>The MOP (Method of Procedure) is the script for the maintenance window. It lists every action in order, the pre- and post-checks that prove each action worked, and the rollback plan if it did not. A good MOP lets any qualified engineer carry out the change without needing to ask the author anything.</p>
<h3>At a glance</h3>
${facts([
  ['Inputs', 'Impact report, risk rating, vendor documentation, approved MOP templates'],
  ['Outputs', 'Draft MOP with execution steps, pre/post checks, rollback plan and execution window'],
  ['Roles', 'Planner or Implementation Engineer (author), Domain SME (optional co-author)'],
  ['SLA', '3 business days for Normal CRs'],
  ['Comes after / before', 'Impact Analysis › MOP Validation'],
])}
${callout('warning', 'A MOP without a tested rollback plan is rejected automatically at MOP Validation.')}
`,
    flow: [
      ['Choose template', 'Start from an approved template for the change type'],
      ['Write steps', 'Commands, expected output and owner for each step'],
      ['Add checks', 'Pre-checks and post-checks for every action'],
      ['Attach rollback', 'How to return to the last known good state'],
      ['Set window', 'Execution window and go/no-go checkpoint'],
      ['Submit', 'Send the MOP for validation'],
    ],
    guidelines: [
      ['must', 'Every execution step must have a matching post-check with the expected output.'],
      ['must', 'The rollback plan must state the point of no return, if there is one.'],
      ['should', 'Start from an approved template rather than copying an old MOP.'],
      ['should', 'Keep each step to a single action an engineer can verify.'],
      ['note', 'Vendor commands pasted into the MOP are checked against the approved command list.'],
    ],
    faqs: [
      ['Can I reuse a MOP from a previous CR?', 'Yes, use "Clone MOP" on the old CR. The clone is re-validated in full — approval does not carry over.'],
      ['Who can edit the MOP after submission?', 'Only the author, and only after a validator sends it back with comments.'],
      ['What counts as a tested rollback?', 'A rollback that was run successfully in the lab or in production in the last 6 months, with evidence attached.'],
    ],
    subTasks: [
      {
        title: 'Create MOP from Template',
        slug: 'create-mop-from-template',
        summary: 'Start a MOP from an approved template and fill in the execution steps.',
        prerequisites: ['Impact report complete', 'Risk rating assigned', 'Vendor procedure document for the change'],
        expectedOutcome: 'A draft MOP linked to the CR with all execution steps and post-checks filled in.',
        steps: [
          { title: 'Open the template library', html: '<p>On the CR select <strong>MOP › New from template</strong>. Filter by domain and vendor to narrow the list.</p>', images: 1 },
          { title: 'Pick the closest template', html: '<p>Templates show their last review date and how many times they were used. Prefer templates reviewed in the last 12 months.</p>', images: 1, callout: { type: 'tip', text: 'If no template fits, ask the domain SME before writing from scratch — a new template may already be in review.' } },
          { title: 'Fill in the execution steps', html: '<p>For each step enter the command, expected output and the role who performs it. Placeholders like <code>{{NE_ID}}</code> are filled from the CR automatically.</p>', images: 2 },
          { title: 'Add post-checks', html: '<p>Every step needs a post-check. Use the <strong>Add check</strong> button under the step and paste the expected output.</p>', callout: { type: 'error', text: '"Post-check missing on step N" means a step has no check. The MOP cannot be submitted until every step has one.' } },
          { title: 'Save the draft', html: '<p>Select <strong>Save draft</strong>. The MOP stays editable until you submit it for validation.</p>' },
        ],
        related: ['attach-rollback-plan', 'add-execution-window'],
      },
      {
        title: 'Attach Rollback Plan',
        slug: 'attach-rollback-plan',
        summary: 'Document how to return to the last known good state, and when the point of no return is.',
        prerequisites: ['Draft MOP with execution steps'],
        expectedOutcome: 'A rollback section with steps, trigger conditions and test evidence.',
        steps: [
          { title: 'Open the rollback section', html: '<p>In the MOP editor select the <strong>Rollback</strong> tab.</p>', images: 1 },
          { title: 'Define the rollback triggers', html: '<p>List the conditions that start a rollback, such as a failed post-check or the go/no-go time passing.</p>' },
          { title: 'Write the rollback steps', html: '<p>Write the steps in the order they must be run. Each one needs a check that confirms the previous state is restored.</p>', images: 1 },
          { title: 'Mark the point of no return', html: '<p>If a step cannot be undone, mark it with <strong>Point of no return</strong>. Approvers will see it highlighted.</p>', callout: { type: 'warning', text: 'Steps after the point of no return need a forward-fix plan instead of a rollback.' } },
          { title: 'Attach test evidence', html: '<p>Upload logs or screenshots from the last rollback test. Evidence older than 6 months is flagged.</p>' },
        ],
        related: ['create-mop-from-template'],
      },
      {
        title: 'Add Execution Window',
        slug: 'add-execution-window',
        summary: 'Set the maintenance window, go/no-go checkpoint and the engineers who will execute.',
        prerequisites: ['Rollback plan attached'],
        expectedOutcome: 'The MOP shows a confirmed window and named executors, ready for submission.',
        steps: [
          { title: 'Choose the window', html: '<p>Open <strong>Schedule</strong> and pick from the maintenance windows available for the affected circles. Standard windows are 00:00–05:00 IST.</p>', images: 1 },
          { title: 'Set the go/no-go checkpoint', html: '<p>Choose the time after which the change must stop and roll back if it is not complete. Leave enough time to run the full rollback.</p>', callout: { type: 'tip', text: 'Rule of thumb: go/no-go = window end − (rollback duration × 1.5).' } },
          { title: 'Assign executors', html: '<p>Add the NOC engineer and any field engineers. They receive the MOP once it is approved.</p>' },
          { title: 'Submit for validation', html: '<p>Select <strong>Submit MOP</strong>. The CR moves to the MOP Validation queue.</p>' },
        ],
      },
    ],
  },
  {
    title: 'MOP Validation',
    slug: 'mop-validation',
    icon: 'shield-check',
    summary: 'Independent technical review of the MOP for correctness, completeness and safe rollback.',
    e2e: `
<p>A validator who did not write the MOP checks it line by line. The aim is to catch wrong commands, missing checks and unrealistic timings before the change reaches approvers or the network.</p>
<h3>At a glance</h3>
${facts([
  ['Inputs', 'Submitted MOP, impact report, risk rating'],
  ['Outputs', 'Validated MOP, or MOP returned with comments'],
  ['Roles', 'MOP Validator (domain SME), MOP author'],
  ['SLA', '2 business days; 1 hour for Emergency'],
  ['Comes after / before', 'MOP Creation › Impacted Party Approval'],
])}
`,
    flow: [
      ['Assign validator', 'Auto-assigned by domain, never the author'],
      ['Technical review', 'Commands, checks, timings'],
      ['Rollback review', 'Rollback plan and evidence'],
      ['Decision', 'Validate or return with comments'],
    ],
    guidelines: [
      ['must', 'The validator must not be the MOP author or a co-author.'],
      ['must', 'Return the MOP if any execution step lacks a post-check.'],
      ['should', 'Leave comments on the specific step rather than a general note.'],
      ['note', 'A MOP can be returned at most three times before it is escalated to the domain lead.'],
    ],
    faqs: [
      ['Can I validate part of a MOP?', 'No. Validation covers the whole MOP; partial approval is not supported.'],
      ['What happens when a MOP is returned?', 'The author is notified and the CR status changes to "MOP rework". The SLA clock pauses until resubmission.'],
    ],
    subTasks: [
      {
        title: 'Review the MOP',
        slug: 'review-the-mop',
        summary: 'Check commands, post-checks and timings step by step.',
        prerequisites: ['Validator role for the MOP domain'],
        expectedOutcome: 'Every step reviewed with comments where changes are needed.',
        steps: [
          { title: 'Open the review view', html: '<p>From <strong>My Queue › MOPs to validate</strong>, open the MOP. The review view shows each step with a comment box.</p>', images: 1 },
          { title: 'Check each command', html: '<p>Commands not on the approved list are highlighted amber. Confirm each one against the vendor procedure.</p>', callout: { type: 'warning', text: 'Never approve a highlighted command without a reference to vendor documentation.' } },
          { title: 'Check the timings', html: '<p>Compare the total step duration with the window. The MOP should finish with time to spare before go/no-go.</p>' },
        ],
        related: ['return-or-validate'],
      },
      {
        title: 'Return or validate the MOP',
        slug: 'return-or-validate',
        summary: 'Record your decision and notify the author.',
        prerequisites: ['Review complete'],
        expectedOutcome: 'MOP status is Validated or Returned, with the author notified.',
        steps: [
          { title: 'Choose the outcome', html: '<p>Select <strong>Validate</strong> if no changes are needed, otherwise <strong>Return with comments</strong>.</p>', images: 1 },
          { title: 'Summarise the reason', html: '<p>Write a one-line summary. The author sees it in their notification.</p>' },
        ],
      },
    ],
  },
  {
    title: 'Impacted Party Approval',
    slug: 'impacted-party-approval',
    icon: 'users',
    summary: 'Get sign-off from every team and customer the change affects before the window is locked.',
    e2e: `
<p>Once the MOP is validated, CMS sends approval requests to every impacted party identified in Impact Analysis: internal domain owners, the NOC, Service Assurance and, where applicable, enterprise customers. The change can go ahead only when all mandatory approvals are in.</p>
<h3>At a glance</h3>
${facts([
  ['Inputs', 'Validated MOP, impact report with impacted parties'],
  ['Outputs', 'All approvals recorded; window locked; customer notifications sent'],
  ['Roles', 'Approvers (domain owners, NOC lead, Service Assurance), Change Manager, Account Managers'],
  ['SLA', 'Approvals due 48 hours before the window; customer notice 72 hours before'],
  ['Comes after / before', 'MOP Validation › Network Execution'],
])}
`,
    flow: [
      ['Send requests', 'CMS notifies each impacted party'],
      ['Customer notice', 'Account Managers notify enterprise customers'],
      ['Collect approvals', 'Approve, reject or request changes'],
      ['CAB review', 'Change Advisory Board for High/Critical'],
      ['Lock window', 'Window frozen; no further edits'],
    ],
    guidelines: [
      ['must', 'High and Critical changes must be approved by the Change Advisory Board (CAB).'],
      ['must', 'Enterprise customers must be notified at least 72 hours before the window.'],
      ['should', 'Approvers should comment on rejections so the Planner can act on them.'],
      ['note', 'An approval expires if the window moves by more than 24 hours.'],
    ],
    faqs: [
      ['What if an approver is on leave?', 'Their delegate set in CMS receives the request automatically. If no delegate is set, the Change Manager can reassign it.'],
      ['Can a customer reject a change?', 'Customers can object. The Account Manager records the objection and the CAB decides whether to proceed.'],
    ],
    subTasks: [
      {
        title: 'Approve or reject a change',
        slug: 'approve-or-reject',
        summary: 'Review the change as an approver and record your decision.',
        prerequisites: ['Approver role', 'Approval request in your queue'],
        expectedOutcome: 'Your decision is recorded and the Planner is notified.',
        steps: [
          { title: 'Open the approval request', html: '<p>Open the link in your notification or go to <strong>My Approvals</strong>.</p>', images: 1 },
          { title: 'Read the summary', html: '<p>The summary shows risk rating, impact, window and rollback. Expand any section for detail.</p>' },
          { title: 'Record your decision', html: '<p>Select <strong>Approve</strong>, <strong>Reject</strong> or <strong>Request changes</strong>. A comment is required for anything other than Approve.</p>', callout: { type: 'tip', text: 'Approving from the mobile app works the same way and is fully audited.' } },
        ],
      },
      {
        title: 'Notify enterprise customers',
        slug: 'notify-enterprise-customers',
        summary: 'Send the planned maintenance notice to affected enterprise customers.',
        prerequisites: ['Account Manager role', 'Customer list from the impact report'],
        expectedOutcome: 'Each affected customer has a notice sent and acknowledged in CMS.',
        steps: [
          { title: 'Open the customer list', html: '<p>On the CR open <strong>Approvals › Customers</strong>.</p>', images: 1 },
          { title: 'Send the notice', html: '<p>Select the customers and choose <strong>Send notice</strong>. The template fills in window, impact and contact details.</p>' },
          { title: 'Record acknowledgements', html: '<p>Mark each customer as acknowledged once they reply. Objections go to the CAB.</p>', callout: { type: 'warning', text: 'Notices sent less than 72 hours before the window need Change Manager approval.' } },
        ],
        related: ['approve-or-reject'],
      },
    ],
  },
  {
    title: 'Network Execution',
    slug: 'network-execution',
    icon: 'radio-tower',
    summary: 'Carry out the change in the approved window, following the MOP and recording every check.',
    e2e: `
<p>During the window the NOC coordinates and the executing engineers follow the MOP step by step, recording the result of each post-check in CMS as they go. The go/no-go checkpoint decides whether the change completes or rolls back.</p>
<h3>At a glance</h3>
${facts([
  ['Inputs', 'Approved MOP, locked window, executor assignments'],
  ['Outputs', 'Step-by-step execution log, final result (Successful, Rolled back, Partial)'],
  ['Roles', 'NOC Engineer (coordinator), Field Engineer (on-site), Domain SME (on call)'],
  ['SLA', 'Start within 15 minutes of window start; status updates every 30 minutes'],
  ['Comes after / before', 'Impacted Party Approval › Task Closure'],
])}
${callout('warning', 'Starting work outside the locked window is a policy breach and is flagged automatically.')}
`,
    flow: [
      ['Start window', 'NOC opens the execution bridge'],
      ['Pre-checks', 'Baseline captured before any change'],
      ['Execute steps', 'Follow the MOP; record each post-check'],
      ['Go / no-go', 'Continue or roll back'],
      ['Post-checks', 'Service verification and alarms'],
    ],
    guidelines: [
      ['must', 'Do not run any command that is not in the approved MOP.'],
      ['must', 'Record each post-check result in CMS before starting the next step.'],
      ['must', 'Roll back if the go/no-go time passes and the change is incomplete.'],
      ['should', 'Post a status update on the bridge every 30 minutes.'],
      ['note', 'All CLI sessions during the window are recorded for audit.'],
    ],
    faqs: [
      ['What if a step fails?', 'Stop, record the failure in CMS, and follow the rollback triggers in the MOP. Escalate to the on-call SME if the outcome is unclear.'],
      ['Can I skip a step that does not apply?', 'Only with the NOC coordinator\'s approval, recorded as a deviation on that step.'],
    ],
    subTasks: [
      {
        title: 'Start the execution',
        slug: 'start-execution',
        summary: 'Open the window in CMS and capture pre-check baselines.',
        prerequisites: ['Locked window has started', 'Executor role on the CR'],
        expectedOutcome: 'Execution in progress with baselines recorded.',
        steps: [
          { title: 'Join the bridge', html: '<p>Join the execution bridge shared by the NOC. Confirm your name and role.</p>' },
          { title: 'Start execution in CMS', html: '<p>On the CR select <strong>Start execution</strong>. The timer starts and the MOP steps unlock.</p>', images: 1 },
          { title: 'Capture baselines', html: '<p>Run each pre-check and paste the output. CMS compares post-check output against this baseline.</p>', images: 1, callout: { type: 'error', text: '"Baseline missing" blocks step 1. Run every pre-check first.' } },
        ],
        related: ['record-step-results'],
      },
      {
        title: 'Record step results',
        slug: 'record-step-results',
        summary: 'Mark each MOP step as done and record the post-check output.',
        prerequisites: ['Execution started'],
        expectedOutcome: 'Every step marked Passed, Failed or Deviated with evidence.',
        steps: [
          { title: 'Run the step', html: '<p>Run the command exactly as written in the MOP.</p>' },
          { title: 'Paste the post-check output', html: '<p>Paste the output into the step. CMS highlights differences from the expected output.</p>', images: 1 },
          { title: 'Set the result', html: '<p>Choose <strong>Passed</strong>, <strong>Failed</strong> or <strong>Deviated</strong>. Failed steps prompt you with the rollback triggers.</p>', callout: { type: 'tip', text: 'Use keyboard shortcut P to mark a step Passed and move to the next.' } },
        ],
      },
      {
        title: 'Roll back a change',
        slug: 'roll-back-change',
        summary: 'Run the rollback plan when a trigger is met.',
        prerequisites: ['A rollback trigger has been met'],
        expectedOutcome: 'Network restored to baseline and the CR marked Rolled back.',
        steps: [
          { title: 'Declare rollback', html: '<p>Announce on the bridge and select <strong>Start rollback</strong> in CMS.</p>', images: 1 },
          { title: 'Run rollback steps', html: '<p>Follow the rollback steps in order and record each check as you go.</p>' },
          { title: 'Verify against baseline', html: '<p>Compare final output against the baseline captured at the start.</p>', callout: { type: 'warning', text: 'If the baseline cannot be restored, escalate immediately to the on-call SME and the NOC duty manager.' } },
        ],
        related: ['attach-rollback-plan'],
      },
    ],
  },
  {
    title: 'Task Closure',
    slug: 'task-closure',
    icon: 'flag',
    summary: 'Verify the outcome, record lessons learned and close the change with complete evidence.',
    e2e: `
<p>After the window, the executor submits the outcome and evidence, the NOC confirms there are no new alarms, and the Change Manager closes the CR. Failed and rolled-back changes get a short review so the next attempt goes better.</p>
<h3>At a glance</h3>
${facts([
  ['Inputs', 'Execution log, post-check evidence, alarm report'],
  ['Outputs', 'Closed CR with outcome code; inventory updated; lessons learned (if needed)'],
  ['Roles', 'Executor (submits), NOC (verifies), Change Manager (closes), Inventory SPOC (updates records)'],
  ['SLA', 'Close within 2 business days of window end'],
  ['Comes after', 'Network Execution — this is the last stage of the lifecycle'],
])}
`,
    flow: [
      ['Submit outcome', 'Executor sets the result and attaches evidence'],
      ['Alarm soak', 'NOC watches alarms for 24 hours'],
      ['Update inventory', 'Records changed by the work are updated'],
      ['Review', 'Lessons learned for failed or rolled-back CRs'],
      ['Close', 'Change Manager closes the CR'],
    ],
    guidelines: [
      ['must', 'Inventory must be updated before the CR is closed if any element attribute changed.'],
      ['must', 'Rolled-back changes need a lessons-learned entry before closure.'],
      ['should', 'Attach screenshots of final post-checks, not just text.'],
      ['note', 'Closed CRs are read-only and kept for 7 years.'],
    ],
    faqs: [
      ['Can a closed CR be reopened?', 'No. Raise a new CR and link it to the closed one.'],
      ['Who writes the lessons learned?', 'The executor drafts it; the domain SME reviews it.'],
    ],
    subTasks: [
      {
        title: 'Submit the outcome',
        slug: 'submit-outcome',
        summary: 'Set the final result and attach the evidence.',
        prerequisites: ['Execution finished'],
        expectedOutcome: 'CR in Pending closure with outcome and evidence attached.',
        steps: [
          { title: 'Open the closure form', html: '<p>On the CR select <strong>Close › Submit outcome</strong>.</p>', images: 1 },
          { title: 'Choose the outcome code', html: '<p>Pick <strong>Successful</strong>, <strong>Successful with deviations</strong>, <strong>Rolled back</strong> or <strong>Failed</strong>.</p>' },
          { title: 'Attach evidence', html: '<p>Upload final post-check output and screenshots.</p>', callout: { type: 'tip', text: 'You can drag the whole evidence folder onto the upload area.' } },
        ],
        related: ['close-the-cr'],
      },
      {
        title: 'Close the CR',
        slug: 'close-the-cr',
        summary: 'Confirm inventory is updated and close the change.',
        prerequisites: ['Change Manager role', 'Outcome submitted', '24-hour alarm soak complete'],
        expectedOutcome: 'CR status is Closed.',
        steps: [
          { title: 'Check the closure checklist', html: '<p>The checklist shows evidence, alarm soak and inventory update status. All must be green.</p>', images: 1 },
          { title: 'Close', html: '<p>Select <strong>Close CR</strong>. Requester and approvers are notified.</p>', callout: { type: 'error', text: '"Inventory update pending" means the Inventory SPOC has not confirmed the update yet.' } },
        ],
      },
    ],
  },
];
