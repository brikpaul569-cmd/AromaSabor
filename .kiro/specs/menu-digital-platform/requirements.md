# Requirements Document

## Introduction

Menu Digital es una plataforma de cotización de menús para eventos gastronómicos (AromaSabor). Permite que un **Admin** (chef/caterer) publique menús con categorías, ítems, pesos y precios; y que el **Cliente** final acceda por link o QR, arme su plato visualmente por porciones con animación ítem a ítem, y reciba una cotización automática en tiempo real. La plataforma soporta un ciclo de vida de cotización con **edición bilateral**: tanto el cliente como el admin pueden modificar el plato en cualquier momento, con notificaciones push automáticas en cada transición de estado.

El sistema está compuesto por:
- Una **API REST** construida con NestJS
- Una **aplicación web** para el Admin (Next.js 14)
- Una **aplicación móvil** para el Cliente (React Native + Expo)

---

## Glossary

- **Admin**: Chef o caterer que gestiona menús, revisa y aprueba/rechaza cotizaciones. Accede vía web con sesión autenticada.
- **Cliente**: Usuario final que selecciona ítems y arma su plato. Accede vía link o QR con token temporal.
- **API**: Servidor NestJS que expone los endpoints REST y maneja la lógica de negocio.
- **Menu**: Conjunto de categorías con ítems disponibles publicado por el Admin para un evento.
- **Categoría**: Agrupación de ítems dentro de un menú (ej: Proteína, Carbohidrato, Ensalada, Salsas, Bebida).
- **Ítem**: Elemento individual dentro de una categoría, con nombre, imagen, peso en gramos, precio por porción y disponibilidad.
- **PlateBuilder**: Componente de interfaz que muestra visualmente el plato del cliente mientras selecciona ítems.
- **Cotización**: Registro que contiene la selección de ítems del cliente, número de personas, precio calculado y estado actual.
- **EditHistory**: Registro histórico de cada modificación realizada sobre una cotización, con fecha, autor y cambios.
- **NotificationService**: Servicio que despacha notificaciones push (FCM) con fallback a email (Resend).
- **FCM_Token**: Token de Firebase Cloud Messaging registrado en el dispositivo del cliente.
- **Pricing_Engine**: Módulo de cálculo de precios (`calculateQuotation`) que suma las porciones seleccionadas y multiplica por el número de personas.
- **Slug**: Identificador URL amigable del menú, generado a partir del nombre.
- **Estado_Cotización**: Valor que describe la fase del ciclo de vida de una cotización (`pending`, `edited_by_admin`, `edited_by_client`, `approved`, `confirmed`, `rejected`).
- **JWT_Admin**: Token de sesión de larga duración para el Admin, emitido vía NextAuth.js.
- **JWT_Cliente**: Token temporal emitido para el Cliente al acceder por link de evento.
- **Socket_Gateway**: Gateway de Socket.IO en el backend que emite eventos en tiempo real a los clientes conectados.
- **Turborepo**: Herramienta de monorepo que gestiona las aplicaciones y paquetes compartidos del proyecto.

---

## Requirements

---

### Requirement 1: Autenticación del Admin

**User Story:** Como Admin, quiero iniciar sesión con mis credenciales, para acceder al panel de gestión de menús y cotizaciones de forma segura.

#### Acceptance Criteria

1. WHEN el Admin envía credenciales válidas (email con formato válido y contraseña no vacía) al endpoint de login, THE API SHALL retornar un JWT_Admin firmado con expiración de 24 horas.
2. WHEN el Admin envía credenciales inválidas al endpoint de login, THE API SHALL retornar un error de autenticación indicando que las credenciales son incorrectas, sin revelar cuál campo es erróneo.
3. WHEN el JWT_Admin ha expirado y el Admin intenta acceder a un endpoint protegido, THE API SHALL rechazar la solicitud con un error indicando que la sesión ha expirado.
4. WHILE el Admin posee un JWT_Admin válido, THE API SHALL permitir el acceso a todos los endpoints protegidos de administración.
5. IF el campo `email` o `password` está vacío en la solicitud de login, THEN THE API SHALL retornar un error de validación con descripción del campo faltante.
6. IF el JWT_Admin está ausente o tiene formato inválido (no es un JWT bien formado) en una solicitud a un endpoint protegido, THEN THE API SHALL retornar un error de autenticación diferenciado del error de token expirado.

