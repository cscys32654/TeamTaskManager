import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const COLUMNS = [
  { id: "To Do", dot: "#64748B" },
  { id: "In Progress", dot: "#4F46E5" },
  { id: "In Review", dot: "#F59E0B" },
  { id: "Done", dot: "#10B981" },
];

const TAG_STYLES = {
  Backend:  { bg: "rgba(99,102,241,0.15)", color: "#818CF8" },
  Frontend: { bg: "rgba(236,72,153,0.15)", color: "#EC4899" },
  DevOps:   { bg: "rgba(6,182,212,0.15)",  color: "#06B6D4" },
  Database: { bg: "rgba(16,185,129,0.15)", color: "#10B981" },
  Docs:     { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
  Design:   { bg: "rgba(124,58,237,0.15)", color: "#A78BFA" },
};

const AVATAR_COLORS = [
  { bg: "rgba(99,102,241,0.3)", color: "#818CF8" },
  { bg: "rgba(16,185,129,0.3)", color: "#10B981" },
  { bg: "rgba(245,158,11,0.3)", color: "#F59E0B" },
  { bg: "rgba(236,72,153,0.3)", color: "#EC4899" },
];

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function isLate(dueDate, status) {
  if (!dueDate || status === "Done") return false;
  return new Date(dueDate) < new Date();
}

export default function Kanban() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", category: "Backend", priority: "Medium", dueDate: "", assignedTo: "" });
  const [dragging, setDragging] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const createTask = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newTask, status: "To Do" }),
      });
      const created = await res.json();
      setTasks((prev) => [...prev, created]);
      setShowModal(false);
      setNewTask({ title: "", category: "Backend", priority: "Medium", dueDate: "", assignedTo: "" });
    } catch (err) {
      console.error(err);
    }
  };

  /* --- Drag & Drop --- */
  const onDragStart = (e, task) => {
    setDragging(task);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (e, colId) => {
    e.preventDefault();
    if (dragging && dragging.status !== colId) updateTaskStatus(dragging._id, colId);
    setDragging(null);
  };

  /* --- Filter --- */
  const filteredTasks = (colId) =>
    tasks.filter((t) => {
      if (t.status !== colId) return false;
      if (filter === "My Tasks") return t.assignedTo === user._id;
      if (filter === "High Priority") return t.priority === "High";
      return true;
    });

  return (
    <div className="pf-app">
      <Navbar user={user} />
      <div className="pf-layout">
        <Sidebar active="kanban" />
        <main className="pf-main pf-kanban-main">
          <div className="pf-kanban-top">
            <div>
              <h1 className="pf-page-title">Kanban Board</h1>
              <p className="pf-page-sub">Sprint 3 · Drag cards between columns to update status</p>
            </div>
            <div className="pf-kanban-controls">
              {["All", "My Tasks", "High Priority"].map((f) => (
                <button key={f} className={`pf-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
              {user.role === "Admin" && (
                <button className="pf-btn-primary" onClick={() => setShowModal(true)}>+ Add Task</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="pf-loading">Loading board...</div>
          ) : (
            <div className="pf-kanban-board">
              {COLUMNS.map((col) => {
                const colTasks = filteredTasks(col.id);
                return (
                  <div
                    key={col.id}
                    className="pf-k-col"
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, col.id)}
                  >
                    <div className="pf-k-col-head">
                      <div className="pf-k-col-dot" style={{ background: col.dot }} />
                      <span className="pf-k-col-name">{col.id}</span>
                      <span className="pf-k-col-count">{colTasks.length}</span>
                    </div>

                    {colTasks.map((task, i) => {
                      const tagStyle = TAG_STYLES[task.category] || TAG_STYLES.Backend;
                      const isDone = task.status === "Done";
                      const late = isLate(task.dueDate, task.status);
                      const avColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                      const assigneeName = task.assignedTo?.name || task.assignedTo || "";

                      return (
                        <div
                          key={task._id}
                          className={`pf-k-card ${isDone ? "done" : ""}`}
                          draggable
                          onDragStart={(e) => onDragStart(e, task)}
                        >
                          <div className="pf-k-tag" style={{ background: tagStyle.bg, color: tagStyle.color }}>
                            {isDone ? "✓ Completed" : task.category || "General"}
                          </div>
                          <div className={`pf-k-title ${isDone ? "strikethrough" : ""}`}>{task.title}</div>
                          <div className="pf-k-foot">
                            <div className="pf-k-avatars">
                              {assigneeName && (
                                <div className="pf-k-av" style={{ background: avColor.bg, color: avColor.color }}>
                                  {initials(assigneeName)}
                                </div>
                              )}
                            </div>
                            {task.dueDate && (
                              <div className={`pf-k-due ${late ? "late" : ""}`}>
                                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                {late && " ⚠"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {user.role === "Admin" && (
                      <div className="pf-k-add" onClick={() => setShowModal(true)}>+ Add card</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Create Task Modal */}
          {showModal && (
            <div className="pf-modal-overlay" onClick={() => setShowModal(false)}>
              <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="pf-modal-title">Create New Task</h2>
                <div className="pf-field">
                  <label>Task Title</label>
                  <input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="What needs to be done?" />
                </div>
                <div className="pf-modal-row">
                  <div className="pf-field">
                    <label>Category</label>
                    <select value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}>
                      {Object.keys(TAG_STYLES).map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="pf-field">
                    <label>Priority</label>
                    <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                      <option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </div>
                </div>
                <div className="pf-field">
                  <label>Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
                </div>
                <div className="pf-modal-actions">
                  <button className="pf-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="pf-btn-primary" onClick={createTask}>Create Task</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
