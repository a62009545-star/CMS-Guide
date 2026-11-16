/**
 * The CRQ lifecycle stages where rescheduling is allowed, and the note each one carries pointing to
 * the CRQ Rescheduling topic. Used by the seed and by the migration for existing databases.
 */
export const RESCHEDULE_NOTES: Record<string, { guideline: ['must' | 'should' | 'note', string]; faq: [string, string] }> = {
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
