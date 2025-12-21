# Configuración de Login con Instagram

Este documento explica cómo configurar el login con Instagram en tu aplicación.

## ⚠️ IMPORTANTE

**Instagram Basic Display API fue deprecado en diciembre 2024.** 

Ahora Instagram requiere usar **Facebook Login** con permisos de Instagram. Debes usar el **Facebook App ID** y **Facebook App Secret**, NO el Instagram App ID.

## ⚠️ Nota sobre Credenciales

**USA LAS CREDENCIALES DE FACEBOOK, NO DE INSTAGRAM:**
- Usa `FACEBOOK_APP_ID` como `INSTAGRAM_CLIENT_ID`
- Usa `FACEBOOK_APP_SECRET` como `INSTAGRAM_CLIENT_SECRET`

## Pasos para Configurar

### 1. Crear una App en Facebook Developers

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Inicia sesión con tu cuenta de Facebook
3. Haz clic en **"Mis Apps"** → **"Crear App"**
4. Selecciona **"Consumidor"** como tipo de app
5. Completa el formulario:
   - **Nombre de la app**: El nombre de tu aplicación
   - **Email de contacto**: Tu email
   - **Propósito de la app**: Selecciona "Autenticación" o "Otro"
6. Haz clic en **"Crear App"**

### 2. Configurar Facebook Login

1. En el panel de tu app, ve a **"Agregar producto"**
2. Busca **"Facebook Login"** y haz clic en **"Configurar"**
3. Completa la configuración básica:
   - **Categoría**: Selecciona la categoría apropiada
   - **Uso de la app**: Describe cómo usarás la API

### 2.1. Configurar Instagram (Opcional pero recomendado)

1. En el panel de tu app, ve a **"Agregar producto"**
2. Busca **"Instagram"** y haz clic en **"Configurar"**
3. Esto te permitirá solicitar permisos específicos de Instagram

### 3. Configurar OAuth Redirect URIs

1. En el panel de tu app, ve a **"Facebook Login"** → **"Configuración"**
2. En la sección **"Valid OAuth Redirect URIs"**, agrega:
   ```
   http://localhost:3000/api/auth/callback/instagram
   https://tudominio.com/api/auth/callback/instagram
   ```
   (Reemplaza `tudominio.com` con tu dominio de producción)

3. **IMPORTANTE**: También ve a **"Configuración"** → **"Básico"** y en **"Dominios de la app"** agrega:
   ```
   localhost
   tudominio.com
   ```

### 4. Obtener Credenciales

1. En el panel de tu app, ve a **"Configuración"** → **"Básico"**
2. Anota los siguientes valores:
   - **App ID** (será tu `INSTAGRAM_CLIENT_ID`) - Este es el **Facebook App ID**
   - **App Secret** (será tu `INSTAGRAM_CLIENT_SECRET`) - Este es el **Facebook App Secret** - Haz clic en "Mostrar" para verlo

**⚠️ IMPORTANTE**: Usa el **Facebook App ID** y **Facebook App Secret**, NO busques credenciales específicas de Instagram.

### 5. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local` o `.env`:

```env
INSTAGRAM_CLIENT_ID=tu_app_id_aqui
INSTAGRAM_CLIENT_SECRET=tu_app_secret_aqui
```

### 6. Agregar Usuarios de Prueba (Solo para Desarrollo)

Si tu app está en modo **Desarrollo**, necesitas agregar usuarios de prueba:

1. Ve a **"Roles"** → **"Roles"** en el panel de tu app
2. Haz clic en **"Agregar personas"**
3. Agrega los usuarios de Facebook/Instagram que quieras usar para probar
4. Los usuarios deben aceptar la invitación desde su cuenta de Facebook
5. Los usuarios deben tener una cuenta de Instagram vinculada a su cuenta de Facebook

### 7. Configurar Permisos

1. Ve a **"Facebook Login"** → **"Configuración"** → **"Permisos y características"**
2. Asegúrate de tener los siguientes permisos habilitados:
   - `instagram_basic` (permiso básico de Instagram)
   - `instagram_graph_user_profile` (perfil del usuario de Instagram)

**Nota**: Estos permisos pueden requerir revisión de Facebook antes de estar disponibles en producción.

### 8. Solicitar Revisión de la App (Para Producción)

Cuando estés listo para producción:

1. Ve a **"Revisión de la app"** en el panel
2. Completa el formulario de revisión
3. Proporciona capturas de pantalla y descripción de cómo usas los datos
4. Espera la aprobación de Facebook (puede tomar varios días)

## Notas Importantes

- **Instagram no proporciona email**: Los usuarios que se registren con Instagram no tendrán email. Se creará un email sintético basado en su username.
- **Teléfono requerido**: Al igual que con Google, los usuarios de Instagram deberán completar su perfil con un teléfono después del primer login.
- **Modo Desarrollo**: En modo desarrollo, solo los usuarios agregados como "testers" pueden usar el login.
- **URLs de Callback**: Asegúrate de agregar todas las URLs donde tu app estará disponible (localhost, staging, producción).

## Solución de Problemas

### Error: "Invalid platform app" o "Invalid OAuth Redirect URI"
- **VERIFICA QUE ESTÉS USANDO EL FACEBOOK APP ID, NO EL INSTAGRAM APP ID**
- Verifica que la URL en tu configuración de Facebook coincida exactamente con la URL de callback de NextAuth
- El formato debe ser: `https://tudominio.com/api/auth/callback/instagram`
- Asegúrate de haber agregado el dominio en "Dominios de la app" en la configuración básica
- Verifica que Facebook Login esté habilitado como producto

### Error: "App Not Setup"
- Asegúrate de haber completado todos los pasos de configuración básica
- Verifica que Facebook Login esté agregado como producto
- Verifica que hayas configurado los "Valid OAuth Redirect URIs"

### Error: "User Not Authorized"
- Si estás en modo desarrollo, asegúrate de agregar el usuario como tester
- Verifica que el usuario haya aceptado la invitación
- El usuario debe tener una cuenta de Instagram vinculada a su cuenta de Facebook

### Error: "Invalid credentials"
- Asegúrate de estar usando el **Facebook App ID** y **Facebook App Secret**
- NO uses el Instagram App ID (si aparece en tu dashboard)
- Verifica que las variables de entorno estén correctamente configuradas:
  ```env
  INSTAGRAM_CLIENT_ID=tu_facebook_app_id
  INSTAGRAM_CLIENT_SECRET=tu_facebook_app_secret
  ```

## Referencias

- [Instagram Basic Display API Documentation](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Facebook Developers Console](https://developers.facebook.com/apps/)
- [NextAuth.js Documentation](https://next-auth.js.org/)