---

### Requirement 2: Acceso del Cliente por Link o QR

**User Story:** Como Cliente, quiero acceder al menú del evento mediante un link o QR, para armar mi plato sin necesidad de registrarme.

#### Acceptance Criteria

1. WHEN el Cliente envía un Slug válido al endpoint de acceso de cliente, THE API SHALL retornar un JWT_Cliente firmado, con alcance limitado al `menuId` asociado al slug, con expiración de 72 horas.
2. IF el Slug enviado no corresponde a ningún menú activo, THEN THE API SHALL retornar un error indicando que el menú no fue encontrado o está inactivo.
3. WHEN el Admin publica un menú (establece `isActive: true`), THE API SHALL generar y retornar un link único con el formato `{base_url}/menu/{slug}` accesible sin autenticación.
4. WHEN el Admin solicita el QR de un menú publicado, THE API SHALL retornar un código QR codificado en base64 que apunta al link único del menú.
5. IF el JWT_Cliente ha expirado y el Cliente intenta acceder a un endpoint protegido, THEN THE API SHALL retornar un error indicando que debe volver a acceder por el link del evento.
6. IF el Slug enviado no cumple el formato válido (caracteres alfanuméricos y guiones, entre 3 y 100 caracteres), THEN THE API SHALL retornar un error de validación de formato antes de consultar la base de datos.

---

### Requirement 3: Gestión de Menús por el Admin

**User Story:** Como Admin, quiero crear, editar y gestionar menús con categorías e ítems, para publicar la oferta gastronómica de cada evento.

#### Acceptance Criteria

1. WHEN el Admin envía un payload válido (nombre ≤ 120 caracteres, al menos una categoría, cada ítem con `portionGrams > 0` y `pricePerPortion ≥ 0`) al endpoint de creación de menú, THE API SHALL crear el menú y retornar el recurso creado con HTTP 201.
2. WHEN el Admin actualiza el nombre de un menú existente mediante `PATCH`, THE API SHALL regenerar el `slug` automáticamente a partir del nuevo nombre y retornar el menú actualizado.
3. WHEN el Admin envía `PATCH /menus/:id` con campos válidos, THE API SHALL actualizar únicamente los campos indicados del menú sin modificar los campos no incluidos en el payload.
4. WHEN el Admin envía `DELETE /menus/:id/items/:itemId`, THE API SHALL marcar el ítem como `isAvailable: false` en lugar de eliminarlo físicamente, para preservar el historial de cotizaciones existentes.
5. WHEN el Admin envía `POST /menus/:id/items` con campos requeridos (nombre, `portionGrams`, `pricePerPortion`, `categoryId`), THE API SHALL agregar el ítem a la categoría especificada y retornar el menú actualizado.
6. WHEN el Admin sube una imagen de ítem en formato JPG, PNG o WebP con tamaño ≤ 5 MB, THE API SHALL almacenar la imagen en Cloudinary y guardar la URL pública resultante en el campo `imageUrl` del ítem.
7. IF el Admin intenta publicar un menú (`isActive: true`) y ninguna categoría contiene al menos un ítem con `isAvailable: true`, THEN THE API SHALL retornar HTTP 422 con descripción del error de validación.
8. THE API SHALL generar el campo `slug` a partir del nombre del menú eliminando caracteres especiales, convirtiendo a minúsculas y reemplazando espacios por guiones; si el slug generado colisiona con uno existente del mismo Admin, THE API SHALL agregar un sufijo numérico incremental para garantizar unicidad.
9. WHEN el Admin solicita `GET /menus`, THE API SHALL retornar la lista de todos los menús del Admin autenticado, ordenados por `createdAt` descendente.
10. IF el `menuId` o `itemId` referenciado en una operación no existe, THEN THE API SHALL retornar HTTP 404 con descripción del recurso no encontrado.
11. IF el `categoryId` especificado en `POST /menus/:id/items` no pertenece al menú indicado, THEN THE API SHALL retornar HTTP 422 con descripción del error de validación.
12. IF el servicio de Cloudinary no responde al subir una imagen, THEN THE API SHALL retornar HTTP 502 indicando falla del servicio externo y el ítem no deberá persistirse en estado incompleto.

