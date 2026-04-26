"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FilterType = "dia" | "semana" | "mes" | "año" | "rango";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const now = new Date();
const YEARS = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

interface Props {
  initialTipo: FilterType;
  initialFecha: string;
  initialSemana: string;
  initialMes: string;
  initialAño: string;
  initialDesde: string;
  initialHasta: string;
  label: string;
}

export function DashboardFilter({
  initialTipo, initialFecha, initialSemana, initialMes, initialAño, initialDesde, initialHasta, label,
}: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState<FilterType>(initialTipo);
  const [fecha, setFecha] = useState(initialFecha);
  const [semana, setSemana] = useState(initialSemana);
  const [mes, setMes] = useState(initialMes);
  const [año, setAño] = useState(initialAño);
  const [desde, setDesde] = useState(initialDesde);
  const [hasta, setHasta] = useState(initialHasta);

  const apply = () => {
    const params = new URLSearchParams();
    params.set("tipo", tipo);
    if (tipo === "dia")    params.set("fecha", fecha);
    if (tipo === "semana") params.set("semana", semana);
    if (tipo === "mes")    { params.set("mes", mes); params.set("año", año); }
    if (tipo === "año")    params.set("año", año);
    if (tipo === "rango")  { params.set("desde", desde); params.set("hasta", hasta); }
    router.push(`/dashboard?${params.toString()}`);
  };

  const inputCls = "px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border border-outline-variant/20";

  const tabs: { key: FilterType; label: string; icon: string }[] = [
    { key: "dia",    label: "Día",    icon: "today" },
    { key: "semana", label: "Semana", icon: "view_week" },
    { key: "mes",    label: "Mes",    icon: "calendar_month" },
    { key: "año",    label: "Año",    icon: "event_note" },
    { key: "rango",  label: "Rango",  icon: "date_range" },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-lg">filter_alt</span>
        <span className="text-xs font-bold uppercase tracking-widest text-outline">Filtrar período</span>
        <span className="ml-auto text-xs text-on-surface-variant italic">{label}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(({ key, label: tabLabel, icon }) => (
          <button
            key={key}
            onClick={() => setTipo(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              tipo === key
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{icon}</span>
            {tabLabel}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="flex items-center gap-3 flex-wrap">
        {tipo === "dia" && (
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputCls}
          />
        )}

        {tipo === "semana" && (
          <input
            type="week"
            value={semana}
            onChange={(e) => setSemana(e.target.value)}
            className={inputCls}
          />
        )}

        {tipo === "mes" && (
          <>
            <select value={mes} onChange={(e) => setMes(e.target.value)} className={inputCls}>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={String(i + 1)}>{m}</option>
              ))}
            </select>
            <select value={año} onChange={(e) => setAño(e.target.value)} className={inputCls}>
              {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </>
        )}

        {tipo === "año" && (
          <select value={año} onChange={(e) => setAño(e.target.value)} className={inputCls}>
            {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        )}

        {tipo === "rango" && (
          <>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={inputCls}
            />
            <span className="text-on-surface-variant text-sm font-medium">—</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className={inputCls}
            />
          </>
        )}

        <button
          onClick={apply}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">search</span>
          Aplicar
        </button>
      </div>
    </div>
  );
}
