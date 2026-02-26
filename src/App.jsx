import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// SITE — SAIL's Intelligent Training Engineer
// An AI Agent replacing Departmental Training Engineer
// ═══════════════════════════════════════════════════════════════

const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";

// ── Utility: Call Claude API via Netlify Function proxy ──
async function callSITE(systemPrompt, userMessage) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "No response received. Check API key in Netlify settings.";
  } catch (e) {
    return "⚠️ API Error: " + e.message;
  }
}

// ── Utility: Log to Google Sheets ──
async function logToSheet(sheetName, rowData) {
  if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") return;
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "append", sheet: sheetName, data: rowData }),
    });
  } catch (e) { console.log("Sheet log error:", e); }
}

// ── Storage helpers (localStorage for standalone hosting) ──
async function loadData(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}
async function saveData(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Icons (inline SVG) ──
const Icon = ({ d, size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const Icons = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  skills: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  calendar: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18",
  alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  award: "M12 15l-3 6 1.5-3.5L7 18l3-6 M12 15l3 6-1.5-3.5L17 18l-3-6 M8.21 13.89L7 23l5-3 5 3-1.21-9.12 M12 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  chart: "M18 20V10 M12 20V4 M6 20v-6",
  report: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  bot: "M12 8V4H8 M2 14h2 M20 14h2 M15 13a1 1 0 0 1 0 2h-6a1 1 0 0 1 0-2 M6 18h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2z M9 13v2 M15 13v2",
  send: "M22 2L11 13 M22 2l-7 20-4-9-9-4z",
  plus: "M12 5v14 M5 12h14",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18 M6 6l12 12",
  search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
};

// ── Shared Styles ──
const theme = {
  bg: "#0B0F1A", bgCard: "#111827", bgHover: "#1F2937", bgInput: "#1a2236",
  border: "#1E293B", borderFocus: "#F59E0B",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  accent: "#F59E0B", accentDim: "#B45309", accentGlow: "rgba(245,158,11,0.15)",
  success: "#22C55E", danger: "#EF4444", info: "#3B82F6", purple: "#A855F7",
};

const cardStyle = {
  background: theme.bgCard, borderRadius: 12, border: `1px solid ${theme.border}`,
  padding: 20, position: "relative", overflow: "hidden",
};
const btnPrimary = {
  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDim})`,
  color: "#000", border: "none", borderRadius: 8, padding: "10px 20px",
  fontWeight: 700, cursor: "pointer", fontSize: 14, letterSpacing: 0.5,
  transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 8,
};
const btnSecondary = {
  background: "transparent", color: theme.textSecondary, border: `1px solid ${theme.border}`,
  borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13,
  transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 6,
};
const inputStyle = {
  background: theme.bgInput, color: theme.textPrimary, border: `1px solid ${theme.border}`,
  borderRadius: 8, padding: "10px 14px", fontSize: 14, width: "100%", outline: "none",
  transition: "border 0.2s", boxSizing: "border-box",
};
const selectStyle = { ...inputStyle, cursor: "pointer", appearance: "auto" };
const textareaStyle = { ...inputStyle, minHeight: 100, resize: "vertical", fontFamily: "inherit" };
const labelStyle = { color: theme.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block", letterSpacing: 1, textTransform: "uppercase" };

// ── Stat Card ──
const StatCard = ({ label, value, sub, color = theme.accent, icon }) => (
  <div style={{ ...cardStyle, flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: theme.textMuted, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      {icon && <Icon d={icon} size={16} color={theme.textMuted} />}
    </div>
    <span style={{ color: theme.textPrimary, fontSize: 28, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{value}</span>
    {sub && <span style={{ color: theme.textMuted, fontSize: 12 }}>{sub}</span>}
  </div>
);

// ── Badge ──
const Badge = ({ text, color = theme.accent }) => (
  <span style={{ background: color + "22", color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{text}</span>
);

// ── Loading Spinner ──
const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.accent }}>
    <div style={{ width: 20, height: 20, border: `2px solid ${theme.border}`, borderTop: `2px solid ${theme.accent}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    <span style={{ fontSize: 13 }}>SITE is thinking...</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ══════════════════════════════════════════════════
// MODULE 1: DASHBOARD OVERVIEW
// ══════════════════════════════════════════════════
const DashboardModule = ({ data }) => {
  const stats = data.stats || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>Command Center</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>Real-time overview of all training operations</p>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard label="Total Employees" value={stats.totalEmployees || 0} sub="In department" icon={Icons.skills} color={theme.info} />
        <StatCard label="Trainings Planned" value={stats.trainingsPlanned || 0} sub="This quarter" icon={Icons.calendar} color={theme.accent} />
        <StatCard label="Skill Coverage" value={`${stats.skillCoverage || 0}%`} sub="Matrix completion" icon={Icons.chart} color={theme.success} />
        <StatCard label="Compliance Rate" value={`${stats.complianceRate || 0}%`} sub="Statutory training" icon={Icons.shield} color={theme.purple} />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard label="Certifications Due" value={stats.certsDue || 0} sub="Next 30 days" icon={Icons.award} color={theme.danger} />
        <StatCard label="Incidents Analyzed" value={stats.incidentsAnalyzed || 0} sub="Converted to training" icon={Icons.alert} color={theme.accent} />
        <StatCard label="Effectiveness Score" value={`${stats.effectivenessScore || 0}%`} sub="Application rate" icon={Icons.chart} color={theme.success} />
        <StatCard label="SOPs Updated" value={stats.sopsUpdated || 0} sub="This month" icon={Icons.book} color={theme.info} />
      </div>
      <div style={{ ...cardStyle }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${theme.accent}, ${theme.info})` }} />
        <h3 style={{ color: theme.textPrimary, margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>⚡ Quick Actions</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["Run Skill Gap Analysis", "Generate Monthly Report", "Check Compliance Status", "Plan Next Training", "Analyze Recent Incident", "Update Skill Matrix"].map(a => (
            <button key={a} style={{ ...btnSecondary, fontSize: 12, padding: "8px 16px" }}>{a}</button>
          ))}
        </div>
      </div>
      <div style={{ ...cardStyle }}>
        <h3 style={{ color: theme.textPrimary, margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>📊 Key Outcomes Tracker</h3>
        {[
          { area: "Capability Readiness", measure: "Skill matrix coverage", value: stats.skillCoverage || 0, target: 90 },
          { area: "Operational Stability", measure: "SOP adherence rate", value: stats.sopAdherence || 0, target: 95 },
          { area: "Learning Application", measure: "Post-training application", value: stats.effectivenessScore || 0, target: 80 },
          { area: "Knowledge Retention", measure: "Lessons captured", value: stats.knowledgeRetention || 0, target: 85 },
        ].map((o, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: theme.textPrimary, fontSize: 13, fontWeight: 600 }}>{o.area}</span>
              <span style={{ color: o.value >= o.target ? theme.success : theme.accent, fontSize: 13, fontWeight: 700 }}>{o.value}% / {o.target}%</span>
            </div>
            <div style={{ background: theme.bgInput, borderRadius: 6, height: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(o.value, 100)}%`, background: o.value >= o.target ? theme.success : `linear-gradient(90deg, ${theme.accent}, ${theme.accentDim})`, borderRadius: 6, transition: "width 1s" }} />
            </div>
            <span style={{ color: theme.textMuted, fontSize: 11 }}>{o.measure}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════
