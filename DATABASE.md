# Arquitectura de la Base de Datos (Fase 3)

Este documento describe la estructura de la base de datos PostgreSQL diseñada para la aplicación de finanzas personales, preparada para integrarse con Supabase en la siguiente fase.

## Diagrama de Relaciones

```text
auth.users (Supabase Auth)
│
└── profiles
    │
    ├── categories (Predeterminadas o Personalizadas)
    ├── payment_methods
    │
    ├── transactions
    │   ├── categories
    │   ├── payment_methods
    │   └── recurring_transactions
    │
    ├── budgets
    │   └── categories
    │
    ├── savings_goals
    │   └── savings_goal_contributions
    │
    └── recurring_transactions
        ├── categories
        └── payment_methods
```

## Resumen de Tablas

1.  **`profiles`**: Extiende la información de `auth.users` de Supabase. Almacena datos como el nombre completo y la moneda preferida. Cada registro aquí se relaciona 1:1 con un usuario de Supabase.
2.  **`categories`**: Almacena las categorías para ingresos y gastos. Existen categorías "predeterminadas" del sistema (`user_id` es `NULL` y `is_default` es `TRUE`), las cuales pueden ser leídas por todos los usuarios. Los usuarios también pueden crear las suyas propias (`user_id` apunta a su perfil). Restricciones impiden que haya categorías duplicadas (mismo nombre y tipo) para un mismo usuario.
3.  **`payment_methods`**: Almacena las formas de pago o cuentas bancarias configuradas por el usuario. Un usuario no puede tener métodos de pago duplicados con el mismo nombre.
4.  **`recurring_transactions`**: Almacena gastos o ingresos que se repiten con cierta frecuencia (semanal, mensual, anual). Sirve como base para automatizar o predecir futuras `transactions`.
5.  **`transactions`**: Tabla central que almacena el historial de todos los movimientos financieros (ingresos y gastos).
6.  **`budgets`**: Define el límite de gasto que un usuario establece para una categoría en un mes y año específicos.
7.  **`savings_goals`**: Representa una meta de ahorro que el usuario quiere alcanzar (ej. "Viaje", "Nueva laptop").
8.  **`savings_goal_contributions`**: Almacena el historial de aportes realizados a una meta de ahorro específica.

## Controles e Integridad de Datos

*   **Valores Monetarios Positivos**: Todas las tablas que almacenan dinero (`amount`, `amount_limit`, `target_amount`) tienen un constraint `CHECK` para garantizar que los valores sean mayores a 0, exceptuando `initial_amount` en metas de ahorro que puede ser mayor o igual a 0.
*   **Triggers de Actualización**: Las tablas con un campo `updated_at` tienen un *trigger* asociado a la función `update_updated_at_column()` que actualiza automáticamente la fecha y hora cada vez que un registro es modificado.
*   **Fechas de Recurrencia**: En las transacciones recurrentes, se valida mediante `CHECK` que la `next_execution_date` sea mayor o igual a `start_date`, y que la `end_date` (si existe) no sea anterior a la fecha de inicio.

## Datos Calculados vs Almacenados

Para mantener la base de datos normalizada, se evita guardar datos que pueden ser calculados de forma determinista:

*   **Progreso de Presupuestos (`used_amount` / `used_percentage`)**: No se almacena un campo `used` en `budgets`. Se calcula sumando el `amount` de las `transactions` correspondientes a la misma categoría, mes y año. Se creó la vista `view_monthly_budgets` para facilitar esta consulta.
*   **Progreso de Metas de Ahorro (`contributed_amount` / `progress_percentage`)**: No se almacena un campo `saved` en `savings_goals`. Se calcula sumando `initial_amount` más el `amount` de todos los `savings_goal_contributions` asociados. Se creó la vista `view_savings_goals_progress` para facilitar esta consulta.

Ambas vistas están configuradas con `WITH (security_invoker = true)`. Esto asegura que los cálculos respeten estrictamente las reglas RLS del usuario que realiza la consulta, previniendo fugas de datos.

## Integración con Supabase Auth

*   La tabla `profiles` tiene un `id` (UUID) que actúa como *Primary Key* y como *Foreign Key* apuntando a `auth.users(id)` (la tabla interna de Supabase Auth).
*   Cuando un usuario sea eliminado de `auth.users`, el comportamiento `ON DELETE CASCADE` se encargará de eliminar su registro en `profiles`, lo cual a su vez provocará la eliminación en cascada de sus `transactions`, `budgets`, `categories`, etc.

## Row Level Security (RLS)

RLS está habilitado en todas las tablas para garantizar que cada usuario vea e interactúe únicamente con su propia información.

*   Todas las tablas tienen políticas (`CREATE POLICY`) que evalúan `auth.uid() = user_id`.
*   Esto asegura que un usuario autenticado nunca pueda acceder, insertar, modificar o eliminar transacciones o saldos de otro usuario.
*   **Excepción para `categories`**: Existe una política especial que permite realizar un `SELECT` a todos los usuarios cuando el registro tiene `is_default = TRUE`, permitiendo compartir las categorías iniciales del sistema. Sin embargo, no existen políticas que permitan a los usuarios hacer `UPDATE` o `DELETE` sobre estas categorías predeterminadas, protegiéndolas contra modificaciones.
