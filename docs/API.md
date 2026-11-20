# Contratos REST

Todos los endpoints financieros requieren `Authorization: Bearer <accessToken>`. Swagger muestra rutas y DTO; importa desde `/docs-json` para Postman.

| Método | Ruta                     | Uso                                          |
| ------ | ------------------------ | -------------------------------------------- |
| POST   | /auth/register           | name, email, password → tokens               |
| POST   | /auth/login              | email, password → tokens                     |
| POST   | /auth/refresh            | refreshToken → tokens nuevos                 |
| POST   | /auth/logout             | refreshToken → revocación                    |
| GET    | /auth/me                 | Perfil autenticado                           |
| PUT    | /profile/objective       | objective                                    |
| PUT    | /budget                  | month, income, fixed, saving                 |
| GET    | /summary?month=AAAA-MM   | Balance; null si aún no existe presupuesto   |
| GET    | /expenses?month=AAAA-MM  | Lista de gastos                              |
| POST   | /expenses                | amount, category, description, date          |
| DELETE | /expenses/:id            | Elimina un gasto del usuario, si mes abierto |
| GET    | /goals                   | Metas con proyección                         |
| POST   | /goals                   | name, target, saved, monthly                 |
| POST   | /goals/:id/contributions | amount                                       |
| POST   | /goals/:id/simulate      | extra → meses, retraso, fecha estimada       |
| POST   | /closures                | month, reflection → cierre confirmado        |
| GET    | /closures                | Historial del usuario                        |
| GET    | /health                  | Comprueba PostgreSQL                         |

El backend rechaza datos adicionales, montos inválidos, UUID inválidos, fechas inexistentes, costos+ahorro mayores al ingreso y operaciones sobre meses cerrados. La interfaz solicita confirmación antes de eliminar gastos.

## Extensión de diseño - 2026-11-17

- GET /analysis?week=AAAA-MM-DD requiere la fecha de un lunes. Devuelve weekStart, weekEnd, total, previousTotal, changePercent, count, impulsiveCount, classifiedCount y categories (category, total, percent). La consulta filtra por el usuario autenticado y comprende la semana seleccionada y la anterior. changePercent es null cuando no hubo gastos en la semana anterior.
- POST /expenses acepta además paymentMethod (Efectivo, Tarjeta de débito, Tarjeta de crédito o Transferencia) y necessary (booleano). Ambos son opcionales para conservar compatibilidad con clientes anteriores.
- GET /expenses incluye paymentMethod y necessary. NULL significa que no se registró ese dato; no equivale a false.
- Aplicar schema.sql con db:migrate antes de usar la nueva versión. Incorpora columnas sin modificar gastos existentes.