---

### Requirement 4: Visualización del Menú por el Cliente

**User Story:** Como Cliente, quiero ver el menú del evento con las categorías y los ítems disponibles, para seleccionar lo que quiero en mi plato.

#### Acceptance Criteria

1. WHEN el Cliente solicita el menú por slug, THE API SHALL retornar el menú activo con todas sus categorías y únicamente los ítems con `isAvailable: true`, en un tiempo de respuesta menor a 2 segundos.
2. IF el slug no corresponde a ningún menú activo, THEN THE API SHALL retornar un error indicando que el menú no fue encontrado o está inactivo.
3. WHEN el PlateBuilder recibe la respuesta de la API con los datos del menú, THE PlateBuilder SHALL renderizar las categorías en el mismo orden que aparecen en el array `categories` de la respuesta.
4. WHEN el Cliente selecciona un ítem de una categoría, THE PlateBuilder SHALL mostrar el ítem añadiéndose al plato visual con una animación de entrada a 60fps usando Reanimated 3, con duración ≤ 400ms.
5. WHILE el Cliente está seleccionando ítems y navegando entre categorías, THE PlateBuilder SHALL mantener el plato parcialmente armado visible en pantalla con todos los ítems ya seleccionados.
6. IF el Cliente intenta seleccionar más ítems de los permitidos por el `maxItems` de una categoría, THEN THE PlateBuilder SHALL bloquear la selección y mostrar al usuario un mensaje indicando el límite de ítems alcanzado para esa categoría.

---

### Requirement 5: Cálculo de Cotización en Tiempo Real

**User Story:** Como Cliente, quiero ver el precio de mi selección actualizado al instante mientras armo mi plato, para decidir qué incluir dentro de mi presupuesto.

#### Acceptance Criteria

1. WHEN el Cliente añade, elimina o reemplaza un ítem seleccionado, o cambia el número de personas, THE Pricing_Engine SHALL recalcular `pricePerPlate` y `totalPrice` y actualizar la UI dentro de 100ms desde la interacción del usuario.
2. THE Pricing_Engine SHALL calcular `pricePerPlate` como la suma de los `pricePerPortion` de todos los ítems seleccionados, redondeado a 2 decimales con método half-up. Si no hay ítems seleccionados, `pricePerPlate` SHALL ser 0.00.
3. THE Pricing_Engine SHALL calcular `totalPrice` como `pricePerPlate` multiplicado por `numberOfPeople`, redondeado a 2 decimales con método half-up.
4. WHILE el Cliente está en el PlateBuilder con al menos un ítem seleccionado, THE PlateBuilder SHALL mostrar el desglose de precio por categoría con el nombre del ítem, su precio individual y un placeholder de precio cero para las categorías sin selección.
5. IF el Cliente intenta avanzar a la pantalla de confirmación sin haber seleccionado ítems en todas las categorías marcadas como requeridas (`required: true`), THEN THE PlateBuilder SHALL deshabilitar el botón de avance y mostrar una lista de las categorías pendientes resaltadas visualmente.
6. IF el Cliente ingresa un valor de `numberOfPeople` fuera del rango [1, 10000], THEN THE PlateBuilder SHALL mostrar un error de validación en el campo y mantener el último valor válido para el cálculo.

---

### Requirement 6: Edición del Plato por el Cliente (antes de confirmar)

**User Story:** Como Cliente, quiero poder cambiar un ítem de mi plato antes de confirmarlo, para corregir errores en mi selección.

#### Acceptance Criteria

