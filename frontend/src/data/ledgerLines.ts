/**
 * Receipt & Payment schedule line items (Northern Accra / Methodist form).
 * defaultGriEligible: only on income — sections 1–6 typically count toward GRI; 7 and Bal b/f default off.
 */

export type LedgerLineDef = {
  id: string
  sectionId: string
  sectionTitle: string
  label: string
  /** When true, amounts on this line feed GRI-based remittances unless overridden later in Settings. */
  defaultGriEligible?: boolean
}

const gri = (v: boolean) => v

export const INCOME_LINES: LedgerLineDef[] = [
  // 1. OFFERTORY
  { id: 'i1-1', sectionId: 'inc-1', sectionTitle: '1. Offertory', label: 'Sunday Offertory (Adult)', defaultGriEligible: gri(true) },
  { id: 'i1-1b', sectionId: 'inc-1', sectionTitle: '1. Offertory', label: 'Sunday Offertory (Children)', defaultGriEligible: gri(true) },
  { id: 'i1-2', sectionId: 'inc-1', sectionTitle: '1. Offertory', label: 'Weekdays Offertory (other than Sunday)', defaultGriEligible: gri(true) },
  { id: 'i1-3', sectionId: 'inc-1', sectionTitle: '1. Offertory', label: 'Kofi and Ama', defaultGriEligible: gri(true) },
  { id: 'i1-4', sectionId: 'inc-1', sectionTitle: '1. Offertory', label: 'Special Offering/Sombi', defaultGriEligible: gri(true) },
  { id: 'i1-5', sectionId: 'inc-1', sectionTitle: '1. Offertory', label: 'Thanks Offering', defaultGriEligible: gri(true) },
  // 2. TITHE
  { id: 'i2-1', sectionId: 'inc-2', sectionTitle: '2. Tithe offering', label: 'Tithes', defaultGriEligible: gri(true) },
  // 3. HARVEST
  { id: 'i3-1', sectionId: 'inc-3', sectionTitle: '3. Harvest income', label: 'Harvest Proceeds (Cash)', defaultGriEligible: gri(true) },
  { id: 'i3-2', sectionId: 'inc-3', sectionTitle: '3. Harvest income', label: 'Harvest Pledges (Late Envelopes)', defaultGriEligible: gri(true) },
  // 4. OTHER OPERATING
  { id: 'i4-1', sectionId: 'inc-4', sectionTitle: '4. Other operating income', label: 'Revival', defaultGriEligible: gri(true) },
  { id: 'i4-2', sectionId: 'inc-4', sectionTitle: '4. Other operating income', label: 'Youth Division Income', defaultGriEligible: gri(true) },
  { id: 'i4-3', sectionId: 'inc-4', sectionTitle: '4. Other operating income', label: 'Other Programmes Income', defaultGriEligible: gri(true) },
  { id: 'i4-4', sectionId: 'inc-4', sectionTitle: '4. Other operating income', label: 'Welfare Contributions', defaultGriEligible: gri(true) },
  { id: 'i4-5', sectionId: 'inc-4', sectionTitle: '4. Other operating income', label: 'Donations/Gifts', defaultGriEligible: gri(true) },
  { id: 'i4-6', sectionId: 'inc-4', sectionTitle: '4. Other operating income', label: 'MPRP', defaultGriEligible: gri(true) },
  { id: 'i4-7', sectionId: 'inc-4', sectionTitle: '4. Other operating income', label: 'Thanksgiving Envelopes', defaultGriEligible: gri(true) },
  { id: 'i4-8', sectionId: 'inc-4', sectionTitle: '4. Other operating income', label: "Children's Week", defaultGriEligible: gri(true) },
  { id: 'i4-9', sectionId: 'inc-4', sectionTitle: '4. Other operating income', label: 'Sale of Lesson Books', defaultGriEligible: gri(true) },
  { id: 'i4-10', sectionId: 'inc-4', sectionTitle: '4. Other operating income', label: 'Sales of Times/Sentinel/Constitution/etc.', defaultGriEligible: gri(true) },
  // 5. OTHER INCOME REMITTANCE
  { id: 'i5-1', sectionId: 'inc-5', sectionTitle: '5. Other income remittance', label: 'Watch night Service Offering', defaultGriEligible: gri(true) },
  { id: 'i5-2', sectionId: 'inc-5', sectionTitle: '5. Other income remittance', label: 'Northern Ghana Appeal', defaultGriEligible: gri(true) },
  { id: 'i5-3', sectionId: 'inc-5', sectionTitle: '5. Other income remittance', label: 'YASA', defaultGriEligible: gri(true) },
  { id: 'i5-4', sectionId: 'inc-5', sectionTitle: '5. Other income remittance', label: 'MDF', defaultGriEligible: gri(true) },
  { id: 'i5-5', sectionId: 'inc-5', sectionTitle: '5. Other income remittance', label: 'Synod Sunday Proceeds', defaultGriEligible: gri(true) },
  { id: 'i5-6', sectionId: 'inc-5', sectionTitle: '5. Other income remittance', label: 'Bible Week Proceeds', defaultGriEligible: gri(true) },
  { id: 'i5-7', sectionId: 'inc-5', sectionTitle: '5. Other income remittance', label: 'Lay Movement Day Offertory', defaultGriEligible: gri(true) },
  { id: 'i5-8', sectionId: 'inc-5', sectionTitle: '5. Other income remittance', label: 'Diocesan/Circuit Collections', defaultGriEligible: gri(true) },
  // 6. ECUMENICAL
  { id: 'i6-1', sectionId: 'inc-6', sectionTitle: '6. Other income — ecumenical bodies', label: 'Trinity', defaultGriEligible: gri(true) },
  { id: 'i6-2', sectionId: 'inc-6', sectionTitle: '6. Other income — ecumenical bodies', label: 'Aldersgate / Heritage Week', defaultGriEligible: gri(true) },
  { id: 'i6-3', sectionId: 'inc-6', sectionTitle: '6. Other income — ecumenical bodies', label: 'All African Conference of Churches', defaultGriEligible: gri(true) },
  { id: 'i6-4', sectionId: 'inc-6', sectionTitle: '6. Other income — ecumenical bodies', label: 'Covenant Envelopes', defaultGriEligible: gri(true) },
  { id: 'i6-5', sectionId: 'inc-6', sectionTitle: '6. Other income — ecumenical bodies', label: 'Christian Home Week (Family Week)', defaultGriEligible: gri(true) },
  { id: 'i6-6', sectionId: 'inc-6', sectionTitle: '6. Other income — ecumenical bodies', label: 'Bible Week', defaultGriEligible: gri(true) },
  // 7. SPECIFIC ACTIVITY (often excluded from GRI)
  { id: 'i7-1', sectionId: 'inc-7', sectionTitle: '7. Income from specific activity', label: 'Rentals of Properties', defaultGriEligible: gri(false) },
  { id: 'i7-2', sectionId: 'inc-7', sectionTitle: '7. Income from specific activity', label: 'Investment Income', defaultGriEligible: gri(false) },
  { id: 'i7-3', sectionId: 'inc-7', sectionTitle: '7. Income from specific activity', label: 'Income from any Profitable Activities', defaultGriEligible: gri(false) },
  { id: 'i7-4', sectionId: 'inc-7', sectionTitle: '7. Income from specific activity', label: 'Diocesan Development Fund', defaultGriEligible: gri(false) },
  { id: 'i7-5', sectionId: 'inc-7', sectionTitle: '7. Income from specific activity', label: 'Grace Fund', defaultGriEligible: gri(false) },
  // Bal b/f
  { id: 'i-bf', sectionId: 'inc-bf', sectionTitle: 'Balance brought forward', label: 'Bal b/f (Previous balance)', defaultGriEligible: gri(false) },
]

