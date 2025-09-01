export type CallOutcome = 
  | 'yes-needs-confirmation'
  | 'confirmed-sale'
  | 'no'
  | 'absolutely-no'
  | 'hangup'
  | 'call-later'
  | 'call-in-2-months'
  | 'sickness-medicine'
  | 'already-customer'
  | 'not-enough-money'
  | 'language-difficulties'
  | 'wrong-number'
  | 'dnc';

export interface CallEntry {
  id: string;
  outcome: CallOutcome;
  timestamp: Date;
  notes?: string;
}

export interface CallStats {
  totalCalls: number;
  confirmedSales: number;
  yesRatio: number;
  engagementRatio: number;
  outcomeCounts: Record<CallOutcome, number>;
}

export interface CallSession {
  id: string;
  calls: CallEntry[];
  startTime: Date;
  endTime?: Date;
}