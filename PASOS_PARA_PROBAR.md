# Cómo probar MegaSport

Esta versión usa React + Express + PostgreSQL/Supabase. XAMPP no participa en
la ejecución de este repositorio.

## 1. Configurar el backend

Dentro de `megasport-backend`, copia `.env.example` como `.env` y completa:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=CADENA_SESSION_POOLER_DE_SUPABASE
DATABASE_SSL=true
JWT_SECRET=UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES
JWT_EXPIRES_IN=8h
```

No compartas ni subas el archivo `.env`.

## 2. Configurar el frontend

Dentro de `megasport-forntend`, copia `.env.example` como `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## 3. Instalar y ejecutar

Terminal 1:

```bash
cd megasport-backend
npm install
npm run dev
```

Terminal 2:

```bash
cd megasport-forntend
npm install
npm run dev
```

Abre `http://localhost:5173`.

## 4. Probar un cliente nuevo

1. Abre `Registro`.
2. Completa nombre, correo, teléfono, código de destino de cinco dígitos,
   dirección y una contraseña de al menos ocho caracteres.
3. El backend guardará solamente el hash bcrypt y asignará el rol `CLIENTE`.
4. Cierra sesión y vuelve a entrar con el correo y la contraseña.

## 5. Habilitar el administrador existente

El administrador inicial tiene el marcador `PENDIENTE_HASH_BACKEND`. Asígnale
una contraseña real desde la carpeta del backend:

```bash
npm run set-password -- admin@megasport.local "UnaContraseñaSegura"
```

## 6. Comprobaciones técnicas

```bash
cd megasport-backend
npm run build

cd ../megasport-forntend
npm run build
npm run lint
```

## Estado de esta entrega

Ya es real:

- catálogo, categorías, productos y variantes desde Supabase;
- registro, login, hashing, perfil y verificación de rol.

Todavía es temporal:

- carrito y órdenes en `localStorage`;
- autorización de tarjetas;
- consulta y seguimiento de couriers.

El siguiente módulo debe ser el carrito persistente asociado al usuario
autenticado.
