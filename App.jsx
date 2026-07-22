import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutGrid, ListChecks, BarChart3, Activity as ActivityIcon,
  Plus, Trash2, Check, Flame, FolderKanban, Target, Mail, Code2,
  FileText, Award, CalendarClock, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
.font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
.font-body { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'JetBrains Mono', monospace; }
.glass { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.bg-glow { background: radial-gradient(circle at 15% 10%, rgba(123,97,255,0.18), transparent 40%), radial-gradient(circle at 90% 85%, rgba(91,61,245,0.15), transparent 45%), #050505; }
`;

const BG = "#050505";
const PURPLE = "#7B61FF";
const PURPLE_DEEP = "#5B3DF5";
const TEXT = "#FFFFFF";
const SUB = "#A5A5A5";
const SUCCESS = "#34D399";
const AMBER = "#FBBF54";
const RUST = "#FF6B6B";
const TEAL = "#5FD1C9";
const BORDER = "rgba(255,255,255,0.08)";

const AVATAR_IMG = "/avatar.webp";
const CATEGORIES = ["Coursework", "Project", "Placement Prep", "Personal"];
const PRIORITIES = ["low", "medium", "high"];
const PRIORITY_COLOR = { low: TEAL, medium: AMBER, high: RUST };
const WEEKLY_GOAL = 10;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtRelative(ts) {
  const diffMs = Date.now() - ts;
  const hrs = diffMs / 3600000;
  if (hrs < 1) return "Just now";
  if (hrs < 24) { const h = Math.floor(hrs); return `${h} hour${h === 1 ? "" : "s"} ago`; }
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return fmtDate(new Date(ts).toISOString().slice(0, 10));
}

const SEED_TASKS = [
  { id: uid(), title: "Finish OS assignment on process scheduling", category: "Coursework", priority: "high", status: "in-progress", dueDate: todayISO(), createdAt: Date.now() - 86400000 * 2, completedAt: null },
  { id: uid(), title: "Push dashboard repo to GitHub", category: "Project", priority: "medium", status: "todo", dueDate: todayISO(), createdAt: Date.now() - 86400000, completedAt: null },
  { id: uid(), title: "Solve 3 array problems", category: "Placement Prep", priority: "medium", status: "done", dueDate: todayISO(), createdAt: Date.now() - 86400000 * 3, completedAt: Date.now() - 86400000 },
  { id: uid(), title: "Build portfolio homepage", category: "Project", priority: "high", status: "in-progress", dueDate: todayISO(), createdAt: Date.now() - 86400000 * 4, completedAt: null },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function codingHoursSample() {
  const values = [1.5, 3, 2, 4.5, 1, 5, 2.5];
  return WEEKDAYS.map((day, i) => ({ day, value: values[i] }));
}
function mailSample() {
  const values = [6, 9, 4, 11, 7, 2, 3];
  return WEEKDAYS.map((day, i) => ({ day, value: values[i] }));
}

const STORAGE_KEY = "dashboard-data";

function loadInitial(setTasks, setLog, setLoading) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setTasks(parsed.tasks || []);
      setLog(parsed.log || []);
    } else {
      setTasks(SEED_TASKS);
      setLog([{ id: uid(), type: "info", message: "Dashboard created", timestamp: Date.now() - 86400000 * 3 }]);
    }
  } catch (e) {
    setTasks(SEED_TASKS);
    setLog([{ id: uid(), type: "info", message: "Dashboard created", timestamp: Date.now() - 86400000 * 3 }]);
  } finally {
    setLoading(false);
  }
}

function persist(tasks, log) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, log }));
  } catch (e) {
    console.error("Storage save failed", e);
  }
}

export default function App() {
  const [tab, setTab] = useState("overview");
  const [tasks, setTasks] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);

  useEffect(() => { loadInitial(setTasks, setLog, setLoading); }, []);
  useEffect(() => {
    if (firstLoad.current) { firstLoad.current = loading; return; }
    if (!loading) persist(tasks, log);
  }, [tasks, log, loading]);

  function addLog(message, type = "info") {
    setLog((l) => [{ id: uid(), type, message, timestamp: Date.now() }, ...l].slice(0, 200));
  }
  function addTask(t) {
    setTasks((ts) => [{ ...t, id: uid(), createdAt: Date.now(), completedAt: null }, ...ts]);
    addLog(`Added task "${t.title}"`, "create");
  }
  function toggleDone(id) {
    setTasks((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      const done = t.status !== "done";
      if (done) addLog(`Completed "${t.title}"`, "done");
      else addLog(`Reopened "${t.title}"`, "update");
      return { ...t, status: done ? "done" : "todo", completedAt: done ? Date.now() : null };
    }));
  }
  function setStatus(id, status) {
    setTasks((ts) => ts.map((t) => {
      if (t.id !== id) return t;
      if (status === t.status) return t;
      addLog(`Moved "${t.title}" to ${status.replace("-", " ")}`, "update");
      return { ...t, status, completedAt: status === "done" ? Date.now() : null };
    }));
  }
  function deleteTask(id) {
    setTasks((ts) => {
      const t = ts.find((x) => x.id === id);
      if (t) addLog(`Deleted "${t.title}"`, "delete");
      return ts.filter((x) => x.id !== id);
    });
  }

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const overdue = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < todayISO()).length;
    const doneToday = tasks.filter((t) => t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length;
    const completionRate = total ? Math.round((done / total) * 100) : 0;
    const activeProjects = tasks.filter((t) => t.category === "Project" && t.status !== "done").length;
    const weekAgo = Date.now() - 86400000 * 7;
    const weeklyCompletions = tasks.filter((t) => t.completedAt && t.completedAt >= weekAgo).length;

    const daysSet = new Set(log.map((e) => new Date(e.timestamp).toDateString()));
    let streak = 0;
    let d = new Date();
    while (daysSet.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }

    return { total, done, inProgress, overdue, doneToday, completionRate, activeProjects, weeklyCompletions, streak };
  }, [tasks, log]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-glow">
        <style>{FONT_STYLE}</style>
        <Loader2 className="animate-spin" size={28} color={PURPLE} />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body bg-glow" style={{ color: TEXT }}>
      <style>{FONT_STYLE}</style>
      <div className="flex flex-col md:flex-row">
        <Sidebar tab={tab} setTab={setTab} />
        <main className="flex-1 px-5 py-6 md:px-10 md:py-8 max-w-6xl">
          <Hero stats={stats} />
          {tab === "overview" && <Overview tasks={tasks} stats={stats} log={log} addTask={addTask} toggleDone={toggleDone} />}
          {tab === "tasks" && <Tasks tasks={tasks} addTask={addTask} toggleDone={toggleDone} setStatus={setStatus} deleteTask={deleteTask} />}
          {tab === "reports" && <Reports tasks={tasks} stats={stats} />}
          {tab === "activity" && <ActivityView log={log} />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab }) {
  const items = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "tasks", label: "Tasks", icon: ListChecks },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "activity", label: "Activity", icon: ActivityIcon },
  ];
  return (
    <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
      <div className="px-5 py-6">
        <div className="font-display text-xl font-semibold" style={{ color: TEXT }}>ledger</div>
        <div className="font-mono text-[11px] mt-0.5" style={{ color: SUB }}>personal ops dashboard</div>
      </div>
      <nav className="flex md:flex-col px-3 pb-4 md:pb-6 gap-1 overflow-x-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                background: active ? `linear-gradient(135deg, ${PURPLE_DEEP}, ${PURPLE})` : "transparent",
                color: active ? "#FFFFFF" : SUB,
              }}
            >
              <Icon size={16} />
              {it.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function QuickStat({ icon: Icon, label, value, sub }) {
  return (
    <div className="glass rounded-xl px-4 py-3.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(123,97,255,0.18)" }}>
        <Icon size={17} color={PURPLE} />
      </div>
      <div className="min-w-0">
        <div className="font-display text-lg font-semibold truncate" style={{ color: TEXT }}>{value}</div>
        <div className="font-mono text-[10px] uppercase tracking-wide truncate" style={{ color: SUB }}>{label}{sub ? ` · ${sub}` : ""}</div>
      </div>
    </div>
  );
}

function Hero({ stats }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const goalOnTrack = stats.weeklyCompletions >= WEEKLY_GOAL;

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-6 py-7 md:px-9 md:py-9 mb-8"
      style={{ background: `radial-gradient(circle at 85% 0%, rgba(255,255,255,0.12), transparent 55%), linear-gradient(135deg, ${PURPLE_DEEP} 0%, ${PURPLE} 100%)` }}
    >
      <img
        src={AVATAR_IMG}
        alt=""
        className="hidden md:block absolute right-4 lg:right-10 bottom-0 pointer-events-none select-none"
        style={{ height: "115%", maxHeight: 340, objectFit: "contain", filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.25))" }}
      />
      <div className="relative max-w-md lg:max-w-lg">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-white">
          {greet}, Priyanka 👋
        </h1>
        <p className="font-body text-sm md:text-base mt-1" style={{ color: "#EDE9FE" }}>Have a wonderful day!</p>
        <p className="font-body text-sm mt-3" style={{ color: "#DCD5FB" }}>
          Stay focused on your goals today. Track your progress, review recent activity, and keep building projects that move your career forward.
        </p>
      </div>

      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 max-w-2xl">
        <QuickStat icon={Flame} label="Current Streak" value={`${stats.streak} Day${stats.streak === 1 ? "" : "s"}`} />
        <QuickStat icon={FolderKanban} label="Active Projects" value={stats.activeProjects} />
        <QuickStat icon={Check} label="Tasks Completed" value={`${stats.completionRate}%`} />
        <QuickStat icon={Target} label="Weekly Goal" value={goalOnTrack ? "On Track" : `${WEEKLY_GOAL - stats.weeklyCompletions} to go`} />
      </div>
    </div>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl font-semibold" style={{ color: TEXT }}>{title}</h2>
      {description && <p className="font-body text-sm mt-1 max-w-2xl" style={{ color: SUB }}>{description}</p>}
    </div>
  );
}

function MiniBarCard({ title, data, color, unit, sample }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-body text-sm font-medium" style={{ color: TEXT }}>{title}</h4>
        {sample && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color: SUB, background: "rgba(255,255,255,0.06)" }}>sample</span>}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: SUB }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.06)" }}
            contentStyle={{ background: "#111114", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: TEXT }}
            itemStyle={{ color: TEXT }}
            formatter={(v) => [`${v}${unit || ""}`, ""]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Overview({ tasks, stats, log, addTask, toggleDone }) {
  const weeklyProductivity = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const count = tasks.filter((t) => t.completedAt && new Date(t.completedAt).toISOString().slice(0, 10) === iso).length;
      days.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), value: count });
    }
    return days;
  }, [tasks]);

  const tasksCompletedByCategory = useMemo(() =>
    CATEGORIES.map((c) => ({ label: c.split(" ")[0], value: tasks.filter((t) => t.category === c && t.status === "done").length }))
      .filter((c) => c.value > 0), [tasks]);

  const projectProgress = useMemo(() =>
    CATEGORIES.map((c) => {
      const inCat = tasks.filter((t) => t.category === c);
      const done = inCat.filter((t) => t.status === "done").length;
      return { label: c.split(" ")[0], value: inCat.length ? Math.round((done / inCat.length) * 100) : 0 };
    }).filter((_, i) => tasks.some((t) => t.category === CATEGORIES[i])), [tasks]);

  const codingHours = useMemo(() => codingHoursSample(), []);
  const mailActivities = useMemo(() => mailSample(), []);

  const upcoming = tasks.filter((t) => t.status !== "done").sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")).slice(0, 6);

  const reportCards = [
    { icon: FileText, title: "Monthly Report", stat: `${stats.done} tasks completed` },
    { icon: CalendarClock, title: "Weekly Summary", stat: `${stats.weeklyCompletions} this week` },
    { icon: FolderKanban, title: "Project Insights", stat: `${stats.activeProjects} active` },
    { icon: Target, title: "Goal Completion", stat: `${Math.min(100, Math.round((stats.weeklyCompletions / WEEKLY_GOAL) * 100))}%` },
    { icon: Award, title: "Productivity Score", stat: `${stats.completionRate}%` },
  ];

  const goals = [
    { label: "Portfolio Completion", value: 95 },
    { label: "JavaScript Learning", value: 78 },
    { label: "GitHub Contributions", value: 65 },
    { label: "Interview Preparation", value: 82 },
  ];

  return (
    <div className="space-y-10">
      <div>
        <SectionHeading
          title="Dashboard Overview"
          description="A personalized workspace that brings together your productivity, project progress, learning journey, and performance insights — all in one place."
        />
      </div>

      <div>
        <SectionHeading title="Performance Analytics" description="Visualize your weekly productivity with interactive bar charts that highlight completed tasks, coding hours, project updates, and learning consistency." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MiniBarCard title="Weekly Productivity" data={weeklyProductivity} color={PURPLE} />
          <MiniBarCard title="Coding Hours" data={codingHours} color={TEAL} unit="h" sample />
          <MiniBarCard title="Tasks Completed" data={tasksCompletedByCategory.length ? tasksCompletedByCategory : [{ label: "—", value: 0 }]} color={SUCCESS} />
          <MiniBarCard title="Project Progress" data={projectProgress.length ? projectProgress : [{ label: "—", value: 0 }]} color={AMBER} unit="%" />
          <MiniBarCard title="Mail Activities" data={mailActivities} color={RUST} sample />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <SectionHeading title="Recent Activity" description="Your latest project updates and completed milestones, in chronological order." />
          <div className="space-y-2">
            {log.slice(0, 5).map((e) => (
              <div key={e.id} className="glass rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Check size={13} color={SUCCESS} className="shrink-0" />
                  <span className="text-sm truncate" style={{ color: TEXT }}>{e.message}</span>
                </div>
                <span className="font-mono text-[11px] shrink-0 ml-3" style={{ color: SUB }}>{fmtRelative(e.timestamp)}</span>
              </div>
            ))}
            {log.length === 0 && <EmptyNote text="No activity yet." />}
          </div>
        </div>

        <div>
          <SectionHeading title="Upcoming Tasks" description="Deadlines, milestones, and daily priorities in one place." />
          <div className="space-y-2">
            {upcoming.length === 0 && <EmptyNote text="Nothing upcoming — nice and clear." />}
            {upcoming.map((t) => (
              <TaskRow key={t.id} task={t} toggleDone={toggleDone} compact />
            ))}
          </div>
        </div>
      </div>

      <div>
        <SectionHeading title="Reports & Insights" description="Generate detailed reports to understand your productivity trends, project performance, learning consistency, and overall growth over time." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {reportCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="glass rounded-xl p-4">
                <Icon size={18} color={PURPLE} />
                <div className="font-body text-sm font-medium mt-2.5" style={{ color: TEXT }}>{c.title}</div>
                <div className="font-mono text-xs mt-1" style={{ color: SUB }}>{c.stat}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionHeading title="Goals" description="Monitor your personal goals and milestones with real-time progress indicators that help you stay motivated and focused." />
        <div className="glass rounded-xl p-5 space-y-4">
          {goals.map((g) => (
            <div key={g.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium" style={{ color: TEXT }}>{g.label}</span>
                <span className="font-mono text-xs" style={{ color: SUB }}>{g.value}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-2 rounded-full" style={{ width: `${g.value}%`, background: `linear-gradient(90deg, ${PURPLE_DEEP}, ${PURPLE})` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionHeading title="Quick add" />
        <QuickAdd addTask={addTask} />
      </div>
    </div>
  );
}

function EmptyNote({ text }) {
  return <div className="text-sm rounded-lg p-4 font-body glass" style={{ color: SUB }}>{text}</div>;
}

function QuickAdd({ addTask }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState("medium");

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), category, priority, status: "todo", dueDate: todayISO() });
    setTitle("");
  }

  const selStyle = { background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: TEXT };

  return (
    <form onSubmit={submit} className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-body"
        style={selStyle}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-2 py-2 rounded-lg text-sm font-body" style={selStyle}>
        {CATEGORIES.map((c) => <option key={c} value={c} style={{ color: "#000" }}>{c}</option>)}
      </select>
      <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-2 py-2 rounded-lg text-sm font-body capitalize" style={selStyle}>
        {PRIORITIES.map((p) => <option key={p} value={p} style={{ color: "#000" }}>{p}</option>)}
      </select>
      <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5" style={{ background: `linear-gradient(135deg, ${PURPLE_DEEP}, ${PURPLE})`, color: "#fff" }}>
        <Plus size={15} /> Add
      </button>
    </form>
  );
}

function TaskRow({ task, toggleDone, setStatus, deleteTask, compact }) {
  const overdue = task.status !== "done" && task.dueDate && task.dueDate < todayISO();
  const selStyle = { background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: TEXT };
  return (
    <div className="glass flex items-center gap-3 rounded-lg px-3 py-2.5">
      <button
        onClick={() => toggleDone(task.id)}
        aria-label={task.status === "done" ? "Mark as not done" : "Mark as done"}
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ border: `1.5px solid ${task.status === "done" ? SUCCESS : SUB}`, background: task.status === "done" ? SUCCESS : "transparent" }}
      >
        {task.status === "done" && <Check size={12} color="#050505" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ textDecoration: task.status === "done" ? "line-through" : "none", color: task.status === "done" ? SUB : TEXT }}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px]" style={{ color: SUB }}>
          <span>{task.category}</span>
          <span>·</span>
          <span style={{ color: overdue ? RUST : SUB }}>{fmtDate(task.dueDate)}{overdue ? " (overdue)" : ""}</span>
        </div>
      </div>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[task.priority] }} title={`${task.priority} priority`} />
      {!compact && setStatus && (
        <select
          value={task.status}
          onChange={(e) => setStatus(task.id, e.target.value)}
          className="font-mono text-[11px] rounded-md px-1.5 py-1 shrink-0"
          style={selStyle}
        >
          <option value="todo" style={{ color: "#000" }}>todo</option>
          <option value="in-progress" style={{ color: "#000" }}>in-progress</option>
          <option value="done" style={{ color: "#000" }}>done</option>
        </select>
      )}
      {!compact && deleteTask && (
        <button onClick={() => deleteTask(task.id)} aria-label="Delete task" className="shrink-0" style={{ color: SUB }}>
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

function Tasks({ tasks, addTask, toggleDone, setStatus, deleteTask }) {
  const [filter, setFilter] = useState("all");
  const filtered = tasks.filter((t) => filter === "all" ? true : t.status === filter);
  const filters = [
    { id: "all", label: "All" },
    { id: "todo", label: "To do" },
    { id: "in-progress", label: "In progress" },
    { id: "done", label: "Done" },
  ];
  return (
    <div className="space-y-4">
      <QuickAdd addTask={addTask} />
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 rounded-full text-xs font-mono"
            style={{
              background: filter === f.id ? `linear-gradient(135deg, ${PURPLE_DEEP}, ${PURPLE})` : "rgba(255,255,255,0.05)",
              color: filter === f.id ? "#fff" : TEXT,
              border: `1px solid ${BORDER}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <EmptyNote text="No tasks in this view." />}
        {filtered.map((t) => (
          <TaskRow key={t.id} task={t} toggleDone={toggleDone} setStatus={setStatus} deleteTask={deleteTask} />
        ))}
      </div>
    </div>
  );
}

