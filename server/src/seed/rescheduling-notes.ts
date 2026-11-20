/**
 * What each CRQ lifecycle stage says about rescheduling, pointing to the CRQ Rescheduling topic.
 * Follows the finalized "CRQ Rescheduling Scenarios" document. Used by the seed and by migrations.
 */
type Note = { guideline: ['must' | 'should' | 'note', string]; faq: [string, string] };

const NO_RESCHEDULE: Note = {
  guideline: [
    'must',
    'Rescheduling is not allowed for the team working on this stage. To reject the CRQ, mark the stage Fail; the requestor team updates it and responds within the agreed SLA. See CRQ Rescheduling in the CMS lifecycle.',
  ],
  faq: [
    'Can we reschedule the CRQ at this stage?',
    'No. Teams working on Plan & Inventory Validation, Impact Analysis, MOP Creation and MOP Validation cannot reschedule. Mark the stage Fail to reject the CRQ; the requestor team is informed and responds within the agreed SLA. Only the NOC SE team, or impacted parties during approval, can reschedule.',
  ],
};

export const RESCHEDULE_NOTES: Record<string, Note> = {
  'plan-inventory-validation': NO_RESCHEDULE,
  'impact-analysis': NO_RESCHEDULE,
  'mop-creation': NO_RESCHEDULE,
  'mop-validation': NO_RESCHEDULE,
  'impacted-party-approval': {
    guideline: [
      'must',
      'Impacted parties can reschedule instead of approving or rejecting, but only within their active action window and only to a later date. A CRQ can be rescheduled only once, and rescheduling after approval makes re-approval mandatory. See CRQ Rescheduling in the CMS lifecycle.',
    ],
    faq: [
      'Can an impacted party reschedule the CRQ?',
      'Yes, within their active approval/rejection window, and only to postpone; preponing is blocked. Only one rescheduling attempt is allowed in the whole CRQ journey. The full rules are in CRQ Rescheduling, in the CMS lifecycle.',
    ],
  },
  'network-execution': {
    guideline: [
      'note',
      'If execution has started but no task is completed, engineers or TLs can postpone by up to 48 hours; longer needs Domain Head and Function Head approval and re-triggers MOP Validation. A partially completed CRQ needs a new activity window within 48 hours. See CRQ Rescheduling in the CMS lifecycle.',
    ],
    faq: [
      'Can we reschedule after execution has started?',
      'Yes. With no task completed, engineers or TLs can postpone by up to 48 hours; beyond that needs Domain Head and Function Head approval, then MOP Validation runs again. If some tasks are completed, select a new activity window within 48 hours; completed and pending tasks stay visible.',
    ],
  },
};

/** Notes added by the first rescheduling migration (from the earlier deck), now replaced. */
export const OLD_RESCHEDULE_NOTES: Record<string, Note> = {
  'mop-creation': {
    guideline: [
      'note',
      'The CRQ can be rescheduled during MOP creation. Postponing by up to 24 hours after the MOP is created keeps it valid; postponing by more than 48 hours re-triggers MOP creation and validation. See CRQ Rescheduling in the CMS lifecycle.',
    ],
    faq: [
      'Can the CRQ be rescheduled while the MOP is being created?',
      'Yes. Before MOP creation starts it can be postponed at any time (not preponed). After the MOP is created, a postponement of up to 24 hours does not re-trigger validation, and one of more than 48 hours re-triggers MOP creation and validation. The full rules are in CRQ Rescheduling, in the CMS lifecycle.',
    ],
  },
  'mop-validation': {
    guideline: [
      'note',
      'The CRQ can be rescheduled during MOP validation. A prepone is allowed only when there are more than 4 days between MOP creation and execution. See CRQ Rescheduling in the CMS lifecycle.',
    ],
    faq: [
      'Can the CRQ be rescheduled during MOP validation?',
      'Yes, within the NOC limits: postponing by more than 48 hours re-triggers MOP creation and validation, and preponing needs more than 4 days between MOP creation and execution. The full rules are in CRQ Rescheduling, in the CMS lifecycle.',
    ],
  },
  'impacted-party-approval': {
    guideline: [
      'must',
      'Impacted parties can reschedule a CRQ instead of approving or rejecting it, but only within their active action window and only to a later date. Rescheduling after approval makes re-approval mandatory. See CRQ Rescheduling in the CMS lifecycle.',
    ],
    faq: [
      'Can an impacted party reschedule the CRQ?',
      'Yes, once per CRQ and only within their active action window. They can only postpone; preponing is blocked. The full rules are in CRQ Rescheduling, in the CMS lifecycle.',
    ],
  },
};
