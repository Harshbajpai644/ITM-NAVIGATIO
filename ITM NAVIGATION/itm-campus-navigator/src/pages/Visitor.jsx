import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BLOCKS, PURPOSES } from '../data/campusData.js'

const empty = { name: '', mobile: '', email: '', department: '', purpose: '', blockId: '', visitTime: '' }

export default function Visitor() {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Naam likho'
    if (!/^[0-9]{10}$/.test(form.mobile.trim())) e.mobile = '10 digit mobile number likho'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Email sahi format me nahi hai'
    if (!form.purpose) e.purpose = 'Kaam chuno'
    if (!form.blockId) e.blockId = 'Building chuno'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
  if (!validate()) return;

  try {
    const response = await fetch("http://localhost:5000/api/visitor-pass", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: form.name,
        mobile: form.mobile,
        email: form.email,
        department: form.department,
        purpose: form.purpose,
        destination: BLOCKS.find((b) => b.id === form.blockId)?.name || "",
        visit_time: form.visitTime || null,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert(" Visitor Pass Saved Successfully");
      setSubmitted(true);
    } else {
      alert(result.error);
    }
  } catch (err) {
    console.error(err);
    alert("Server se connect nahi ho paaya.");
  }
};

  if (submitted) {
    const block = BLOCKS.find((b) => b.id === form.blockId)
    return (
      <div className="page page-narrow">
        <div className="glass-card" style={{ padding: '28px 24px' }}>
          <p className="status-note go">✓ Visitor pass ready hai</p>
          <h1 className="page-title" style={{ fontSize: 22 }}>Namaste, {form.name.split(' ')[0]}</h1>
          <p className="page-sub" style={{ marginBottom: 16 }}>
            {form.purpose} ke liye <strong>{block?.name}</strong> ja rahe ho.
            {form.visitTime ? ` Visit time: ${form.visitTime}.` : ''}
          </p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => navigate(`/map?dest=${form.blockId}`)}>
              Navigate karo
            </button>
            <button className="btn btn-outline" onClick={() => { setForm(empty); setSubmitted(false); }}>
              Naya pass
            </button>
          </div>
          <p className="status-note">
            Note: Ye pass sirf isi session me dikh raha hai — koi record kahin store nahi hota.
            Agar admin ke paas visitor log chahiye, backend/Google Sheet integration alag se jodna hoga.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-narrow">
      <div className="eyebrow">Visitor Pass</div>
      <h1 className="page-title">Fill Your Details</h1>
      <p className="page-sub">Ye jaankari sirf aapko sahi rasta dikhane ke liye use hogi.</p>

      <div className="field">
        <label className="field-label">Naam</label>
        <input className="text-input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jaise: Rohit Kumar" />
        {errors.name && <p className="status-note error">{errors.name}</p>}
      </div>

      <div className="field">
        <label className="field-label">Mobile Number</label>
        <input className="text-input" value={form.mobile} onChange={(e) => update('mobile', e.target.value)} placeholder="10 digit number" />
        {errors.mobile && <p className="status-note error">{errors.mobile}</p>}
      </div>

      <div className="field">
        <label className="field-label">Email (optional)</label>
        <input className="text-input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
        {errors.email && <p className="status-note error">{errors.email}</p>}
      </div>

      <div className="field">
        <label className="field-label">Department (optional)</label>
        <input className="text-input" value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="Jaise: CSE, MBA" />
      </div>

      <div className="field">
        <label className="field-label">Purpose for your visit </label>
        <select className="select-input" value={form.purpose} onChange={(e) => update('purpose', e.target.value)}>
          <option value="">— choose —</option>
          {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {errors.purpose && <p className="status-note error">{errors.purpose}</p>}
      </div>

      <div className="field">
        <label className="field-label">where you want to go</label>
        <select className="select-input" value={form.blockId} onChange={(e) => update('blockId', e.target.value)}>
          <option value="">— choose —</option>
          {BLOCKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {errors.blockId && <p className="status-note error">{errors.blockId}</p>}
      </div>

      <div className="field">
        <label className="field-label">Visit Time (optional)</label>
        <input type="time" className="text-input" value={form.visitTime} onChange={(e) => update('visitTime', e.target.value)} />
      </div>

      <button className="btn btn-primary" onClick={handleSubmit}>Pass banao</button>
    </div>
  )
}