export const EXPENDITURE_LINES: LedgerLineDef[] = [
  // 1. UTILITY
  { id: 'e1-1', sectionId: 'exp-1', sectionTitle: '1. Utility expenses', label: 'Utility (Electricity)' },
  { id: 'e1-2', sectionId: 'exp-1', sectionTitle: '1. Utility expenses', label: 'Mic Batteries' },
  { id: 'e1-3', sectionId: 'exp-1', sectionTitle: '1. Utility expenses', label: 'Water' },
  { id: 'e1-4', sectionId: 'exp-1', sectionTitle: '1. Utility expenses', label: 'Communication (Tel)' },
  { id: 'e1-5', sectionId: 'exp-1', sectionTitle: '1. Utility expenses', label: 'Utility (Water)' },
  // 2. SUNDAY
  { id: 'e2-1', sectionId: 'exp-2', sectionTitle: '2. Sunday expenses', label: 'Insurance' },
  { id: 'e2-2', sectionId: 'exp-2', sectionTitle: '2. Sunday expenses', label: 'Fuel for Genset' },
  { id: 'e2-3', sectionId: 'exp-2', sectionTitle: '2. Sunday expenses', label: 'Rentals' },
  { id: 'e2-4', sectionId: 'exp-2', sectionTitle: '2. Sunday expenses', label: 'Facility Rental Expenses' },
  // 3. R&M
  { id: 'e3-1', sectionId: 'exp-3', sectionTitle: '3. Repairs and maintenance', label: 'Land & Building (Electrical Works)' },
  { id: 'e3-2', sectionId: 'exp-3', sectionTitle: '3. Repairs and maintenance', label: 'Furniture & Fittings (Manse Bed)' },
  { id: 'e3-3', sectionId: 'exp-3', sectionTitle: '3. Repairs and maintenance', label: 'Musical Equipment' },
  { id: 'e3-4', sectionId: 'exp-3', sectionTitle: '3. Repairs and maintenance', label: 'Plant & Machinery (Bulb)' },
  { id: 'e3-5', sectionId: 'exp-3', sectionTitle: '3. Repairs and maintenance', label: 'Project' },
  { id: 'e3-6', sectionId: 'exp-3', sectionTitle: '3. Repairs and maintenance', label: 'Manse Expenses' },
  // 4. ADMIN
  { id: 'e4-1', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Gender & Social Services (Resource Personnel)' },
  { id: 'e4-2', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Office Expenses (Stationery)' },
  { id: 'e4-3', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Donation' },
  { id: 'e4-4', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Bank Charges' },
  { id: 'e4-5', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Equipment/Furniture Rentals' },
  { id: 'e4-6', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Honorarium — Visiting Preachers' },
  { id: 'e4-7', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Travelling Expenses' },
  { id: 'e4-8', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Poor Fund' },
  { id: 'e4-9', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Sanitizer & Tissue' },
  { id: 'e4-10', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Entertainment (Picnic)' },
  { id: 'e4-11', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Cleaning and Sanitation (Detergent)' },
  { id: 'e4-12', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Assistance to Organizations (Brigade Trainer)' },
  { id: 'e4-13', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Medical Expenses' },
  { id: 'e4-14', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Welfare' },
  { id: 'e4-15', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Printing & Stationery' },
  { id: 'e4-16', sectionId: 'exp-4', sectionTitle: '4. Administration', label: "Lord's Supper Expenses (Communion)" },
  { id: 'e4-17', sectionId: 'exp-4', sectionTitle: '4. Administration', label: "Minister's X Mas Appreciation" },
  { id: 'e4-18', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Ministers Appreciation' },
  { id: 'e4-19', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Church Workers Appreciation' },
  { id: 'e4-20', sectionId: 'exp-4', sectionTitle: '4. Administration', label: 'Scholarship' },
  // 5. SPECIFIC OPERATING
  { id: 'e5-1', sectionId: 'exp-5', sectionTitle: '5. Specific operating area expenses', label: 'Rentals (Dust Bin)' },
  { id: 'e5-2', sectionId: 'exp-5', sectionTitle: '5. Specific operating area expenses', label: 'Lesson Books' },
  { id: 'e5-3', sectionId: 'exp-5', sectionTitle: '5. Specific operating area expenses', label: "Children's week" },
  { id: 'e5-4', sectionId: 'exp-5', sectionTitle: '5. Specific operating area expenses', label: 'Loan Repayment' },
  { id: 'e5-5', sectionId: 'exp-5', sectionTitle: '5. Specific operating area expenses', label: 'Others' },
  // 6. PAYROLL
  { id: 'e6-1', sectionId: 'exp-6', sectionTitle: '6. Payroll cost', label: 'Ministerial Allowance' },
  { id: 'e6-2', sectionId: 'exp-6', sectionTitle: '6. Payroll cost', label: 'Stewards Allowances' },
  { id: 'e6-3', sectionId: 'exp-6', sectionTitle: '6. Payroll cost', label: 'Church Officers Allowance' },
  // 7. EVANG
  { id: 'e7-1', sectionId: 'exp-7', sectionTitle: '7. Evangelism and other programme expenses', label: 'Evangelism Expenses' },
  { id: 'e7-2', sectionId: 'exp-7', sectionTitle: '7. Evangelism and other programme expenses', label: 'Cord. Office on Youth and Education (YASA)' },
  { id: 'e7-3', sectionId: 'exp-7', sectionTitle: '7. Evangelism and other programme expenses', label: 'Cord. Office on Ministry' },
  { id: 'e7-4', sectionId: 'exp-7', sectionTitle: '7. Evangelism and other programme expenses', label: 'Northern Ghana Appeal' },
  // 8. REMITTANCE
  { id: 'e8-1', sectionId: 'exp-8', sectionTitle: '8. Other expenses remittance', label: '40% to Connexional' },
  { id: 'e8-2', sectionId: 'exp-8', sectionTitle: '8. Other expenses remittance', label: '9% to Diocese' },
  { id: 'e8-3', sectionId: 'exp-8', sectionTitle: '8. Other expenses remittance', label: '13% to Circuit' },
  { id: 'e8-4', sectionId: 'exp-8', sectionTitle: '8. Other expenses remittance', label: 'Lay Movement Appeal' },
  { id: 'e8-5', sectionId: 'exp-8', sectionTitle: '8. Other expenses remittance', label: 'Emergency Fund' },
  { id: 'e8-6', sectionId: 'exp-8', sectionTitle: '8. Other expenses remittance', label: 'Bible Week' },
]

const incomeMap = new Map(INCOME_LINES.map((l) => [l.id, l]))
const expMap = new Map(EXPENDITURE_LINES.map((l) => [l.id, l]))

export function getIncomeLine(id: string): LedgerLineDef | undefined {
  return incomeMap.get(id)
}

export function getExpenditureLine(id: string): LedgerLineDef | undefined {
  return expMap.get(id)
}

export function lineLabel(
  kind: 'income' | 'expenditure',
  lineId: string
): string {
  const line =
    kind === 'income' ? getIncomeLine(lineId) : getExpenditureLine(lineId)
  return line?.label ?? lineId
}

export function isIncomeGriEligibleByDefault(lineId: string): boolean {
  const line = getIncomeLine(lineId)
  return line?.defaultGriEligible === true
}

export type LineGroup = { sectionTitle: string; lines: LedgerLineDef[] }

function groupBySection(lines: LedgerLineDef[]): LineGroup[] {
  const order: string[] = []
  const map = new Map<string, LedgerLineDef[]>()
  for (const line of lines) {
    if (!map.has(line.sectionId)) {
      order.push(line.sectionId)
      map.set(line.sectionId, [])
    }
    map.get(line.sectionId)!.push(line)
  }
  return order.map((sid) => ({
    sectionTitle: map.get(sid)![0].sectionTitle,
    lines: map.get(sid)!,
  }))
}

export function incomeLineGroups(): LineGroup[] {
  return groupBySection(INCOME_LINES)
}

export function expenditureLineGroups(): LineGroup[] {
  return groupBySection(EXPENDITURE_LINES)
}
