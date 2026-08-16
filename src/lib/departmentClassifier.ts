import { DEPARTMENT_ADMINS } from './adminConfig';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ClassificationResult {
  department: string;
  assignedAdminId: string;
  priority: PriorityLevel;
  summary: string;
  priorityReason: string;
  reasonsList: string[];
}

const UPPCL_KEYWORDS = [
  'electricity', 'electric', 'power', 'current', 'bijli', 'light', 'street light',
  'transformer', 'pole', 'wire', 'electric pole', 'power cut', 'voltage', 'meter',
  'electric meter', 'uppcl'
];

const PWD_KEYWORDS = [
  'road', 'pothole', 'highway', 'bridge', 'footpath', 'road damage', 'broken road',
  'construction', 'pwd', 'drainage road', 'public works'
];

const WATER_KEYWORDS = [
  'water', 'pipeline', 'pipe', 'water supply', 'leakage', 'water leakage',
  'sewer', 'sewage', 'drain', 'drinking water', 'jal', 'jal sansthan', 'water tank'
];

const CYBER_KEYWORDS = [
  'cyber', 'hacking', 'hack', 'fraud', 'online fraud', 'scam', 'phishing',
  'otp fraud', 'upi fraud', 'bank fraud', 'cyber crime', 'account hacked',
  'social media hacked', 'identity theft', 'online cheating'
];

const DM_KEYWORDS = [
  'district', 'magistrate', 'government', 'administration', 'public administration',
  'general complaint', 'official', 'authority'
];

const CRITICAL_EMERGENCY_KEYWORDS = [
  'accident', 'sparking', 'fire', 'live wire', 'sewage leak inside house',
  'bank drain', 'stolen lakhs', 'major highway blocked', 'hazard', 'life-threatening'
];

export function classifyDepartment(
  description: string,
  linkedCount: number = 0,
  isClustered: boolean = false
): ClassificationResult {
  const text = (description || '').toLowerCase();

  let selectedDept = 'District Magistrate (DM)';

  const hasKeyword = (keywords: string[]) => keywords.some(kw => text.includes(kw));

  if (hasKeyword(CYBER_KEYWORDS)) {
    selectedDept = 'Cyber Cell';
  } else if (hasKeyword(WATER_KEYWORDS)) {
    selectedDept = 'Water Works / Jal Sansthan';
  } else if (hasKeyword(UPPCL_KEYWORDS)) {
    selectedDept = 'UPPCL / Electricity Department';
  } else if (hasKeyword(PWD_KEYWORDS)) {
    selectedDept = 'PWD';
  } else if (hasKeyword(DM_KEYWORDS)) {
    selectedDept = 'District Magistrate (DM)';
  } else {
    selectedDept = 'District Magistrate (DM)';
  }

  const assignedAdminId = DEPARTMENT_ADMINS[selectedDept] || '55555';

  let priority: PriorityLevel = 'Medium';
  const reasonsList: string[] = [];

  // 1. Check critical emergency keywords
  const isEmergency = CRITICAL_EMERGENCY_KEYWORDS.some(kw => text.includes(kw));
  const isHighRiskCategory = selectedDept === 'Cyber Cell' || text.includes('hack') || text.includes('fraud') || text.includes('sewage overflow') || text.includes('pothole');

  if (isEmergency || linkedCount >= 10) {
    priority = 'Critical';
    if (isEmergency) reasonsList.push('Safety hazard / emergency keywords detected');
    if (linkedCount >= 10) reasonsList.push(`${linkedCount} linked citizen reports (High public impact)`);
  } else if (isHighRiskCategory || linkedCount >= 3 || isClustered) {
    priority = 'High';
    if (text.includes('pothole') || text.includes('road')) reasonsList.push('Major road / traffic safety impact');
    if (selectedDept === 'Cyber Cell') reasonsList.push('Financial fraud / cyber security risk');
    if (text.includes('sewage overflow')) reasonsList.push('Public health hazard');
    if (linkedCount >= 3) reasonsList.push(`${linkedCount} linked citizen complaints`);
    if (isClustered) reasonsList.push('Geographic concentration area (Hotspot)');
  } else if (text.includes('minor') || text.includes('inquiry') || (selectedDept === 'UPPCL / Electricity Department' && text.includes('light') && !text.includes('transformer'))) {
    priority = 'Low';
    reasonsList.push('Non-urgent routine maintenance category');
  } else {
    priority = 'Medium';
    reasonsList.push('Standard category resolution SLA applied');
  }

  if (reasonsList.length === 0) {
    reasonsList.push(`Category: ${selectedDept}`);
  }

  const priorityReason = `Priority ${priority.toUpperCase()} because: ${reasonsList.join(', ')}`;

  // Generate concise summary
  let summary = description.trim();
  if (!summary) {
    summary = `Reported ${selectedDept} issue awaiting inspection.`;
  } else if (summary.length > 120) {
    summary = summary.substring(0, 117) + '...';
  }

  return {
    department: selectedDept,
    assignedAdminId,
    priority,
    summary,
    priorityReason,
    reasonsList
  };
}
