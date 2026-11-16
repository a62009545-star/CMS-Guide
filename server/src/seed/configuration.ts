/*
 * The "configuration" section (labelled "CMS lifecycle" in the UI), written from the CHM SOPs:
 * Team Management, Activity Database Setup & View and Roster, plus User Management and the team
 * member actions described by the team. (The Scheduler Workflow SOP is used for CRQ lifecycle
 * stage 1, Plan & Inventory Validation: see plan-inventory.ts.)
 * The sign-in steps every SOP repeats live once, in "Getting started with CHM".
 * Screenshots are in client/public/sop/<topic>/.
 */
import type { SeedModule, SeedSubTask, Shot } from './content.js';

const CHM_URL = 'https://chngmgmt.airtel.com/airtelcms/login';

const shot = (folder: string, name: string, alt: string, caption?: string): Shot => ({ src: `/sop/${folder}/${name}.webp`, alt, caption });

const facts = (rows: [string, string][]) =>
  `<table><tbody>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;
const callout = (type: 'tip' | 'warning' | 'info', html: string) => `<div data-callout="${type}"><p>${html}</p></div>`;

const SIGNED_IN = 'Signed in to CHM (see “Sign in to CHM” under Getting started)';
const TEAM_PATH = 'Vertical › Team Function › Domain › Sub Domain';

/** Team Management: the Actions column (edit and delete) on each team member. */
export const teamMemberActions: SeedSubTask[] = [
  {
    title: 'Edit a team member',
    slug: 'edit-a-team-member',
    summary: 'Change a team member’s details from the Actions column. Everything can be edited except the OLM ID.',
    prerequisites: [SIGNED_IN, 'You are the team lead, or in a role above team lead'],
    expectedOutcome: 'The member’s details are updated in Team Management.',
    steps: [
      {
        title: 'Find the team member',
        html: `<p>Open <strong>Team Management</strong> and select <strong>${TEAM_PATH}</strong>. Find the engineer in the list, or type their name or OLM ID into the search box.</p>`,
        shots: [shot('team-management', 'team-list', 'Team list with an Actions column on the right holding a blue edit pencil and a red delete bin for each engineer')],
      },
      {
        title: 'Click Edit in the Actions column',
        html: '<p>In the <strong>Actions</strong> column on the right of the engineer’s row, click the <strong>edit</strong> icon (the pencil). The member’s details open for editing.</p>',
        callout: { type: 'warning', text: 'Only a team lead, or a role above team lead, can edit a team member. If you are not, ask your team lead to make the change.' },
      },
      {
        title: 'Update the details',
        html: '<p>Change the details that need updating, such as name, email, mobile number, employment type, vendor company, designation, job level, office location, device vendor capability or place in the organisation hierarchy.</p><p>The <strong>OLM ID</strong> cannot be edited.</p>',
        callout: { type: 'tip', text: 'If the OLM ID itself is wrong, delete the member and add them again with the correct OLM ID.' },
      },
      {
        title: 'Save the changes',
        html: '<p>Save the form. The updated details show in the team list straight away.</p>',
      },
    ],
    related: ['remove-a-team-member', 'add-a-team-member'],
  },
  {
    title: 'Remove a team member',
    slug: 'remove-a-team-member',
    summary: 'Delete a member who has left the company or the team, or who was added by mistake.',
    prerequisites: [SIGNED_IN, 'The person has left the company or the team, or was added by mistake'],
    expectedOutcome: 'The member no longer appears in the team list.',
    steps: [
      {
        title: 'Find the team member',
        html: `<p>Open <strong>Team Management</strong> and select <strong>${TEAM_PATH}</strong>. Find the engineer in the list, or search by name or OLM ID.</p>`,
        shots: [shot('team-management', 'team-list', 'Team list with the red delete bin in the Actions column of each engineer')],
      },
      {
        title: 'Click Delete in the Actions column',
        html: '<p>In the <strong>Actions</strong> column on the right of the engineer’s row, click the <strong>delete</strong> icon (the red bin). If CHM asks you to confirm, confirm the deletion.</p>',
        callout: {
          type: 'warning',
          text: 'Delete a member only when they have left the company, have moved out of the team, or were added by mistake. To change their details, edit them instead.',
        },
      },
      {
        title: 'Check the team list',
        html: '<p>The engineer is removed from the team list, and the level counts in the toolbar update.</p>',
      },
    ],
    related: ['edit-a-team-member', 'add-a-team-member'],
  },
];

/** User Management: give people access to CMS. Written from screenshots of the Add New User wizard. */
const um = (name: string, alt: string) => shot('user-management', name, alt);
export const userManagementModule: SeedModule = {
  title: 'User Management',
  slug: 'user-management',
  section: 'configuration',
  icon: 'user-plus',
  summary: 'Add people to CMS so they can sign in, then view, edit, check permissions, reset passwords or remove users from the User Directory.',
  hero: um('directory-more-menu', 'User Directory listing users with OLM ID, department, role, status and joined date, with the more-options menu open'),
  e2e: `
