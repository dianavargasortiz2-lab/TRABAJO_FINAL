# Asadero Con Afán

Aplicación Angular con API Express y MongoDB. El sitio público conserva las páginas Inicio, Menú, Nuestro equipo y Únete & Opiniones; también agrega carrito, pedidos, seguimiento y administración.

## Desarrollo local

1. Instala Node.js 20.19+ y crea un clúster de MongoDB Atlas. En Atlas agrega el usuario de base de datos y autoriza la IP desde la que se ejecutará la API.
2. Copia `.env.example` a `.env`; reemplaza `MONGO_URI` con la URI privada que entrega Atlas y configura un `JWT_SECRET` aleatorio, `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mínimo 12 caracteres). Codifica en URL los caracteres especiales del usuario o contraseña. `.env` está excluido de Git; no compartas ni publiques sus valores.
3. Si defines `DELIVERY_FEE_COP`, la web muestra el total exacto. Si no está definido, los pedidos se reciben y guardan con el domicilio y total pendientes de confirmación; no se inventa ningún costo.
4. Instala paquetes con `npm install`.
5. En terminales separadas ejecuta `npm run start:api` y `npm start`. Al conectar con MongoDB, la API carga automáticamente los productos y vacantes iniciales que falten y crea el administrador inicial desde las variables del `.env`.

Usa `npm run seed:catalog` para aplicar cambios del catálogo compartido a la base de datos. Usa `npm run seed:admin` cuando necesites cambiar o restablecer las credenciales del administrador.

Angular usa `proxy.conf.json` para enviar `/api` al servidor local en el puerto 3000. La API comienza únicamente si puede conectarse a MongoDB.

## Despliegue público en Render

El archivo `render.yaml` configura un único servicio web: compila Angular y Express sirve la aplicación y sus rutas `/api` desde el mismo dominio. Esto evita tener que configurar un proxy entre dos servicios. Al iniciar, la API crea los productos y vacantes iniciales que falten sin reemplazar las vacantes que ya hayas editado, y crea el administrador inicial si configuras sus variables.

1. En Render, crea un **Blueprint** y conecta el repositorio público `dianavargasortiz2-lab/TRABAJO_FINAL`.
2. Al sincronizar el Blueprint, define `MONGO_URI`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` como variables privadas en Render. Usa la URI de MongoDB Atlas y una contraseña única de al menos 12 caracteres. No agregues estos valores a GitHub.
3. En Atlas, permite la conexión desde las direcciones de salida que Render muestra para el servicio. Evita abrir el acceso a todas las IP salvo que sea estrictamente temporal.
4. Render genera `JWT_SECRET` y publica la aplicación en una URL `onrender.com`. Comprueba `/api/health` para confirmar que el servicio responde.
5. Opcionalmente define `DELIVERY_FEE_COP` con el costo real del domicilio en la configuración del servicio; si lo dejas vacío, los pedidos se guardarán y el costo se confirmará con el cliente. La API crea el administrador inicial al iniciar. Para cambiar su contraseña después, configura localmente `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env` y ejecuta `npm run seed:admin` contra el mismo Atlas.

El acceso a administración está discretamente oculto en el pie de página: haz clic cinco veces seguidas en el texto de derechos reservados para abrir el inicio de sesión. El panel requiere autenticación; la ruta no sustituye la contraseña.

El plan gratuito de Render puede suspender el servicio tras un periodo sin actividad; la primera visita posterior puede tardar en responder.

## Recuperación de acceso

La recuperación de contraseña envía un enlace por SMTP. Configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM`; sin esos datos, la API informa que la recuperación no está disponible y no afirma que haya enviado un correo.

## Catálogo e información pendiente

El catálogo compartido por Angular y el proceso de carga a MongoDB está en `shared/catalog.json`; actualiza ese archivo para cambiar productos, imágenes, precios o vacantes iniciales. Combos y postres se muestran como filtros sin productos porque el sitio de origen no tenía artículos de esas categorías. Las tarjetas utilizan ilustraciones SVG locales originales como recurso temporal; reemplázalas por fotografías autorizadas del negocio en `img/menu/` cuando estén disponibles. El menú obtiene los productos desde `/api/products` y muestra un aviso y el catálogo local si la API no está disponible.

Los datos del equipo conservan los textos del sitio de origen. La misión, visión y valores se presentan de forma breve y coherente con la propuesta comercial del asadero.

La compilación de Angular produce `dist/asadero-con-afan`. El backend debe desplegarse como servicio Node/Express con una instancia MongoDB y las variables anteriores configuradas.
