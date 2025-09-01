"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@fullcalendar/daygrid/index.css";

// ====== Component: Filters ======
function Filters({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const Select = (p: any) => (
    <select className="border rounded-xl px-3 py-2" {...p} />
  );
  return (
    <div className="flex flex-wrap gap-3 my-3">
      <Select
        value={value.category}
        onChange={(e) => onChange({ ...value, category: e.target.value })}
      >
        <option value="all">كل الأنواع</option>
        <option value="exam">امتحانات</option>
        <option value="holiday">إجازات</option>
        <option value="study">أيام دراسية</option>
        <option value="event">فعاليات</option>
        <option value="registration">تسجيل</option>
      </Select>
      <Select
        value={value.audience}
        onChange={(e) => onChange({ ...value, audience: e.target.value })}
      >
        <option value="all">كل الفئات</option>
        <option value="students">طلاب</option>
        <option value="parents">أولياء أمور</option>
        <option value="teachers">معلمون</option>
      </Select>
      <Select
        value={value.term}
        onChange={(e) => onChange({ ...value, term: e.target.value })}
      >
        <option value="all">كل الفصول</option>
        <option value="T1">الفصل الأول</option>
        <option value="Break">إجازة</option>
        <option value="T2">الفصل الثاني</option>
        <option value="Exams">الامتحانات</option>
        <option value="Summer">الصيف</option>
      </Select>
    </div>
  );
}

// ====== Component: Countdown ======
function NextCountdown({ rows }: { rows: any[] }) {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const next = useMemo(() => {
    const list = rows.filter((r) => (r.published || "TRUE").toUpperCase() === "TRUE");
    const toDate = (r: any) =>
      new Date(
        r.start_time ? `${r.start_date}T${r.start_time}` : `${r.start_date}T00:00:00`
      );
    const future = list
      .map((r) => ({ r, d: toDate(r) }))
      .filter((x) => x.d.getTime() >= now.getTime());
    future.sort((a, b) => a.d.getTime() - b.d.getTime());
    return future[0] || null;
  }, [rows, now]);

  if (!next) return null;
  const diffMs = next.d.getTime() - now.getTime();
  const s = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(s / 86400),
    hours = Math.floor((s % 86400) / 3600),
    mins = Math.floor((s % 3600) / 60),
    secs = s % 60;

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm my-3">
      <div className="text-sm text-gray-600 mb-1">الفعالية الأقرب</div>
      <div className="text-lg font-bold">
        {next.r.icon_emoji ? `${next.r.icon_emoji} ` : ""}
        {next.r.title_ar}
      </div>
      <div className="text-gray-700 mt-1">
        تبقّى: {days} يوم، {hours} ساعة، {mins} دقيقة، {secs} ثانية
      </div>
    </div>
  );
}

// ====== Page ======
type RawEvent = {
  id: string;
  title_ar: string;
  description?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  all_day?: string;
  category?: string;
  audience?: string;
  term?: string;
  color_hex?: string;
  icon_emoji?: string;
  published?: string;
};

export default function Home() {
  const [rows, setRows] = useState<RawEvent[]>([]);
  const [filters, setFilters] = useState({
    category: "all",
    audience: "all",
    term: "all",
  });

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_SHEETDB_URL as string)
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? data : data.data || []))
      .then(setRows)
      .catch((e) => console.error(e));
  }, []);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => (r.published || "TRUE").toUpperCase() === "TRUE")
        .filter((r) => filters.category === "all" || r.category === filters.category)
        .filter(
          (r) =>
            filters.audience === "all" ||
            (r.audience || "").split("|").includes(filters.audience)
        )
        .filter((r) => filters.term === "all" || r.term === filters.term),
    [rows, filters]
  );

  const events = useMemo(
    () =>
      filtered.map((r) => ({
        id: r.id,
        title: `${r.icon_emoji ? r.icon_emoji + " " : ""}${r.title_ar}`,
        start: r.start_date,
        end: r.end_date || undefined,
        allDay: true,
        backgroundColor: r.color_hex || undefined,
        extendedProps: { description: r.description || "" },
      })),
    [filtered]
  );

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">📅 تقويم العام الدراسي 2025/2026</h1>
      <NextCountdown rows={rows} />
      <Filters value={filters} onChange={setFilters} />
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="ar"
        firstDay={6}
        height="auto"
        events={events}
      />
    </main>
  );
}
