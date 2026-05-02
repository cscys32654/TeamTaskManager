import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { projectAPI, taskAPI, authAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { format, isPast, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const COLUMNS = ['Todo', 'In Progress', 'Done'];

const COL_STYLES = {
  'Todo':        { dot: '#64748B', badge: { background: 'rgba(100,116,139,0.2)', color: '#94A3B8' } },
  'In Progress': { dot: '#4F46E5', badge: { background: 'rgba(99,102,241,0.2)',  color: '#818CF8' } },
  'Done':        { dot: '#10B981', badge: { background: 'rgba(16,185,129,0.2)',  color: '#10B981' } },
};

const AVATAR_COLORS = [
  { bg: 'rgba(99,102,241,0.25)',  color: '#818CF8' },
  { bg: 'rgba(16,185,129,0.25)', color: '#10B981' },
  { bg: 'rgba(245,158,11,0.25)', color: '#F59E0B' },
  { bg: 'rgba(236,72,153,0.25)', color: '#EC4899' },
  { bg: 'rgba(6,182,212,0.25)',  color: '#06B6D4' },
];

// stable color per name
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

/* ── Modal ── */
const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 50, padding: '24px',
  }}>
    <div style={{
      background: '#1E293B', border: '1px solid rgba(148,163,184,0.12)',
      borderRadius: '18px', width: '100%', maxWidth: '480px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', borderBottom: '1px solid rgba(148,163,184,0.08)',
      }}>
        <h3 style={{ fontFamily: "'Syne','DM Sans',sans-serif", fontWeight: 700, fontSize: '16px', color: '#E2E8F0' }}>
          {title}
        </h3>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
          fontSize: '20px', lineHeight: 1, padding: '2px 6px', borderRadius: '6px',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#E2E8F0'}
          onMouseLeave={e => e.currentTarget.style.color = '#475569'}
        >×</button>
      </div>
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  </div>
);

/* ── Field helpers ── */
const fieldLabel = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const fieldInput = {
  width: '100%', background: '#0F172A', border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: '10px', padding: '10px 13px', color: '#E2E8F0',
  fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '13px',
  outline: 'none', boxSizing: 'border-box',
};

