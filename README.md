# Cifra - Finanzas Personales

**Cifra** es una aplicación web moderna orientada a móvil (Mobile-First) diseñada para tomar el control de tus finanzas personales de la manera más limpia y sencilla posible.

Desarrollada con **Next.js 14 (App Router)**, **React**, y **Supabase** (Autenticación y Base de Datos).

## ✨ Características Principales

- **Gestión de Movimientos:** Ingresos y gastos con categorías personalizadas y métodos de pago.
- **Presupuestos Mensuales:** Define límites por categoría y recibe alertas visuales cuando te acerques al límite.
- **Metas de Ahorro:** Crea objetivos (ej. "Viaje a Japón") y registra tus aportes a lo largo del tiempo.
- **Pagos Recurrentes:** Sistema automatizado inteligente que genera tus cargos fijos mensuales o semanales (Netflix, Gimnasio, Renta) al iniciar sesión, sin requerir servidores CRON costosos.
- **Analítica y Reportes:** Gráficas vectoriales SVG generadas matemáticamente en tiempo real, desgloses por categoría y generación de insights sintéticos sobre tus finanzas.
- **Exportación a PDF:** Diseño adaptativo (`@media print`) que permite exportar tus reportes mensuales con un diseño limpio.
- **Notificaciones In-App:** Alertas no intrusivas sobre límites excedidos o pagos próximos a vencer.
- **Seguridad Robusta:** Políticas de Row Level Security (RLS) que garantizan que tus datos sean 100% privados y no accesibles ni siquiera por otros usuarios registrados.

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14, React 19, CSS Vainilla (Diseño a medida, sin Tailwind).
- **Backend:** Supabase (Auth, Postgres, Server Actions).
- **Íconos:** Lucide React.
- **Despliegue Recomendado:** Vercel o Netlify.

## 🚀 Instalación y Ejecución Local

1. Clona el repositorio.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura tus variables de entorno en el archivo `.env.local` basado en `.env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_llave_anonima
   ```
4. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🗄️ Base de Datos (Supabase)

Para inicializar la base de datos, debes ejecutar los archivos ubicados en `supabase/migrations/` directamente en tu SQL Editor de Supabase:
1. `001_initial_schema.sql`: Crea las tablas, triggers actualizadores de fechas y habilita el RLS.
2. `002_recurring_rpc.sql`: Crea el procedimiento almacenado que evalúa y cobra los pagos recurrentes automáticamente de forma "Just-in-Time".

## 📄 Licencia

Uso Personal.