1. WHEN el Cliente toca un ítem en el plato visual en estado borrador local (cotización aún no enviada), THE PlateBuilder SHALL abrir el `EditItemModal` mostrando únicamente los ítems de la misma categoría con `isAvailable: true`.
2. WHEN el Cliente selecciona un ítem de reemplazo en el `EditItemModal`, THE PlateBuilder SHALL sustituir el ítem anterior por el nuevo en el plato visual.
3. WHEN el PlateBuilder sustituye un ítem, THE PlateBuilder SHALL iniciar la animación de entrada del ítem nuevo en un plazo ≤ 100ms desde la selección.
4. WHEN el Cliente reemplaza un ítem, THE Pricing_Engine SHALL recalcular el precio total dentro de 100ms.
5. WHILE el Cliente está en la pantalla de armado del plato sin cotización enviada, THE PlateBuilder SHALL permitir al Cliente modificar su selección un número ilimitado de veces sin restricciones ni advertencias.
6. IF el Cliente cierra el `EditItemModal` sin seleccionar un ítem de reemplazo, THEN THE PlateBuilder SHALL mantener el ítem original sin cambios.
7. IF la categoría del ítem tocado no contiene ningún otro ítem con `isAvailable: true` (aparte del actualmente seleccionado), THEN THE PlateBuilder SHALL mostrar un mensaje indicando que no hay alternativas disponibles y no permitirá la sustitución.

---

### Requirement 7: Confirmación de la Cotización por el Cliente

**User Story:** Como Cliente, quiero confirmar mi plato junto con mis datos de contacto y los detalles del evento, para enviar mi cotización al Admin.

#### Acceptance Criteria

1. WHEN el Cliente completa el formulario con `name`, `phone` (máx. 20 caracteres), `eventType`, `eventDate` (formato ISO 8601), `numberOfPeople` y `selectedItems` no vacíos, y envía la cotización, THE API SHALL crear la cotización con `status: "pending"` y retornar HTTP 201 con el id de la cotización.
2. WHEN la cotización es persistida, THE API SHALL calcular y almacenar `pricePerPlate` como la suma de los `pricePerPortion` de los `selectedItems` enviados, y `totalPrice` como `pricePerPlate × numberOfPeople`.
3. WHEN la cotización es creada con `status: "pending"`, THE NotificationService SHALL enviar una notificación push al Admin con la información de la nueva cotización (nombre del cliente, número de personas y precio total).
4. WHEN la cotización es creada con `status: "pending"`, THE NotificationService SHALL enviar una notificación push al Cliente confirmando que su cotización fue enviada y que será avisado cuando el chef la revise.
5. IF alguno de los campos `name`, `phone`, `eventType`, `eventDate`, `numberOfPeople` o `selectedItems` está ausente o vacío en el payload, THEN THE API SHALL retornar HTTP 400 con descripción de cada campo faltante.
6. IF el `numberOfPeople` enviado en el payload es menor que 1 o mayor que 10,000, THEN THE API SHALL retornar HTTP 422 con descripción del error de rango.
7. IF el `menuId` enviado no corresponde a un menú con `isActive: true`, THEN THE API SHALL retornar HTTP 404 con descripción del recurso no encontrado.
8. WHEN la cotización es creada, THE API SHALL persistir el `fcmToken` enviado por el Cliente en `clientInfo.fcmToken`; si el `fcmToken` está ausente, THE API SHALL persistir `null` y usar el email como canal de notificación de fallback.

---

### Requirement 8: Edición Bilateral del Plato (Post-Confirmación)

**User Story:** Como Cliente o Admin, quiero poder modificar los ítems del plato después de que la cotización ha sido enviada, para ajustar detalles sin tener que crear una cotización nueva.

#### Acceptance Criteria

