import { Resend } from "resend";

const FROM_EMAIL = "sistema@traumatologiabarrionuevo.com";
const ADMIN_EMAIL = "admin@traumatologiabarrionuevo.com";

interface CashClosingEmailData {
  branchName: string;
  closedBy: string;
  closedAt: Date;
  initialFund: number;
  totalIncome: number;
  totalExpenses: number;
  totalCashCount: number;
  verifiedTransfer: number;
  verifiedDebit: number;
  verifiedCredit: number;
  totalVerified: number;
  difference: number;
  status: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Guayaquil",
  }).format(date);
}

export async function sendCashClosingEmail(data: CashClosingEmailData): Promise<void> {
  const statusLabel = data.status === "CUADRADO" ? "CUADRADO ✓" : "CON DIFERENCIA ⚠";
  const statusColor = data.status === "CUADRADO" ? "#16a34a" : "#dc2626";
  const statusBg = data.status === "CUADRADO" ? "#dcfce7" : "#fee2e2";

  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:10px 16px;color:#727782;font-size:13px;border-bottom:1px solid #f3f4f3;">${label}</td><td style="padding:10px 16px;text-align:right;font-size:13px;font-weight:${bold ? "700" : "500"};border-bottom:1px solid #f3f4f3;">${value}</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f8;color:#191c1c;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#003772,#004e9c);padding:32px;text-align:center;color:#fff;">
    <h1 style="margin:0;font-size:20px;font-weight:700;">Informe Oficial de Cierre de Caja</h1>
    <p style="margin:6px 0 0;font-size:13px;opacity:0.8;">${data.branchName}</p>
  </div>

  <div style="padding:28px 32px;">
    <table style="width:100%;border-collapse:collapse;">
      ${row("Fecha", formatDateTime(data.closedAt))}
      ${row("Sucursal", data.branchName)}
      ${row("Empleado Responsable", data.closedBy)}
    </table>

    <h3 style="margin:20px 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#727782;">Resumen de Ingresos</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${row("Fondo Inicial", formatCurrency(data.initialFund))}
      ${row("Total Reportado en Sistema", formatCurrency(data.totalIncome))}
      ${row("Total Egresos de Caja", formatCurrency(data.totalExpenses))}
    </table>

    <h3 style="margin:20px 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#727782;">Verificación Física</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${row("Efectivo contado (billetes + monedas)", formatCurrency(data.totalCashCount))}
      ${row("Transferencias verificadas", formatCurrency(data.verifiedTransfer))}
      ${row("Tarjetas débito verificadas", formatCurrency(data.verifiedDebit))}
      ${row("Tarjetas crédito verificadas", formatCurrency(data.verifiedCredit))}
      ${row("Total Verificado Físico", formatCurrency(data.totalVerified), true)}
      ${row("Diferencia", formatCurrency(Math.abs(data.difference)), true)}
    </table>

    <div style="background:#f3f4f3;padding:16px;border-radius:6px;margin-top:20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;color:#424751;font-weight:600;">Estado Final</span>
      <span style="background:${statusBg};color:${statusColor};padding:4px 14px;border-radius:20px;font-weight:700;font-size:13px;">${statusLabel}</span>
    </div>

    <div style="margin-top:28px;padding:18px;background:#f9f9f8;border-left:3px solid #003772;font-size:11px;color:#424751;line-height:1.7;">
      Este documento constituye registro oficial del cierre de caja diario, emitido y validado por el sistema administrativo interno de VALRIMED S.A.S. La información aquí contenida tiene carácter confidencial, uso exclusivo interno y está sujeta a auditoría contable y verificación reglamentaria conforme a los procedimientos establecidos por la empresa.<br/><br/>
      El manejo de este reporte requiere estricta reserva y seguridad. Cualquier incumplimiento de estas disposiciones o manipulación no autorizada de su contenido será sancionado disciplinariamente, de acuerdo con el Reglamento Interno de Trabajo y las políticas de control financiero de VALRIMED S.A.S.<br/><br/>
      Documento generado automáticamente por el Sistema de Control Financiero Institucional.
    </div>
  </div>

  <div style="padding:16px 32px;background:#003772;color:rgba(255,255,255,0.7);font-size:11px;text-align:center;">
    VALRIMED S.A.S. — Departamento Contable y Auditoría Interna<br/>
    Centro de Traumatología y Fisioterapia Barrionuevo
  </div>
</div>
</body>
</html>`;

  if (!process.env.RESEND_API_KEY) {
    console.log("[EMAIL] RESEND_API_KEY no configurada — correo omitido en desarrollo");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `Informe Oficial de Cierre de Caja — ${data.branchName}`,
    html,
  });
}
