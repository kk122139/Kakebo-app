# language: es
Característica: Presupuesto consciente Kakebo
  Escenario: Calcular disponible mensual
    Dado un usuario autenticado con ingresos de 420000 pesos
    Y costos fijos de 100000 y ahorro planificado de 50000
    Cuando registra un gasto adicional de 35000
    Entonces su disponible es 235000 pesos
  Escenario: Evitar un presupuesto inconsistente
    Dado ingresos mensuales de 100000
    Cuando define costos fijos de 80000 y ahorro de 30000
    Entonces la API rechaza el presupuesto
  Escenario: Aislar datos de usuarios
    Dado dos usuarios distintos
    Cuando el segundo intenta aportar a una meta del primero
    Entonces la API responde que la meta no existe
  Escenario: Cerrar el mes
    Dado un presupuesto abierto y una reflexión
    Cuando confirma el cierre
    Entonces se guarda una instantánea y se bloquean nuevos gastos del mes
  Escenario: Recuperar auditoría
    Dado MongoDB momentáneamente no disponible durante la entrega
    Cuando se registra un gasto
    Entonces el evento permanece pendiente en PostgreSQL
    Y se entrega cuando MongoDB vuelve a estar disponible
  Escenario: Simular sin modificar datos
    Dado una meta de 100000 con 20000 ahorrados y aporte mensual de 20000
    Cuando simula un gasto extraordinario de 30000
    Entonces la proyección pasa de 4 a 6 meses
    Y el saldo y la meta no cambian
