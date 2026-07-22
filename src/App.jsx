import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutGrid, ListChecks, BarChart3, Activity as ActivityIcon,
  Plus, Trash2, Check, Flame, FolderKanban, Target, Mail, Code2,
  FileText, Award, CalendarClock, Loader2, CalendarDays, Cloud,
  ChevronLeft, ChevronRight, X
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

const AVATAR_IMG = `${import.meta.env.BASE_URL}avatar.webp`;
const BANNER_IMG = `${import.meta.env.BASE_URL}banner.jpg`; // add your image as public/banner.jpg (or .png/.webp) — see instructions
const DEFAULT_LAT = 23.2599;
const DEFAULT_LON = 77.4126;
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

function loadInitial(setTasks, setLog, setEvents, setLoading) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setTasks(parsed.tasks || []);
      setLog(parsed.log || []);
      setEvents(parsed.events || []);
    } else {
      setTasks(SEED_TASKS);
      setLog([{ id: uid(), type: "info", message: "Dashboard created", timestamp: Date.now() - 86400000 * 3 }]);
      setEvents([]);
    }
  } catch (e) {
    setTasks(SEED_TASKS);
    setLog([{ id: uid(), type: "info", message: "Dashboard created", timestamp: Date.now() - 86400000 * 3 }]);
    setEvents([]);
  } finally {
    setLoading(false);
  }
}

function persist(tasks, log, events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, log, events }));
  } catch (e) {
    console.error("Storage save failed", e);
  }
}

export default function App() {
  const [tab, setTab] = useState("overview");
  const [tasks, setTasks] = useState([]);
  const [log, setLog] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const firstLoad = useRef(true);

  useEffect(() => { loadInitial(setTasks, setLog, setEvents, setLoading); }, []);
  useEffect(() => {
    if (firstLoad.current) { firstLoad.current = loading; return; }
    if (!loading) persist(tasks, log, events);
  }, [tasks, log, events, loading]);

  function addEvent(ev) {
    setEvents((es) => [...es, { ...ev, id: uid() }]);
    addLog(`Added event "${ev.title}" on ${fmtDate(ev.date)}`, "create");
  }
  function deleteEvent(id) {
    setEvents((es) => {
      const e = es.find((x) => x.id === id);
      if (e) addLog(`Removed event "${e.title}"`, "delete");
      return es.filter((x) => x.id !== id);
    });
  }

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
      <TopBanner />
      <div className="flex flex-col md:flex-row">
        <Sidebar tab={tab} setTab={setTab} />
        <main className="flex-1 px-5 py-6 md:px-10 md:py-8 max-w-6xl">
          <Hero stats={stats} />
          {tab === "overview" && <Overview tasks={tasks} stats={stats} log={log} addTask={addTask} toggleDone={toggleDone} />}
          {tab === "tasks" && <Tasks tasks={tasks} addTask={addTask} toggleDone={toggleDone} setStatus={setStatus} deleteTask={deleteTask} />}
          {tab === "calendar" && <CalendarView events={events} addEvent={addEvent} deleteEvent={deleteEvent} />}
          {tab === "reports" && <Reports tasks={tasks} stats={stats} />}
          {tab === "activity" && <ActivityView log={log} />}
        </main>
      </div>
    </div>
  );
}

function TopBanner() {
  const now = new Date();
  const clock = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <div
      className="w-full flex items-center justify-between px-5 md:px-9 py-3 relative overflow-hidden"
      style={{ borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)" }}
    >
      {/* BANNER_IMAGE_SLOT: replace this with <img src={BANNER_IMG} ... /> once you add your image (see instructions) */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PURPLE_DEEP}, ${PURPLE})` }}>
          <span className="font-display text-sm font-semibold text-white">L</span>
        </div>
        <span className="font-display text-base font-semibold" style={{ color: TEXT }}>ledger</span>
        <span className="font-mono text-[10px] hidden sm:inline" style={{ color: SUB }}>personal ops dashboard</span>
      </div>
      <span className="font-mono text-xs" style={{ color: SUB }}>{clock}</span>
    </div>
  );
}

function Sidebar({ tab, setTab }) {
  const items = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "tasks", label: "Tasks", icon: ListChecks },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
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

function useWeather() {
  const [temp, setTemp] = useState(null);
  useEffect(() => {
    let cancelled = false;
    function fetchFor(lat, lon) {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then((r) => r.json())
        .then((d) => { if (!cancelled && d && d.current_weather) setTemp(Math.round(d.current_weather.temperature)); })
        .catch(() => {});
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchFor(pos.coords.latitude, pos.coords.longitude),
        () => fetchFor(DEFAULT_LAT, DEFAULT_LON),
        { timeout: 4000 }
      );
    } else {
      fetchFor(DEFAULT_LAT, DEFAULT_LON);
    }
    return () => { cancelled = true; };
  }, []);
  return temp;
}

function WeatherDate() {
  const temp = useWeather();
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className="font-mono text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.14)", color: "#fff" }}>
        <CalendarClock size={13} /> {dateStr}
      </span>
      <span className="font-mono text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.14)", color: "#fff" }}>
        <Cloud size={13} /> {temp === null ? "…" : `${temp}°C`}
      </span>
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
        <WeatherDate />
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

function ProductivityRing({ stats }) {
  const rate = stats.completionRate;
  const ringData = [
    { name: "done", value: rate },
    { name: "remaining", value: 100 - rate },
  ];
  return (
    <div className="glass rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={ringData} dataKey="value" innerRadius={48} outerRadius={65} startAngle={90} endAngle={-270} stroke="none">
              <Cell fill={PURPLE} />
              <Cell fill="rgba(255,255,255,0.08)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold" style={{ color: TEXT }}>{rate}%</span>
          <span className="font-mono text-[10px]" style={{ color: SUB }}>score</span>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-display text-lg font-semibold" style={{ color: TEXT }}>Productivity score</h3>
        <p className="font-body text-sm mt-1" style={{ color: SUB }}>
          {stats.done} of {stats.total} tasks completed overall.
        </p>
        <div className="flex gap-4 mt-3 font-mono text-xs" style={{ color: SUB }}>
          <span><span style={{ color: PURPLE }}>●</span> completed</span>
          <span><span style={{ color: "rgba(255,255,255,0.3)" }}>●</span> remaining</span>
        </div>
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
      return { label: c.split(" ")[0], value: inCat.length ? Math.round((done / inCat.length)
