# GaitFlow Security & Authorization Architecture
**Versión:** 2.0 (Enterprise-Ready)

## Objetivo
Implementar una arquitectura de seguridad de grado de producción para GaitFlow que garantice la privacidad, la trazabilidad y la preparación para certificaciones como SOC2, GDPR y expansiones internacionales (LATAM, Europa, UAE). 

El sistema asegura que:
* Cada "stable" (establo) accede exclusivamente a su propia información.
* Cada usuario accede solo a los datos permitidos por su rol.
* Cada acción crítica es auditable.
* Los servicios de IA no pueden eludir los permisos del sistema.

---

## 1. Arquitectura Multi-Tenant
Todas las entidades comerciales deben pertenecer a un Estable (Stable). El aislamiento de inquilinos (tenant isolation) es obligatorio para el acceso a datos. Ninguna consulta debe recuperar datos sin filtrar por el ID del establo.

### Tabla `stables`
* **id** (uuid)
* **name**
* **slug**
* **subscription_plan**
* **status**
* **created_at**
* **updated_at**

**Regla de Negocio:** Añadir `stable_id` (UUID NOT NULL) a todas las tablas de negocio como usuarios, caballos, tareas, citas, documentos, contactos, listas de mercado, registros de cría, transacciones financieras, planes de nutrición, ubicaciones y equipos.

---

## 2. Gestión de Identidad y Acceso (IAM)
El sistema de autenticación se basa en Supabase Auth con extensiones de seguridad empresarial.

* Inicio de sesión por correo electrónico.
* Restablecimiento de contraseña.
* Soporte de Magic Link.
* **Single Sign-On (SSO):** Soporte para SAML/OIDC destinado a clientes corporativos (Google Workspace, Microsoft Entra ID).
* **Gestión de Sesiones:** Políticas de tiempo de inactividad, cierre de sesión automático e invalidación remota de sesiones.
* **Políticas de Contraseñas:** Reglas estrictas de complejidad, historial y rotación para usuarios no SSO.

### Políticas MFA (Autenticación Multifactor)
* **Obligatorio:** Owner y Stable Admin.
* **Opcional:** Veterinarian, Trainer, Groom, Farrier y Dentist.

---

## 3. Sistema de Roles (RBAC)
Los usuarios pueden tener múltiples roles dentro del sistema. 

| Rol | Capacidades | Restricciones |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | Acceso total a la plataforma, gestión de inquilinos y supervisión de facturación. | Solo personal interno de GaitFlow. |
| **OWNER** | Acceso total a su propio establo, gestión de usuarios, facturación, mercado, documentos y finanzas. | Ninguna explícita a nivel de inquilino. |
| **STABLE_ADMIN** | Gestión de operaciones, usuarios, caballos y tareas. | No puede eliminar el inquilino ni modificar la suscripción. |
| **VETERINARIAN** | Registros médicos, eventos de salud, recetas e historial de tratamientos. | Sin acceso financiero ni al mercado. |
| **TRAINER** | Registros de entrenamiento, caballos asignados y tareas asignadas. | Sin acceso financiero ni de cría. |
| **GROOM** | Ejecución de tareas diarias, registros de alimentación y operaciones del establo. | Información de caballos en solo lectura, sin acceso a documentos o finanzas. |
| **FARRIER** | Registros de cuidado de pezuñas y citas asignadas. | Solo caballos asignados. |
| **DENTIST** | Historial dental y citas asignadas. | Solo caballos asignados. |

---

## 4. Matriz de Permisos
Gestión granular mediante las tablas `permissions`, `role_permissions` y `user_roles` (con los campos `user_id`, `role_id`, `stable_id`).

**Módulos de Ejemplo:**
* `horses.read`, `horses.create`, `horses.update`, `horses.delete`
* `tasks.read`, `tasks.create`, `tasks.update`, `tasks.delete`
* `financial.read`, `financial.update`
* `documents.read`, `documents.upload`
* `marketplace.manage`

---

## 5. Row Level Security (RLS) y Control de Acceso Granular
RLS debe estar habilitado en todas las tablas.

* **Política de Aislamiento de Establo:** Los usuarios solo pueden acceder a registros donde `record.stable_id = current_user.stable_id`.
* **Políticas de Propiedad:** Algunas entidades requieren restricciones adicionales (ej. Veterinarios viendo solo caballos asignados).
* **Asignación de Caballos (`horse_assignments`):** Requiere validación RLS en campos `horse_id`, `user_id`, `permission_level`.
* **Acceso a Nivel de Caballo (`horse_access`):** Define tipos de acceso como VIEW, EDIT, MEDICAL, TRAINING.
* **Acceso por Ubicación (`user_locations`):** Los usuarios solo ven datos operativos de las ubicaciones a las que están asignados (ej. Un Groom en Granero A no accede a datos del Granero B).

---

## 6. Sistema de Auditoría (Audit Logs)
Los registros de auditoría deben ser inmutables para cumplir con estándares legales.

### Estructura (`audit_logs`)
* **Campos:** `id`, `user_id`, `stable_id`, `action`, `entity_type`, `entity_id`, `old_data`, `new_data`, `ip_address`, `created_at`.