<p>User Management is where people are given access to CMS. A person must be added here before they can sign in. The page lists everyone in the <strong>User Directory</strong>.</p>
${facts([
  ['Where in CHM', 'Side menu › <strong>User Management</strong>. The page has three tabs: User Management, User Log Details and Audit Log.'],
  ['Who can add users', 'Only people who have access to User Management'],
  ['Ways to add a user', '<strong>Team User</strong> or <strong>Other User</strong>'],
  ['On the User Directory', 'Totals (total users, active, team heads, super admins, inactive, new this month), search by name, OLM ID or email, role filter, sort, Filters, <strong>Import</strong>, <strong>Export</strong> and <strong>Add User</strong>'],
  ['Actions on each user', '<strong>View</strong> (eye): the user’s details. <strong>Edit</strong> (pencil): change details, except the OLM ID and organisation hierarchy. <strong>More</strong> (⋮): Permissions, Reset Password and Remove User.'],
])}
<h3>The Add New User wizard</h3>
<ol>
<li><strong>Basic Info</strong>: OLM ID, full name, email address and mobile number.</li>
<li><strong>Employment</strong>: employment type, vendor company, designation, job level, office location, device vendor capability, gender and date of joining.</li>
<li><strong>Hierarchy</strong>: Vertical, Team Function, Domain and Sub Domain.</li>
<li><strong>Review</strong>: check every detail, including the role, then click Add User.</li>
</ol>
${callout('info', 'Use <strong>Back</strong> at any step to change something you entered earlier. Nothing is saved until you click <strong>Add User</strong> on the Review step.')}
<h3>After a user is added</h3>
<ul>
<li><strong>View</strong> (eye) opens a panel with three tabs: <strong>Overview</strong> (OLM ID, email, phone, organisation, department, employment type, joining date), <strong>Permissions</strong> and <strong>Sessions</strong>.</li>
<li><strong>Edit</strong> (pencil) opens <strong>Edit Team Member</strong>. Everything can be changed except the OLM ID and the organisation hierarchy, which are locked.</li>
<li><strong>More</strong> (⋮) has <strong>Permissions</strong>, <strong>Reset Password</strong> and <strong>Remove User</strong>.</li>
</ul>
${callout('warning', 'The OLM ID and organisation hierarchy cannot be changed after a user is added. Check them carefully on the Review step.')}
`,
  flow: [
    ['Open User Management', 'Side menu › User Management'],
    ['Add User', 'Top right of the User Directory'],
    ['Basic Info', 'OLM ID, name, email, mobile'],
    ['Employment', 'Type, designation, level, location'],
    ['Hierarchy', 'Vertical › Team Function › Domain › Sub Domain'],
    ['Review and add', 'Check the details, click Add User'],
    ['Manage the user', 'View, edit, permissions, reset password, remove'],
  ],
  guidelines: [
    ['must', 'Only people with access to User Management can add users to CMS.'],
    ['must', 'Enter the OLM ID as 8 letters and numbers, and an email address that ends in @airtel.com.'],
    ['must', 'Choose the Vertical, Team Function, Domain and Sub Domain the person actually works in. They decide which team’s work the user is linked to.'],
    ['should', 'Check every value on the Review step before clicking Add User, especially the OLM ID, email and Sub Domain.'],
    ['must', 'The OLM ID and organisation hierarchy cannot be edited once a user is added.'],
    ['must', 'Use Remove User only for someone who should no longer have access to CMS.'],
    ['note', 'Search the User Directory by name, OLM ID or email first, to make sure the person has not already been added.'],
    ['note', 'Fields marked with an asterisk (*) are required when adding or editing a user.'],
  ],
  faqs: [
    ['What is the difference between Team User and Other User?', 'A Team User is a member of a team in Team Management. An Other User needs access to CMS but is not a member of a team.'],
    ['I cannot see User Management in the side menu. Why?', 'Only people with access to User Management see it. Ask a CMS admin to add the user for you.'],
    ['I made a mistake on an earlier step. Do I have to start again?', 'No. Click Back to return to any earlier step, correct it, then click Next again. Nothing is saved until you click Add User on the Review step.'],
    ['Which Verticals can I choose?', 'System Engineering, Service Experience, Infra and Technology Solutions. Team Function, Domain and Sub Domain then narrow it down to the person’s team.'],
    ['How do I see what a user is allowed to do?', 'Click the eye icon and open the Permissions tab, or choose Permissions from the ⋮ menu. It lists every permission the user’s role grants, for example All CRQs · View or Dashboard · Create.'],
    ['Can I change a user’s OLM ID or team?', 'No. The OLM ID and organisation hierarchy are locked when you edit a user. Every other detail can be changed.'],
    ['A user forgot their password. What do I do?', 'Open the ⋮ menu on their row and choose Reset Password.'],
  ],
  subTasks: [
    {
      title: 'Add a user to CMS',
      slug: 'add-a-user',
      summary: 'Click Add User and complete the four steps of the Add New User wizard: Basic Info, Employment, Hierarchy and Review.',
      prerequisites: [SIGNED_IN, 'Access to User Management', 'The person’s OLM ID, @airtel.com email, mobile number, employment details and team'],
      expectedOutcome: 'The person is added to the User Directory and can sign in to CMS.',
      steps: [
        {
          title: 'Open User Management and click Add User',
          html: '<p>In the side menu, select <strong>User Management</strong>. On the <strong>User Directory</strong>, click <strong>Add User</strong> at the top right. Choose <strong>Team User</strong> or <strong>Other User</strong> if CHM asks. The <strong>Add New User</strong> window opens on the Basic Info step.</p>',
          callout: { type: 'tip', text: 'Search the User Directory by name, OLM ID or email first, to check the person is not already a user.' },
        },
        {
          title: 'Fill in Basic Info',
          html: '<ul><li><strong>OLM ID</strong>: 8 letters and numbers.</li><li><strong>Full Name</strong>.</li><li><strong>Email Address</strong>: must end in @airtel.com.</li><li><strong>Mobile Number</strong>.</li></ul><p>Click <strong>Next</strong>.</p>',
          shots: [um('basic-info', 'Add New User, Basic Info step, with OLM ID, Full Name, Email Address and Mobile Number fields, and Cancel and Next buttons')],
        },
        {
          title: 'Fill in Employment',
          html: '<p>Choose the <strong>Employment Type</strong> and <strong>Job Level</strong> from their lists, and fill in <strong>Vendor Company</strong>, <strong>Designation</strong>, <strong>Office Location</strong> and <strong>Device Vendor Capability</strong>. Choose the <strong>Gender</strong> and pick the <strong>Date of Joining</strong>. Click <strong>Next</strong>.</p>',
          shots: [um('employment', 'Add New User, Employment step, with Employment Type, Vendor Company, Designation, Job Level, Office Location, Device Vendor Capability, Gender and Date of Joining')],
        },
        {
          title: 'Choose the Hierarchy',
          html: '<p>Choose the person’s <strong>Vertical</strong>, then <strong>Team Function</strong>, <strong>Domain</strong> and <strong>Sub Domain</strong>, for example System Engineering › Change Management › IP Access › MPLS Access. Click <strong>Next</strong>.</p>',
          shots: [
            um('vertical-options', 'Vertical list open with System Engineering, Service Experience, Infra and Technology Solutions'),
            um('hierarchy', 'Hierarchy step filled in with System Engineering, Change Management, IP Access and MPLS Access'),
          ],
          callout: { type: 'warning', text: 'Pick the team the person actually works in. The Sub Domain decides which team’s work the user is linked to.' },
        },
        {
          title: 'Review and click Add User',
          html: '<p>The <strong>Review</strong> step lists everything you entered, and the role the user will have, for example <strong>Team Member</strong>. Check each value. Use <strong>Back</strong> to correct anything, then click <strong>Add User</strong>.</p>',
          shots: [um('review', 'Review step listing full name, OLM ID, email, mobile, designation, vertical, team function, domain, sub domain and role, with Back and Add User buttons')],
        },
      ],
      related: ['sign-in-to-chm', 'add-a-team-member'],
    },
    {
      title: 'View a user’s details',
      slug: 'view-a-user',
      summary: 'Click the eye icon to open the user’s details: Overview, Permissions and Sessions.',
      prerequisites: [SIGNED_IN, 'Access to User Management'],
      expectedOutcome: 'You can see the user’s details and the permissions their role gives them.',
      steps: [
        {
          title: 'Find the user',
          html: '<p>In <strong>User Management</strong>, find the user in the <strong>User Directory</strong>. Search by name, OLM ID or email, or narrow the list with the role filter and <strong>Filters</strong>.</p>',
          shots: [um('directory-more-menu', 'User Directory with totals, search, role filter, sort and the list of users with their actions')],
        },
        {
          title: 'Click the eye icon',
          html: '<p>In the <strong>Actions</strong> column, click the <strong>eye</strong> icon. A panel opens on the right with the user’s name, role and status.</p><p>The <strong>Overview</strong> tab shows the OLM ID, email, phone, organisation, department, employment type and joining date.</p>',
          shots: [um('user-overview', 'User details panel, Overview tab, with OLM ID, email, phone, organisation, department, employment type and joining date')],
        },
        {
          title: 'Check permissions and sessions',
          html: '<p>Open the <strong>Permissions</strong> tab to see every permission the user’s role grants, such as All CRQs · View or Dashboard · Create. The number next to the tab name is the total. Open <strong>Sessions</strong> to see the user’s sessions.</p>',
          shots: [um('user-permissions', 'User details panel, Permissions tab, listing the permissions granted to the Team Member role')],
          callout: { type: 'tip', text: 'Click the pencil at the top of the panel to edit the user from here.' },
        },
      ],
      related: ['edit-a-user', 'user-more-actions'],
    },
    {
      title: 'Edit a user’s details',
      slug: 'edit-a-user',
      summary: 'Click the pencil icon to change a user’s details. The OLM ID and organisation hierarchy are locked.',
      prerequisites: [SIGNED_IN, 'Access to User Management'],
      expectedOutcome: 'The user’s details are updated in the User Directory.',
      steps: [
        {
          title: 'Click the pencil icon',
          html: '<p>Find the user in the <strong>User Directory</strong> and click the <strong>pencil</strong> icon in the <strong>Actions</strong> column, or the pencil at the top of the user’s details panel. The <strong>Edit Team Member</strong> window opens.</p>',
        },
        {
          title: 'Change the details',
          html: '<p>Update what needs changing:</p><ul><li><strong>Basic information</strong>: employee name, email, mobile number and gender.</li><li><strong>Employment details</strong>: employment type, vendor company, designation, job level and the other employment fields.</li></ul><p>The <strong>OLM ID</strong> shows as <strong>Locked</strong>, and the organisation hierarchy cannot be changed.</p>',
          shots: [um('edit-user', 'Edit Team Member window with the banner saying OLM ID and organisation hierarchy are locked, and the Basic Information and Employment Details sections')],
          callout: { type: 'warning', text: 'Fields marked with an asterisk (*) are required. Save Changes stays unavailable until they are filled in.' },
        },
        {
          title: 'Save the changes',
          html: '<p>Click <strong>Save Changes</strong>. To leave without changing anything, click <strong>Cancel</strong>.</p>',
        },
      ],
      related: ['view-a-user', 'edit-a-team-member'],
    },
    {
      title: 'Permissions, reset password and remove a user',
      slug: 'user-more-actions',
      summary: 'Use the ⋮ menu on a user’s row to see their permissions, reset their password or remove them from CMS.',
      prerequisites: [SIGNED_IN, 'Access to User Management'],
      expectedOutcome: 'The user’s permissions are checked, their password is reset, or they are removed from CMS.',
      steps: [
        {
          title: 'Open the ⋮ menu',
          html: '<p>Find the user in the <strong>User Directory</strong> and click <strong>⋮</strong> (more options) at the end of their row. The menu has <strong>Permissions</strong>, <strong>Reset Password</strong> and <strong>Remove User</strong>.</p>',
          shots: [um('directory-more-menu', 'More-options menu open on a user’s row with Permissions, Reset Password and Remove User')],
        },
        {
          title: 'Check permissions',
          html: '<p>Choose <strong>Permissions</strong> to see every permission the user’s role grants.</p>',
          shots: [um('user-permissions', 'Granted permissions for the Team Member role')],
        },
        {
          title: 'Reset the password',
          html: '<p>Choose <strong>Reset Password</strong> when the user has forgotten their password or cannot sign in.</p>',
        },
        {
          title: 'Remove the user',
          html: '<p>Choose <strong>Remove User</strong> to take the person off CMS. Confirm if CHM asks.</p>',
          callout: { type: 'warning', text: 'Remove a user only when they should no longer have access to CMS. To change their details, edit them instead.' },
        },
      ],
      related: ['view-a-user', 'remove-a-team-member'],
    },
  ],
};

/**
 * CRQ Rescheduling, written from the "CRQ Rescheduling Scenarios & Logics" deck (CHM: CAB & Approvals).
 * Rescheduling is allowed during MOP creation and validation, and during impacted party approval.
 */
const rs = (name: string, alt: string) => shot('rescheduling', name, alt);
export const reschedulingModule: SeedModule = {
  title: 'CRQ Rescheduling',
  slug: 'crq-rescheduling',
  section: 'configuration',
  icon: 'calendar-clock',
  summary: 'When and how a CRQ can be postponed or preponed: during MOP creation and validation, and during impacted party approval.',
  hero: rs('ground-rules', 'Ground rules for rescheduling: availability calendar, owner and reason, re-approval trigger, and a maximum of two reschedules'),
  e2e: `
