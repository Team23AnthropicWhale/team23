export type UrgencyLevel = 'red' | 'amber' | 'blue';
export type MetricColor = 'red' | 'blue' | 'neutral' | 'green';
export type PillVariant = 'urgent' | 'active' | 'pending' | 'closed';
export type AvatarVariant = 'red' | 'blue' | 'amber' | 'teal';

export interface Worker {
  greeting: string;
  name: string;
  sector: string;
  role: string;
  avatarInitials: string;
}

export interface AlertData {
  count: number;
  cases: string[];
  action: string;
}

export interface Metric {
  label: string;
  value: number | string;
  tag: string;
  color: MetricColor;
}

export interface Task {
  id: string;
  filePath?: string;
  urgency: UrgencyLevel;
  title: string;
  subtitle: string;
  time: string;
}

export interface CaseAvatar {
  initials: string;
  variant: AvatarVariant;
}

export interface Case {
  avatar: CaseAvatar;
  id: string;
  name?: string;
  filePath?: string | null;
  createdAt?: string;
  updatedAt?: string;
  type: string;
  encryptionDay: number;
  status: PillVariant;
  alertLevel?: UrgencyLevel;
  alertIssue?: string;
  worker?: string;
  sector?: string;
}