function Reports({ tasks, stats }) {
  const byCategory = useMemo(() => CATEGORIES.map((c) => ({ name: c, count: tasks.filter((t) => t.category === c).length })).filter((c) => c.count > 0), [tasks]);
  const byPriority = useMemo(() => PRIORITIES.map((p) => ({ name: p, value: tasks.filter((t) => t.priority === p).length, color: PRIORITY_COLOR[p] })).filter((p) => p.value > 0), [tasks]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <QuickStat icon={Award} label="Completion rate" value={`${stats.completionRate}%`} />
        <QuickStat icon={FolderKanban} label="Categories active" value={byCategory.length} />
        <QuickStat icon={Target} label="High priority open" value={tasks.filter((t) => t.priority === "high" && t.status !== "done").length} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-4">
          <h3 className="font-display text-base font-semibold mb-3" style={{ color: TEXT }}>Tasks by category</h3>
          {byCategory.length === 0 ? <EmptyNote text="No data yet." /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: SUB }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: SUB }} />
                <Tooltip contentStyle={{ background: "#111114", border: `1px solid ${BORDER}`, borderRadius: 8 }} labelStyle={{ color: TEXT }} itemStyle={{ color: TEXT }} />
                <Bar dataKey="count" fill={PURPLE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="font-display text-base font-semibold mb-3" style={{ color: TEXT }}>By priority</h3>
          {byPriority.length === 0 ? <EmptyNote text="No data yet." /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byPriority} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {byPriority.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111114", border: `1px solid ${BORDER}`, borderRadius: 8 }} labelStyle={{ color: TEXT }} itemStyle={{ color: TEXT }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityView({ log }) {
  const heatData = useMemo(() => {
    const map = {};
    log.forEach((e) => {
      const iso = new Date(e.timestamp).toISOString().slice(0, 10);
      map[iso] = (map[iso] || 0) + 1;
    });
    const cells = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      cells.push({ iso, count: map[iso] || 0 });
    }
    return cells;
  }, [log]);

  function cellColor(count) {
    if (count === 0) return "rgba(255,255,255,0.06)";
    if (count === 1) return "rgba(123,97,255,0.35)";
    if (count === 2) return "rgba(123,97,255,0.6)";
    if (count <= 4) return PURPLE;
    return "#fff";
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-4">
        <h3 className="font-display text-base font-semibold mb-1" style={{ color: TEXT }}>Activity log</h3>
        <p className="font-mono text-[11px] mb-4" style={{ color: SUB }}>last 12 weeks, one cell per day</p>
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2" style={{ width: "fit-content" }}>
          {heatData.map((c) => (
            <div key={c.iso} title={`${c.iso}: ${c.count} event(s)`} className="w-3.5 h-3.5 rounded-sm" style={{ background: cellColor(c.count) }} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold mb-3" style={{ color: TEXT }}>Log</h3>
        <div className="space-y-2">
          {log.length === 0 && <EmptyNote text="No activity yet." />}
          {log.map((e) => (
            <div key={e.id} className="glass flex items-center gap-3 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.type === "done" ? SUCCESS : e.type === "delete" ? RUST : e.type === "create" ? TEAL : e.type === "update" ? AMBER : SUB }} />
              <span className="text-sm flex-1 truncate" style={{ color: TEXT }}>{e.message}</span>
              <span className="font-mono text-[11px] shrink-0" style={{ color: SUB }}>{fmtRelative(e.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