<p>A CRQ’s execution date can be moved to a later date (<strong>postpone</strong>) or an earlier date (<strong>prepone</strong>). Rescheduling is allowed at two points in the CRQ lifecycle:</p>
<ul>
<li><strong>MOP Creation and MOP Validation</strong>: the NOC can postpone, and in some cases prepone, the activity.</li>
<li><strong>Impacted Party Approval</strong>: each impacted party can approve, reschedule or reject within its action window. Impacted parties can only postpone.</li>
</ul>
<h3>Ground rules for every reschedule</h3>
${facts([
  ['1. Availability calendar', 'CHM checks that the execution engineer is available and shows a calendar of available dates. The days-margin criteria are not applied to this calendar.'],
  ['2. Owner and reason', 'Every reschedule must record who is rescheduling (the owner) and why (the reason).'],
  ['3. Re-approval', 'If impacted parties have already approved, rescheduling makes their re-approval mandatory.'],
  ['4. Two at most', 'A CRQ can be rescheduled twice at most, and only once by impacted parties.'],
])}
<h3>MOP creation and validation (NOC)</h3>
${facts([
  ['Before MOP creation starts', 'Postpone at any time. Prepone is not allowed.'],
  ['After the MOP is created: up to 24 hours', 'Postponing by up to 24 hours does not re-trigger MOP validation.'],
  ['After the MOP is created: beyond 48 hours', 'Postponing by more than 48 hours re-triggers MOP creation and validation.'],
  ['Prepone', 'Allowed only when there are more than 4 days between the MOP creation date and the execution date. Inside that 4-day margin, CHM shows a warning pop-up that you must explicitly confirm.'],
])}
<h3>Impacted party approval</h3>
${facts([
  ['Actions', 'Approve, Reschedule or Reject, within the party’s active action window'],
  ['Reschedule', 'Allowed only inside the active action window'],
  ['Direction', 'Postpone only. Preponing is blocked for all approval parties.'],
])}
<h3>If execution is delayed</h3>
${facts([
  ['Not started (zero completion), up to 48 hours', 'Engineers or team leads can postpone by up to 48 hours without penalty.'],
  ['Not started, beyond 48 hours', 'Needs explicit authorisation from the Domain Head and Function Head, and re-triggers MOP creation and validation.'],
  ['Partially completed', 'Select a new activity window within 48 hours. The scheduled date and time move to the new slot, and completed and pending tasks stay visible while you update the CRQ’s task status.'],
])}
`,
  flow: [
    ['Check the stage', 'MOP creation/validation or impacted party approval'],
    ['Check the limits', 'Postpone or prepone, hours and days margin'],
    ['Pick a date', 'From the availability calendar'],
    ['Owner and reason', 'Both are mandatory'],
    ['Re-approval', 'If impacted parties had already approved'],
  ],
  guidelines: [
    ['must', 'Record the rescheduling owner and the reason for every reschedule.'],
    ['must', 'A CRQ can be rescheduled at most twice, and only once by impacted parties.'],
    ['must', 'If impacted parties have already approved, rescheduling makes their re-approval mandatory.'],
    ['must', 'Impacted parties can only postpone, and only within their active action window. Preponing is blocked for all approval parties.'],
    ['must', 'Prepone only when there are more than 4 days between the MOP creation date and the execution date.'],
    ['should', 'Keep a postponement after MOP creation within 24 hours where you can, so MOP validation does not have to run again.'],
    ['note', 'Postponing by more than 48 hours after the MOP is created re-triggers MOP creation and validation.'],
    ['note', 'The availability calendar shows dates when the execution engineer is free; the days-margin criteria are not applied to it.'],
  ],
  faqs: [
    ['When can a CRQ be rescheduled?', 'During MOP creation and MOP validation, and during impacted party approval.'],
    ['How many times can a CRQ be rescheduled?', 'Twice at most. Impacted parties can use only one of those reschedules.'],
    ['Can an impacted party bring the activity forward?', 'No. Impacted parties can only postpone, and only within their active action window. Preponing is blocked for all approval parties.'],
    ['Will postponing make the MOP go through validation again?', 'Not if you postpone by up to 24 hours after the MOP is created. Postponing by more than 48 hours re-triggers MOP creation and validation.'],
    ['Why do I see a warning when I prepone?', 'The new date is inside the 4-day margin after the MOP creation date. Preponing is only allowed when there are more than 4 days between MOP creation and execution, so CHM asks you to confirm explicitly.'],
    ['Do impacted parties need to approve again after a reschedule?', 'Yes, if they had already approved. Rescheduling makes re-approval mandatory.'],
  ],
  subTasks: [
    {
      title: 'Reschedule during MOP creation or validation',
      slug: 'reschedule-during-mop',
      summary: 'Postpone or prepone a CRQ while the MOP is being created or validated, within the NOC limits.',
      prerequisites: [SIGNED_IN, 'The CRQ is in MOP Creation or MOP Validation', 'The CRQ has been rescheduled fewer than two times'],
      expectedOutcome: 'The CRQ has a new execution date, with the owner and reason recorded, and any re-approval or MOP re-validation it needs is triggered.',
      steps: [
        {
          title: 'Decide whether to postpone or prepone',
          html: '<p>Check where the CRQ is:</p><ul><li><strong>MOP creation has not started</strong>: you can postpone at any time. You cannot prepone.</li><li><strong>MOP already created</strong>: you can postpone, or prepone if the dates allow it (see step 3).</li></ul>',
          shots: [rs('noc-postponement', 'NOC postponement logic: no prepone before MOP creation; postpone within 24 hours without re-validation; beyond 48 hours re-triggers MOP creation and validation')],
        },
        {
          title: 'If you postpone, check how far',
          html: '<ul><li><strong>Up to 24 hours</strong>: MOP validation is not triggered again.</li><li><strong>More than 48 hours</strong>: MOP creation and validation are triggered again.</li></ul>',
          callout: { type: 'tip', text: 'Keep the postponement within 24 hours where you can, so the MOP does not have to be validated again.' },
        },
        {
          title: 'If you prepone, check the 4-day margin',
          html: '<p>Preponing is allowed only when there are <strong>more than 4 days</strong> between the MOP creation date and the execution date. If the new date falls inside the 4-day margin, CHM shows a warning pop-up that you must explicitly confirm.</p>',
          shots: [rs('noc-preponement', 'NOC preponement logic: prepone is valid only when more than 4 days separate MOP creation and execution; inside the margin a warning pop-up appears')],
        },
        {
          title: 'Pick the new date, owner and reason',
          html: '<p>Choose the new date from the <strong>availability calendar</strong>, which shows when the execution engineer is free. Enter the <strong>rescheduling owner</strong> and the <strong>reason</strong>; both are mandatory. Save the reschedule.</p>',
          shots: [rs('ground-rules', 'Ground rules: availability calendar, owner and reason, re-approval trigger and a maximum of two reschedules per CRQ')],
          callout: { type: 'warning', text: 'If impacted parties have already approved the CRQ, they must approve it again after the reschedule.' },
        },
      ],
      related: ['reschedule-during-approval'],
    },
    {
      title: 'Reschedule during impacted party approval',
      slug: 'reschedule-during-approval',
      summary: 'As an impacted party, postpone a CRQ instead of approving or rejecting it, within your action window.',
      prerequisites: [SIGNED_IN, 'You are an impacted party for the CRQ, and your action window is open', 'The CRQ has not already been rescheduled by an impacted party'],
      expectedOutcome: 'The CRQ is postponed, with the owner and reason recorded.',
      steps: [
        {
          title: 'Choose Reschedule in your action window',
          html: '<p>While your action window is open, you can <strong>Approve</strong>, <strong>Reschedule</strong> or <strong>Reject</strong> the CRQ. Choose <strong>Reschedule</strong> when the change can go ahead, but on a later date.</p>',
          shots: [rs('impacted-parties-protocol', 'Impacted parties protocol: Approve, Reschedule and Reject within the action window')],
          callout: { type: 'error', text: 'Rescheduling is only possible inside your active action window. Once it has passed, you cannot reschedule the CRQ.' },
        },
        {
          title: 'Pick a later date',
          html: '<p>Choose a new date from the <strong>availability calendar</strong>. Impacted parties can only <strong>postpone</strong>: earlier dates are blocked.</p>',
        },
        {
          title: 'Enter the owner and reason, and save',
          html: '<p>Enter the <strong>rescheduling owner</strong> and the <strong>reason</strong>; both are mandatory. Save the reschedule.</p>',
          callout: { type: 'warning', text: 'Impacted parties can reschedule a CRQ only once, and a CRQ can be rescheduled at most twice in total.' },
        },
      ],
      related: ['reschedule-during-mop', 'approve-or-reject'],
    },
    {
      title: 'Handle a delay during execution',
      slug: 'reschedule-during-execution',
      summary: 'What to do when execution is delayed, whether it has not started or is partially complete.',
      prerequisites: [SIGNED_IN, 'The CRQ is in Network Execution'],
      expectedOutcome: 'The CRQ has a new activity window, with any authorisation or MOP re-validation it needs.',
      steps: [
        {
          title: 'If execution has not started',
          html: '<ul><li><strong>Up to 48 hours</strong>: engineers or team leads can postpone without penalty.</li><li><strong>More than 48 hours</strong>: get explicit authorisation from the <strong>Domain Head</strong> and the <strong>Function Head</strong>. MOP creation and validation are triggered again.</li></ul>',
          shots: [rs('execution-postponement', 'Postponement during execution: up to 48 hours by engineers or team leads; beyond 48 hours needs Domain Head and Function Head approval')],
        },
        {
          title: 'If execution is partially complete',
          html: '<p>Select a <strong>new activity window within 48 hours</strong>. The scheduled date and time move to the new slot. Completed and pending tasks stay visible while you update the CRQ’s task status.</p>',
          shots: [rs('partial-completion', 'Partial completion rescheduling: choose a new activity window within 48 hours')],
        },
      ],
      related: ['reschedule-during-mop', 'record-step-results'],
    },
  ],
};

export const configurationModules: SeedModule[] = [
  /* ───────────────────────── Getting started ───────────────────────── */
  {
    title: 'Getting started with CHM',
    slug: 'getting-started-with-chm',
    section: 'configuration',
    icon: 'log-in',
    summary: 'Sign in to CHM (Change Management System) and find the menus used by the configuration and management guides.',
    hero: shot('sign-in', 'chm-landing', 'CHM landing page with the Change Management System title and the Tap to sign in button'),
    e2e: `
