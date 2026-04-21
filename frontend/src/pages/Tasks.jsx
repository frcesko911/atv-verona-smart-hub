import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, X, Check, Trash2, Edit3, ChevronDown, ChevronUp, Calendar, Tag } from 'lucide-react';

const CATEGORIES = ['tutte', 'scuola', 'personale', 'viaggio', 'lavoro'];
const PRIORITIES = ['bassa', 'media', 'alta'];
const CATEGORY_LABELS = { tutte:'Tutte', scuola:'Scuola', personale:'Personale', viaggio:'Viaggio', lavoro:'Lavoro' };
const PRIORITY_LABELS = { bassa:'Bassa', media:'Media', alta:'Alta' };

function TaskForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    title: '', description: '', due_date: '', priority: 'media', category: 'personale'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try { await onSave(form); }
    catch (err) { setError(err.response?.data?.error || 'Errore nel salvataggio.'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="stack stack-md">
      <div className="form-group">
        <label className="form-label">Titolo *</label>
        <input className="form-input" placeholder="Descrivi la tua attività..." value={form.title}
          onChange={e => setForm(f => ({...f, title: e.target.value}))} required maxLength={100} />
      </div>
      <div className="form-group">
        <label className="form-label">Descrizione</label>
        <textarea className="form-textarea" placeholder="Dettagli opzionali..." value={form.description}
          onChange={e => setForm(f => ({...f, description: e.target.value}))} maxLength={500} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="form-group">
          <label className="form-label">Priorità</label>
          <select className="form-select" value={form.priority}
            onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select className="form-select" value={form.category}
            onChange={e => setForm(f => ({...f, category: e.target.value}))}>
            {CATEGORIES.filter(c => c !== 'tutte').map(c =>
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            )}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Scadenza</label>
        <input className="form-input" type="date" value={form.due_date ? form.due_date.split('T')[0] : ''}
          onChange={e => setForm(f => ({...f, due_date: e.target.value}))} min={new Date().toISOString().split('T')[0]} />
      </div>
      {error && <p className="form-error">⚠️ {error}</p>}
      <div className="row row-gap-sm" style={{ justifyContent:'flex-end' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Annulla</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
          {loading ? 'Salvo...' : initial ? 'Aggiorna' : 'Crea attività'}
        </button>
      </div>
    </form>
  );
}

function CompleteModal({ task, onDone, onCancel }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try { await onDone(notes); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">✅ Completa attività</div>
        <p style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:16 }}>
          <strong>"{task.title}"</strong>
        </p>
        <div className="form-group" style={{ marginBottom:20 }}>
          <label className="form-label">Note di completamento (opzionale)</label>
          <textarea className="form-textarea" placeholder="Come hai completato questa attività?"
            value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} />
        </div>
        <button className="btn btn-primary btn-full" onClick={submit} disabled={loading}>
          {loading ? 'Salvo...' : '✅ Segna come completata'}
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onComplete }) {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status === 'in_corso';

  return (
    <div className={`card card-sm animate-in`}
         style={{ borderLeft: `3px solid ${task.priority === 'alta' ? 'var(--error)' : task.priority === 'media' ? 'var(--warning)' : 'var(--success)'}`,
                  opacity: task.status === 'completato' ? 0.65 : 1 }}>
      <div className="row-between" style={{ alignItems:'flex-start', gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="row row-gap-sm" style={{ flexWrap:'wrap', marginBottom:6 }}>
            <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
            <span className={`badge badge-${task.category}`}>{CATEGORY_LABELS[task.category]}</span>
            {task.status === 'completato' && <span className="badge badge-attivo">✓ Completata</span>}
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:task.due_date?4:0 }}>
            {task.status === 'completato' && <span style={{ textDecoration:'line-through', opacity:0.6 }}>{task.title}</span>}
            {task.status !== 'completato' && task.title}
          </div>
          {task.due_date && (
            <div className="row row-gap-sm" style={{ marginTop:4 }}>
              <Calendar size={12} color={isOverdue ? 'var(--error)' : 'var(--text-muted)'} />
              <span style={{ fontSize:12, color: isOverdue ? 'var(--error)' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                {isOverdue ? 'Scaduta: ' : ''}
                {new Date(task.due_date).toLocaleDateString('it-IT', { day:'numeric', month:'short' })}
              </span>
            </div>
          )}
        </div>
        <div className="row row-gap-sm">
          {task.status === 'in_corso' && (
            <button onClick={() => onComplete(task)} title="Completa"
              style={{ width:32, height:32, borderRadius:'50%', background:'var(--success-bg)', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer' }}>
              <Check size={15} color="var(--success)" />
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>
            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border-light)' }}>
          {task.description && (
            <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:12, lineHeight:1.6 }}>{task.description}</p>
          )}
          {task.completion_notes && (
            <div style={{ background:'var(--success-bg)', borderRadius:'var(--radius-sm)', padding:'10px 12px', marginBottom:12 }}>
              <p style={{ fontSize:12, color:'#059669', fontWeight:600, marginBottom:4 }}>📝 Note di completamento</p>
              <p style={{ fontSize:13, color:'var(--text-secondary)' }}>{task.completion_notes}</p>
            </div>
          )}
          <div className="row row-gap-sm" style={{ justifyContent:'flex-end' }}>
            {task.status === 'in_corso' && (
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>
                <Edit3 size={13}/> Modifica
              </button>
            )}
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)}>
              <Trash2 size={13}/> Elimina
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tutte');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [completeTask, setCompleteTask] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data.tasks);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createTask(form) {
    await axios.post('/api/tasks', form);
    setShowForm(false);
    load();
  }

  async function updateTask(form) {
    await axios.put(`/api/tasks/${editTask.id}`, { ...editTask, ...form });
    setEditTask(null);
    load();
  }

  async function deleteTask(id) {
    if (!window.confirm('Eliminare questa attività?')) return;
    await axios.delete(`/api/tasks/${id}`);
    load();
  }

  async function completeTaskFn(notes) {
    await axios.put(`/api/tasks/${completeTask.id}`, {
      ...completeTask, status: 'completato', completion_notes: notes
    });
    setCompleteTask(null);
    load();
  }

  const pending   = tasks.filter(t => t.status === 'in_corso');
  const completed = tasks.filter(t => t.status === 'completato');
  const filtered  = (activeTab === 'tutte' ? pending : pending.filter(t => t.category === activeTab));

  return (
    <div className="page-pad stack stack-lg">
      {/* Category tabs */}
      <div className="tab-bar">
        {CATEGORIES.map(c => (
          <button key={c} className={`tab-item${activeTab===c?' active':''}`} onClick={() => setActiveTab(c)}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {[
          { label:'In corso', val: pending.length,              color:'var(--primary)' },
          { label:'Oggi',     val: pending.filter(t => t.due_date && t.due_date.split('T')[0] === new Date().toISOString().split('T')[0]).length, color:'var(--warning)' },
          { label:'Completate',val: completed.length,           color:'var(--success)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card card-sm" style={{ textAlign:'center' }}>
            <div style={{ fontSize:24, fontWeight:800, color }}>{val}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500, marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* New task form */}
      {showForm && (
        <div className="card">
          <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>➕ Nuova attività</div>
          <TaskForm onSave={createTask} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Edit task form */}
      {editTask && (
        <div className="card">
          <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>✏️ Modifica attività</div>
          <TaskForm initial={editTask} onSave={updateTask} onCancel={() => setEditTask(null)} />
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-title">Nessuna attività</div>
          <div className="empty-subtitle">
            {activeTab === 'tutte' ? 'Crea la tua prima attività!' : `Nessuna attività in "${CATEGORY_LABELS[activeTab]}".`}
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16}/> Aggiungi attività
          </button>
        </div>
      ) : (
        <div className="stack stack-sm">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task}
              onEdit={t => { setEditTask(t); setShowForm(false); }}
              onDelete={deleteTask}
              onComplete={t => setCompleteTask(t)} />
          ))}
        </div>
      )}

      {/* Completed section */}
      {completed.length > 0 && (
        <div>
          <button onClick={() => setShowCompleted(v => !v)}
            className="row row-gap-sm" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13, fontWeight:600 }}>
            {showCompleted ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            Completate ({completed.length})
          </button>
          {showCompleted && (
            <div className="stack stack-sm" style={{ marginTop:10 }}>
              {completed.map(task => (
                <TaskCard key={task.id} task={task} onEdit={() => {}} onDelete={deleteTask} onComplete={() => {}} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complete modal */}
      {completeTask && (
        <CompleteModal task={completeTask} onDone={completeTaskFn} onCancel={() => setCompleteTask(null)} />
      )}

      {/* FAB */}
      {!showForm && !editTask && (
        <button className="fab" onClick={() => { setShowForm(true); setEditTask(null); }} aria-label="Nuova attività">
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}
