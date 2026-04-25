import type { AlertData, Case, Metric, Task, Worker } from '@/types/dashboard';

export const MOCK_WORKER: Worker = {
  greeting: 'Good morning,',
  name: 'Field Worker',
  sector: 'Sector B',
  role: 'Field Worker',
  avatarInitials: 'FW',
};

export const MOCK_ALERT: AlertData = {
  count: 2,
  cases: ['CP-0441', 'CP-0389'],
  action: 'visit required today',
};

export const MOCK_METRICS: Metric[] = [
  { label: 'Urgent', value: 4, tag: 'Action today', color: 'red' },
  { label: 'My active cases', value: 31, tag: 'Sector B', color: 'blue' },
  { label: 'Pending referrals', value: 9, tag: 'Awaiting reply', color: 'neutral' },
  { label: 'Closed this month', value: 12, tag: 'Safe outcomes', color: 'green' },
];

export const MOCK_TASKS: Task[] = [
  {
    urgency: 'red',
    id: 'CP-0441',
    title: 'Home visit',
    subtitle: 'Child A · F, 7 · Unaccompanied',
    time: '09:00',
  },
  {
    urgency: 'red',
    id: 'CP-0389',
    title: 'Safety assessment',
    subtitle: 'Child B · M, 11 · GBV',
    time: '10:30',
  },
  {
    urgency: 'amber',
    id: 'CP-0441',
    title: 'Complete BIA form',
    subtitle: 'Best interest assessment',
    time: '12:00',
  },
  {
    urgency: 'amber',
    id: 'CP-0403',
    title: 'Referral follow-up',
    subtitle: 'Family tracing — Day 22',
    time: '14:00',
  },
  {
    urgency: 'blue',
    id: 'CP-0412',
    title: 'Case review',
    subtitle: 'Child C · F, 14 · PSS',
    time: '16:00',
  },
];

export const MOCK_SUPERVISOR_CASES: Case[] = [
  {
    avatar: { initials: 'E·M6', variant: 'red' },
    id: 'CP-0312', type: 'Protection follow-up', encryptionDay: 8, status: 'urgent',
    alertLevel: 'red', alertIssue: 'Overdue visit', worker: 'FW-01', sector: 'Sector A',
  },
  {
    avatar: { initials: 'A·F7', variant: 'red' },
    id: 'CP-0441', type: 'Unaccompanied minor', encryptionDay: 2, status: 'urgent',
    alertLevel: 'amber', alertIssue: 'Form incomplete', worker: 'FW-05', sector: 'Sector B',
  },
  {
    avatar: { initials: 'B·M11', variant: 'red' },
    id: 'CP-0389', type: 'GBV — family violence', encryptionDay: 5, status: 'urgent',
    alertLevel: 'amber', alertIssue: 'Referral awaiting sign-off', worker: 'FW-07', sector: 'Sector C',
  },
  {
    avatar: { initials: 'C·F14', variant: 'blue' },
    id: 'CP-0412', type: 'Psychosocial support', encryptionDay: 18, status: 'active',
  },
  {
    avatar: { initials: 'D·M9', variant: 'amber' },
    id: 'CP-0403', type: 'Family tracing & reunification', encryptionDay: 22, status: 'pending',
  },
];

export const MOCK_APPROVALS = [
  { id: 'APR-001', caseId: 'CP-0389', type: 'Referral request',     worker: 'FW-07', submittedAt: '2h ago'    },
  { id: 'APR-002', caseId: 'CP-0441', type: 'BIA form sign-off',    worker: 'FW-05', submittedAt: '4h ago'    },
  { id: 'APR-003', caseId: 'CP-0312', type: 'Case closure request', worker: 'FW-01', submittedAt: 'Yesterday' },
];

export const MOCK_CASES: Case[] = [
  {
    avatar: { initials: 'A·F7', variant: 'red' },
    id: 'CP-0441',
    type: 'Unaccompanied minor',
    encryptionDay: 2,
    status: 'urgent',
  },
  {
    avatar: { initials: 'B·M11', variant: 'red' },
    id: 'CP-0389',
    type: 'GBV — family violence',
    encryptionDay: 5,
    status: 'urgent',
  },
  {
    avatar: { initials: 'C·F14', variant: 'blue' },
    id: 'CP-0412',
    type: 'Psychosocial support',
    encryptionDay: 18,
    status: 'active',
  },
  {
    avatar: { initials: 'D·M9', variant: 'amber' },
    id: 'CP-0403',
    type: 'Family tracing & reunification',
    encryptionDay: 22,
    status: 'pending',
  },
];
