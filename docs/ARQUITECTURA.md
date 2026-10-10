# Arquitectura y reglas

El cliente Expo consume una API REST NestJS. PostgreSQL conserva usuarios, sesiones, presupuestos, gastos, metas y outbox. Un trabajador entrega eventos del outbox a MongoDB cada tres segundos; el ID único permite reintentos sin duplicar documentos. Los cierres incluyen una instantánea y reflexión en el evento. La consulta de cierres usa el outbox como fuente fiable aunque Mongo esté momentáneamente caído.

## Modelo

- users 1:N sessions, budgets y goals.
- budgets (user_id, month) 1:N expenses.
- users 1:N outbox; Mongo audit contiene eventId, userId, kind, payload y createdAt.
- CLP entero, sin flotantes monetarios. Entradas limitadas a 10^12 pesos. BIGINT de PostgreSQL se convierte a number para JSON.
- Disponible = ingresos − costos fijos − ahorro planificado − gastos adicionales.
- Cuota diaria = floor(max(0, disponible) / días restantes), incluyendo hoy; mes pasado devuelve cero.
- Ahorro real al cierre = ingresos − costos fijos − gastos. Es dinero restante declarado, no verificación bancaria.
- No vuelvas a registrar costos fijos como gastos adicionales: se duplicaría su descuento.
- Metas independientes del presupuesto: un aporte actualiza la alcancía, sin descontar de nuevo el saldo mensual.
- Simulación: ceil((objetivo − ahorrado + gasto hipotético) / aporte mensual); fecha aproximada al desplazar meses desde hoy.
- Cierre bloquea futuras modificaciones de ese presupuesto y sus gastos. Es una acción confirmada por el cliente.
- Las fechas de cálculo del MVP usan UTC; ajustar a America/Santiago antes de operar con cierres al cambio de día local.

## Seguridad implementada

Hash bcrypt (coste 12), access JWT 15 minutos con issuer/audience y algoritmo restringido, refresh aleatorio de 30 días guardado como hash SHA-256 y rotado atómicamente. SecureStore conserva solo el refresh nativo; access en memoria. En web no se persisten tokens. Validación DTO, consultas parametrizadas, verificación del propietario, Helmet, CORS configurable y rate limit en autenticación.

Logout revoca el refresh. El access ya emitido sigue siendo válido hasta expirar (15 minutos). El MVP no detecta reutilización de familias completas de refresh ni implementa revocación instantánea de access. La entrega de auditoría es eventual; supervisar pendientes y agregar alertas antes de producción. No se afirma certificación OWASP ni preparación para producción.

## Próxima refactorización

El MVP agrupa endpoints para que sea fácil leerlo. Separar en módulos Auth, Budgets, Expenses, Goals y Closures, con servicios y repositorios inyectables. Dividir App.tsx por pantallas, añadir navegación formal y pruebas de UI. No es una implementación completa de Clean Architecture.