1. WHEN el Cliente autenticado envía una edición de ítems sobre una cotización con `status` en `["pending", "edited_by_admin"]`, THE API SHALL actualizar `selectedItems`, recalcular y persistir `pricePerPlate` y `totalPrice`, cambiar `status` a `"edited_by_client"` y registrar la edición en `editHistory`.
2. WHEN el Admin autenticado envía una edición de ítems sobre una cotización con `status` en `["pending", "edited_by_client"]`, THE API SHALL actualizar `selectedItems`, recalcular y persistir `pricePerPlate` y `totalPrice`, cambiar `status` a `"edited_by_admin"` y registrar la edición en `editHistory`. IF el `status` actual no es uno de los permitidos para el Admin, THEN THE API SHALL retornar HTTP 409 con descripción de la transición inválida.
3. WHEN el `status` cambia a `"edited_by_client"`, THE NotificationService SHALL enviar una notificación push al Admin indicando que el cliente modificó su plato y solicitando revisión antes de aprobar.
4. WHEN el `status` cambia a `"edited_by_admin"`, THE NotificationService SHALL enviar una notificación push al Cliente indicando que el chef ajustó su selección y solicitando revisión y confirmación.
5. IF el Cliente intenta editar una cotización con `status: "rejected"`, THEN THE API SHALL retornar HTTP 409 indicando que las cotizaciones rechazadas no pueden ser editadas.
6. IF el Cliente envía una edición sobre una cotización con `status` en `["approved", "confirmed"]` e incluye el campo `confirmOverride: true` en el payload, THEN THE API SHALL procesar la edición, cambiar el `status` a `"edited_by_client"` y retornar HTTP 200.
7. THE API SHALL registrar en `editHistory` por cada modificación: `editedBy` ("admin" | "client"), `editedAt` (timestamp ISO 8601), `previousItems`, `newItems` y `reason` (cadena de hasta 255 caracteres, opcional).
8. WHEN una cotización es editada por el Cliente, THE Socket_Gateway SHALL emitir el evento `quotation:updated` con el payload completo de la cotización actualizada a todos los Admins conectados.
9. IF el JWT del solicitante no tiene autorización sobre la cotización indicada, THEN THE API SHALL retornar HTTP 403 indicando acceso no autorizado, sin modificar la cotización.
10. IF `selectedItems` en el payload está vacío o contiene un `itemId` que no existe en el menú asociado, THEN THE API SHALL retornar HTTP 422 con descripción del error de validación, sin modificar la cotización.

---

### Requirement 9: Gestión de Estados de Cotización por el Admin

**User Story:** Como Admin, quiero aprobar, rechazar o editar cotizaciones desde el panel web, para gestionar las confirmaciones de los eventos de mis clientes.

#### Acceptance Criteria

1. WHEN el Admin autenticado envía una transición de estado `"approved"` sobre una cotización en estado permitido, THE API SHALL cambiar el estado a `"approved"` y retornar HTTP 200.
2. WHEN el Admin autenticado envía una transición de estado `"confirmed"` sobre una cotización en estado permitido, THE API SHALL cambiar el estado a `"confirmed"` y retornar HTTP 200.
3. WHEN el Admin autenticado envía una transición de estado `"rejected"` con un campo `adminNotes` de al menos 1 carácter, THE API SHALL cambiar el estado a `"rejected"`, persistir la nota y retornar HTTP 200.
4. IF el Admin envía una transición de estado `"rejected"` con `adminNotes` ausente o vacío, THEN THE API SHALL retornar HTTP 422 con descripción del campo requerido.
5. WHEN el `status` cambia a `"approved"`, THE NotificationService SHALL enviar una notificación push al Cliente informando la aprobación del menú y la fecha del evento.
6. WHEN el `status` cambia a `"confirmed"`, THE NotificationService SHALL enviar una notificación push tanto al Cliente como al Admin confirmando el menú y la fecha del evento.
7. WHEN el `status` cambia a `"rejected"`, THE NotificationService SHALL enviar una notificación push al Cliente indicando que el chef no puede preparar la selección y sugiriendo contacto alternativo.
8. THE API SHALL validar que las transiciones de estado cumplan el diagrama definido: `pending` → `edited_by_admin` | `approved` | `rejected`; `edited_by_client` → `edited_by_admin` | `approved` | `rejected`; `edited_by_admin` → `confirmed` | `rejected`.
9. IF el Admin intenta realizar una transición de estado no incluida en el diagrama, THEN THE API SHALL retornar HTTP 409 indicando los estados de origen y destino inválidos.
10. IF la cotización referenciada no existe, THEN THE API SHALL retornar HTTP 404 con descripción del recurso no encontrado.
11. IF el JWT del Admin no tiene autorización sobre la cotización indicada, THEN THE API SHALL retornar HTTP 403 sin modificar el estado de la cotización.
12. IF el fallo en el envío de notificación ocurre después de que el cambio de estado fue persistido correctamente, THEN THE API SHALL retornar HTTP 200 y registrar el fallo de notificación en los logs sin revertir el cambio de estado.

