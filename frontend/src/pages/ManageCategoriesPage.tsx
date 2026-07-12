import { useState, useSyncExternalStore } from 'react'
import {
  getCustomLinesSnapshot,
  subscribeCustomLines,
  updateCustomLines,
} from '../ledger/customLinesStore'
import {
  incomeLineGroups,
  expenditureLineGroups,
} from '../data/ledgerLines'
import type { LedgerLineDef } from '../ledger/ledgerTypes'
import { Link } from 'react-router-dom'
import styles from './ManageCategoriesPage.module.css'
import layout from './PlaceholderPage.module.css'

export function ManageCategoriesPage() {
  useSyncExternalStore(subscribeCustomLines, getCustomLinesSnapshot)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Also form state for adding new category
  const [isAdding, setIsAdding] = useState<'income' | 'expenditure' | null>(null)
  const [addLabel, setAddLabel] = useState('')
  const [addSection, setAddSection] = useState('')

  const incGroups = incomeLineGroups()
  const expGroups = expenditureLineGroups()

  function startEdit(line: LedgerLineDef) {
    setEditingId(line.id)
    setEditValue(line.label)
    setIsAdding(null)
  }

  function saveEdit() {
    if (!editingId) return
    if (editValue.trim()) {
      updateCustomLines((prev) => ({
        ...prev,
        renamedLines: { ...prev.renamedLines, [editingId]: editValue.trim() },
      }))
    }
    setEditingId(null)
  }

  function startAdd(kind: 'income' | 'expenditure') {
    setIsAdding(kind)
    setAddLabel('')
    const groups = kind === 'income' ? incGroups : expGroups
    setAddSection(groups[0]?.lines[0]?.sectionId ?? '')
    setEditingId(null)
  }

  function saveAdd() {
    if (!isAdding || !addLabel.trim() || !addSection) return
    const groups = isAdding === 'income' ? incGroups : expGroups
    const section = groups.find((g) => g.lines[0]?.sectionId === addSection)
    if (!section) return
    
    const newId = `c-${Date.now()}`
    const newLine: LedgerLineDef = {
      id: newId,
      sectionId: addSection,
      sectionTitle: section.sectionTitle,
      label: addLabel.trim(),
      defaultGriEligible: isAdding === 'income' ? false : undefined, // safe default
    }

    updateCustomLines((prev) => ({
      ...prev,
      ...(isAdding === 'income'
        ? { addedIncomeLines: [...prev.addedIncomeLines, newLine] }
        : { addedExpenditureLines: [...prev.addedExpenditureLines, newLine] }),
    }))

    setIsAdding(null)
  }

  function renderGroup(g: { sectionTitle: string; lines: LedgerLineDef[] }) {
    return (
      <div key={g.sectionTitle} className={styles.group}>
        <h4 className={styles.groupTitle}>{g.sectionTitle}</h4>
        <ul className={styles.list}>
          {g.lines.map((l) => (
            <li key={l.id} className={styles.listItem}>
              {editingId === l.id ? (
                <div className={styles.editRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  />
                  <button className={styles.saveBtn} onClick={saveEdit}>Save</button>
                  <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <div className={styles.viewRow}>
                  <span className={styles.label}>{l.label}</span>
                  <button className={styles.editBtn} onClick={() => startEdit(l)}>Edit</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className={layout.wrap}>
      <h1 className={layout.title}>Manage Categories</h1>
      <p className={layout.text}>
        <Link to="/app/settings" className={styles.backLink}>&larr; Back to Settings</Link>
      </p>

      <div className={styles.wrap}>
        <div className={styles.columns}>
        {/* Income Column */}
        <div className={styles.column}>
          <div className={styles.colHeader}>
            <h3 className={styles.columnTitle}>Income</h3>
            <button className={styles.addBtn} onClick={() => startAdd('income')}>Add Income</button>
          </div>
          {isAdding === 'income' && (
            <div className={styles.addForm}>
              <select
                className={styles.select}
                value={addSection}
                onChange={(e) => setAddSection(e.target.value)}
              >
                {incGroups.map((g) => (
                  <option key={g.lines[0]?.sectionId} value={g.lines[0]?.sectionId}>
                    {g.sectionTitle}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="New income category"
                className={styles.input}
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                autoFocus
              />
              <div className={styles.addActions}>
                <button className={styles.saveBtn} onClick={saveAdd}>Add</button>
                <button className={styles.cancelBtn} onClick={() => setIsAdding(null)}>Cancel</button>
              </div>
            </div>
          )}
          <div className={styles.groups}>
            {incGroups.map(renderGroup)}
          </div>
        </div>

        {/* Expenditure Column */}
        <div className={styles.column}>
          <div className={styles.colHeader}>
            <h3 className={styles.columnTitle}>Expenditure</h3>
            <button className={styles.addBtn} onClick={() => startAdd('expenditure')}>Add Expenditure</button>
          </div>
          {isAdding === 'expenditure' && (
             <div className={styles.addForm}>
             <select
               className={styles.select}
               value={addSection}
               onChange={(e) => setAddSection(e.target.value)}
             >
               {expGroups.map((g) => (
                 <option key={g.lines[0]?.sectionId} value={g.lines[0]?.sectionId}>
                   {g.sectionTitle}
                 </option>
               ))}
             </select>
             <input
               type="text"
               placeholder="New expenditure category"
               className={styles.input}
               value={addLabel}
               onChange={(e) => setAddLabel(e.target.value)}
               autoFocus
             />
             <div className={styles.addActions}>
               <button className={styles.saveBtn} onClick={saveAdd}>Add</button>
               <button className={styles.cancelBtn} onClick={() => setIsAdding(null)}>Cancel</button>
             </div>
           </div>
          )}
          <div className={styles.groups}>
            {expGroups.map(renderGroup)}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
