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
