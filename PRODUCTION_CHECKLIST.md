# Lista de Verificación para Producción (Cifra V1.0)

Esta guía detalla los pasos finales obligatorios para desplegar la aplicación "Cifra" en un entorno de producción (como Vercel, Netlify o un servidor VPS).

## 1. Supabase (Backend y Base de Datos)
- [ ] **Desactivar el entorno local (Opcional):** Si desarrollaste localmente, asegúrate de crear un proyecto en la nube de Supabase (app.supabase.com).
- [ ] **Ejecutar Migraciones:** En tu nuevo proyecto de Supabase (nube), ve a *SQL Editor* y ejecuta en orden:
  - `001_initial_schema.sql` (Esquema principal y RLS)
  - `002_recurring_rpc.sql` (Función automatizada de recurrencias)
- [ ] **Ajustes de Auth:** En *Authentication > Providers*, desactiva "Confirm Email" si no vas a usar un servidor SMTP comercial todavía (para que los usuarios entren directo al registrarse).
- [ ] **Site URL y Redirects:** En *Authentication > URL Configuration*, establece tu dominio de producción (ej: `https://cifra.app`) como Site URL.

## 2. Variables de Entorno (.env)
- [ ] En tu plataforma de despliegue (ej. Vercel), asegúrate de agregar las siguientes variables de entorno de producción (las obtienes de Supabase > Settings > API):
  - `NEXT_PUBLIC_SUPABASE_URL` = (Tu URL de proyecto, ej: https://xyz.supabase.co)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Tu llave pública anónima).

> ATENCIÓN: NUNCA pongas la llave `service_role` en el entorno de Vercel para este proyecto. El frontend utiliza estrictamente `anon_key` para forzar el cumplimiento de RLS.

## 3. Construcción (Build)
- [ ] Ejecutar `npm run build` o dejar que Vercel lo haga. Si falla el build por tipado TypeScript, revisa los logs y ajusta el código (actualmente el código está estabilizado y debería compilar sin errores en su rama Main).
- [ ] Asegurarse de que el comando de Vercel/Netlify sea `next build` (que es el predeterminado).

## 4. Pruebas Manuales (Humo / Smoke Tests) en Producción
Una vez desplegado y con la URL de producción viva, crea una cuenta de prueba y verifica:
- [ ] ¿Puedes iniciar sesión y cerrar sesión sin problemas?
- [ ] ¿Puedes crear un Gasto e Ingreso, y se reflejan en la gráfica circular y de barras al instante?
- [ ] ¿La creación de presupuestos se limita correctamente (no te deja crear dos iguales para el mismo mes)?
- [ ] Prueba exportar un PDF. ¿Se generan los gráficos vectoriales ocultando los menús correctamente?
- [ ] ¿La ruta raíz `/` te redirige al `/login` si no tienes sesión iniciada?

Si todo marca verde, **¡el proyecto está listo para lanzamiento público!**
