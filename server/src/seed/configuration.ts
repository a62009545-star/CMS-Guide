/*
 * Configuration & management section, written from the CHM SOPs:
 * Team Management, Activity Database Setup & View, Roster, and Scheduler Workflow (CRQ Workflow).
 * The sign-in steps every SOP repeats live once, in "Getting started with CHM".
 * Screenshots are in client/public/sop/<topic>/.
 */
import type { SeedModule, Shot } from './content.js';

const CHM_URL = 'https://chngmgmt.airtel.com/airtelcms/login';

const shot = (folder: string, name: string, alt: string, caption?: string): Shot => ({ src: `/sop/${folder}/${name}.webp`, alt, caption });

const facts = (rows: [string, string][]) =>
  `<table><tbody>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;
const callout = (type: 'tip' | 'warning' | 'info', html: string) => `<div data-callout="${type}"><p>${html}</p></div>`;

const SIGNED_IN = 'Signed in to CHM (see “Sign in to CHM” under Getting started)';
const TEAM_PATH = 'Vertical › Team Function › Domain › Sub Domain';

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
<li><strong>Scheduler</strong> (clock icon): CRQ Workflow, Plan, CRQ Journey and Cancelled CRQs.</li>
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
    summary: 'See the engineers in each team, filter and search them, and add team members one at a time or in bulk from Excel.',
    hero: shot('team-management', 'team-list', 'Team Overview listing engineers with OLM ID, name, job level and device vendor capability'),
    e2e: `
<p>Team Management is where each team’s engineers are recorded: who they are, their job level, their employer and which vendors’ equipment they can work on. The roster and CRQ assignments rely on this information, so keep it up to date.</p>
${facts([
  ['Where in CHM', 'Left menu › <strong>Team Management</strong> (people icon). The page is called Team Overview.'],
  ['Choose a team with', TEAM_PATH],
  ['You can', 'Search engineers, filter every column, choose which columns to show, add one member, or upload many from Excel'],
  ['Used with', 'Roster (shifts are planned for these engineers) and the CRQ Workflow'],
])}
${callout('info', 'The name in the middle of the toolbar is the team’s L4 manager. The coloured counts next to it show how many engineers the team has at each level (L1 to L4) and in total.')}
`,
    flow: [
      ['Open Team Management', 'People icon in the left menu'],
      ['Select the team', TEAM_PATH],
      ['Find engineers', 'Search, column filters, column picker'],
      ['Add members', 'One at a time, or in bulk from Excel'],
    ],
    guidelines: [
      ['must', 'Select Vertical, Team Function, Domain and Sub Domain before looking for engineers. The list stays empty until all four are chosen.'],
      ['must', 'Enter the OLM ID as 8 letters and numbers, and use the engineer’s @airtel.com email address.'],
      ['must', 'For bulk uploads, start from the template downloaded from CHM. Do not rename, reorder or delete its columns.'],
      ['should', 'Review the results of a bulk upload before submitting, and fix rows with errors in the spreadsheet rather than one by one afterwards.'],
      ['note', 'Use the search box to find an engineer by name or OLM ID without scrolling.'],
    ],
    faqs: [
      ['Why is the team list empty?', 'Choose all four filters at the top: Vertical, Team Function, Domain and Sub Domain. The list loads once the last one is selected.'],
      ['How do I see more details, such as email or mobile number?', 'Use the column picker (the icon with horizontal lines at the top right of the table) and switch on the columns you want.'],
      ['Should I add one engineer or upload a spreadsheet?', 'Use Add Single Member for one or two people. Use Upload via Excel when onboarding several engineers at once.'],
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
    ],
  },

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

  /* ───────────────────────── CRQ Workflow ───────────────────────── */
  {
    title: 'Scheduler: CRQ Workflow',
    slug: 'crq-workflow',
    section: 'configuration',
    icon: 'workflow',
    summary: 'Find your team’s CRQs, start a stage, review plan, inventory and impact data, update attributes and submit validation.',
    hero: shot('crq-workflow', 'crq-workflow-list', 'CRQ Workflow showing the stage bar from Plan & Inventory to Task closure and the list of plans'),
    e2e: `
