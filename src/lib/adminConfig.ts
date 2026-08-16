export interface AdminAccount {
  id: string;
  department: string;
  otp: string;
  role: string;
}

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: "11111",
    department: "UPPCL / Electricity Department",
    otp: "123456",
    role: "Department Administrator"
  },
  {
    id: "22222",
    department: "PWD",
    otp: "234567",
    role: "Department Administrator"
  },
  {
    id: "33333",
    department: "Water Works / Jal Sansthan",
    otp: "345678",
    role: "Department Administrator"
  },
  {
    id: "44444",
    department: "Cyber Cell",
    otp: "456789",
    role: "Department Administrator"
  },
  {
    id: "55555",
    department: "District Magistrate (DM)",
    otp: "567890",
    role: "District Magistrate / Admin"
  }
];

export const DEPARTMENT_ADMINS: Record<string, string> = {
  "UPPCL / Electricity Department": "11111",
  "PWD": "22222",
  "Water Works / Jal Sansthan": "33333",
  "Cyber Cell": "44444",
  "District Magistrate (DM)": "55555"
};

/**
 * Normalize any legacy or alias department string to the exact canonical department name.
 */
export function normalizeDepartmentName(deptStr: string): string {
  const d = (deptStr || '').toLowerCase();
  if (d.includes('cyber') || d.includes('scam') || d.includes('fraud')) {
    return 'Cyber Cell';
  }
  if (d.includes('water') || d.includes('sansthan') || d.includes('sewer') || d.includes('jal')) {
    return 'Water Works / Jal Sansthan';
  }
  if (d.includes('uppcl') || d.includes('electric') || d.includes('bijli') || d.includes('power')) {
    return 'UPPCL / Electricity Department';
  }
  if (d.includes('pwd') || d.includes('road') || d.includes('highway') || d.includes('bridge') || d.includes('public works')) {
    return 'PWD';
  }
  return 'District Magistrate (DM)';
}

/**
 * Get assigned Admin ID for any given department string.
 */
export function getAdminIdForDepartment(deptStr: string): string {
  const canonical = normalizeDepartmentName(deptStr);
  return DEPARTMENT_ADMINS[canonical] || '55555';
}

export function getAdminById(id: string): AdminAccount | undefined {
  return ADMIN_ACCOUNTS.find(a => a.id === id);
}

export function validateAdminLogin(id: string, otp: string): AdminAccount | undefined {
  return ADMIN_ACCOUNTS.find(a => a.id === id && a.otp === otp);
}
