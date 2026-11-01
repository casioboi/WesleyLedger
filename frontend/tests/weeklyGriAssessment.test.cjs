const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const sourceRoot = path.join(__dirname, '..', 'src')

function loadTypeScriptModule(relativePath, dependencies = {}) {
  const filename = path.join(sourceRoot, relativePath)
  const source = fs.readFileSync(filename, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  })
  const loaded = { exports: {} }
  const resolveDependency = (id) => {
    if (Object.prototype.hasOwnProperty.call(dependencies, id)) {
      return dependencies[id]
    }
    return require(id)
  }
  new Function('require', 'module', 'exports', outputText)(
    resolveDependency,
    loaded,
    loaded.exports
  )
  return loaded.exports
}

const remittance = loadTypeScriptModule('lib/remittance.ts')
const incomeLines = [
  { id: 'tithe', label: 'Tithes', defaultGriEligible: true },
  { id: 'offering', label: 'Sunday Offertory', defaultGriEligible: true },
  { id: 'project', label: 'Project Offering', defaultGriEligible: false },
]
const assessment = loadTypeScriptModule('lib/weeklyGriAssessment.ts', {
  '../data/ledgerLines': { getMergedIncomeLines: () => incomeLines },
  './remittance': remittance,
})

test('matches existing GRI remittance percentages and keeps society remainder', () => {
  const result = assessment.calculateGriAssessmentAmounts(49_000)

  assert.deepEqual(result, {
    incomeMinor: 49_000,
    connexionalMinor: 19_600,
    dioceseMinor: 4_410,
    circuitMinor: 6_370,
    emergencyMinor: 372,
    totalAssessmentMinor: 30_752,
    societyBalanceMinor: 18_248,
  })
})

test('allocates rounding pesewas so each displayed line reconciles to weekly rates', () => {
  const lines = assessment.calculateGriAssessmentLines([
    { lineId: 'one', incomeMinor: 1 },
    { lineId: 'two', incomeMinor: 1 },
    { lineId: 'three', incomeMinor: 1 },
    { lineId: 'four', incomeMinor: 1 },
    { lineId: 'five', incomeMinor: 1 },
  ])
  const totals = lines.reduce(
    (sum, line) => ({
      connexionalMinor: sum.connexionalMinor + line.connexionalMinor,
      dioceseMinor: sum.dioceseMinor + line.dioceseMinor,
      circuitMinor: sum.circuitMinor + line.circuitMinor,
      emergencyMinor: sum.emergencyMinor + line.emergencyMinor,
      societyBalanceMinor: sum.societyBalanceMinor + line.societyBalanceMinor,
    }),
    {
      connexionalMinor: 0,
      dioceseMinor: 0,
      circuitMinor: 0,
      emergencyMinor: 0,
      societyBalanceMinor: 0,
    }
  )
  const expected = remittance.remittanceFromGriMinor(5)

  assert.deepEqual(
    {
      connexionalMinor: totals.connexionalMinor,
      dioceseMinor: totals.dioceseMinor,
      circuitMinor: totals.circuitMinor,
      emergencyMinor: totals.emergencyMinor,
    },
    expected
  )
  assert.equal(totals.societyBalanceMinor, 5 - Object.values(expected).reduce((a, b) => a + b, 0))
})

test('uses Monday-to-Sunday calendar weeks across month and year boundaries', () => {
  assert.deepEqual(assessment.calendarWeekRange('2026-11-01'), {
    startIso: '2026-10-26',
    endIso: '2026-11-01',
  })
  assert.deepEqual(assessment.calendarWeekRange('2021-01-01'), {
    startIso: '2020-12-28',
    endIso: '2021-01-03',
  })
  assert.equal(assessment.isoWeekNumber('2021-01-01'), 53)
  assert.equal(assessment.isoWeekNumber('2021-01-04'), 1)
  assert.equal(assessment.shiftCalendarWeek('2026-11-01', 1), '2026-11-02')
})

test('weekly sheet includes only eligible income in range and aggregates by source', () => {
  const transactions = [
    { id: 'a', dateIso: '2026-10-26', kind: 'income', lineId: 'tithe', amountMinor: 10_000 },
    { id: 'b', dateIso: '2026-11-01', kind: 'income', lineId: 'tithe', amountMinor: 5_000 },
    { id: 'c', dateIso: '2026-11-02', kind: 'income', lineId: 'tithe', amountMinor: 99_000 },
    { id: 'd', dateIso: '2026-10-30', kind: 'income', lineId: 'project', amountMinor: 80_000 },
    { id: 'e', dateIso: '2026-10-30', kind: 'expenditure', lineId: 'tithe', amountMinor: 70_000 },
  ]

  const result = assessment.buildWeeklyGriAssessment(
    transactions,
    '2026-10-26',
    '2026-11-01',
    (lineId) => lineId !== 'project'
  )

  assert.equal(result.lines.length, 1)
  assert.equal(result.lines[0].lineId, 'tithe')
  assert.equal(result.lines[0].incomeMinor, 15_000)
  assert.equal(result.totals.incomeMinor, 15_000)
  assert.equal(
    result.totals.totalAssessmentMinor,
    remittance.remittanceFromGriMinor(15_000).connexionalMinor +
      remittance.remittanceFromGriMinor(15_000).dioceseMinor +
      remittance.remittanceFromGriMinor(15_000).circuitMinor +
      remittance.remittanceFromGriMinor(15_000).emergencyMinor
  )
})

test('live assessment combines saved weekly income with the current draft', () => {
  const result = assessment.buildWeeklyGriAssessment(
    [
      { id: 'saved', dateIso: '2026-10-28', kind: 'income', lineId: 'tithe', amountMinor: 10_000 },
    ],
    '2026-10-26',
    '2026-11-01',
    (lineId) => lineId !== 'project',
    new Map([
      ['tithe', 5_000],
      ['project', 20_000],
    ])
  )

  assert.equal(result.lines.length, 1)
  assert.equal(result.lines[0].incomeMinor, 15_000)
  assert.equal(result.totals.incomeMinor, 15_000)
})

test('empty weeks return zero totals and no income rows', () => {
  const result = assessment.buildWeeklyGriAssessment(
    [],
    '2026-10-26',
    '2026-11-01',
    () => true
  )

  assert.deepEqual(result.lines, [])
  assert.equal(result.totals.incomeMinor, 0)
  assert.equal(result.totals.totalAssessmentMinor, 0)
})