// MODULE 2: SKILL GAP ANALYSIS
// ══════════════════════════════════════════════════
const SkillGapModule = ({ data, setData }) => {
  const [loading, setLoading] = useState(false);
  const [dept, setDept] = useState("BF (Blast Furnace)");
  const [role, setRole] = useState("Operator");
  const [result, setResult] = useState("");
  const employees = data.employees || [];

  const runAnalysis = async () => {
    setLoading(true);
    const sys = `You are SITE (SAIL's Intelligent Training Engineer), an AI agent at a SAIL steel plant. You specialize in skill gap analysis. Generate a structured skill gap analysis report for the given department and role. Include: 1) Role-wise skill matrix (list 8-10 key skills with current level 1-5 and required level 1-5), 2) Critical gaps identified, 3) Priority training recommendations, 4) Timeline for closure. Format with clear sections. Be specific to steel plant operations.`;
    const msg = `Department: ${dept}\nRole: ${role}\nNumber of employees in role: ${employees.filter(e => e.role === role).length || "Unknown"}\n\nGenerate a comprehensive skill gap analysis.`;
    const r = await callSITE(sys, msg);
    setResult(r);
    logToSheet("SkillGapAnalysis", [new Date().toISOString(), dept, role, "Analysis completed"]);
    setLoading(false);
  };

  const addEmployee = () => {
    const name = prompt("Employee Name:");
    if (!name) return;
    const r = prompt("Role (Operator/Technician/Supervisor):");
    const newEmp = { id: Date.now(), name, role: r || "Operator", dept, skills: {}, certifications: [] };
    const updated = { ...data, employees: [...employees, newEmp] };
    setData(updated);
    saveData("site-data", updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>Skill Gap Analysis</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>AI-powered role-wise skill matrix diagnosis</p>
      </div>
      <div style={{ ...cardStyle }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Department</label>
            <select style={selectStyle} value={dept} onChange={e => setDept(e.target.value)}>
              {["BF (Blast Furnace)", "SMS (Steel Melting Shop)", "CCD (Continuous Casting)", "HSM (Hot Strip Mill)", "CRM (Cold Rolling Mill)", "Coke Ovens", "Sinter Plant", "Power Plant", "Maintenance (Mech)", "Maintenance (Elec)", "Instrumentation", "Quality Control"].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Target Role</label>
            <select style={selectStyle} value={role} onChange={e => setRole(e.target.value)}>
              {["Operator", "Senior Operator", "Technician", "Senior Technician", "Shift In-charge", "Supervisor", "Foreman", "Assistant Manager"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={btnPrimary} onClick={runAnalysis} disabled={loading}>
            {loading ? <Spinner /> : <><Icon d={Icons.search} size={16} color="#000" /> Run AI Analysis</>}
          </button>
          <button style={btnSecondary} onClick={addEmployee}>
            <Icon d={Icons.plus} size={16} /> Add Employee
          </button>
        </div>
      </div>
      {employees.length > 0 && (
        <div style={{ ...cardStyle }}>
          <h3 style={{ color: theme.textPrimary, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Employee Registry ({employees.length})</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{["Name", "Role", "Department", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: theme.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${theme.border}` }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {employees.slice(0, 10).map((emp, i) => (
                  <tr key={emp.id || i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: "10px 12px", color: theme.textPrimary, fontSize: 13, fontWeight: 600 }}>{emp.name}</td>
                    <td style={{ padding: "10px 12px" }}><Badge text={emp.role} color={theme.info} /></td>
                    <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{emp.dept}</td>
                    <td style={{ padding: "10px 12px" }}><Badge text="Active" color={theme.success} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {result && (
        <div style={{ ...cardStyle, borderColor: theme.accent + "44" }}>
          <h3 style={{ color: theme.accent, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>🤖 SITE Analysis Report</h3>
          <pre style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{result}</pre>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════
// MODULE 3: TRAINING PLANNER
// ══════════════════════════════════════════════════
const TrainingPlannerModule = ({ data, setData }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [form, setForm] = useState({ title: "", type: "Technical", dept: "BF (Blast Furnace)", date: "", duration: "1 day", participants: "", trainer: "", mode: "Classroom" });
  const trainings = data.trainings || [];

  const addTraining = () => {
    if (!form.title) return;
    const t = { ...form, id: Date.now(), status: "Planned", createdAt: new Date().toISOString() };
    const updated = { ...data, trainings: [...trainings, t] };
    setData(updated);
    saveData("site-data", updated);
    logToSheet("TrainingPlan", [t.createdAt, t.title, t.type, t.dept, t.date, t.status]);
    setForm({ title: "", type: "Technical", dept: "BF (Blast Furnace)", date: "", duration: "1 day", participants: "", trainer: "", mode: "Classroom" });
  };

  const generatePlan = async () => {
    setLoading(true);
    const sys = `You are SITE, the AI Training Engineer at a SAIL steel plant. Generate a comprehensive monthly training plan for the department. Include: 1) Week-by-week schedule, 2) Training topics with objectives, 3) Target audience for each, 4) Trainer suggestions (internal SME/external), 5) Resources needed, 6) KPIs to track. Consider: safety mandates, statutory requirements, operational needs, and multi-shift scheduling. Be specific to steel plant operations.`;
    const r = await callSITE(sys, `Department: ${form.dept}\nMonth: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}\nGenerate a detailed monthly training plan.`);
    setResult(r);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>Training Planner</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>Plan, schedule, and track all training programs</p>
      </div>
      <div style={{ ...cardStyle }}>
        <h3 style={{ color: theme.textPrimary, margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Schedule New Training</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Training Title</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., BF Tapping Safety Procedures" />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={selectStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {["Technical", "Safety", "SOP-Based", "Statutory", "Quality", "Behavioral", "OJT", "Induction", "Cross-functional"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <select style={selectStyle} value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })}>
              {["BF (Blast Furnace)", "SMS (Steel Melting Shop)", "CCD (Continuous Casting)", "HSM (Hot Strip Mill)", "CRM (Cold Rolling Mill)", "Coke Ovens", "Sinter Plant", "Power Plant", "Maintenance (Mech)", "Maintenance (Elec)"].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input style={inputStyle} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Duration</label>
            <select style={selectStyle} value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}>
              {["2 hours", "Half day", "1 day", "2 days", "3 days", "1 week"].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Training Mode</label>
            <select style={selectStyle} value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
              {["Classroom", "On-the-Job (OJT)", "Simulator", "Online/Digital", "Workshop", "Field Visit"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Trainer / Faculty</label>
            <input style={inputStyle} value={form.trainer} onChange={e => setForm({ ...form, trainer: e.target.value })} placeholder="Internal SME / External" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button style={btnPrimary} onClick={addTraining}><Icon d={Icons.plus} size={16} color="#000" /> Add to Plan</button>
          <button style={btnSecondary} onClick={generatePlan} disabled={loading}>
            {loading ? <Spinner /> : <><Icon d={Icons.bot} size={16} /> AI Generate Monthly Plan</>}
          </button>
        </div>
      </div>
      {trainings.length > 0 && (
        <div style={{ ...cardStyle }}>
          <h3 style={{ color: theme.textPrimary, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Training Schedule ({trainings.length})</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{["Training", "Type", "Date", "Duration", "Mode", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: theme.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${theme.border}` }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {trainings.map((t, i) => (
                  <tr key={t.id || i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: "10px 12px", color: theme.textPrimary, fontSize: 13, fontWeight: 600 }}>{t.title}</td>
                    <td style={{ padding: "10px 12px" }}><Badge text={t.type} color={t.type === "Safety" ? theme.danger : theme.info} /></td>
                    <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{t.date || "TBD"}</td>
                    <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{t.duration}</td>
                    <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{t.mode}</td>
                    <td style={{ padding: "10px 12px" }}><Badge text={t.status} color={t.status === "Completed" ? theme.success : theme.accent} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {result && (
        <div style={{ ...cardStyle, borderColor: theme.accent + "44" }}>
          <h3 style={{ color: theme.accent, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>🤖 AI-Generated Monthly Plan</h3>
          <pre style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{result}</pre>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════
// MODULE 4: INCIDENT → TRAINING CONVERTER
// ══════════════════════════════════════════════════
const IncidentModule = ({ data, setData }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [incident, setIncident] = useState({ description: "", type: "Safety Incident", dept: "BF (Blast Furnace)", severity: "Medium", date: "" });
  const incidents = data.incidents || [];

  const analyzeIncident = async () => {
    if (!incident.description) return;
    setLoading(true);
    const sys = `You are SITE, the AI Training Engineer at a SAIL steel plant. Analyze the given incident/deviation and convert it into actionable training inputs. Provide: 1) Root cause analysis (human factor), 2) Skill/knowledge gaps identified, 3) Specific training intervention recommended, 4) Target audience, 5) Training content outline, 6) Suggested delivery method (OJT/classroom/simulation), 7) Assessment criteria, 8) Preventive measures through capability building. Be specific to steel plant operations and safety requirements.`;
    const r = await callSITE(sys, `Incident Type: ${incident.type}\nDepartment: ${incident.dept}\nSeverity: ${incident.severity}\nDate: ${incident.date}\nDescription: ${incident.description}`);
    setResult(r);
    const newInc = { ...incident, id: Date.now(), analysis: r, status: "Analyzed", analyzedAt: new Date().toISOString() };
    const updated = { ...data, incidents: [...incidents, newInc], stats: { ...data.stats, incidentsAnalyzed: (data.stats?.incidentsAnalyzed || 0) + 1 } };
    setData(updated);
    saveData("site-data", updated);
    logToSheet("IncidentAnalysis", [newInc.analyzedAt, incident.type, incident.dept, incident.severity, "Analyzed & training recommended"]);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>Incident → Training Converter</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>Convert process deviations, incidents & breakdowns into focused training</p>
      </div>
      <div style={{ ...cardStyle }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={labelStyle}>Incident Type</label>
            <select style={selectStyle} value={incident.type} onChange={e => setIncident({ ...incident, type: e.target.value })}>
              {["Safety Incident", "Near Miss", "Process Deviation", "Equipment Breakdown", "Quality Defect", "Environmental Event", "SOP Violation"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Severity</label>
            <select style={selectStyle} value={incident.severity} onChange={e => setIncident({ ...incident, severity: e.target.value })}>
              {["Low", "Medium", "High", "Critical"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <select style={selectStyle} value={incident.dept} onChange={e => setIncident({ ...incident, dept: e.target.value })}>
              {["BF (Blast Furnace)", "SMS (Steel Melting Shop)", "CCD (Continuous Casting)", "HSM (Hot Strip Mill)", "CRM (Cold Rolling Mill)", "Coke Ovens", "Sinter Plant"].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date of Incident</label>
            <input style={inputStyle} type="date" value={incident.date} onChange={e => setIncident({ ...incident, date: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Incident Description</label>
            <textarea style={textareaStyle} value={incident.description} onChange={e => setIncident({ ...incident, description: e.target.value })} placeholder="Describe the incident, deviation, or breakdown in detail. Include what happened, where, who was involved, and what conditions led to it..." />
          </div>
        </div>
        <button style={{ ...btnPrimary, marginTop: 16 }} onClick={analyzeIncident} disabled={loading}>
          {loading ? <Spinner /> : <><Icon d={Icons.bot} size={16} color="#000" /> Analyze & Generate Training Plan</>}
        </button>
      </div>
      {result && (
        <div style={{ ...cardStyle, borderColor: theme.danger + "44" }}>
          <h3 style={{ color: theme.danger, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>🔍 Incident Analysis & Training Recommendation</h3>
          <pre style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{result}</pre>
        </div>
      )}
      {incidents.length > 0 && (
        <div style={{ ...cardStyle }}>
          <h3 style={{ color: theme.textPrimary, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Incident Log ({incidents.length})</h3>
          {incidents.slice(-5).reverse().map((inc, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: theme.textPrimary, fontSize: 13, fontWeight: 600 }}>{inc.type}</span>
                <span style={{ color: theme.textMuted, fontSize: 12, marginLeft: 12 }}>{inc.dept}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Badge text={inc.severity} color={inc.severity === "Critical" ? theme.danger : inc.severity === "High" ? theme.accent : theme.info} />
                <Badge text={inc.status} color={theme.success} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════
// MODULE 5: OJT & CERTIFICATION TRACKER
// ══════════════════════════════════════════════════
const OJTModule = ({ data, setData }) => {
  const [form, setForm] = useState({ employee: "", skill: "", mentor: "", startDate: "", targetDate: "", status: "In Progress" });
  const ojts = data.ojts || [];

  const addOJT = () => {
    if (!form.employee || !form.skill) return;
    const ojt = { ...form, id: Date.now(), createdAt: new Date().toISOString() };
    const updated = { ...data, ojts: [...ojts, ojt] };
    setData(updated);
    saveData("site-data", updated);
    logToSheet("OJTTracker", [ojt.createdAt, form.employee, form.skill, form.mentor, form.status]);
    setForm({ employee: "", skill: "", mentor: "", startDate: "", targetDate: "", status: "In Progress" });
  };

  const updateStatus = (id, status) => {
    const updated = { ...data, ojts: ojts.map(o => o.id === id ? { ...o, status } : o) };
    setData(updated);
    saveData("site-data", updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>OJT & Certification Tracker</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>On-the-Job Training, mentoring & certification management</p>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard label="Active OJTs" value={ojts.filter(o => o.status === "In Progress").length} color={theme.info} />
        <StatCard label="Completed" value={ojts.filter(o => o.status === "Certified").length} color={theme.success} />
        <StatCard label="Overdue" value={ojts.filter(o => o.status === "Overdue").length} color={theme.danger} />
      </div>
      <div style={{ ...cardStyle }}>
        <h3 style={{ color: theme.textPrimary, margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Add OJT / Certification Program</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><label style={labelStyle}>Employee Name</label><input style={inputStyle} value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })} placeholder="Employee name" /></div>
          <div><label style={labelStyle}>Skill / Certification</label><input style={inputStyle} value={form.skill} onChange={e => setForm({ ...form, skill: e.target.value })} placeholder="e.g., Crane Operation Level 2" /></div>
          <div><label style={labelStyle}>Mentor / Supervisor</label><input style={inputStyle} value={form.mentor} onChange={e => setForm({ ...form, mentor: e.target.value })} placeholder="Assigned mentor" /></div>
          <div><label style={labelStyle}>Status</label>
            <select style={selectStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {["In Progress", "Assessment Pending", "Certified", "Overdue", "Withdrawn"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Start Date</label><input style={inputStyle} type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
          <div><label style={labelStyle}>Target Completion</label><input style={inputStyle} type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} /></div>
        </div>
        <button style={{ ...btnPrimary, marginTop: 16 }} onClick={addOJT}><Icon d={Icons.plus} size={16} color="#000" /> Add OJT Record</button>
      </div>
      {ojts.length > 0 && (
        <div style={{ ...cardStyle }}>
          <h3 style={{ color: theme.textPrimary, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>OJT Records</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Employee", "Skill/Cert", "Mentor", "Target", "Status", "Action"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: theme.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", borderBottom: `1px solid ${theme.border}` }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {ojts.map((o, i) => (
                <tr key={o.id || i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: "10px 12px", color: theme.textPrimary, fontSize: 13, fontWeight: 600 }}>{o.employee}</td>
                  <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{o.skill}</td>
                  <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{o.mentor}</td>
                  <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{o.targetDate}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <Badge text={o.status} color={o.status === "Certified" ? theme.success : o.status === "Overdue" ? theme.danger : theme.accent} />
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <select style={{ ...selectStyle, padding: "4px 8px", fontSize: 11 }} value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                      {["In Progress", "Assessment Pending", "Certified", "Overdue", "Withdrawn"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════
// MODULE 6: CONTENT HUB (SOPs & Work Instructions)
// ══════════════════════════════════════════════════
const ContentHubModule = ({ data, setData }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [topic, setTopic] = useState("");
  const [dept, setDept] = useState("BF (Blast Furnace)");
  const sops = data.sops || [];

  const generateSOP = async () => {
    if (!topic) return;
    setLoading(true);
    const sys = `You are SITE, the AI Training Engineer at a SAIL steel plant. Generate a professional Standard Operating Procedure (SOP) or Work Instruction document. Include: 1) Document ID and version, 2) Purpose and scope, 3) Definitions and abbreviations, 4) Safety precautions and PPE requirements, 5) Step-by-step procedure with checkpoints, 6) Quality parameters, 7) Emergency procedures, 8) Reference documents. Make it specific to steel plant operations and compliant with IS standards.`;
    const r = await callSITE(sys, `Department: ${dept}\nTopic: ${topic}\n\nGenerate a comprehensive SOP/Work Instruction.`);
    setResult(r);
    const newSop = { id: Date.now(), title: topic, dept, status: "Draft", createdAt: new Date().toISOString(), content: r };
    const updated = { ...data, sops: [...sops, newSop] };
    setData(updated);
    saveData("site-data", updated);
    logToSheet("ContentHub", [newSop.createdAt, topic, dept, "SOP Generated"]);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>Content Hub — SOPs & Work Instructions</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>AI-generated and managed training content library</p>
      </div>
      <div style={{ ...cardStyle }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 250 }}>
            <label style={labelStyle}>SOP / Work Instruction Topic</label>
            <input style={inputStyle} value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Blast Furnace Tapping Procedure, Crane Pre-Operation Checklist" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Department</label>
            <select style={selectStyle} value={dept} onChange={e => setDept(e.target.value)}>
              {["BF (Blast Furnace)", "SMS (Steel Melting Shop)", "CCD (Continuous Casting)", "HSM (Hot Strip Mill)", "Coke Ovens", "Sinter Plant", "Maintenance (Mech)"].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <button style={{ ...btnPrimary, marginTop: 16 }} onClick={generateSOP} disabled={loading}>
          {loading ? <Spinner /> : <><Icon d={Icons.bot} size={16} color="#000" /> Generate SOP / Work Instruction</>}
        </button>
      </div>
      {sops.length > 0 && (
        <div style={{ ...cardStyle }}>
          <h3 style={{ color: theme.textPrimary, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Content Library ({sops.length})</h3>
          {sops.map((s, i) => (
            <div key={s.id || i} style={{ padding: "12px 0", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: theme.textPrimary, fontSize: 13, fontWeight: 600 }}>{s.title}</span>
                <span style={{ color: theme.textMuted, fontSize: 12, marginLeft: 12 }}>{s.dept}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: theme.textMuted, fontSize: 11 }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                <Badge text={s.status} color={s.status === "Published" ? theme.success : theme.accent} />
              </div>
            </div>
          ))}
        </div>
      )}
      {result && (
        <div style={{ ...cardStyle, borderColor: theme.info + "44" }}>
          <h3 style={{ color: theme.info, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>📄 Generated SOP</h3>
          <pre style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{result}</pre>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════
// MODULE 7: COMPLIANCE & STATUTORY TRAINING
// ══════════════════════════════════════════════════
const ComplianceModule = ({ data, setData }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const requirements = data.compliance || [];

  const addRequirement = () => {
    const title = prompt("Compliance requirement title:");
    if (!title) return;
    const freq = prompt("Frequency (Annual/Bi-annual/Quarterly/Monthly):");
    const r = { id: Date.now(), title, frequency: freq || "Annual", lastCompleted: "", nextDue: "", status: "Pending", dept: "All" };
    const updated = { ...data, compliance: [...requirements, r] };
    setData(updated);
    saveData("site-data", updated);
  };

  const auditCheck = async () => {
    setLoading(true);
    const sys = `You are SITE, the AI Training Engineer at a SAIL steel plant. Generate a comprehensive statutory and compliance training audit report. Include: 1) All mandatory training requirements under Indian Factories Act 1948, 2) SAIL-specific mandatory training policies, 3) Safety training requirements (PESO, OISD, BIS), 4) Environmental compliance training, 5) Current compliance status assessment, 6) Gap identification, 7) Remediation timeline, 8) Audit-ready documentation checklist. Be comprehensive and specific to Indian steel industry regulations.`;
    const r = await callSITE(sys, `Department: All\nAudit Date: ${new Date().toLocaleDateString()}\n\nGenerate a comprehensive compliance audit report.`);
    setResult(r);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>Compliance & Statutory Training</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>Ensure all mandated training from Company Policy, Statutory Requirements & Government Directives</p>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard label="Total Requirements" value={requirements.length} color={theme.info} />
        <StatCard label="Compliant" value={requirements.filter(r => r.status === "Compliant").length} color={theme.success} />
        <StatCard label="Overdue" value={requirements.filter(r => r.status === "Overdue").length} color={theme.danger} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button style={btnPrimary} onClick={auditCheck} disabled={loading}>
          {loading ? <Spinner /> : <><Icon d={Icons.shield} size={16} color="#000" /> Run AI Compliance Audit</>}
        </button>
        <button style={btnSecondary} onClick={addRequirement}><Icon d={Icons.plus} size={16} /> Add Requirement</button>
      </div>
      {requirements.length > 0 && (
        <div style={{ ...cardStyle }}>
          <h3 style={{ color: theme.textPrimary, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Compliance Requirements</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Requirement", "Frequency", "Status", "Next Due"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: theme.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", borderBottom: `1px solid ${theme.border}` }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {requirements.map((r, i) => (
                <tr key={r.id || i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: "10px 12px", color: theme.textPrimary, fontSize: 13, fontWeight: 600 }}>{r.title}</td>
                  <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{r.frequency}</td>
                  <td style={{ padding: "10px 12px" }}><Badge text={r.status} color={r.status === "Compliant" ? theme.success : r.status === "Overdue" ? theme.danger : theme.accent} /></td>
                  <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{r.nextDue || "Not set"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result && (
        <div style={{ ...cardStyle, borderColor: theme.purple + "44" }}>
          <h3 style={{ color: theme.purple, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>🛡️ Compliance Audit Report</h3>
          <pre style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{result}</pre>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════
// MODULE 8: EFFECTIVENESS TRACKER
// ══════════════════════════════════════════════════
const EffectivenessModule = ({ data, setData }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [form, setForm] = useState({ training: "", attendees: "", preScore: "", postScore: "", applicationObs: "", managerFeedback: "" });
  const evals = data.evaluations || [];

  const addEval = () => {
    if (!form.training) return;
    const ev = { ...form, id: Date.now(), createdAt: new Date().toISOString(), kirkpatrick: "" };
    const updated = { ...data, evaluations: [...evals, ev] };
    setData(updated);
    saveData("site-data", updated);
    logToSheet("Effectiveness", [ev.createdAt, form.training, form.preScore, form.postScore, form.applicationObs]);
    setForm({ training: "", attendees: "", preScore: "", postScore: "", applicationObs: "", managerFeedback: "" });
  };

  const analyzeEffectiveness = async () => {
    setLoading(true);
    const sys = `You are SITE, the AI Training Engineer. Analyze training effectiveness using the Kirkpatrick 4-level model. Provide: Level 1 (Reaction), Level 2 (Learning - pre/post scores), Level 3 (Behavior - on-job application), Level 4 (Results - performance impact). Include recommendations for improvement. Be specific about metrics and actionable next steps for a steel plant context.`;
    const evalData = evals.map(e => `Training: ${e.training}, Pre: ${e.preScore}, Post: ${e.postScore}, Application: ${e.applicationObs}`).join("\n");
    const r = await callSITE(sys, `Evaluate these training programs:\n${evalData || "No evaluations yet. Provide a framework for steel plant training effectiveness measurement."}`);
    setResult(r);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>Training Effectiveness</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>Beyond attendance — track application, performance impact & Kirkpatrick evaluation</p>
      </div>
      <div style={{ ...cardStyle }}>
        <h3 style={{ color: theme.textPrimary, margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Record Evaluation</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}><label style={labelStyle}>Training Program</label><input style={inputStyle} value={form.training} onChange={e => setForm({ ...form, training: e.target.value })} placeholder="Training name" /></div>
          <div><label style={labelStyle}>No. of Attendees</label><input style={inputStyle} type="number" value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} /></div>
          <div><label style={labelStyle}>Pre-Training Score (%)</label><input style={inputStyle} type="number" value={form.preScore} onChange={e => setForm({ ...form, preScore: e.target.value })} /></div>
          <div><label style={labelStyle}>Post-Training Score (%)</label><input style={inputStyle} type="number" value={form.postScore} onChange={e => setForm({ ...form, postScore: e.target.value })} /></div>
          <div><label style={labelStyle}>On-Job Application Observations</label><input style={inputStyle} value={form.applicationObs} onChange={e => setForm({ ...form, applicationObs: e.target.value })} placeholder="Observed changes in behavior" /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={labelStyle}>Manager/Supervisor Feedback</label><textarea style={{ ...textareaStyle, minHeight: 60 }} value={form.managerFeedback} onChange={e => setForm({ ...form, managerFeedback: e.target.value })} placeholder="Feedback from line manager on performance impact" /></div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button style={btnPrimary} onClick={addEval}><Icon d={Icons.plus} size={16} color="#000" /> Record Evaluation</button>
          <button style={btnSecondary} onClick={analyzeEffectiveness} disabled={loading}>
            {loading ? <Spinner /> : <><Icon d={Icons.bot} size={16} /> AI Effectiveness Analysis</>}
          </button>
        </div>
      </div>
      {evals.length > 0 && (
        <div style={{ ...cardStyle }}>
          <h3 style={{ color: theme.textPrimary, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Evaluation Records</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Training", "Attendees", "Pre-Score", "Post-Score", "Improvement"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: theme.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", borderBottom: `1px solid ${theme.border}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {evals.map((e, i) => {
                const imp = e.postScore && e.preScore ? (e.postScore - e.preScore) : "—";
                return (
                  <tr key={e.id || i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: "10px 12px", color: theme.textPrimary, fontSize: 13, fontWeight: 600 }}>{e.training}</td>
                    <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{e.attendees}</td>
                    <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{e.preScore}%</td>
                    <td style={{ padding: "10px 12px", color: theme.textSecondary, fontSize: 13 }}>{e.postScore}%</td>
                    <td style={{ padding: "10px 12px" }}><Badge text={imp !== "—" ? `+${imp}%` : "—"} color={imp > 0 ? theme.success : theme.textMuted} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {result && (
        <div style={{ ...cardStyle, borderColor: theme.success + "44" }}>
          <h3 style={{ color: theme.success, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>📈 Effectiveness Analysis</h3>
          <pre style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{result}</pre>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════
// MODULE 9: REPORTS & ANALYTICS
// ══════════════════════════════════════════════════
const ReportsModule = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [reportType, setReportType] = useState("Monthly Training Summary");

  const generateReport = async () => {
    setLoading(true);
    const dataSum = `Employees: ${(data.employees || []).length}, Trainings: ${(data.trainings || []).length}, Incidents Analyzed: ${(data.incidents || []).length}, OJTs: ${(data.ojts || []).length}, SOPs: ${(data.sops || []).length}, Evaluations: ${(data.evaluations || []).length}`;
    const sys = `You are SITE, the AI Training Engineer at a SAIL steel plant. Generate a professional ${reportType} report. Include all relevant metrics, analysis, trends, and recommendations. The report should be suitable for presentation to the HoD and senior management. Format professionally with sections, data tables, and action items. Include: Executive Summary, Key Metrics, Detailed Analysis, Achievements, Gaps & Challenges, Recommendations, Next Period Targets.`;
    const r = await callSITE(sys, `Report Type: ${reportType}\nData Summary: ${dataSum}\nPeriod: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}\n\nGenerate the report.`);
    setResult(r);
    logToSheet("Reports", [new Date().toISOString(), reportType, "Generated"]);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>Reports & Analytics</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>AI-generated reports for management review and audit</p>
      </div>
      <div style={{ ...cardStyle }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <label style={labelStyle}>Report Type</label>
            <select style={selectStyle} value={reportType} onChange={e => setReportType(e.target.value)}>
              {["Monthly Training Summary", "Quarterly Skill Gap Report", "Annual Training Calendar", "Compliance Audit Report", "Training Effectiveness Analysis", "Incident-to-Training Conversion Report", "OJT & Certification Status", "Department Capability Assessment", "Budget Utilization Report", "Knowledge Retention Assessment"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button style={btnPrimary} onClick={generateReport} disabled={loading}>
            {loading ? <Spinner /> : <><Icon d={Icons.report} size={16} color="#000" /> Generate Report</>}
          </button>
        </div>
      </div>
      <div style={{ ...cardStyle }}>
        <h3 style={{ color: theme.textPrimary, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>Data Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Employees Registered", value: (data.employees || []).length },
            { label: "Trainings Planned", value: (data.trainings || []).length },
            { label: "Incidents Analyzed", value: (data.incidents || []).length },
            { label: "Active OJTs", value: (data.ojts || []).length },
            { label: "SOPs Created", value: (data.sops || []).length },
            { label: "Evaluations Done", value: (data.evaluations || []).length },
          ].map((s, i) => (
            <div key={i} style={{ background: theme.bgInput, borderRadius: 8, padding: 14, textAlign: "center" }}>
              <div style={{ color: theme.textPrimary, fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      {result && (
        <div style={{ ...cardStyle, borderColor: theme.accent + "44" }}>
          <h3 style={{ color: theme.accent, margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>📋 {reportType}</h3>
          <pre style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{result}</pre>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════
// MODULE 10: SITE AI ASSISTANT (Chat)
// ══════════════════════════════════════════════════
const AIAssistantModule = ({ data }) => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Namaste! I'm **SITE** — SAIL's Intelligent Training Engineer. I can help you with:\n\n• Skill gap analysis & skill matrix design\n• Training planning & scheduling\n• Converting incidents to training inputs\n• SOP & work instruction creation\n• Compliance & statutory requirements\n• Training effectiveness evaluation\n• Any training-related query for your steel plant\n\nHow can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const sys = `You are SITE (SAIL's Intelligent Training Engineer), an advanced AI agent deployed at a SAIL steel plant to perform ALL functions of a Departmental Training Engineer. You have deep expertise in:
- Steel plant operations, processes, and equipment across all departments (BF, SMS, CCD, HSM, CRM, Coke Ovens, Sinter Plant, etc.)
- Skill gap analysis using role-wise skill matrices
- Training planning, scheduling, and execution for operators, technicians, and supervisors
- Converting incidents, deviations, and breakdowns into training inputs
- OJT facilitation, mentoring, and certification programs
- SOP and work instruction creation and maintenance
- Statutory compliance (Indian Factories Act, PESO, OISD, BIS standards)
- Training effectiveness measurement (Kirkpatrick model)
- Adult learning principles and competency-based training
- L&D coordination with Corporate/Unit L&D
- Indian steel industry regulations and SAIL-specific policies

Current department data: Employees: ${(data.employees||[]).length}, Trainings: ${(data.trainings||[]).length}, OJTs: ${(data.ojts||[]).length}

Respond helpfully, professionally, and with specific actionable advice. Use steel plant terminology. Be the best training engineer SAIL has ever had.`;

    const r = await callSITE(sys, userMsg);
    setMessages(prev => [...prev, { role: "assistant", content: r }]);
    logToSheet("AIChat", [new Date().toISOString(), userMsg.slice(0, 100), "Response generated"]);
    setLoading(false);
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "calc(100vh - 160px)" }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>SITE AI Assistant</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>Your intelligent training engineer — ask anything about training operations</p>
      </div>
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "4px 0" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "80%", padding: "12px 16px", borderRadius: 12,
              background: m.role === "user" ? theme.accent + "22" : theme.bgCard,
              border: `1px solid ${m.role === "user" ? theme.accent + "44" : theme.border}`,
              color: theme.textPrimary, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap",
            }}>
              {m.role === "assistant" && <div style={{ color: theme.accent, fontSize: 11, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>SITE</div>}
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ padding: "8px 0" }}><Spinner /></div>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask SITE anything about training operations..."
        />
        <button style={{ ...btnPrimary, padding: "10px 16px" }} onClick={sendMessage} disabled={loading}>
          <Icon d={Icons.send} size={18} color="#000" />
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════
// MODULE 11: SETTINGS & GOOGLE SHEETS SETUP
// ══════════════════════════════════════════════════
const SettingsModule = ({ data, setData }) => {
  const [url, setUrl] = useState(GOOGLE_SCRIPT_URL);
  const [dept, setDept] = useState(data.settings?.department || "");
  const [plant, setPlant] = useState(data.settings?.plant || "");

  const saveSettings = () => {
    const updated = { ...data, settings: { ...data.settings, department: dept, plant, gsUrl: url } };
    setData(updated);
    saveData("site-data", updated);
  };

  const resetAll = async () => {
    if (confirm("⚠️ This will delete ALL SITE data. Are you sure?")) {
      const fresh = { stats: {}, employees: [], trainings: [], incidents: [], ojts: [], sops: [], compliance: [], evaluations: [], settings: {} };
      setData(fresh);
      await saveData("site-data", fresh);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `SITE_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ color: theme.textPrimary, margin: 0, fontSize: 22, fontWeight: 800 }}>Settings & Configuration</h2>
        <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: 13 }}>Configure SITE agent, Google Sheets integration, and department details</p>
      </div>
      <div style={{ ...cardStyle }}>
        <h3 style={{ color: theme.textPrimary, margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Department Configuration</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><label style={labelStyle}>Plant/Unit</label><input style={inputStyle} value={plant} onChange={e => setPlant(e.target.value)} placeholder="e.g., Bokaro Steel Plant" /></div>
          <div><label style={labelStyle}>Department</label><input style={inputStyle} value={dept} onChange={e => setDept(e.target.value)} placeholder="e.g., BF (Blast Furnace)" /></div>
        </div>
      </div>
      <div style={{ ...cardStyle }}>
        <h3 style={{ color: theme.textPrimary, margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Google Sheets Integration</h3>
        <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 12 }}>Enter your Google Apps Script Web App URL to enable automatic logging to Google Sheets. See the deployment guide for setup instructions.</p>
        <label style={labelStyle}>Apps Script Web App URL</label>
        <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/..." />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button style={btnPrimary} onClick={saveSettings}><Icon d={Icons.check} size={16} color="#000" /> Save Settings</button>
        <button style={btnSecondary} onClick={exportData}><Icon d={Icons.download} size={16} /> Export All Data</button>
        <button style={{ ...btnSecondary, borderColor: theme.danger, color: theme.danger }} onClick={resetAll}><Icon d={Icons.x} size={16} /> Reset All Data</button>
      </div>
    </div>
  );
};


// ══════════════════════════════════════════════════
// MAIN APP — SITE DASHBOARD
// ══════════════════════════════════════════════════
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { id: "skills", label: "Skill Gap Analysis", icon: Icons.skills },
  { id: "planner", label: "Training Planner", icon: Icons.calendar },
  { id: "incidents", label: "Incident → Training", icon: Icons.alert },
  { id: "ojt", label: "OJT & Certification", icon: Icons.award },
  { id: "content", label: "Content Hub", icon: Icons.book },
  { id: "compliance", label: "Compliance", icon: Icons.shield },
  { id: "effectiveness", label: "Effectiveness", icon: Icons.chart },
  { id: "reports", label: "Reports", icon: Icons.report },
  { id: "assistant", label: "SITE AI Chat", icon: Icons.bot },
  { id: "settings", label: "Settings", icon: Icons.settings },
];

const defaultData = {
  stats: { totalEmployees: 0, trainingsPlanned: 0, skillCoverage: 0, complianceRate: 0, certsDue: 0, incidentsAnalyzed: 0, effectivenessScore: 0, sopsUpdated: 0, sopAdherence: 0, knowledgeRetention: 0 },
  employees: [], trainings: [], incidents: [], ojts: [], sops: [], compliance: [], evaluations: [], settings: {},
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(defaultData);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData("site-data", defaultData).then(d => {
      setData(d);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) saveData("site-data", data);
  }, [data, loaded]);

  const updateStats = useCallback(() => {
    setData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalEmployees: (prev.employees || []).length,
        trainingsPlanned: (prev.trainings || []).length,
        incidentsAnalyzed: (prev.incidents || []).length,
        sopsUpdated: (prev.sops || []).length,
      }
    }));
  }, []);

  useEffect(() => { updateStats(); }, [data.employees?.length, data.trainings?.length, data.incidents?.length, data.sops?.length]);

  const renderModule = () => {
    switch (page) {
      case "dashboard": return <DashboardModule data={data} />;
      case "skills": return <SkillGapModule data={data} setData={setData} />;
      case "planner": return <TrainingPlannerModule data={data} setData={setData} />;
      case "incidents": return <IncidentModule data={data} setData={setData} />;
      case "ojt": return <OJTModule data={data} setData={setData} />;
      case "content": return <ContentHubModule data={data} setData={setData} />;
      case "compliance": return <ComplianceModule data={data} setData={setData} />;
      case "effectiveness": return <EffectivenessModule data={data} setData={setData} />;
      case "reports": return <ReportsModule data={data} />;
      case "assistant": return <AIAssistantModule data={data} />;
      case "settings": return <SettingsModule data={data} setData={setData} />;
      default: return <DashboardModule data={data} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: theme.bg, fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", color: theme.textPrimary, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 240 : 60, background: theme.bgCard, borderRight: `1px solid ${theme.border}`,
        display: "flex", flexDirection: "column", transition: "width 0.3s", flexShrink: 0, overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: sidebarOpen ? "20px 16px" : "20px 10px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setSidebarOpen(!sidebarOpen)}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDim})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#000", flexShrink: 0 }}>
            S
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: theme.textPrimary, letterSpacing: 1 }}>SITE</div>
              <div style={{ fontSize: 9, color: theme.textMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>AI Training Engineer</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {navItems.map(item => (
            <div
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: sidebarOpen ? "10px 16px" : "10px 18px",
                margin: "2px 8px", borderRadius: 8, cursor: "pointer",
                background: page === item.id ? theme.accentGlow : "transparent",
                borderLeft: page === item.id ? `3px solid ${theme.accent}` : "3px solid transparent",
                transition: "all 0.2s",
              }}
            >
              <Icon d={item.icon} size={18} color={page === item.id ? theme.accent : theme.textMuted} />
              {sidebarOpen && (
                <span style={{ fontSize: 13, fontWeight: page === item.id ? 700 : 500, color: page === item.id ? theme.accent : theme.textSecondary, whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        {sidebarOpen && (
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${theme.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.textMuted, letterSpacing: 1 }}>SAIL Digital Transformation</div>
            <div style={{ fontSize: 9, color: theme.textMuted, marginTop: 2 }}>Powered by Claude AI</div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {/* Top Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }}>
              SAIL's Intelligent Training Engineer
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, background: `linear-gradient(135deg, ${theme.accent}, #FBBF24)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {navItems.find(n => n.id === page)?.label || "Dashboard"}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme.success, animation: "pulse 2s infinite" }} />
            <span style={{ color: theme.success, fontSize: 12, fontWeight: 600 }}>SITE Active</span>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          </div>
        </div>

        {renderModule()}
      </div>
    </div>
  );
}