---

### Requirement 10: Historial de Cambios de la Cotización

**User Story:** Como Admin, quiero ver el historial completo de modificaciones de una cotización, para entender cómo evolucionó el plato del cliente antes del evento.

#### Acceptance Criteria

1. WHEN el Admin solicita el historial de una cotización existente, THE API SHALL retornar el array `editHistory` ordenado por el campo `editedAt` de manera ascendente (del más antiguo al más reciente).
2. THE API SHALL incluir en cada entrada del `editHistory` los campos `editedBy` (valor "Admin" o "Cliente" según el rol del autor), `editedAt`, `previousItems`, `newItems` y `reason`.
3. WHEN la cotización no tiene ediciones registradas, THE API SHALL retornar un array vacío para el campo `editHistory`.
4. IF el `id` de cotización solicitado no existe, THEN THE API SHALL retornar HTTP 404 con descripción del recurso no encontrado.
5. WHEN el Admin abre la vista de historial de una cotización, THE Web_Admin SHALL renderizar una lista ordenada de entradas de `editHistory`, mostrando por cada entrada: `editedAt` formateado, actor (`editedBy`), y los ítems modificados, en el mismo orden que la respuesta de la API.
6. WHEN el Admin visualiza una entrada del historial, THE Web_Admin SHALL resaltar con color verde los ítems presentes en `newItems` pero no en `previousItems` (añadidos), con color rojo los presentes en `previousItems` pero no en `newItems` (eliminados), y sin resaltado especial los ítems presentes en ambos arrays.

---

### Requirement 11: Panel de Cotizaciones del Admin

**User Story:** Como Admin, quiero ver todas las cotizaciones organizadas por estado en un dashboard, para gestionar eficientemente los pedidos de mis clientes.

#### Acceptance Criteria

1. WHEN el Admin solicita la lista de cotizaciones, THE API SHALL retornar las cotizaciones del Admin autenticado paginadas en 20 ítems por página por defecto, incluyendo en la respuesta los campos `total`, `page`, `pageSize` y `totalPages`.
2. IF el Admin envía un valor de `status` no perteneciente a los estados válidos como parámetro de filtro, THEN THE API SHALL retornar HTTP 422 con descripción del valor inválido.
3. IF el Admin envía parámetros de filtro de fecha con formato inválido (no ISO 8601) o con `from` posterior a `to`, THEN THE API SHALL retornar HTTP 422 con descripción del error de validación del rango.
4. WHEN el Admin abre el dashboard, THE Web_Admin SHALL mostrar el conteo de cotizaciones agrupadas por cada uno de los seis estados: `pending`, `edited_by_admin`, `edited_by_client`, `approved`, `confirmed` y `rejected`.
5. WHEN el Admin abre el dashboard, THE Web_Admin SHALL mostrar la suma de `totalPrice` de todas las cotizaciones con `status` en `["approved", "confirmed"]` cuyo `createdAt` esté dentro del mes calendario en curso (del día 1 al último día del mes actual).
6. WHEN el Admin abre el detalle de una cotización con `status: "edited_by_client"`, THE Web_Admin SHALL mostrar una comparación lado a lado de los ítems de `previousItems` (versión anterior) y `newItems` (versión del cliente) de la última entrada de `editHistory`.
7. THE API SHALL retornar el campo `updatedAt` en cada cotización de la lista, y THE Web_Admin SHALL usar ese campo para permitir ordenamiento descendente por "más recientemente modificada" como orden por defecto.

---

### Requirement 12: Sistema de Notificaciones Push y Email

**User Story:** Como Admin o Cliente, quiero recibir notificaciones en tiempo real cuando ocurra cualquier acción sobre mis cotizaciones, para estar siempre informado del estado del proceso.

#### Acceptance Criteria

