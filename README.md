# Arqueo Caja Barrionuevo

Sistema web de arqueo y cierre de caja para **VALRIMED S.A.S.** — Centro de Traumatología y Fisioterapia Barrionuevo.

---

## Stack Tecnológico

- **Next.js 16** — App Router + Server Actions + RSC
- **TypeScript** — Strict mode
- **Tailwind CSS** — Sistema de diseño "The Architectural Ledger"
- **Prisma 5** — ORM
- **PostgreSQL** — Base de datos
- **NextAuth v5** — Autenticación JWT con Credentials Provider
- **Recharts** — Gráficas interactivas
- **Resend** — Envío de correos
- **Anthropic SDK** — IA para justificaciones en conciliaciones

---

## Instalación y configuración

### 1. Requisitos previos

- Node.js ≥ 20.12.x
- PostgreSQL (local o en la nube: Neon, Supabase, Railway)

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
DATABASE_URL=postgresql://usuario:clave@host:5432/arqueo_caja
NEXTAUTH_SECRET=genera-un-string-aleatorio-de-32-caracteres
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
DOWNLOAD_KEY_SECRET=otro-string-seguro
```

### 3. Instalar dependencias

```bash
npm install --legacy-peer-deps
```

### 4. Inicializar base de datos

```bash
# Crear tablas (primera vez)
npx prisma db push

# Poblar con datos iniciales
npm run db:seed
```

Esto creará:
- **2 sucursales**: Sur (El Calzado) y Valle (Capelo)
- **Admin principal**: `hugomauricio79@gmail.com` / `Admin2024!`
- **Empleado de prueba**: `empleado@traumatologiabarrionuevo.com` / `Empleado123!`
- Todos los permisos base por rol

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — redirige automáticamente al login.

---

## Módulos disponibles

| Módulo | Ruta | Acceso |
|---|---|---|
| Login | `/login` | Público |
| Dashboard | `/dashboard` | Todos |
| Arqueo de Caja | `/arqueo` | Empleados + Admin |
| Historial de Cierres | `/cierres` | Admin + Contador |
| Conciliaciones | `/conciliaciones` | Admin + Contador |
| Auditoría | `/auditoria` | Admin + Contador |
| Perfiles y Permisos | `/perfiles` | Admin |
| Establecimientos | `/establecimientos` | Admin |

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run db:push      # Sincronizar schema sin migración
npm run db:migrate   # Crear migración y aplicar
npm run db:seed      # Poblar con datos iniciales
npm run db:studio    # Abrir Prisma Studio (GUI para BD)
npm run db:generate  # Re-generar Prisma Client
```

---

## Deploy en producción

### Opción A — Vercel + Neon (recomendado)

1. Crear proyecto en [Neon](https://neon.tech) y copiar `DATABASE_URL`
2. Hacer push a GitHub
3. Conectar repo en [Vercel](https://vercel.com) y configurar variables de entorno
4. Deploy automático

### Opción B — VPS propio

```bash
npm run build
npm run start
```

---

## Arquitectura

```
app/
├── (auth)/login/          ← Página de login (pública)
├── (dashboard)/           ← Layout con sidebar para admins/contadores
│   ├── dashboard/         ← KPIs + gráficas + cierres recientes
│   ├── cierres/           ← Historial con filtros, exportación
│   ├── conciliaciones/    ← Conciliación bancaria con conteo físico
│   ├── auditoria/         ← Registro inmutable de acciones
│   ├── perfiles/          ← CRUD usuarios y permisos
│   └── establecimientos/  ← CRUD sucursales
└── (empleado)/arqueo/     ← Flujo de cierre de caja (7 pasos)

components/
├── ui/          ← Button, Input, KPICard, StatusBadge
├── layout/      ← Sidebar, PageHeader
├── dashboard/   ← DashboardCharts
├── arqueo/      ← ArqueoWizard (stepper)
├── cierres/     ← CierresTable
├── conciliaciones/ ← ConciliacionForm
├── perfiles/    ← PerfilesManager
└── establecimientos/ ← EstablecimientosManager

lib/
├── auth.ts      ← NextAuth config
├── prisma.ts    ← Singleton Prisma client
├── audit.ts     ← Logger de auditoría inmutable
├── email.ts     ← Envío de correo tras cierre
├── permissions.ts ← Verificador de permisos por rol/usuario
└── utils.ts     ← Formatters (moneda, fecha, hora)

server/
├── actions/     ← Server Actions (cierres, perfiles, establecimientos, conciliaciones)
└── queries/     ← Funciones de lectura BD (dashboard, cierres)

prisma/
├── schema.prisma ← 12 modelos completos
└── seed.ts       ← Datos iniciales
```

---

## Roles y permisos

| Permiso | Admin | Empleado | Contador | Otro Admin |
|---|---|---|---|---|
| Ver dashboard | ✅ | ✅ | ✅ | ✅ |
| Crear arqueo | ✅ | ✅ | ❌ | ✅ |
| Ver historial | ✅ | propios | ✅ | ✅ |
| Exportar | ✅ | ❌ | ✅ | configurable |
| Conciliaciones | ✅ | ❌ | ✅ | ❌ |
| Auditoría | ✅ | ❌ | ✅ | ❌ |
| Perfiles | ✅ | ❌ | ❌ | ❌ |
| Establecimientos | ✅ | ❌ | ❌ | ❌ |

---

*VALRIMED S.A.S. — Sistema de Control Financiero Institucional*
