# ParejaFinance 💰❤️

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
- **Backend**: Next.js API Routes (Serverless)
- **Base de Datos**: MongoDB Atlas
- **Autenticación**: JWT con cookies HttpOnly
- **Despliegue**: Vercel

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, logout, me
│   │   ├── dashboard/     # Datos consolidados
│   │   ├── expenses/      # CRUD gastos compartidos
│   │   ├── monthly-data/  # Ingresos y gastos fijos
│   │   ├── savings/       # Metas de ahorro
│   │   └── seed/          # Crear usuarios iniciales
│   ├── dashboard/         # Página principal
│   └── page.tsx           # Login
├── components/
│   └── ui/                # Componentes reutilizables
└── lib/
    ├── auth.ts            # Utilidades de autenticación
    ├── calculations/      # Algoritmo de equidad
    └── db/
        ├── connection.ts  # Conexión MongoDB
        └── models/        # Esquemas Mongoose
```

## Instalación

1. **Clonar e instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.local.example .env.local
# Editar .env.local con tu conexión MongoDB Atlas
```

3. **Ejecutar en desarrollo**:
```bash
npm run dev
```

4. **Crear usuarios iniciales**:
   - Ir a http://localhost:3000
   - Click en "Crear Usuarios (primera vez)"

## Variables de Entorno

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=tu-secreto-jwt
USER1_NAME=Nombre1
USER1_PASSWORD=password1
USER2_NAME=Nombre2
USER2_PASSWORD=password2
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

## Despliegue en Vercel

1. Conectar repositorio a Vercel
2. Configurar variables de entorno en Vercel Dashboard
3. Deploy automático

## Licencia

MIT
