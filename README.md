# Eco House — Demo web + CRM

Sitio web para **Eco House (Puerto Rico)** — *Make your house eco-friendly*. Una sola plataforma: sitio, cotización con factura, tienda, CRM y portal del cliente.

## Lo que incluye

**Sitio (`/`)**
- Historia que avanza con el scroll: factura → placas → batería → apagón en el vecindario (la casa Eco House sigue encendida).
- Programas de Energía con calculadora de ahorro sobre la factura de LUMA (hasta 70%).
- Servicios: solar residencial/comercial, baterías, off-grid, cisternas y calentadores, eficiencia.
- **Tienda solar** con filtros, búsqueda, ficha de producto y "lista de cotización".
- **Calculadora de respaldo**: equipos del hogar + horas sin luz → kWh necesarios y batería recomendada de la tienda.
- **Cotización gratis**: subir factura (PDF/JPG/PNG), estimado al instante, registro (nombre completo, celular, email, pueblo, dirección y ubicación GPS) y visita técnica en calendario. Genera un código de proyecto (EH-xxxx).
- Testimonios, contacto y textos legales (borrador).
- Móvil tipo app: barra inferior con botón central "Cotizar", accesos rápidos y carruseles.

**Panel Eco House (`/#/admin`)** — CRM todo en uno
- Resumen: KPIs, solicitudes por día, embudo, visitas próximas, leads por pueblo.
- Pipeline (arrastrar y soltar): Nuevo → Contactado → Visita → Propuesta → Permisos LUMA → Instalación → Encendido.
- Clientes: búsqueda, filtros, exportar CSV. Ficha con factura (ver/descargar), mapa, llamar/WhatsApp/email, visita, valor de venta y notas.
- Citas, productos editables (se reflejan en la tienda) y alta manual de clientes.

**Portal del cliente (`/#/portal`)** — el cliente sigue su proyecto con su código y su celular/email.

## Notas de la demo
- Los datos se guardan en el navegador (localStorage + IndexedDB para las facturas). Para producción: base de datos y almacenamiento de archivos (p. ej. Supabase), autenticación con roles y notificaciones.
- Especificaciones marcadas "por confirmar" (Gendome, Sunbeat, calentador, cisterna) y precios: pendientes del cliente; se editan desde el panel.
- Testimonios tomados del sitio actual: confirmar con el cliente.

```bash
npm install
npm run dev
```

Diseño y desarrollo: NEXIX Tech Studio.
