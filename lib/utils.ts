type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | undefined | null>;

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flatMap((input) => {
      if (!input) return [];
      if (typeof input === "string") return [input];
      if (Array.isArray(input)) return [cn(...input)];
      if (typeof input === "object") {
        return Object.entries(input)
          .filter(([, v]) => Boolean(v))
          .map(([k]) => k);
      }
      return [];
    })
    .join(" ");
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Guayaquil",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Guayaquil",
  }).format(d);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Guayaquil",
  }).format(d);
}

export function parseDecimal(value: string | number): number {
  const str = String(value).replace(/[^0-9.-]/g, "");
  return parseFloat(str) || 0;
}
