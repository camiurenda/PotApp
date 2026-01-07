# PotApp 💰❤️

Aplicación web para gestionar la economía compartida con tu pareja, priorizando la **equidad sobre la igualdad**.

## Concepto Clave

El sistema **NO es 50/50**. Se basa en la **Equidad del Neto Disponible**:

```
Neto Disponible = Ingresos Totales - Gastos Fijos Personales
% Participación = Neto Disponible Individual / Suma de Netos Disponibles
```

## Características

- **Cálculo Proporcional**: Cada usuario aporta según su capacidad real
- **Gestión de Gastos Compartidos**: Estilo Splitwise pero proporcional
- **Compensación Automática**: El sistema calcula "quién debe a quién"
- **Metas de Ahorro Dinámicas**: Si no se cubre la cuota, la fecha se estira (sin generar deuda)
- **Dashboard en Tiempo Real**: Visualización clara del estado financiero

## Stack Tecnológico

- **Frontend**: Next.js 14 + React 18 + TailwindCSS
- **Backend**: Express.js + TypeScript
- **Base de Datos**: MongoDB Atlas
- **Autenticación**: JWT con cookies HttpOnly
- **Arquitectura**: Client/Server separados

## Estructura del Proyecto

```
PotApp/
├── client/                # Frontend Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/ # Página principal
│   │   │   └── page.tsx   # Login
│   │   └── components/
│   │       └── ui/        # Componentes reutilizables
│   ├── package.json
│   └── next.config.js
│
├── server/                # Backend Express
│   ├── src/
│   │   ├── models/        # Modelos Mongoose
│   │   ├── routes/        # Rutas Express
│   │   ├── utils/         # Utilidades (auth, cálculos)
│   │   ├── config/        # Configuración DB
│   │   └── index.ts       # Servidor principal
│   ├── package.json
│   └── tsconfig.json
│
└── package.json           # Scripts raíz
```

## Instalación

1. **Clonar el repositorio**:
```bash
git clone https://github.com/camiurenda/PotApp.git
cd PotApp
```

2. **Instalar todas las dependencias**:
```bash
npm run install:all
```

3. **Configurar variables de entorno**:

**Server** (`server/.env`):
```bash
cp server/.env.example server/.env
# Editar server/.env con tu configuración
```

**Client** (opcional - `client/.env.local`):
```bash
# Solo si necesitas configuración específica del cliente
```

4. **Ejecutar en desarrollo**:
```bash
npm run dev
```

Esto iniciará:
- **Server**: http://localhost:5000
- **Client**: http://localhost:3000

5. **Crear usuarios iniciales**:
   - Ir a http://localhost:3000
   - Click en "Crear Usuarios (primera vez)"
   - O hacer POST a http://localhost:5000/api/seed

## Variables de Entorno

### Server (`server/.env`)

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/potapp?retryWrites=true&w=majority
JWT_SECRET=tu-secreto-jwt-super-seguro
PORT=5000
CLIENT_URL=http://localhost:3000

USER1_NAME=Usuario1
USER1_PASSWORD=password1
USER2_NAME=Usuario2
USER2_PASSWORD=password2
```

### Client (`client/.env.local`) - Opcional

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Algoritmo de Equidad

### Ejemplo Práctico

| Usuario | Ingresos | Gastos Fijos | Neto Disponible | % Participación |
|---------|----------|--------------|-----------------|-----------------|
| Ana     | $100,000 | $20,000      | $80,000         | 66.67%          |
| Carlos  | $60,000  | $20,000      | $40,000         | 33.33%          |
| **Total** | | | **$120,000** | **100%** |

Si los gastos compartidos del mes son **$30,000**:
- Ana debería pagar: $20,000 (66.67%)
- Carlos debería pagar: $10,000 (33.33%)

Si Ana pagó $25,000 y Carlos pagó $5,000:
- **Carlos le debe $5,000 a Ana**

## Scripts Disponibles

### Raíz del proyecto
- `npm run install:all` - Instala dependencias en client, server y raíz
- `npm run dev` - Ejecuta client y server en modo desarrollo
- `npm run dev:client` - Solo ejecuta el cliente
- `npm run dev:server` - Solo ejecuta el servidor
- `npm run build` - Construye client y server para producción
- `npm start` - Ejecuta client y server en modo producción

### Client (carpeta `client/`)
- `npm run dev` - Desarrollo Next.js (puerto 3000)
- `npm run build` - Build de producción
- `npm start` - Servidor de producción

### Server (carpeta `server/`)
- `npm run dev` - Desarrollo con nodemon (puerto 5000)
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar versión compilada

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Obtener usuario actual

### Dashboard
- `GET /api/dashboard?year=2024&month=1` - Datos consolidados del mes

### Gastos
- `GET /api/expenses?year=2024&month=1` - Listar gastos
- `POST /api/expenses` - Crear gasto
- `DELETE /api/expenses?id=xxx` - Eliminar gasto

### Datos Mensuales
- `GET /api/monthly-data?year=2024&month=1` - Obtener datos del mes
- `POST /api/monthly-data` - Actualizar datos del mes

### Metas de Ahorro
- `GET /api/savings` - Listar metas activas
- `POST /api/savings` - Crear meta
- `POST /api/savings/:id/contribute` - Contribuir a una meta

### Utilidades
- `POST /api/seed` - Crear usuarios iniciales
- `POST /api/reset` - Limpiar base de datos

## Despliegue

### Backend (Render, Railway, etc.)
1. Conectar repositorio
2. Configurar build command: `cd server && npm install && npm run build`
3. Configurar start command: `cd server && npm start`
4. Configurar variables de entorno

### Frontend (Vercel, Netlify)
1. Conectar repositorio
2. Configurar root directory: `client`
3. Build command: `npm run build`
4. Configurar `NEXT_PUBLIC_API_URL` con la URL del backend

## Licencia

MIT