### Eventos Requeridos
* Creación de usuarios y cambios de roles.
* Actualizaciones de caballos.
* Cambios financieros y ventas en el mercado.
* Acceso a documentos y cambios de permisos.

---

## 7. Privacidad de Datos y Cumplimiento (Compliance)
* **Gestión de Consentimiento:** Registro auditable de la aceptación de términos, políticas de privacidad y cookies.
* **Políticas de Retención y Purga:** Proceso automatizado para la eliminación segura de datos ("Derecho al olvido" de GDPR) tras la cancelación de un tenant.
* **Enmascaramiento de Datos (Data Masking):** Ocultación de PII y datos bancarios para el personal interno de GaitFlow (SUPER_ADMIN) a menos que haya un proceso formal de soporte.

---

## 8. Seguridad de Documentos
Nunca usar buckets públicos para documentos. Se utilizará almacenamiento privado mediante el bucket `documents-private`.

* **Reglas de Acceso:** Acceso exclusivo a través de URLs firmadas con expiración de 300 segundos.
* **Metadatos Almacenados:** Hash SHA256, usuario que subió el archivo, versión, fecha de expiración, caballo vinculado y contacto vinculado.

---

## 9. Capa de Seguridad de IA
Los servicios de IA tienen prohibido acceder directamente a Supabase. El flujo requerido es: IA → Capa API → Validación de Permisos → Base de Datos.

* **Restricciones de Datos:** La IA nunca debe recibir datos de otros inquilinos, volcados completos de bases de datos o credenciales de rol de servicio.
* **Flujo de Trabajo:** El backend valida permisos, recupera datos autorizados y entrega únicamente los datos filtrados a la IA para generar respuestas.
* **Protección de Prompts:** Filtrado y sanitización de entradas para evitar ataques de inyección de prompt (Prompt Injection).
* **Control de Costos:** Cuotas estrictas de uso de tokens de IA por tenant para prevenir agotamiento de recursos o ataques de denegación de servicio financiero.

---

## 10. Seguridad de API e Infraestructura
* **WAF y Protección DDoS:** Filtrado de tráfico malicioso y ataques distribuidos.
* **Listas de Permitidos (IP Whitelisting):** Configuración opcional para "Stables" y obligatoria para accesos de `SUPER_ADMIN`.
* **Protecciones Base:** Limitación de tasa (Rate Limiting), validación de solicitudes, sanitización de entradas, protección CSRF, cookies seguras y verificación JWT.
* **Límites de Tasa:** Usuarios anónimos (100 req/hora), usuarios autenticados (1000 req/hora), acciones de administrador (estrangulamiento adicional).

---

## 11. Criptografía y Gestión de Secretos
* **Datos en tránsito:** TLS 1.3.
* **Datos en reposo:** AES-256.
* **Gestión de Llaves y Secretos:** Uso de servicios como AWS KMS o HashiCorp Vault para rotación de llaves, y políticas estrictas de inyección de secretos en flujos CI/CD.
* **Campos Sensibles:** IDs de impuestos, información bancaria, documentos personales y contratos deben cifrarse antes del almacenamiento.

---

## 12. Backup y Continuidad del Negocio (Disaster Recovery)
* **Estrategia de Backup:** Copias de seguridad diarias, automatizadas, con retención de 90 días y almacenamiento en región cruzada. Se requiere proceso de restauración probado.
* **RPO (Recovery Point Objective):** Archivo continuo de WAL (Write-Ahead Logging) para garantizar una pérdida máxima de datos de 1 hora.
* **RTO (Recovery Time Objective):** Definición estricta de tiempo de levantamiento de infraestructura replicada en caso de caída catastrófica.

---

## 13. Monitoreo y DevSecOps
* **Herramientas:** Sentry, seguimiento de errores y monitoreo de rendimiento.
* **DevSecOps:** Implementación de análisis estático (SAST) y dinámico (DAST) en repositorios, y escaneo automatizado de dependencias para vulnerabilidades (CVEs).
* **Alertas Críticas de Seguridad:** Múltiples inicios de sesión fallidos, intentos de escalada de privilegios, descargas inusuales de documentos y uso excesivo de API.

---

## 14. Lista de Verificación para Producción
Mandatorio antes del lanzamiento:

| Estado | Tarea |
| :---: | :--- |
| [ ] | MFA habilitado para Owner/Admin |
| [ ] | SSO e IAM Avanzado configurado |
| [ ] | RLS habilitado en todas las tablas y Aislamiento de Establo validado |
| [ ] | Registros de auditoría operativos y Políticas de Retención activas |
| [ ] | Almacenamiento de documentos privado con acceso por URL firmada |
| [ ] | Sistema de roles operativo y matriz de permisos completada |
| [ ] | Restricciones de acceso a IA implementadas junto con protección Prompt Injection |
| [ ] | Copias de seguridad diarias operativas (RPO/RTO validados) |
| [ ] | Monitoreo, WAF y SAST/DAST configurados |
| [ ] | Pruebas de penetración (Penetration testing) completadas |
