import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudAccountSection } from '../components/CloudAccountSection'
import { ThemeToggle } from '../components/ThemeToggle'
import { useChurchProfile } from '../context/useChurchProfile'
import { useToast } from '../context/ToastContext'
import { INCOME_LINES, incomeLineGroups, isIncomeGriEligibleByDefault } from '../data/ledgerLines'
import {
  getGriOverridesSnapshot,
  griOverridesMapsEqual,
  replaceGriOverrides,
} from '../gri/griOverridesStore'
import { resolveIncomeGriEligible } from '../lib/griResolve'
import { useGriEligibility } from '../gri/useGriEligibility'
import styles from './PlaceholderPage.module.css'
import local from './SettingsPage.module.css'

export function SettingsPage() {
  const { profile } = useChurchProfile()
  const { showToast } = useToast()
  const { overrides } = useGriEligibility()

  const [draft, setDraft] = useState<Record<string, boolean>>(() => ({
    ...getGriOverridesSnapshot(),
  }))

  const dirty = useMemo(() => !griOverridesMapsEqual(draft, overrides), [draft, overrides])

  function patchDraftLine(lineId: string, eligible: boolean) {
    setDraft((d) => {
      const next = { ...d }
      const def = isIncomeGriEligibleByDefault(lineId)
      if (eligible === def) delete next[lineId]
      else next[lineId] = eligible
      return next
    })
  }

  function patchDraftSection(sectionId: string, eligible: boolean) {
    setDraft((d) => {
      const next = { ...d }
      for (const line of INCOME_LINES) {
        if (line.sectionId !== sectionId) continue
        const def = isIncomeGriEligibleByDefault(line.id)
        if (eligible === def) delete next[line.id]
        else next[line.id] = eligible
      }
      return next
    })
  }

  function resetDraftToScheduleDefaults() {
    setDraft({})
    showToast('GRI draft reset to schedule defaults. Save when you are ready to apply.', 'info')
  }

  function saveGriDraft() {
    replaceGriOverrides(draft)
    setDraft({ ...getGriOverridesSnapshot() })
    showToast('GRI settings saved. The ledger and quarterly report now use these rules.')
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.text}>
        Choose which income schedule lines count toward <strong>GRI</strong> (Gross Remittable Income). That total drives Connexional, Diocese, Circuit, and Emergency remittance figures on the ledger and quarterly report.
      </p>

      <CloudAccountSection />

      <section className={local.appearance} aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className={local.profileTitle}>
          Appearance
        </h2>
        <p className={local.profileHint}>Choose dark or light interface. Your choice is saved on this device.</p>
        <ThemeToggle variant="default" />
      </section>

      <section className={local.profile} aria-labelledby="church-profile-heading">
        <h2 id="church-profile-heading" className={local.profileTitle}>
          Church profile
        </h2>
        <p className={local.profileHint}>
          Used on the dashboard header and will feed your PDF cover sheet.
        </p>
        <dl className={local.dl}>
          <div className={local.row}>
            <dt>Society</dt>
            <dd>{profile.society}</dd>
          </div>
          <div className={local.row}>
            <dt>Circuit</dt>
            <dd>{profile.circuit}</dd>
          </div>
          <div className={local.row}>
            <dt>Diocese</dt>
            <dd>{profile.diocese}</dd>
          </div>
        </dl>
        <Link className={local.editLink} to="/setup?edit=1">
          Edit church profile
        </Link>
      </section>

      <section className={local.gri} aria-labelledby="gri-heading">
        <h2 id="gri-heading" className={local.profileTitle}>
          GRI — income lines subject to remittance
        </h2>
        <p className={local.profileHint}>
          The built-in schedule sets sensible defaults (sections 1–6 usually included; section 7 and balance brought forward usually excluded). Edit the checkboxes below, then click <strong>Save GRI settings</strong> to apply. Until you save, the ledger and report keep the last saved rules.
        </p>
        <div className={local.griToolbar}>
          <button
            type="button"
            className={local.saveBtn}
            onClick={saveGriDraft}
            disabled={!dirty}
          >
            Save GRI settings
          </button>
          <button type="button" className={local.resetBtn} onClick={resetDraftToScheduleDefaults}>
            Reset draft to schedule defaults
          </button>
        </div>
        {dirty ? (
          <p className={local.griUnsaved} role="status">
            You have unsaved changes.
          </p>
        ) : null}
        <div className={local.griGroups}>
          {incomeLineGroups().map((g) => {
            const sectionId = g.lines[0]?.sectionId
            if (!sectionId) return null
            return (
              <div key={sectionId} className={local.griGroup}>
                <div className={local.griGroupHead}>
                  <h3 className={local.griSectionTitle}>{g.sectionTitle}</h3>
                  <div className={local.griSectionActions} role="group" aria-label={`${g.sectionTitle} GRI shortcuts`}>
                    <button
                      type="button"
                      className={local.sectionBtn}
                      onClick={() => patchDraftSection(sectionId, true)}
                    >
                      All GRI
                    </button>
                    <button
                      type="button"
                      className={local.sectionBtn}
                      onClick={() => patchDraftSection(sectionId, false)}
                    >
                      None GRI
                    </button>
                  </div>
                </div>
                <ul className={local.griLineList}>
                  {g.lines.map((line) => {
                    const on = resolveIncomeGriEligible(line.id, draft)
                    const lineId = `gri-line-${line.id}`
                    return (
                      <li key={line.id} className={local.griLineRow}>
                        <label className={local.griLineLabel} htmlFor={lineId}>
                          <span className={local.griLineText}>{line.label}</span>
                          <input
                            id={lineId}
                            className={local.griToggle}
                            type="checkbox"
                            checked={on}
                            onChange={(e) => patchDraftLine(line.id, e.target.checked)}
                          />
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
