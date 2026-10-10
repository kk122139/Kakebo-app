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

El backend rechaza datos adicionales, montos inválidos, UUID inválidos, fechas inexistentes, costos+ahorro mayores al ingreso y operaciones sobre meses cerrados. Eliminar gastos no exige confirmación adicional en esta base; agregar diálogo al desarrollar UX final.
