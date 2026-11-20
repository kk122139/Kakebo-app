# Validación realizada

Fecha: 2026-10-06.

| Comprobación                                                           | Resultado                                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Instalación npm                                                        | Correcta; package-lock.json incluido                              |
| Compilación TypeScript de API                                          | Correcta                                                          |
| Pruebas de lógica y validación                                         | 9/9 aprobadas                                                     |
| Revisión de tipos móvil                                                | Correcta                                                          |
| Exportación Expo para web                                              | Correcta                                                          |
| Exportación Expo para Android (bundle Hermes)                          | Correcta                                                          |
| Compatibilidad Expo usando matriz incluida en el paquete, modo offline | Correcta después de ajustar React Native a 0.83.10                |
| Docker, migración y consultas sobre bases reales                       | Pendiente: Docker no está instalado en el entorno de construcción |
| Interacción en dispositivo físico                                      | Pendiente                                                         |
| APK mediante EAS                                                       | Configurado, no compilado                                         |

La exportación Android valida el empaquetado JavaScript, no reemplaza una compilación APK ni una prueba en teléfono. La verificación online adicional de Expo no pudo completarse por un timeout del proxy. La matriz local sí se comprobó.

Las pruebas cubren balance, febrero bisiesto, sobregasto, meses anteriores, proyección, importes fraccionarios, campos adicionales, categorías, límite real de contraseña y conservación de los metadatos DTO que utiliza Nest en ejecución. No se han ejecutado pruebas de integración con PostgreSQL/MongoDB ni se ha certificado OWASP.

## Prueba manual pendiente

Arrancar Docker y la API siguiendo README. Crear dos usuarios. Verificar que el segundo no accede a metas o gastos del primero. Crear presupuesto, gasto, meta, aporte y simulación. Cerrar un mes y comprobar que no permite nuevos gastos ni modificaciones. Detener Mongo después de arrancar la API, crear un gasto y verificar que el outbox permanece pendiente; reanudar Mongo y comprobar entrega única. Reiniciar app y verificar restauración nativa de sesión. Ejecutar el flujo completo en Android antes de distribuir.

## Actualización visual · 2026-10-07

Se incorporaron las cinco imágenes proporcionadas: fondo inicial, tres ilustraciones introductorias y logo. Se verificó TypeScript y se exportaron correctamente web y Android incluyendo todos los assets. Las imágenes están empaquetadas localmente y no requieren descargas al abrir las pantallas. No se realizó prueba visual en dispositivo físico.

## Continuación - 2026-11-17

API: compilación y 13 pruebas aprobadas. Móvil: revisión de tipos aprobada. Interfaz: recorrido con API simulada aprobado en Chrome a 320, 390 y 430 px, con capturas revisadas. No se observaron errores de ejecución ni desbordes horizontales en los escenarios probados.

La integración real sigue pendiente: Docker Desktop no inició correctamente y Compose devolvió error interno 500. No se aplicó la nueva migración ni se validó persistencia, aislamiento, sesión nativa o auditoría. Ver CONTINUACION_2026-11-17.md para cambios, comandos y limitaciones.

## Corrección de caída al registrar gastos - 2026-11-17

Se reprodujo el fallo con un usuario nuevo: GET /summary sin presupuesto devolvía HTTP 200 con cuerpo vacío. El cliente convertía el fallo de parseo JSON en {}, lo trataba como presupuesto existente y la pantalla de registro intentaba acceder a categories.slice().

Se corrigió la lectura HTTP para representar un cuerpo vacío como null, mostrar un error recuperable si el contenido no vacío no es JSON y evitar el acceso a categorías ausentes. Un usuario sin presupuesto ahora ve la acción para configurarlo.

Verificaciones posteriores:
- Revisión de tipos móvil aprobada.
- Cinco pruebas de regresión del cliente HTTP: ejecutar node --test apps/mobile/tests/api.test.cjs.
- Prueba de interfaz con NestJS y PostgreSQL reales, sin simular respuestas: registro, objetivo, ausencia de presupuesto, configuración de presupuesto, botón Registrar Gasto, persistencia de monto/método/necesidad, saldo calculado y análisis semanal. Aprobada en Chrome 390x844.
- Docker arrancó correctamente en esta sesión, ambas bases están en ejecución y se aplicó la migración.
- Evidencia local: .codex-preview/resultado-api-real.json y capturas real-01-sin-presupuesto.png / real-02-gasto-guardado.png.
- Aún se necesita confirmación del usuario en Expo Go. Los registros también contienen un aviso de Expo Go SDK 58 frente al proyecto SDK 55; no se actualizaron dependencias.