<p>CHM is the Change Management System where change requests (CRQs) are planned, scheduled and closed. Every configuration and management task in this section starts from the CHM home page, so sign in first.</p>
${facts([
  ['Address', `<a href="${CHM_URL}">${CHM_URL}</a>`],
  ['You sign in with', 'Your OLM ID, your password and the security code (captcha) shown on the page'],
  ['After signing in', 'The CHM home page: your overview, today’s attendance and your roster'],
])}
<h3>Menus used in these guides</h3>
<p>The left-hand menu holds the icons you need. Move the cursor over an icon to see its options.</p>
<ul>
<li><strong>Team Management</strong> (people icon): engineers in each team.</li>
<li><strong>User Management</strong>: who can sign in to CMS.</li>
<li><strong>Scheduler</strong> (clock icon): CRQ Workflow (see Plan &amp; Inventory Validation in the CRQ lifecycle), Plan, CRQ Journey and Cancelled CRQs.</li>
<li><strong>Roster</strong> (calendar icon): Roster View and Roster Generation.</li>
</ul>
`,
    flow: [
      ['Open CHM', 'Go to the CHM address'],
      ['Tap to sign in', 'Top-right of the landing page'],
      ['Enter credentials', 'OLM ID, password and security code'],
      ['Home page', 'Use the left menu to reach each area'],
    ],
    guidelines: [
      ['must', 'Sign in with your own OLM ID. Do not share credentials or sign in for someone else.'],
      ['should', 'Bookmark the CHM address so you always open the official sign-in page.'],
      ['note', 'If the security code is hard to read, use the refresh icon next to it to get a new one.'],
    ],
    faqs: [
      ['What is my OLM ID?', 'Your 8-character Airtel employee login ID, for example A1SMCYAO. It is the same ID you use for other Airtel systems.'],
      ['I forgot my password. What do I do?', 'Use the “Forgot?” link above the password field on the sign-in page, or “Need help?” at the bottom of the page.'],
    ],
    subTasks: [
      {
        title: 'Sign in to CHM',
        slug: 'sign-in-to-chm',
        summary: 'Open CHM, sign in with your OLM ID and reach the home page.',
        prerequisites: ['An active OLM ID with access to CHM'],
        expectedOutcome: 'The CHM home page opens, showing your overview, attendance and roster.',
        steps: [
          {
            title: 'Open the CHM sign-in page',
            html: `<p>Enter the CHM address in your browser’s address bar:</p><p><a href="${CHM_URL}">${CHM_URL}</a></p><p>On the landing page, click <strong>TAP TO SIGN IN</strong> in the top-right corner.</p>`,
            shots: [shot('sign-in', 'chm-landing', 'CHM landing page. The Tap to sign in button is in the top-right corner.')],
          },
          {
            title: 'Enter your OLM ID, password and security code',
            html: '<p>On the <strong>Welcome back</strong> page:</p><ol><li>Enter your <strong>OLM ID</strong>, for example A1SMCYAO.</li><li>Enter your <strong>password</strong>.</li><li>Type the <strong>security code</strong> shown next to the field.</li><li>Click <strong>Sign In</strong>.</li></ol>',
            shots: [shot('sign-in', 'sign-in-form', 'Welcome back sign-in form with OLM ID, password and security verification fields and the Sign In button')],
            callout: { type: 'tip', text: 'If the security code is hard to read, click the refresh icon next to it for a new one.' },
          },
          {
            title: 'Check you are on the CHM home page',
            html: '<p>After signing in, CHM opens the home page with your overview, today’s attendance and your roster. The icons on the left take you to Team Management, the Scheduler and the Roster.</p>',
            shots: [shot('sign-in', 'chm-home', 'CHM home page showing the overview card, today’s attendance, today’s assignments and My roster, with the menu icons on the left')],
          },
        ],
        related: ['view-your-team', 'find-a-crq'],
      },
    ],
  },

  /* ───────────────────────── Team Management ───────────────────────── */
  {
    title: 'Team Management',
    slug: 'team-management',
    section: 'configuration',
    icon: 'users',
    summary: 'See the engineers in each team, filter and search them, add team members one at a time or in bulk from Excel, and edit or remove them.',
    hero: shot('team-management', 'team-list', 'Team Overview listing engineers with OLM ID, name, job level and device vendor capability'),
    e2e: `