1. WHEN el NotificationService recibe una solicitud de notificación con un `fcmToken` registrado y no expirado, THE NotificationService SHALL entregar el mensaje push al dispositivo del destinatario usando Firebase Cloud Messaging.
2. IF el `fcmToken` del destinatario no está presente o es inválido, THEN THE NotificationService SHALL enviar el mensaje como email usando Resend al email registrado en `clientInfo.email` de la cotización.
3. THE NotificationService SHALL registrar cada intento de notificación (exitoso o fallido) con: tipo de destinatario, canal utilizado (push/email), id de cotización, tipo de evento, timestamp de envío y resultado del intento.
4. WHEN el Admin solicita el historial de notificaciones de una cotización, THE API SHALL retornar todos los registros de notificación asociados a ese `quotationId`.
5. THE NotificationService SHALL reintentar el envío push hasta 3 veces con esperas exponenciales de 1s, 2s y 4s antes de ejecutar el fallback a email.
6. WHEN cualquiera de los siguientes eventos ocurre — creación de cotización, cambio de estado, edición por Admin, edición por Cliente, aprobación o rechazo —, THE NotificationService SHALL enviar la notificación al destinatario correspondiente según el mapa de eventos definido en el caso de estudio.
7. WHERE la aplicación móvil del Cliente está en primer plano (foreground), THE Mobile_App SHALL mostrar un banner in-app con el mensaje de la notificación visible durante al menos 5 segundos, en lugar de depender de la notificación del sistema operativo.
8. WHEN la aplicación móvil del Cliente estaba cerrada y el usuario abre la app desde una notificación, THE Mobile_App SHALL navegar directamente a la pantalla de detalle de la cotización referenciada en el payload de la notificación.
9. IF el envío push falla tras los 3 reintentos y el envío de email de fallback también falla, THEN THE NotificationService SHALL registrar el fallo doble con todos los detalles del error y continuar sin interrumpir el flujo principal de la cotización.

---

### Requirement 13: Actualizaciones en Tiempo Real con Socket.IO

**User Story:** Como Admin, quiero ver en tiempo real cuando un cliente está editando o confirmando su cotización, para no trabajar sobre datos desactualizados.

#### Acceptance Criteria

1. WHEN el Admin está conectado al Socket_Gateway y un Cliente confirma o edita una cotización, THE Socket_Gateway SHALL emitir el evento `quotation:updated` con el payload completo de la cotización actualizada al Admin.
2. WHEN el Admin recibe el evento `quotation:updated`, THE Web_Admin SHALL actualizar automáticamente tanto el panel de lista de cotizaciones como la vista de detalle si está abierta, sin requerir recarga manual de la página.
3. THE Socket_Gateway SHALL requerir un JWT_Admin válido en el handshake de conexión para autenticar la sesión del Admin antes de aceptar la conexión.
4. IF el JWT_Admin en el handshake del Socket_Gateway es inválido, THEN THE Socket_Gateway SHALL rechazar la conexión con código de error 401.
5. IF el JWT_Admin en el handshake del Socket_Gateway está ausente, THEN THE Socket_Gateway SHALL rechazar la conexión con código de error 401 diferenciado del caso de token inválido.
6. WHILE el Admin está visualizando el detalle de una cotización específica, THE Socket_Gateway SHALL emitir el evento `quotation:editing` con el `quotationId` cuando el Cliente abra esa cotización en modo edición, y SHALL emitir el evento `quotation:editing:stopped` con el `quotationId` cuando el Cliente cierre la edición o abandone la pantalla.

---

### Requirement 14: Cálculo Correcto del Precio (Propiedad de Consistencia)

**User Story:** Como plataforma, debo garantizar que el precio calculado sea siempre consistente con los ítems seleccionados, independientemente de la secuencia de ediciones realizadas.

#### Acceptance Criteria

