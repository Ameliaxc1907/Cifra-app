# Configuración de Supabase (Fase 4)

Este documento detalla los pasos para conectar tu proyecto local a tu instancia de Supabase de manera segura, utilizando Next.js App Router.

## 1. Variables de Entorno

En la raíz del proyecto, debes crear un archivo `.env.local` basado en el archivo `.env.example` proporcionado.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```
> [!WARNING]
> Nunca incluyas la clave `service_role` en el archivo `.env.local` si tiene el prefijo `NEXT_PUBLIC_`, ya que se filtraría al frontend comprometiendo la base de datos. Solo necesitas la URL y la `anon_key`.

## 2. Configurar la Base de Datos en Supabase

### Ejecutar Migraciones
Abre el **SQL Editor** en tu panel de Supabase y ejecuta los archivos en el siguiente orden:
1.  `supabase/migrations/001_initial_schema.sql` (Crea las tablas, RLS, Vistas, etc.)
2.  `supabase/migrations/002_auth_trigger.sql` (Crea la función y el trigger que genera automáticamente el perfil al registrar un usuario en Auth).

### Ejecutar los Datos Semilla (Seed)
En el mismo **SQL Editor**, ejecuta:
1.  `supabase/seed.sql` (Inserta las categorías predeterminadas del sistema que todos los usuarios podrán ver).

## 3. Autenticación (Auth) y Creación de Profiles

*   **Registro**: Cuando un usuario se registra en la página `/login`, sus datos se insertan en `auth.users` de Supabase.
*   **Trigger**: Inmediatamente después, PostgreSQL dispara el trigger `on_auth_user_created`, el cual ejecuta la función `handle_new_user()`.
*   **Perfil Automático**: Esta función toma el `id` (UUID) del usuario y crea automáticamente una fila en `public.profiles`. Esto evita que haya usuarios "huérfanos" sin perfil, y es una operación garantizada a nivel de base de datos.

## 4. Middleware y Rutas Protegidas

El proyecto utiliza un middleware en la raíz (`middleware.ts`) apoyado por `@supabase/ssr` (`lib/supabase/middleware.ts`).
*   **Redirecciones**: Si no hay sesión, el usuario es forzado a redirigirse a `/login`. Si ya tiene sesión, no puede acceder a `/login` y es enviado al Dashboard (`/`).
*   **Seguridad**: El acceso al Dashboard y sus componentes requiere que el usuario exista y tenga una sesión activa.

## 5. Correr el Proyecto

El comando estándar para iniciar tu entorno de desarrollo en este proyecto es:

```bash
pnpm dev
# Si usas npm, sería: npm run dev
```

## 6. Probar la Conexión (Prueba de Base de Datos)

Al ingresar a la aplicación autenticado, en la esquina inferior derecha verás un widget de prueba temporal ("Supabase Test (Fase 4)").
1.  **Profile**: Debería mostrar la estructura JSON de tu perfil (con tu `user_id` coincidiendo con Supabase Auth).
2.  **Categorías**: Debe listar las categorías predeterminadas ("Default") que insertaste con el `seed.sql`.
3.  **Crear Categoría**: Al hacer clic en "Crear Categoría Custom", se insertará una nueva categoría ligada a tu `user_id`. Esto prueba que el Row Level Security (RLS) permite la inserción de tus propios datos. Si recargas la página (o el Server Action hace *revalidate*), verás la nueva categoría en la lista marcada como "(Custom)".