<p>Team Management is where each team’s engineers are recorded: who they are, their job level, their employer and which vendors’ equipment they can work on. The roster and CRQ assignments rely on this information, so keep it up to date.</p>
${facts([
  ['Where in CHM', 'Left menu › <strong>Team Management</strong> (people icon). The page is called Team Overview.'],
  ['Choose a team with', TEAM_PATH],
  ['You can', 'Search engineers, filter every column, choose which columns to show, add one member, or upload many from Excel'],
  ['Actions on each member', '<strong>Edit</strong> (pencil) changes a member’s details. <strong>Delete</strong> (bin) removes the member from the team.'],
  ['Who can edit', 'Team leads, and roles above team lead'],
  ['Used with', 'Roster (shifts are planned for these engineers) and the CRQ Workflow, where CRQs are assigned to teams'],
])}
${callout('warning', 'Every detail of a member can be edited except the OLM ID. Delete a member only when they have left the company or the team, or were added by mistake.')}
${callout('info', 'The name in the middle of the toolbar is the team’s L4 manager. The coloured counts next to it show how many engineers the team has at each level (L1 to L4) and in total.')}
`,
    flow: [
      ['Open Team Management', 'People icon in the left menu'],
      ['Select the team', TEAM_PATH],
      ['Find engineers', 'Search, column filters, column picker'],
      ['Add members', 'One at a time, or in bulk from Excel'],
      ['Edit or remove', 'Actions column: edit details or delete a member'],
    ],
    guidelines: [
      ['must', 'Select Vertical, Team Function, Domain and Sub Domain before looking for engineers. The list stays empty until all four are chosen.'],
      ['must', 'Enter the OLM ID as 8 letters and numbers, and use the engineer’s @airtel.com email address.'],
      ['must', 'For bulk uploads, start from the template downloaded from CHM. Do not rename, reorder or delete its columns.'],
      ['must', 'Only a team lead, or a role above team lead, can edit a team member.'],
      ['must', 'Delete a team member only when they have left the company or the team, or were added by mistake.'],
      ['should', 'Review the results of a bulk upload before submitting, and fix rows with errors in the spreadsheet rather than one by one afterwards.'],
      ['note', 'Every detail of a member can be edited except the OLM ID.'],
      ['note', 'Use the search box to find an engineer by name or OLM ID without scrolling.'],
    ],
    faqs: [
      ['Why is the team list empty?', 'Choose all four filters at the top: Vertical, Team Function, Domain and Sub Domain. The list loads once the last one is selected.'],
      ['How do I see more details, such as email or mobile number?', 'Use the column picker (the icon with horizontal lines at the top right of the table) and switch on the columns you want.'],
      ['Should I add one engineer or upload a spreadsheet?', 'Use Add Single Member for one or two people. Use Upload via Excel when onboarding several engineers at once.'],
      ['Who can edit a team member?', 'Team leads, and roles above team lead. If the edit option does not work for you, ask your team lead to make the change.'],
      ['Can I change a member’s OLM ID?', 'No. The OLM ID is the only detail that cannot be edited. If a member was added with the wrong OLM ID, delete them and add them again with the correct one.'],
      ['When should I delete a team member?', 'Only when the person has left the company, has moved out of the team, or was added by mistake.'],
    ],
    subTasks: [
      {
        title: 'View your team',
        slug: 'view-your-team',
        summary: 'Open Team Overview, select your team and find engineers with search, filters and the column picker.',
        prerequisites: [SIGNED_IN],
        expectedOutcome: 'The engineers in your team are listed, with the columns you need.',
        steps: [
          {
            title: 'Open Team Management',
            html: '<p>In the left menu, click <strong>Team Management</strong> (the people icon). The Team Overview page opens with empty filters.</p>',
            shots: [shot('team-management', 'team-overview-empty', 'Team Overview before filters are selected, showing “Select filters to explore data”')],
          },
          {
            title: 'Select your team',
            html: `<p>Choose each filter from its dropdown: <strong>${TEAM_PATH}</strong>. The team’s engineers appear in the table.</p><p>The L4 manager’s name is shown in the middle of the toolbar, with the number of engineers at each level.</p>`,
            shots: [shot('team-management', 'team-list', 'Team list for System Engineering, Change Management, IP Access, CEN Access, with the team manager and level counts in the toolbar')],
            callout: { type: 'tip', text: 'Type a name or OLM ID into the search box above the table to find someone quickly.' },
          },
          {
            title: 'Filter by column',
            html: '<p>At the top right of the table there are two icons. Click <strong>Show/Hide filters</strong> to add a filter under every column heading, then pick values from each column’s dropdown.</p>',
            shots: [shot('team-management', 'column-filters', 'Team table with a filter dropdown under each column heading')],
          },
          {
            title: 'Choose which columns to show',
            html: '<p>Click the <strong>column picker</strong> (the icon with horizontal lines). Switch columns on or off, such as Email, Mobile, Designation, Office Location or Date of Joining. Use <strong>Show all</strong> or <strong>Hide all</strong> to change them together.</p>',
            shots: [shot('team-management', 'column-picker', 'Column picker listing OLM ID, Employee Name, Email, Mobile, Employment Type and more, each with an on/off switch')],
          },
        ],
        related: ['add-a-team-member', 'bulk-upload-team-members'],
      },
      {
        title: 'Add a team member',
        slug: 'add-a-team-member',
        summary: 'Add one engineer with their basic information, employment details and place in the organisation.',
        prerequisites: [SIGNED_IN, 'The engineer’s OLM ID, @airtel.com email and employment details'],
        expectedOutcome: 'The new engineer appears in the team list.',
        steps: [
          {
            title: 'Choose Add Single Member',
            html: '<p>On Team Overview, click <strong>Add Member</strong> at the top right. In the <strong>Add New Member</strong> window, choose <strong>Add Single Member</strong>.</p>',
            shots: [shot('team-management', 'add-member-options', 'Add New Member window with two options: Add Single Member and Upload via Excel')],
          },
          {
            title: 'Fill in the member’s details',
            html: '<p>Complete each part of the form:</p><ul><li><strong>Basic information</strong>: OLM ID (8 letters and numbers), employee name, email (must end in @airtel.com) and mobile number.</li><li><strong>Employment details</strong>: employment type, vendor company, designation, job level, office location, device vendor capability, role code and date of joining.</li><li><strong>Organisation hierarchy</strong>: where the engineer sits in the team structure.</li></ul>',
            shots: [shot('team-management', 'add-single-member', 'Add New Team Member form with Basic Information and Employment Details sections')],
            callout: { type: 'warning', text: 'Fields marked with an asterisk (*) are required. The form will not save until they are filled in.' },
          },
          {
            title: 'Save the new member',
            html: '<p>Click <strong>Add Member</strong> at the bottom of the form. The engineer is added to the team list.</p>',
          },
        ],
        related: ['bulk-upload-team-members', 'view-your-team'],
      },
      {
        title: 'Bulk upload team members',
        slug: 'bulk-upload-team-members',
        summary: 'Add many engineers at once by filling in the CHM Excel template and uploading it.',
        prerequisites: [SIGNED_IN, 'Microsoft Excel or another spreadsheet tool that saves .xlsx files'],
        expectedOutcome: 'All valid rows from your spreadsheet are added to CHM Team Management.',
        steps: [
          {
            title: 'Choose Upload via Excel',
            html: '<p>On Team Overview, click <strong>Add Member</strong>, then choose <strong>Upload via Excel</strong>. The <strong>Bulk Upload Employees</strong> window opens with three stages: Download Template, Fill &amp; Upload, and Review Results.</p>',
            shots: [shot('team-management', 'add-member-options', 'Add New Member window. Upload via Excel is the second option.')],
          },
          {
            title: 'Download the template',
            html: '<p>Click <strong>Download Template</strong>. The template already contains the required dropdowns and your hierarchy data. If you already have the latest template, click <strong>I already have it</strong>.</p>',
            shots: [shot('team-management', 'bulk-download-template', 'Bulk Upload Employees, Download Template stage, with the Download Template and I already have it buttons')],
          },
          {
            title: 'Fill in the template',
            html: '<p>Add one engineer per row. The columns are OLM ID, Employee Name, Email, Mobile, Employment Type, Vendor Company, Designation, Job Level, Office Location, Gender, Device Vendor Capability, Date of Joining, Vertical, Function and Domain. Save the file.</p>',
            shots: [shot('team-management', 'bulk-template-columns', 'Excel template header row with the employee columns')],
            callout: { type: 'warning', text: 'Do not rename, reorder or delete columns, and enter Date of Joining in the format shown in its header. Otherwise those rows are rejected.' },
          },
          {
            title: 'Upload the filled file',
            html: '<p>After downloading, the window moves to <strong>Fill &amp; Upload</strong>. Drag your saved .xlsx file into the box, or click to browse, then click <strong>Upload File</strong>.</p>',
            shots: [shot('team-management', 'bulk-fill-upload', 'Fill & Upload stage with a drag-and-drop area for .xlsx files and the Upload File button')],
          },
          {
            title: 'Review the results and submit',
            html: '<p>CHM checks the file and shows the results. Review them, then click <strong>Save/Submit</strong>. The engineers are added to Team Management.</p>',
            callout: { type: 'tip', text: 'If some rows have errors, fix them in your spreadsheet and upload it again rather than correcting engineers one by one.' },
          },
        ],
        related: ['add-a-team-member'],
      },
      ...teamMemberActions,
    ],
  },

  /* ───────────────────────── User Management ───────────────────────── */
  userManagementModule,

  /* ───────────────────────── Activity Database ───────────────────────── */
  {
    title: 'Activity Database Setup & View',
    slug: 'activity-database',
    section: 'configuration',
    icon: 'database',
    summary: 'Look up plan types in the CHM activity database, and add new ones in bulk from Excel or one at a time.',
    hero: shot('activity-database', 'plan-view-setup', 'Plan View & Setup listing plan types with network domain, layer, vendor, impact and status'),
    e2e: `