1. THE Pricing_Engine SHALL garantizar que `pricePerPlate` sea siempre igual a la suma exacta de `pricePerPortion` de todos los `selectedItems`, redondeada a 2 decimales con método half-up, para cualquier combinación válida de ítems. Si `selectedItems` está vacío, `pricePerPlate` SHALL ser 0.00.
2. THE Pricing_Engine SHALL garantizar que `totalPrice` sea siempre igual a `pricePerPlate` multiplicado por `numberOfPeople`, redondeado a 2 decimales con método half-up, para cualquier valor de `numberOfPeople` entre 1 y 10,000.
3. WHEN los precios de ítems del menú son modificados por el Admin después de que una cotización fue creada, THE API SHALL preservar los `pricePerPortion` almacenados en `selectedItems` de la cotización existente sin actualizarlos. IF la cotización no puede preservar los precios originales, THEN THE API SHALL rechazar la operación de modificación del menú y retornar un error antes de persistir cualquier cambio.
4. THE Pricing_Engine SHALL producir el mismo resultado para `pricePerPlate` independientemente del orden en que los ítems aparecen en el array `selectedItems` (propiedad conmutativa), redondeado a 2 decimales con método half-up.
5. WHEN el Cliente añade, elimina o reemplaza un ítem, o modifica `numberOfPeople`, THE Pricing_Engine SHALL recalcular y actualizar `pricePerPlate` y `totalPrice` como respuesta directa a cada una de esas acciones.

---

### Requirement 15: Gestión de Imágenes de Ítems

**User Story:** Como Admin, quiero subir imágenes para cada ítem del menú, para que el cliente vea el plato visualmente mientras lo arma.

#### Acceptance Criteria

1. WHEN el Admin sube un archivo de imagen para un ítem, THE API SHALL aceptar archivos en formatos JPG, PNG y WebP con un tamaño máximo de 5 MB.
2. IF el archivo subido supera 5 MB o tiene un MIME type distinto de `image/jpeg`, `image/png` o `image/webp`, THEN THE API SHALL retornar HTTP 422 con descripción del error de validación antes de intentar subirlo a Cloudinary.
3. WHEN la imagen pasa la validación, THE API SHALL subirla a Cloudinary con transformación a 400×400 píxeles en formato WebP, y almacenar la URL resultante en el campo `imageUrl` del ítem.
4. WHEN el PlateBuilder renderiza los ítems seleccionados del plato visual, THE PlateBuilder SHALL cargar la imagen del ítem desde su `imageUrl`.
5. IF un ítem no tiene `imageUrl` definida o la URL no es accesible, THEN THE PlateBuilder SHALL mostrar un placeholder visual genérico correspondiente a la categoría del ítem (sin mostrar imagen rota ni error en pantalla).
6. IF el servicio de Cloudinary no responde durante la subida, THEN THE API SHALL retornar HTTP 502 indicando falla del servicio externo y el campo `imageUrl` del ítem no deberá ser modificado.

---

### Requirement 16: Acceso a Detalle de Cotización

**User Story:** Como Admin o Cliente, quiero ver el detalle completo de una cotización, para revisar la selección, el precio y el estado actual.

#### Acceptance Criteria

1. WHEN el Admin solicita el detalle de una cotización existente, THE API SHALL retornar el objeto completo de la cotización incluyendo `selectedItems`, `clientInfo`, `pricePerPlate`, `totalPrice`, `status`, `adminNotes` (o `null` si no hay nota) y `editHistory` (o array vacío si no hay ediciones).
2. WHEN el Cliente solicita el detalle de una cotización y el identificador del cliente en su JWT coincide con el registrado en `clientInfo` de la cotización, THE API SHALL retornar el detalle completo de la cotización.
3. IF el identificador del cliente en el JWT no coincide con el registrado en `clientInfo` de la cotización, THEN THE API SHALL retornar HTTP 403 con un mensaje de error indicando acceso no autorizado.
4. WHEN el Admin abre la vista de detalle de una cotización, THE Web_Admin SHALL renderizar una representación visual del plato armado usando los ítems de `selectedItems` con sus imágenes o placeholders correspondientes.
5. IF la cotización tiene `status` en `["approved", "confirmed"]`, THEN THE Mobile_App y THE Web_Admin SHALL deshabilitar todos los controles que permiten añadir, eliminar o modificar ítems en `selectedItems`, mostrando el plato en modo solo lectura.
