export interface RiskFinding {
  label: string;
  labelThai: string;
  logId: string;
  location?: string;
  time?: string;
  source?: string;
  sourceName?: string;
  sourceUrl?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  type?: 'SCAM' | 'UNREST' | 'DEBT' | 'MENTAL_HEALTH';
  isPiiCleared?: boolean;
}

export interface RiskData {
  id: string;
  label: string;
  labelThai: string;
  score: number;
  baseline: number;
  threshold: number;
  color: string;
  emoji: string;
  topDriver: string;
  topDriverThai: string;
  secondaryDriver: string;
  secondaryDriverThai: string;
  persistentSince?: number;
  redSince?: number;
  isPersistent?: boolean;
  location?: string;
  time?: string;
  evidenceDescription?: string;
  evidenceDescriptionThai?: string;
  sourceName?: string;
  sourceUrl?: string;
  timestamp?: number;
  logId?: string;
  findings?: RiskFinding[];
}

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  messageThai: string;
  seq: number;
  timestamp: number;
  details?: string;
  deepDive?: string;
  sourceName?: string;
  sourceUrl?: string;
  lat?: number;
  lon?: number;
  locationName?: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DailySummary {
  overview: string;
  overviewThai: string;
  keyTakeaways: string[];
  keyTakeawaysThai: string[];
  criticalWatchlist: string[];
  criticalWatchlistThai: string[];
  wisdoms: string[];
  wisdomsThai: string[];
  timestamp?: number;
}