/* ── Task Card ── */
const TaskCard = ({ task, index, isAdmin, onEdit, onDelete, allUsers }) => {
  const overdue = task.dueDate && task.status !== 'Done' && isPast(parseISO(task.dueDate));
  const ac = avatarColor(task.assignedTo?.name || '');
  const isDone = task.status === 'Done';

  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={!isAdmin}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            background: snapshot.isDragging ? '#263148' : '#0F172A',
            border: snapshot.isDragging ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(148,163,184,0.1)',
            borderRadius: '12px', padding: '14px', marginBottom: '10px',
            cursor: isAdmin ? 'grab' : 'default',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
            opacity: isDone ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!snapshot.isDragging) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; }}
          onMouseLeave={e => { if (!snapshot.isDragging) e.currentTarget.style.borderColor = 'rgba(148,163,184,0.1)'; }}
        >
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
            <p style={{
              fontSize: '13px', fontWeight: 500, color: isDone ? '#475569' : '#E2E8F0',
              lineHeight: 1.45, textDecoration: isDone ? 'line-through' : 'none', flex: 1,
            }}>{task.title}</p>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                <button onClick={() => onEdit(task)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px',
                  borderRadius: '5px', color: '#334155', fontSize: '12px', transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#818CF8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#334155'}
                >✏️</button>
                <button onClick={() => onDelete(task._id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px',
                  borderRadius: '5px', color: '#334155', fontSize: '12px', transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#334155'}
                >🗑️</button>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p style={{ fontSize: '12px', color: '#475569', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {task.description}
            </p>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {task.assignedTo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '6px',
                  background: ac.bg, color: ac.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 700, fontFamily: "'Syne', sans-serif",
                }}>
                  {task.assignedTo.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: '11px', color: '#475569' }}>{task.assignedTo.name}</span>
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: '#334155' }}>Unassigned</span>
            )}
            {task.dueDate && (
              <span style={{ fontSize: '11px', fontWeight: 500, color: overdue ? '#EF4444' : '#475569' }}>
                {overdue ? '⚠ ' : ''}{format(parseISO(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

/* ── Board ── */
export default function Board() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [project, setProject]     = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [members, setMembers]     = useState([]);
  const [allUsers, setAllUsers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask]   = useState(null);
  const [form, setForm]           = useState({ title: '', description: '', assignedTo: '', dueDate: '', status: 'Todo' });
  const [saving, setSaving]       = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        projectAPI.getById(projectId),
        taskAPI.getByProject(projectId),
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
      setMembers(pRes.data.members || []);
      if (isAdmin) {
        const uRes = await authAPI.users();
        setAllUsers(uRes.data);
      }
    } catch { toast.error('Failed to load board'); }
    finally { setLoading(false); }
  }, [projectId, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', assignedTo: '', dueDate: '', status: 'Todo' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null };
      if (editTask) {
        const { data } = await taskAPI.update(projectId, editTask._id, payload);
        setTasks(t => t.map(x => x._id === data._id ? data : x));
        toast.success('Task updated');
      } else {
        const { data } = await taskAPI.create(projectId, payload);
        setTasks(t => [data, ...t]);
        toast.success('Task created');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally { setSaving(false); }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(projectId, taskId);
      setTasks(t => t.filter(x => x._id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const onDragEnd = async ({ draggableId, destination, source }) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    const newStatus = destination.droppableId;
    setTasks(t => t.map(x => x._id === draggableId ? { ...x, status: newStatus } : x));
    try {
      await taskAPI.updateStatus(projectId, draggableId, newStatus);
    } catch {
      toast.error('Failed to update status');
      fetchData();
    }
  };

  const filteredTasks   = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);
  const getColumnTasks  = (col) => filteredTasks.filter(t => t.status === col);

  /* ─ Loading skeleton ─ */
  if (loading) return (
    <div style={{ padding: '32px 28px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ height: '26px', background: '#1E293B', borderRadius: '8px', width: '200px', marginBottom: '8px' }} />
        <div style={{ height: '14px', background: '#1E293B', borderRadius: '6px', width: '140px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
        {COLUMNS.map(c => <div key={c} style={{ background: '#1E293B', borderRadius: '14px', height: '280px', border: '1px solid rgba(148,163,184,0.1)' }} />)}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 28px', minHeight: '100%', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: "'Syne','DM Sans',sans-serif", fontWeight: 700, fontSize: '22px', color: '#E2E8F0', marginBottom: '4px' }}>
            {project?.name}
          </h2>
          <p style={{ color: '#475569', fontSize: '13px' }}>
            {tasks.length} tasks · {members.length} members
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            border: 'none', borderRadius: '10px', color: 'white',
            fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            + Add Task
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['All', ...COLUMNS].map(f => {
          const active = filter === f;
          const count = f === 'All' ? tasks.length : tasks.filter(t => t.status === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px', border: 'none',
              background: active ? 'rgba(99,102,241,0.15)' : '#1E293B',
              color: active ? '#818CF8' : '#64748B',
              fontFamily: 'inherit', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              outline: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(148,163,184,0.1)',
            }}>
              {f}
              <span style={{
                background: active ? 'rgba(99,102,241,0.2)' : 'rgba(148,163,184,0.08)',
                color: active ? '#818CF8' : '#475569',
                fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '20px',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Kanban ── */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
          {COLUMNS.map(col => {
            const colStyle = COL_STYLES[col];
            const colTasks = getColumnTasks(col);
            return (
              <div key={col} style={{
                background: '#1E293B', border: '1px solid rgba(148,163,184,0.08)',
                borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column',
              }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colStyle.dot, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Syne','DM Sans',sans-serif", fontWeight: 600, fontSize: '13px', color: '#E2E8F0', flex: 1 }}>{col}</span>
                  <span style={{
                    ...colStyle.badge,
                    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                  }}>{colTasks.length}</span>
                </div>

                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: '80px', borderRadius: '10px', flex: 1,
                        background: snapshot.isDraggingOver ? 'rgba(99,102,241,0.05)' : 'transparent',
                        transition: 'background 0.2s',
                        padding: snapshot.isDraggingOver ? '4px' : '0',
                      }}
                    >
                      {colTasks.map((task, i) => (
                        <TaskCard
                          key={task._id} task={task} index={i}
                          isAdmin={isAdmin} onEdit={openEdit} onDelete={handleDelete}
                          allUsers={allUsers}
                        />
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#334155', padding: '20px 0' }}>
                          No tasks
                        </p>
                      )}
                    </div>
                  )}
                </Droppable>

                {isAdmin && (
                  <button onClick={openCreate} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px',
                    background: 'none', border: 'none', color: '#334155',
                    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    padding: '6px 2px', fontFamily: 'inherit', transition: 'color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#818CF8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#334155'}
                  >
                    + Add card
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* ── Task Modal ── */}
      {showModal && (
        <Modal title={editTask ? 'Edit Task' : 'New Task'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={fieldLabel}>Title *</label>
              <input required value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Task title"
                style={fieldInput}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(148,163,184,0.12)'}
              />
            </div>
            <div>
              <label style={fieldLabel}>Description</label>
              <textarea value={form.description} rows={3}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional details…"
                style={{ ...fieldInput, resize: 'none', lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(148,163,184,0.12)'}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={fieldLabel}>Assign to</label>
                <select value={form.assignedTo}
                  onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}
                  style={{ ...fieldInput, appearance: 'none' }}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Status</label>
                <select value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  style={{ ...fieldInput, appearance: 'none' }}
                >
                  {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={fieldLabel}>Due date</label>
              <input type="date" value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                style={{ ...fieldInput, colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(148,163,184,0.12)'}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                border: '1px solid rgba(148,163,184,0.12)', background: 'none',
                color: '#64748B', fontFamily: 'inherit', fontSize: '13px',
                fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.06)'; e.currentTarget.style.color = '#E2E8F0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748B'; }}
              >Cancel</button>
              <button type="submit" disabled={saving} style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                border: 'none', color: 'white',
                fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              }}>
                {saving ? 'Saving…' : editTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