<p>The activity database holds every <strong>plan type</strong> CHM knows, such as Node Deletion or Ring Upgradation 10G to 25G. Each plan type defines, for every phase of a change, which team does the work, in which shift, the minimum engineer level and how long it takes. CHM uses this when scheduling CRQs.</p>
${facts([
  ['Where in CHM', 'Left menu › <strong>Scheduler</strong> (clock icon) › <strong>Plan</strong>. The page is called Plan View &amp; Setup.'],
  ['Choose a team with', `${TEAM_PATH}, for example System Engineering › Change Management › IP Access › MPLS Access`],
  ['Each plan type shows', 'Plan type, network domain, layer, vendor/OEM, impact and status'],
  ['Phases per plan type', 'Review, Impact analysis, Scheduling, MOP creation, MOP validation, Execution'],
  ['Add plan types', 'In bulk with Download Template and Upload Excel, or one at a time with New Plan'],
])}
${callout('warning', 'Plan types must be unique. If a plan type already exists in the activity database, a bulk upload will not let you confirm it.')}
`,
    flow: [
      ['Open Plan', 'Scheduler (clock icon) › Plan'],
      ['Select the team', TEAM_PATH],
      ['Review plan types', 'Search and open a plan type'],
      ['Add plan types', 'Excel upload or New Plan'],
      ['Set up phases', 'Team, shift, level and time for each phase'],
    ],
    guidelines: [
      ['must', 'Check the plan type does not already exist before adding it. Duplicates are rejected.'],
      ['must', 'For bulk uploads, use the template from CHM. One activity uses six rows, one per phase, sharing the same Activity Ref.'],
      ['must', 'Fill in Time (min) on every phase row of the template.'],
      ['should', 'After creating a plan type, complete every phase (Review through Execution) and save it, so the plan is ready for scheduling.'],
      ['note', 'Read the “How to load” sheet inside the template before filling it in.'],
    ],
    faqs: [
      ['Why is “Confirm upload” disabled?', 'The preview found errors, most often a plan type that already exists in the CHM activity database. Fix or remove those rows and upload the file again. Use Export Validation Report to see every error.'],
      ['What does each phase of a plan type define?', 'The assigned team (Vertical, Team Function, Domain, Sub Domain), the shift, the minimum engineer level and the time required in minutes.'],
      ['Can I search for a plan type?', 'Yes. Use the search box above the plan table on Plan View & Setup.'],
    ],
    subTasks: [
      {
        title: 'Find a plan type',
        slug: 'find-a-plan-type',
        summary: 'Open Plan View & Setup, select your team and open a plan type to see its phases.',
        prerequisites: [SIGNED_IN],
        expectedOutcome: 'You can see a plan type’s details for every phase, from Review to Execution.',
        steps: [
          {
            title: 'Open Plan',
            html: '<p>Move the cursor over the <strong>Scheduler</strong> icon (the clock) in the left menu and click <strong>Plan</strong>.</p>',
            shots: [shot('activity-database', 'scheduler-menu-plan', 'Scheduler menu open with CRQ Workflow, Plan, CRQ Journey and Cancelled CRQs')],
          },
          {
            title: 'Select your team',
            html: `<p>Choose <strong>${TEAM_PATH}</strong> from the dropdowns, for example System Engineering › Change Management › IP Access › MPLS Access.</p>`,
            shots: [shot('activity-database', 'plan-select-team', 'Plan View & Setup asking you to select a sub domain to load its plans')],
          },
          {
            title: 'Browse the plan types',
            html: '<p>The table lists every plan type for the team, with its network domain, layer, vendor/OEM, impact and status. Use the search box to find one by name.</p>',
            shots: [shot('activity-database', 'plan-view-setup', 'Plan View & Setup table of plan types with Download Template, Upload Excel and New Plan buttons')],
          },
          {
            title: 'Open a plan type',
            html: '<p>Click a plan type to open it. The left side lists the phases: Review, Impact analysis, Scheduling, MOP creation, MOP validation and Execution. Click a phase to see its assigned team, shift, minimum level and time required.</p>',
            shots: [shot('activity-database', 'plan-phases', 'A plan type open on the Review phase, showing the assigned team, shift, minimum level and time required')],
          },
        ],
        related: ['add-plan-types-in-bulk', 'create-a-plan-type'],
      },
      {
        title: 'Add plan types in bulk',
        slug: 'add-plan-types-in-bulk',
        summary: 'Add several new plan types by filling in the activity template and uploading it.',
        prerequisites: [SIGNED_IN, 'The new plan types do not already exist in the activity database'],
        expectedOutcome: 'The new plan types are added to the activity database for your team.',
        steps: [
          {
            title: 'Download the template',
            html: '<p>On Plan View &amp; Setup, with your team selected, click <strong>Download Template</strong> at the top right.</p>',
            shots: [shot('activity-database', 'plan-view-setup', 'Plan View & Setup. Download Template, Upload Excel and New Plan are at the top right.')],
          },
          {
            title: 'Fill in the template',
            html: '<p>Each activity uses <strong>six rows, one per phase</strong>, sharing the same Activity Ref. Fill in the plan columns on the CRQ Review row, and the time in minutes on every phase row. Save the file.</p>',
            shots: [shot('activity-database', 'bulk-plan-template', 'Activity template in Excel, with six phase rows per activity')],
            callout: { type: 'tip', text: 'The template has a “How to load” sheet. Read it before you start.' },
          },
          {
            title: 'Upload the file',
            html: '<p>Click <strong>Upload Excel</strong>. In <strong>Bulk Upload Plan &amp; Activity</strong>, drag your .xlsx file into the box or click to browse, then click <strong>Preview File</strong>.</p>',
            shots: [shot('activity-database', 'bulk-plan-upload', 'Bulk Upload Plan & Activity window with a Download Template button and a drag-and-drop area')],
          },
          {
            title: 'Check the preview and confirm',
            html: '<p>The preview shows how many activities are valid and invalid. If every plan type is new and valid, click <strong>Confirm Upload</strong>.</p>',
            shots: [shot('activity-database', 'bulk-plan-preview', 'Preview & Validate stage showing one invalid activity and a list of validation errors')],
            callout: { type: 'error', text: '“Confirm upload” is disabled when a plan type already exists in the CHM activity database or a row has errors. Click Export Validation Report, fix the rows and upload again.' },
          },
        ],
        related: ['create-a-plan-type', 'find-a-plan-type'],
      },
      {
        title: 'Create a plan type',
        slug: 'create-a-plan-type',
        summary: 'Add a single plan type with New Plan, then set up each of its phases.',
        prerequisites: [SIGNED_IN, 'The plan type does not already exist in the activity database'],
        expectedOutcome: 'The plan type is created and every phase is saved.',
        steps: [
          {
            title: 'Click New Plan',
            html: '<p>On Plan View &amp; Setup, click <strong>New Plan</strong> at the top right.</p>',
            shots: [shot('activity-database', 'plan-view-setup', 'Plan View & Setup with the New Plan button at the top right')],
          },
          {
            title: 'Enter the plan details',
            html: '<p>In <strong>Add New Plan</strong>, fill in every field: CHM Domain, CHM Sub Domain, Network Domain, Layer, Plan Type, Vendor/OEM and Change Impact. Click <strong>Create Plan</strong>.</p>',
            shots: [shot('activity-database', 'add-new-plan', 'Add New Plan form with CHM Domain, Sub Domain, Network Domain, Layer, Plan Type, Vendor/OEM and Change Impact')],
          },
          {
            title: 'Set up each phase and save',
            html: '<p>Open the new plan type and complete each phase in turn: Review, Impact analysis, Scheduling, MOP creation, MOP validation and Execution. For each, set the assigned team, shift, minimum level and time required, then click <strong>Save phase</strong>.</p>',
            shots: [shot('activity-database', 'plan-phases', 'Plan phases with the Review phase being edited and the Save phase button')],
            callout: { type: 'warning', text: 'A plan type is not ready for scheduling until every phase is filled in and saved.' },
          },
        ],
        related: ['add-plan-types-in-bulk'],
      },
    ],
  },

  /* ───────────────────────── Roster ───────────────────────── */
  {
    title: 'Roster',
    slug: 'roster',
    section: 'configuration',
    icon: 'calendar-days',
    summary: 'View your team’s shifts, holidays and week offs, use the roster tools, and generate the golden set roster.',
    hero: shot('roster', 'roster-weekly', 'Weekly team roster with each engineer’s shifts for Monday to Sunday'),
    e2e: `
