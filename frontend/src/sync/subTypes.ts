export const SUBSCRIPTION_MODULE = true;
export type SubscriptionStatus = 'active' | 'halted' | 'expired';
export type SubscriptionPlan = '1_week' | '2_weeks' | '1_month' | '3_months' | '6_months' | '1_year' | 'lifetime';

export interface UserSubscription {
  userId: string;
  status: SubscriptionStatus;
  planType: SubscriptionPlan;
  startsAt: string;
  expiresAt: string;
  haltReason?: string;
  grantedBy?: string;
  updatedAt: string;
}

export interface UserMetadata {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'halted' | 'suspended';
  lastLoginAt?: string;
  lastActiveIP?: string;
  appVersion?: string;
}

export interface ActivityLog {
  id?: string;
  userId: string;
  email: string;
  action: string;
  details: string;
  timestamp: string;
  deviceInfo: string;
}