<p>CRQ Workflow is where you work on change requests (CRQs) stage by stage. The stage bar follows the CMS lifecycle described in this guide: Plan &amp; Inventory, Impact analysis, MOP creation, MOP validation, Scheduling, Network execution and Task closure.</p>
${facts([
  ['Where in CHM', 'Left menu › <strong>Scheduler</strong> (clock icon) › <strong>CRQ Workflow</strong>'],
  ['Choose a team with', `${TEAM_PATH}, or search for a CRQ number directly`],
  ['Toolbar', 'Change Impact filter, task search, View Selected CRQ, Review Plan &amp; Inventory, PDF View and the CRQ count'],
  ['For each CRQ', 'Start the stage, fetch and sync plan data, review impact data, update attributes and submit validation'],
])}
<h3>The four rows of the page</h3>
<ol>
<li>Team filters: Vertical, Team Function, Domain and Sub Domain.</li>
<li>Global CRQ search: find a CRQ by number without choosing a team.</li>
<li>The stage bar: from Plan &amp; Inventory to Task closure.</li>
<li>The toolbar: Change Impact filter, task search, View Selected CRQ, Review Plan &amp; Inventory, PDF View and the total CRQ count.</li>
</ol>
${callout('warning', 'Click Fetch Plan Data and then Sync Plan Data before Review Plan &amp; Inventory. Otherwise the NE and interface data will not be there to review.')}
`,
    flow: [
      ['Open CRQ Workflow', 'Scheduler (clock icon) › CRQ Workflow'],
      ['Find the CRQ', 'Team filters or CRQ search'],
      ['Start stage', 'View Selected CRQ › Start Stage'],
      ['Fetch and sync', 'NE and interface data from Planning'],
      ['Review', 'Impact data, pass or fail checkpoints'],
      ['Update and submit', 'Attributes, outcome, submit validation'],
    ],
    guidelines: [
      ['must', 'Click Fetch Plan Data and Sync Plan Data before Review Plan & Inventory, or no NE and interface data will be available.'],
      ['must', 'Click Start Stage before working on a CRQ stage. The CRQ status changes when the stage starts.'],
      ['must', 'Update the attributes from Remedy and save them before you pass and submit validation.'],
      ['should', 'Check the plan PDF before starting work, and download it if you need it offline.'],
      ['note', 'Attribute Update is available at every stage from Validation to Task closure.'],
    ],
    faqs: [
      ['Can I find a CRQ without choosing the team?', 'Yes. Type the CRQ number into the global CRQ search at the top right. You do not need to select a domain or sub domain.'],
      ['Why is there no data in Review Plan & Inventory?', 'Fetch Plan Data and Sync Plan Data have not been run for the CRQ. Run them from the CRQ, then open Review Plan & Inventory again.'],
      ['Which outcomes can I choose?', 'Pass, Failed or Cancelled. Choose Cancelled when the change was cancelled before it was completed.'],
      ['What do Fetch Plan Data and Sync Plan Data do?', 'Fetch Plan Data brings the NE and interface details in from Planning. Sync Plan Data checks the node and interface data in the plan.'],
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
            html: '<p>Move the cursor over the <strong>Scheduler</strong> icon (the clock) in the left menu. Four options appear. Click <strong>CRQ Workflow</strong>.</p>',
            shots: [shot('crq-workflow', 'scheduler-menu', 'Scheduler menu with CRQ Workflow, Plan, CRQ Journey and Cancelled CRQs')],
          },
          {
            title: 'Select your team or search for the CRQ',
            html: `<p>Select <strong>${TEAM_PATH}</strong> to list every CRQ assigned to the team. To go straight to one CRQ, type its number into the <strong>global CRQ search</strong> instead; you do not need to select the team first.</p>`,
            shots: [shot('crq-workflow', 'crq-workflow-list', 'CRQ Workflow with team filters, stage bar, toolbar and the list of plans')],
            callout: { type: 'tip', text: 'Use the Change Impact filter and the task search in the toolbar to narrow down a long list.' },
          },
          {
            title: 'Expand a plan to see its CRQs',
            html: '<p>Click the down arrow next to a <strong>plan number</strong>. The CRQs under that plan appear with their CRQ number, start and end dates, CRQ status and review status.</p>',
            shots: [shot('crq-workflow', 'crq-expanded', 'A plan expanded to show its CRQ with start date, end date and status')],
          },
        ],
        related: ['start-a-crq-stage'],
      },
      {
        title: 'Start a CRQ stage and fetch plan data',
        slug: 'start-a-crq-stage',
        summary: 'Select a CRQ, start its stage, fetch and sync plan data, and check the plan PDF.',
        prerequisites: [SIGNED_IN, 'The CRQ is listed in CRQ Workflow (see “Find a CRQ”)'],
        expectedOutcome: 'The stage is started and the CRQ’s plan data is fetched and synced, ready for review.',
        steps: [
          {
            title: 'Select the CRQ',
            html: '<p>Tick the checkbox next to the CRQ. Three toolbar buttons become available: <strong>View Selected CRQ</strong>, <strong>Review Plan &amp; Inventory</strong> and <strong>PDF View</strong>.</p>',
            shots: [shot('crq-workflow', 'crq-selected', 'A CRQ selected with View Selected CRQ, Review Plan & Inventory and PDF View available')],
          },
          {
            title: 'View the CRQ and start the stage',
            html: '<p>Click <strong>View Selected CRQ</strong> to see its details, such as circle, description and plan type. Click <strong>Start Stage</strong>. The CRQ’s status changes to show the stage has started.</p>',
            shots: [shot('crq-workflow', 'start-stage', 'Selected CRQ details with Fetch Plan Data, Sync Plan Data, CRQ Details and Start Stage')],
          },
          {
            title: 'Fetch and sync the plan data',
            html: '<p>Click <strong>Fetch Plan Data</strong> to bring in the NE and interface details from Planning. Then click <strong>Sync Plan Data</strong> to check the node and interface data in the plan. Click <strong>CRQ Details</strong> for the full CRQ information.</p>',
            shots: [shot('crq-workflow', 'crq-details', 'CRQ Details panel with CRQ status, plan details, schedule and location')],
            callout: { type: 'warning', text: 'Do both before Review Plan & Inventory. Without them, no NE or interface data is available to review.' },
          },
          {
            title: 'Check the plan PDF',
            html: '<p>Click <strong>PDF View</strong> to read the plan report on the same page. Click <strong>Download</strong> to save a copy to your computer.</p>',
            shots: [shot('crq-workflow', 'plan-pdf', 'Plan report PDF preview with the Download button')],
          },
        ],
        related: ['review-impact-and-submit', 'find-a-crq'],
      },
      {
        title: 'Review impact data and submit validation',
        slug: 'review-impact-and-submit',
        summary: 'Review the impact data, pass or fail checkpoints, update attributes and submit the outcome.',
        prerequisites: [SIGNED_IN, 'Plan data fetched and synced for the CRQ (see “Start a CRQ stage and fetch plan data”)'],
        expectedOutcome: 'The CRQ’s review is submitted with its outcome and updated attributes.',
        steps: [
          {
            title: 'Open the review and view the data',
            html: '<p>With the CRQ selected, click <strong>Review Plan &amp; Inventory</strong>. When the fetch shows as complete, click <strong>View data</strong> to see the impact data for each checkpoint.</p>',
            shots: [shot('crq-workflow', 'crq-review', 'CRQ Review with the checkpoint summary, View data, Mark PASS and Mark FAIL')],
          },
          {
            title: 'Mark each checkpoint pass or fail',
            html: '<p>Check each checkpoint’s data. Click <strong>Mark PASS</strong> if it is correct or <strong>Mark FAIL</strong> if something is wrong.</p>',
          },
          {
            title: 'Update the attributes',
            html: '<p>Click <strong>Attribute Update</strong>. Update the attributes that come from Remedy, such as status and support group details, then click <strong>Save</strong>.</p>',
            shots: [shot('crq-workflow', 'attribute-update', 'Attribute Update window with Remedy Console and CAB Form attributes and the Save button')],
            callout: { type: 'tip', text: 'Attribute Update is available at every stage from Validation to Task closure, so you can update attributes as the CRQ moves through the lifecycle.' },
          },
          {
            title: 'Choose the outcome and submit',
            html: '<p>Under <strong>Select outcome</strong>, choose <strong>Pass</strong>, <strong>Failed</strong> or <strong>Cancelled</strong>. Then click <strong>Submit Validation</strong>.</p>',
            shots: [shot('crq-workflow', 'crq-review', 'Select outcome with Pass, Failed and Cancelled, and the Submit Validation button')],
          },
        ],
        related: ['start-a-crq-stage'],
      },
    ],
  },
];