<p>The roster shows who is working which shift on which day. CHM uses it to know which engineers are available to work on changes. There are two tabs:</p>
<ul>
<li><strong>Roster View</strong>: the roster for a week or a month, with shifts, holidays and week offs, and tools to export, import, swap shifts and highlight.</li>
<li><strong>Roster Generation</strong>: the generated six-week roster (the golden set), with analytics, export and editing.</li>
</ul>
${facts([
  ['Where in CHM', 'Left menu › <strong>Roster</strong> (calendar icon) › Roster View or Roster Generation'],
  ['Choose a team with', TEAM_PATH],
  ['Roster View periods', 'Weekly or Monthly'],
  ['Roster Generation period', 'Six weeks'],
])}
${callout('info', 'The legend at the bottom of Roster View lists every shift code used in the roster and its timings.')}
`,
    flow: [
      ['Open Roster', 'Calendar icon in the left menu'],
      ['Roster View', 'Week or month, shifts and week offs'],
      ['Roster tools', 'Export, import, swap, highlight, filter'],
      ['Roster Generation', 'Six-week golden set'],
      ['Edit golden set', 'Set shifts and save changes'],
    ],
    guidelines: [
      ['must', 'Select Vertical, Team Function, Domain and Sub Domain before viewing or generating a roster.'],
      ['must', 'Click Save changes after editing the golden set. Unsaved edits are lost.'],
      ['should', 'Use Export before importing a new roster, so you have a copy of the current one.'],
      ['should', 'Check Analytics for engineers with a high night-shift or total-shift load before saving a golden set.'],
      ['note', 'Turn on Detailed in Roster View to see each engineer’s available and total minutes and their assigned activities.'],
    ],
    faqs: [
      ['What is the golden set roster?', 'The six-week roster that Roster Generation produces for a team. You can review it with Analytics, export it as CSV and edit it.'],
      ['How do I swap shifts between two engineers?', 'In Roster View, click Shift Swap in the toolbar and choose the two engineers and shifts.'],
      ['What do the shift letters mean?', 'Check the legend at the bottom of Roster View. It lists every shift code and its timing.'],
    ],
    subTasks: [
      {
        title: 'View the team roster',
        slug: 'view-the-team-roster',
        summary: 'Open Roster View for your team and read shifts, holidays and week offs for a week or a month.',
        prerequisites: [SIGNED_IN],
        expectedOutcome: 'The roster for your team and period is shown.',
        steps: [
          {
            title: 'Open Roster View',
            html: '<p>Move the cursor over the <strong>Roster</strong> icon (the calendar) in the left menu. Two options appear: Roster View and Roster Generation. Click <strong>Roster View</strong>.</p>',
            shots: [shot('roster', 'roster-menu', 'Roster menu open with Roster View and Roster Generation')],
          },
          {
            title: 'Choose your team and period',
            html: `<p>Choose <strong>Weekly</strong> or <strong>Monthly</strong>, pick the dates, then select <strong>${TEAM_PATH}</strong> from the dropdowns.</p>`,
            shots: [shot('roster', 'roster-view-empty', 'Roster View with Weekly and Monthly options and the team filters, before a team is selected')],
          },
          {
            title: 'Read the roster',
            html: '<p>The roster shows every engineer in the team with their shift for each day, including holidays and week offs.</p>',
            shots: [shot('roster', 'roster-weekly', 'Weekly roster with shift codes for each engineer and day')],
          },
          {
            title: 'Turn on Detailed for more information',
            html: '<p>Switch on <strong>Detailed</strong> in the toolbar. Each cell then shows the engineer’s available and total minutes and their assigned activities.</p>',
            shots: [shot('roster', 'roster-detailed', 'Roster with Detailed switched on, showing shift times, minutes and activities for each engineer')],
          },
          {
            title: 'Check the shift legend',
            html: '<p>At the bottom of the roster, the legend lists every shift code used and its timings.</p>',
            shots: [shot('roster', 'roster-legend', 'Roster legend with shift codes such as General, Night, Afternoon, Leave, Holiday, Comp off and Week off')],
          },
        ],
        related: ['use-the-roster-tools', 'generate-the-golden-set-roster'],
      },
      {
        title: 'Use the roster tools',
        slug: 'use-the-roster-tools',
        summary: 'Export and import the roster, swap shifts, search for engineers, highlight shift types and filter.',
        prerequisites: [SIGNED_IN, 'Roster View open for your team'],
        expectedOutcome: 'You can find, change and share roster information with the toolbar.',
        steps: [
          {
            title: 'Know the toolbar',
            html: '<p>Above the roster, the toolbar shows <strong>Today’s shift count</strong> (the count of each shift type) and the tools in the steps below.</p>',
            shots: [shot('roster', 'roster-weekly', 'Roster View toolbar with today’s shift count, search, highlight, Detailed, Export, Import and Shift Swap')],
          },
          {
            title: 'Export or import the roster',
            html: '<p>Click <strong>Export</strong> to download the full roster as an Excel file. Click <strong>Import</strong> to upload a roster from an Excel file.</p>',
            callout: { type: 'warning', text: 'Export the current roster before importing, so you can go back to it if something is wrong.' },
          },
          {
            title: 'Swap a shift between two engineers',
            html: '<p>Click <strong>Shift Swap</strong> and choose the two engineers whose shifts you want to exchange.</p>',
          },
          {
            title: 'Search for an engineer',
            html: '<p>Type a name or OLM ID into <strong>Search employee</strong> to find someone in the roster.</p>',
          },
          {
            title: 'Highlight a shift type',
            html: '<p>Choose a shift type from the <strong>Highlight</strong> dropdown, for example Night, Leave or Week off. The roster then highlights only that shift type.</p>',
            shots: [shot('roster', 'roster-highlight', 'Highlight dropdown open with General, Late General, B Shift, Night, Afternoon, Leave, Holiday, Comp off, New joinee and Week off')],
          },
          {
            title: 'Filter by shift type or job level',
            html: '<p>Click the filter icon (three lines) to show two more filters, <strong>All shift types</strong> and <strong>All job levels</strong>, and narrow the roster down.</p>',
          },
        ],
        related: ['view-the-team-roster'],
      },
      {
        title: 'Generate the golden set roster',
        slug: 'generate-the-golden-set-roster',
        summary: 'Open Roster Generation, review the six-week roster and its analytics, then export or edit the golden set.',
        prerequisites: [SIGNED_IN],
        expectedOutcome: 'The six-week golden set roster for your team is reviewed and saved.',
        steps: [
          {
            title: 'Open Roster Generation',
            html: '<p>Open the <strong>Roster</strong> icon (the calendar) in the left menu and click <strong>Roster Generation</strong>, or switch to the Roster Generation tab from Roster View.</p>',
            shots: [shot('roster', 'generation-empty', 'Roster Generation tab before a team is selected')],
          },
          {
            title: 'Select your team',
            html: `<p>Select <strong>${TEAM_PATH}</strong>. The generated roster for the team appears, covering six weeks.</p>`,
            shots: [shot('roster', 'generation-six-weeks', 'Golden set roster covering six weeks for every engineer in the team')],
          },
          {
            title: 'Search and filter',
            html: '<p>Use the search box to find an engineer by name or OLM ID. Click <strong>Filters</strong> to sort (by name, work, night, off or load) and to show only certain employee levels (L1 to L4) or roles (team member, sub domain head, domain head). Click <strong>Apply Filters</strong>.</p>',
            shots: [shot('roster', 'generation-filters', 'Roster Filters panel with sorting order, employee levels and roles')],
          },
          {
            title: 'Check the workload in Analytics',
            html: '<p>Click <strong>Analytics</strong> to see the shift distribution: total shifts, total employees, night shifts, general shifts and engineers with a high night load or low rest.</p>',
            shots: [shot('roster', 'generation-analytics', 'Shift Distribution Analytics with total shifts, balanced, high night load and low rest counts')],
          },
          {
            title: 'Export the golden set',
            html: '<p>Click <strong>Export</strong> to download the golden set roster as a CSV file.</p>',
          },
          {
            title: 'Edit the golden set and save',
            html: '<p>Click <strong>Edit</strong>. On the golden set edit page, select the engineers, set their shifts, then click <strong>Save changes</strong>.</p>',
            shots: [shot('roster', 'golden-set-edit', 'Golden set edit page with engineers selected and the Save changes button')],
            callout: { type: 'warning', text: 'Changes are only kept after you click Save changes.' },
          },
        ],
        related: ['view-the-team-roster'],
      },
    ],
  },

  /* ───────────────────────── CRQ Rescheduling ───────────────────────── */
  reschedulingModule,
];
