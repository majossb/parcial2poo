# Sistema de mantenimiento de conjuntos residenciales

Monolito modular con arquitectura hexagonal (backend) y cliente web PWA (frontend).

## Estructura

- `backend/`  API REST en Node.js + TypeScript. Un solo despliegue, tres módulos:
  `auth`, `hojas-de-vida` y `asistencia`.
- `frontend/` Aplicación web React + Vite con Service Worker e IndexedDB (modo sin conexión).
- `docker-compose.yml` Levanta PostgreSQL (y más adelante la API y el frontend).

## Reglas del proyecto

1. Cada módulo del backend tiene tres carpetas: `domain`, `application`, `infrastructure`.
2. Las dependencias solo apuntan hacia adentro: infrastructure -> application -> domain.
3. Un módulo solo se usa desde otro a través de su `index.ts` (su API pública).
4. Las tablas pertenecen a un solo módulo; ningún módulo lee las tablas de otro.
5. Cada feature del frontend corresponde a un módulo del backend y solo habla con él desde su carpeta `api/`.
6. Lo que atraviesa el modo sin conexión vive en `frontend/src/offline/`.
