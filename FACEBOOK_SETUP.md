# Configuración de Login con Facebook

Este documento explica cómo configurar el login con Facebook en tu aplicación usando NextAuth.js.

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
3. Selecciona **"Web"** como plataforma
4. Completa la configuración básica

### 3. Configurar OAuth Redirect URIs

1. En el panel de tu app, ve a **"Facebook Login"** → **"Configuración"**
2. En la sección **"Valid OAuth Redirect URIs"**, agrega:
   ```
   http://localhost:3000/api/auth/callback/facebook
   https://tudominio.com/api/auth/callback/facebook
   ```
   (Reemplaza `tudominio.com` con tu dominio de producción)

3. En **"Configuración"** → **"Básico"**, en **"Dominios de la app"** agrega:
   ```
   localhost
   tudominio.com
   ```

### 4. Obtener Credenciales

1. En el panel de tu app, ve a **"Configuración"** → **"Básico"**
2. Anota los siguientes valores:
   - **App ID** (será tu `FACEBOOK_CLIENT_ID`)
   - **App Secret** (será tu `FACEBOOK_CLIENT_SECRET`) - Haz clic en "Mostrar" para verlo

### 5. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local` o `.env`:

```env
FACEBOOK_CLIENT_ID=tu_app_id_aqui
FACEBOOK_CLIENT_SECRET=tu_app_secret_aqui
```

### 6. Agregar Usuarios de Prueba (Solo para Desarrollo)

Si tu app está en modo **Desarrollo**, necesitas agregar usuarios de prueba:

1. Ve a **"Roles"** → **"Roles"** en el panel de tu app
2. Haz clic en **"Agregar personas"**
3. Agrega los usuarios de Facebook que quieras usar para probar
4. Los usuarios deben aceptar la invitación desde su cuenta de Facebook

### 7. Configurar Permisos

1. Ve a **"Facebook Login"** → **"Configuración"** → **"Permisos y características"**
2. Los permisos básicos (`email`, `public_profile`) ya están habilitados por defecto
3. Si necesitas permisos adicionales, solicítalos aquí

### 8. Solicitar Revisión de la App (Para Producción)

Cuando estés listo para producción:

1. Ve a **"Revisión de la app"** en el panel
2. Completa el formulario de revisión
3. Proporciona capturas de pantalla y descripción de cómo usas los datos
4. Espera la aprobación de Facebook (puede tomar varios días)

## Notas Importantes

- **Facebook proporciona email**: A diferencia de Instagram, Facebook sí proporciona el email del usuario.
- **Teléfono requerido**: Al igual que con Google, los usuarios de Facebook deberán completar su perfil con un teléfono después del primer login si no lo tienen.
- **Modo Desarrollo**: En modo desarrollo, solo los usuarios agregados como "testers" pueden usar el login.
- **URLs de Callback**: Asegúrate de agregar todas las URLs donde tu app estará disponible (localhost, staging, producción).

## Solución de Problemas

### Error: "Invalid OAuth Redirect URI"
- Verifica que la URL en tu configuración de Facebook coincida exactamente con la URL de callback de NextAuth
- El formato debe ser: `https://tudominio.com/api/auth/callback/facebook`
- Asegúrate de haber agregado el dominio en "Dominios de la app"

### Error: "App Not Setup"
- Asegúrate de haber completado todos los pasos de configuración básica
- Verifica que Facebook Login esté agregado como producto
- Verifica que hayas seleccionado "Web" como plataforma

### Error: "User Not Authorized"
- Si estás en modo desarrollo, asegúrate de agregar el usuario como tester
- Verifica que el usuario haya aceptado la invitación

### Error: "Invalid credentials"
- Verifica que estés usando el **Facebook App ID** y **Facebook App Secret** correctos
- Verifica que las variables de entorno estén correctamente configuradas:
  ```env
  FACEBOOK_CLIENT_ID=tu_facebook_app_id
  FACEBOOK_CLIENT_SECRET=tu_facebook_app_secret
  ```

## Referencias

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Facebook Developers Console](https://developers.facebook.com/apps/)
- [NextAuth.js Facebook Provider](https://next-auth.js.org/providers/facebook)
