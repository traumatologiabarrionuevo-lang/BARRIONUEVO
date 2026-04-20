"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos
const WARNING_MS = 30 * 1000;      // aviso 30 segundos antes

const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

export function InactivityGuard() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warnRef.current) clearTimeout(warnRef.current);
    if (countRef.current) clearInterval(countRef.current);
  };

  const resetTimer = () => {
    clearAll();
    setShowWarning(false);
    setCountdown(30);

    warnRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(30);
      countRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            if (countRef.current) clearInterval(countRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, TIMEOUT_MS - WARNING_MS);

    timerRef.current = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, TIMEOUT_MS);
  };

  useEffect(() => {
    resetTimer();
    EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      clearAll();
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-error text-3xl">timer</span>
        </div>
        <div className="text-center">
          <h2 className="text-body-lg font-bold text-on-surface mb-1">Sesión por vencer</h2>
          <p className="text-body-md text-on-surface-variant">
            Por inactividad, la sesión se cerrará en
          </p>
          <p className="text-4xl font-black text-error mt-2">{countdown}s</p>
        </div>
        <button
          onClick={resetTimer}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-body-md hover:bg-primary/90 transition-colors"
        >
          Continuar sesión
        </button>
      </div>
    </div>
  );
}
