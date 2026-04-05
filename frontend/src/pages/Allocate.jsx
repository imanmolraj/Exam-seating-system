import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import api from '../api'
import toast from 'react-hot-toast'
import MetricCard from '../components/MetricCard'
import {
  Upload, FileText, X, Play, Download, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, BarChart2,
  Target, Zap, Sparkles, Loader, Ban, UserX, Pin, Trash2
} from 'lucide-react'

function FileDropzone({ label, file, onFile, onClear }) {
  const onDrop = useCallback(accepted => { if (accepted[0]) onFile(accepted[0]) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false
  })
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>{label}</label>
      {file ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--radius-md)' }}>
          <FileText size={18} color="var(--primary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{file.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
          </div>
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          ><X size={15} /></button>
        </div>
      ) : (
        <div {...getRootProps()} style={{ padding: '28px 16px', border: `2px dashed ${isDragActive ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'rgba(99,102,241,0.05)' : 'var(--bg-input)', transition: 'all 0.2s ease' }}>
          <input {...getInputProps()} />
          <Upload size={22} color={isDragActive ? 'var(--primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, color: isDragActive ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: 4 }}>{isDragActive ? 'Drop to upload' : 'Drag & drop or click to browse'}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>CSV files only</p>
        </div>
      )}
    </div>
  )
}

function ConfigInput({ label, value, onChange, min, max }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max}
        style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-mono)', outline: 'none' }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

function ConstraintBadge({ icon: Icon, label, color, onRemove }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: `${color}14`, border: `1px solid ${color}35`, borderRadius: 20, fontSize: 12, color }}>
      <Icon size={12} />
      <span>{label}</span>
      {onRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color, display: 'flex', padding: 0, marginLeft: 2, opacity: 0.7 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
        ><X size={11} /></button>
      )}
    </div>
  )
}

export default function Allocate() {
  const [studentFile, setStudentFile]         = useState(null)
  const [teacherFile, setTeacherFile]         = useState(null)
  const [examName, setExamName]               = useState('')
  const [config, setConfig]                   = useState({ max_classes: 20, rows: 10, cols: 4, min_perfect: 30, min_good: 20, random_seed: 42, shuffle: false })
  const [showAdvanced, setShowAdvanced]       = useState(false)
  const [constraintText, setConstraintText]   = useState('')
  const [parsedConstraints, setParsedConstraints] = useState(null)
  const [parsingAI, setParsingAI]             = useState(false)
  const [aiWarning, setAiWarning]             = useState('')
  const [loading, setLoading]                 = useState(false)
  const [result, setResult]                   = useState(null)
  const [showLogs, setShowLogs]               = useState(false)
  const [recordId, setRecordId]               = useState(null)

  const set = key => val => setConfig(c => ({ ...c, [key]: val }))

  const handleParseConstraints = async () => {
    if (!constraintText.trim()) { toast.error('Enter a constraint description first'); return }
    setParsingAI(true); setAiWarning('')
    try {
      const res = await api.post('/constraints/parse', { text: constraintText })
      setParsedConstraints(res.data.constraints)
      if (res.data.warning) setAiWarning(res.data.warning)
      else toast.success('Constraints parsed by Gemini AI!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI parsing failed')
    } finally { setParsingAI(false) }
  }

  const clearConstraints = () => { setParsedConstraints(null); setConstraintText(''); setAiWarning('') }
  const removeForbiddenPair = idx => setParsedConstraints(c => ({ ...c, forbidden_dept_pairs: c.forbidden_dept_pairs.filter((_, i) => i !== idx) }))
  const removeUnavailable   = idx => setParsedConstraints(c => ({ ...c, unavailable_teachers: c.unavailable_teachers.filter((_, i) => i !== idx) }))
  const removeFixed         = idx => setParsedConstraints(c => ({ ...c, fixed_invigilators: c.fixed_invigilators.filter((_, i) => i !== idx) }))

  const handleGenerate = async () => {
    if (!studentFile || !teacherFile) { toast.error('Please upload both CSV files'); return }
    if (!examName.trim()) { toast.error('Please enter an exam name'); return }
    setLoading(true); setResult(null)
    const formData = new FormData()
    formData.append('students_file', studentFile)
    formData.append('teachers_file', teacherFile)
    formData.append('exam_name', examName.trim())
    Object.entries(config).forEach(([k, v]) => formData.append(k === 'shuffle' ? 'shuffle_within_dept' : k, v))
    formData.append('ai_constraints', JSON.stringify(parsedConstraints || {}))
    try {
      const res = await api.post('/allocate', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data); setRecordId(res.data.record_id)
      toast.success('Seating plan generated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed')
    } finally { setLoading(false) }
  }

  const handleDownload = async () => {
    try {
      const res = await api.get(`/allocate/${recordId}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = `${examName.replace(/\s+/g, '_')}_seating_plan.xlsx`; a.click()
      window.URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const constraintCount = parsedConstraints
    ? (parsedConstraints.forbidden_dept_pairs?.length || 0) +
      (parsedConstraints.unavailable_teachers?.length || 0) +
      (parsedConstraints.fixed_invigilators?.length || 0)
    : 0

  return (
    <div style={{ padding: 32, animation: 'fadeIn 0.4s ease', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>New Allocation</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Upload data, describe constraints in plain English, and generate an optimized seating plan</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ── Left: Exam details + uploads + AI constraints ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Exam name */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Exam Details</h2>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>EXAM NAME</label>
            <input type="text" value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. End Semester Exam 2025"
              style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* File uploads */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Upload Files</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FileDropzone label="STUDENT LIST (CSV)" file={studentFile} onFile={setStudentFile} onClear={() => setStudentFile(null)} />
              <FileDropzone label="TEACHER / INVIGILATOR LIST (CSV)" file={teacherFile} onFile={setTeacherFile} onClear={() => setTeacherFile(null)} />
            </div>
            <div style={{ marginTop: 14, padding: 12, background: 'rgba(34,211,238,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(34,211,238,0.15)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expected columns: <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Name, ID/Roll, Department</span></p>
            </div>
          </div>

          {/* ── AI Constraints ── */}
          <div style={{ background: 'var(--bg-card)', border: `1px solid ${constraintCount > 0 ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: 24, transition: 'border-color 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>AI Constraints</h2>
              {constraintCount > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', borderRadius: 10, fontFamily: 'var(--font-mono)' }}>
                  {constraintCount} active
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Describe your constraints in plain English — Gemini AI will parse them automatically
            </p>

            <textarea value={constraintText} onChange={e => setConstraintText(e.target.value)} rows={4}
              placeholder={"Examples:\n• \"CSE and ECE shouldn't be in the same room\"\n• \"Dr. Sharma (ID T001) must be in Room 3\"\n• \"Prof. Qasim (ID T005) is on leave today\""}
              style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={handleParseConstraints} disabled={parsingAI || !constraintText.trim()}
                style={{ flex: 1, padding: '10px', background: parsingAI ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: parsingAI ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s' }}
                onMouseEnter={e => { if (!parsingAI) e.currentTarget.style.background = 'rgba(99,102,241,0.2)' }}
                onMouseLeave={e => { if (!parsingAI) e.currentTarget.style.background = 'rgba(99,102,241,0.12)' }}
              >
                {parsingAI ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Parsing...</> : <><Sparkles size={14} /> Parse with AI</>}
              </button>
              {parsedConstraints && (
                <button onClick={clearConstraints} style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <Trash2 size={13} /> Clear
                </button>
              )}
            </div>

            {/* AI warning */}
            {aiWarning && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--warning)', display: 'flex', gap: 8 }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {aiWarning}
              </div>
            )}

            {/* Parsed result badges */}
            {parsedConstraints && (
              <div style={{ marginTop: 16, animation: 'fadeIn 0.3s ease' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: 10 }}>PARSED CONSTRAINTS</div>

                {parsedConstraints.forbidden_dept_pairs?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}><Ban size={11} /> Forbidden Dept Pairs</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {parsedConstraints.forbidden_dept_pairs.map((pair, i) => (
                        <ConstraintBadge key={i} icon={Ban} label={`${pair[0]} ↔ ${pair[1]}`} color="var(--danger)" onRemove={() => removeForbiddenPair(i)} />
                      ))}
                    </div>
                  </div>
                )}

                {parsedConstraints.fixed_invigilators?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}><Pin size={11} /> Fixed Room Assignments</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {parsedConstraints.fixed_invigilators.map((f, i) => (
                        <ConstraintBadge key={i} icon={Pin} label={`ID ${f.TeacherID} → Room ${f.Room}`} color="var(--accent)" onRemove={() => removeFixed(i)} />
                      ))}
                    </div>
                  </div>
                )}

                {parsedConstraints.unavailable_teachers?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}><UserX size={11} /> On Leave / Unavailable</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {parsedConstraints.unavailable_teachers.map((tid, i) => (
                        <ConstraintBadge key={i} icon={UserX} label={`ID ${tid}`} color="var(--warning)" onRemove={() => removeUnavailable(i)} />
                      ))}
                    </div>
                  </div>
                )}

                {constraintCount === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No constraints detected. Try rephrasing your input.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Room configuration + generate button ── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Room Configuration</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Adjust parameters for the allocation algorithm</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ConfigInput label="MAX ROOMS"       value={config.max_classes}  onChange={set('max_classes')}  min={1}  max={200} />
            <ConfigInput label="ROWS PER ROOM"   value={config.rows}         onChange={set('rows')}         min={1}  max={50} />
            <ConfigInput label="COLS PER ROOM"   value={config.cols}         onChange={set('cols')}         min={1}  max={10} />
            <ConfigInput label="MIN PERFECT ROOM" value={config.min_perfect} onChange={set('min_perfect')}  min={1}  max={config.rows * config.cols} />
          </div>

          <button onClick={() => setShowAdvanced(s => !s)} style={{ width: '100%', marginTop: 16, padding: '9px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>
            Advanced Options {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAdvanced && (
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, animation: 'fadeIn 0.3s ease' }}>
              <ConfigInput label="MIN GOOD ROOM" value={config.min_good}    onChange={set('min_good')}    min={1} max={config.rows * config.cols} />
              <ConfigInput label="RANDOM SEED"   value={config.random_seed} onChange={set('random_seed')} min={0} max={1000000} />
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="shuffle" checked={config.shuffle} onChange={e => setConfig(c => ({ ...c, shuffle: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                <label htmlFor="shuffle" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Shuffle students within each department</label>
              </div>
            </div>
          )}

          {/* Active constraint summary */}
          {constraintCount > 0 && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 11, color: 'var(--primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: 6 }}>✦ AI CONSTRAINTS ACTIVE</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {parsedConstraints?.forbidden_dept_pairs?.length > 0 && <span>🚫 {parsedConstraints.forbidden_dept_pairs.length} forbidden dept pair{parsedConstraints.forbidden_dept_pairs.length > 1 ? 's' : ''}</span>}
                {parsedConstraints?.fixed_invigilators?.length > 0  && <span>📌 {parsedConstraints.fixed_invigilators.length} fixed invigilator assignment{parsedConstraints.fixed_invigilators.length > 1 ? 's' : ''}</span>}
                {parsedConstraints?.unavailable_teachers?.length > 0 && <span>🏖️ {parsedConstraints.unavailable_teachers.length} teacher{parsedConstraints.unavailable_teachers.length > 1 ? 's' : ''} on leave</span>}
              </div>
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading}
            style={{ width: '100%', marginTop: 24, padding: '14px', background: loading ? 'rgba(99,102,241,0.4)' : 'var(--primary)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s ease', boxShadow: loading ? 'none' : '0 0 24px var(--primary-glow)' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--primary-hover)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--primary)' }}
          >
            {loading
              ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Generating...</>
              : <><Play size={16} /> Generate Seating Plan</>
            }
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {result && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={20} color="var(--success)" />
              <span style={{ fontWeight: 600, fontSize: 15 }}>Seating plan generated successfully!</span>
            </div>
            <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--success)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Download size={14} /> Download Excel
            </button>
          </div>

          {result.unallocated_log?.length > 0 && (
            <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={16} color="var(--warning)" />
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--warning)' }}>Unallocated Students</span>
              </div>
              {result.unallocated_log.map((l, i) => <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{l}</p>)}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            <MetricCard label="Room Utilization" value={result.metrics.room_utilization} unit="%" icon={BarChart2} color="var(--success)" />
            <MetricCard label="Fairness Index"   value={result.metrics.fairness_index}   icon={Target}   color="var(--primary)" />
            <MetricCard label="Load Variance"    value={result.metrics.load_variance}    icon={Zap}      color="var(--accent)" />
            <MetricCard label="Conflicts"        value={result.metrics.conflict_count}   icon={AlertTriangle} color={result.metrics.conflict_count === 0 ? 'var(--success)' : 'var(--danger)'} subtitle={result.metrics.conflict_count === 0 ? 'Perfect ✓' : 'Review needed'} />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Room Summary</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>{['Room','Departments','Students','Invigilators','Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {result.summary.map(row => (
                    <tr key={row.Room} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>#{row.Room}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>{row.Departments}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>{row.Students_Assigned}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.Invigilators}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', background: row.Constraint_Check?.includes('Leftover') ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: row.Constraint_Check?.includes('Leftover') ? 'var(--warning)' : 'var(--success)' }}>
                          {row.Constraint_Check?.includes('Leftover') ? 'LEFTOVER' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <button onClick={() => setShowLogs(s => !s)} style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
              <span style={{ fontWeight: 500 }}>Generation Logs</span>
              {showLogs ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {showLogs && (
              <div style={{ padding: '0 20px 20px', animation: 'fadeIn 0.2s ease' }}>
                <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', padding: 16, maxHeight: 240, overflowY: 'auto' }}>
                  {result.logs.map((l, i) => (
                    <p key={i} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: l.startsWith('[AI]') ? 'var(--primary)' : l.startsWith('[Warning]') ? 'var(--warning)' : 'var(--text-muted)', marginBottom: 4, lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--border-bright)', marginRight: 8 }}>{String(i + 1).padStart(2, '0')}</span>{l}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
