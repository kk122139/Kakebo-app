# Kakebo · MVP móvil

Base de desarrollo para el proyecto APT. Expo + React Native + TypeScript, API NestJS, PostgreSQL y MongoDB. Los datos financieros son reales y persistidos; no existe un modo de datos ficticios.

## Inicio en Windows (PowerShell)

Requisitos: Node.js 22 LTS o superior, Docker Desktop iniciado (con WSL2), Git y Expo Go compatible con SDK 55 para probar en Android. También puedes usar un emulador o una development build.

Desde la carpeta del proyecto:

```powershell
npm ci
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
docker compose up -d
```

Edita `apps/api/.env`: sustituye JWT_SECRET por un valor aleatorio. Puedes generarlo con:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Instala el esquema e inicia la API:

```powershell
npm run db:migrate -w apps/api
npm run api
```

En otra terminal:

```powershell
npm run mobile
```

Escanea el QR desde Expo Go. El equipo y el teléfono deben estar en la misma red. En `apps/mobile/.env`, cambia `EXPO_PUBLIC_API_URL` por `http://IP_DE_TU_PC:3000`. Consulta tu IPv4 con `ipconfig`. Para emulador Android utiliza `http://10.0.2.2:3000`; para navegador en el mismo PC, `http://localhost:3000`. Reinicia Expo si cambias `.env`. Si Windows bloquea la conexión, permite Node en la red privada.

API: http://localhost:3000 · Estado: `/health` · Swagger: `/docs`.

El script `api` compila TypeScript antes de arrancar para conservar los metadatos que Nest necesita para validar los DTO. Al editar la API, ejecuta `npm run build` en otra terminal: Node reinicia al cambiar `dist`.

## Recorrido de demostración

1. Bienvenida → tres pantallas introductorias → Crear cuenta.
2. Usa una contraseña de al menos 10 caracteres y elige un objetivo.
3. Configura el mes, ingresos 420000, costos fijos 100000 y ahorro 50000.
4. Registra un gasto de 35000. El disponible resultante será 235000.
5. Crea una meta y registra aportes; prueba un gasto hipotético en el simulador.
6. Revisa el cierre, escribe una reflexión y confirma el bloqueo del mes.
7. Cierra sesión y vuelve a ingresar: los datos persisten.

## Estructura para continuar

| Ruta                                 | Responsabilidad                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `apps/mobile/App.tsx`                | Pantallas y navegación del MVP; bienvenida, login, presupuesto, gastos, metas y cierre |
| `apps/mobile/src/ui.tsx`             | Componentes reutilizables, colores, tipografía y formato de moneda                     |
| `apps/mobile/src/api.ts`             | Peticiones HTTP, almacenamiento seguro y renovación de sesión                          |
| `apps/mobile/app.json`               | Identidad de la aplicación y configuración Expo                                        |
| `apps/mobile/eas.json`               | Perfil de compilación APK                                                              |
| `apps/api/src/main.ts`               | Arranque de Nest, validación, CORS, límites de acceso y Swagger                        |
| `apps/api/src/auth.ts`               | Registro, login, JWT, refresh rotatorio y guard de autenticación                       |
| `apps/api/src/dto.ts`                | Contratos y validaciones de los datos de entrada                                       |
| `apps/api/src/finance.controller.ts` | Endpoints financieros y transacciones                                                  |
| `apps/api/src/finance.ts`            | Reglas puras de balance y simulación                                                   |
| `apps/api/src/finance.test.ts`       | Pruebas automatizadas de cálculos                                                      |
| `apps/api/src/db.ts`                 | Conexión SQL y entrega de eventos a MongoDB mediante outbox                            |
| `apps/api/src/schema.sql`            | Tablas, restricciones e índices iniciales                                              |
| `apps/api/src/migrate.ts`            | Instalación inicial del esquema                                                        |
| `docker-compose.yml`                 | Bases de datos y volúmenes locales                                                     |
| `docs/`                              | Requisitos BDD, arquitectura, contratos y pendientes                                   |
| `.github/workflows/ci.yml`           | Compilación, tipos y pruebas en GitHub Actions                                         |

Para cambiar el estilo, empieza por `ui.tsx`. Para agregar una pantalla, separa un componente en `src/screens` y conéctalo desde `App.tsx`. Para agregar una regla financiera, empieza por `finance.ts` y una prueba. Para agregar un endpoint, define primero su DTO y controla el propietario con `userId`. Para un cambio SQL posterior, crea una migración versionada: el script inicial no actualiza tablas existentes.

## Validaciones

```powershell
npm test
npm run build
npm run typecheck
```

Consulta `docs/VALIDACION.md` para saber qué se ejecutó y qué requiere pruebas en tu equipo.

## Compilar un APK después de probar

```powershell
cd apps/mobile
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

EAS requiere tu cuenta Expo y configuración de proyecto. Para un APK distribuible configura una URL HTTPS pública de la API en el entorno de compilación; un APK con una IP local solo funcionará en esa red. Este paquete incluye la configuración, no un APK ya compilado ni un backend publicado.

## Alcance visual y funcional

Se siguen los colores crema/verde, botones redondeados y flujo de la imagen adjunta. Se incluyen las imágenes originales proporcionadas en `apps/mobile/assets/`: fondo de bienvenida, tres ilustraciones y logo. El diseño sigue la referencia visual; no se incluye acceso a Figma. La pantalla de registro usa el texto correcto “Crear cuenta”. La opción repetida de objetivos se reemplaza por “Planificar mis metas”.

Google/Apple, recuperación de contraseña por correo, biometría y notificaciones no están implementados. Los servicios externos y sus credenciales se definirán al incorporarlos. No hay conexión bancaria: ingresos, costos, compras y aportes son declarados por el usuario.

## Imágenes de inicio

`src/IntroScreens.tsx` organiza la bienvenida y las tres pantallas introductorias. Usa `foto_inicial.png` como fondo, `foto_1.png` para hábitos, `foto_2.png` para ahorro y `foto_3.png` para el camino de vida. `src/ui.tsx` muestra `Logo.png` en las cabeceras de acceso, registro y objetivo. Puedes sustituir los archivos en `assets` conservando sus nombres. El fondo inicial ya incluye texto y logo, por eso no se superponen copias adicionales.
