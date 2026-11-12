import { estimate } from './_lib/solar.js';
import { fail, guard, HttpError, openai, type Req, type Res } from './_lib/server.js';

export const config = { maxDuration: 60 };

const MAX_BYTES = 4 * 1024 * 1024; // el límite del cuerpo en Vercel es 4.5 MB

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    es_factura: { type: 'boolean', description: 'true si el documento es una factura de electricidad' },
    total_a_pagar: { type: ['number', 'null'], description: 'Cargos del mes actual en dólares (sin balance anterior si se distingue)' },
    consumo_kwh: { type: ['number', 'null'], description: 'Consumo del periodo actual en kWh' },
    periodo: { type: ['string', 'null'], description: 'Periodo facturado, ej. "15 sep – 14 oct 2026"' },
    dias: { type: ['integer', 'null'] },
    tarifa: { type: ['string', 'null'], description: 'Tipo de tarifa o servicio (residencial/comercial) si aparece' },
    historial: {
      type: 'array',
      description: 'Consumo mensual de la gráfica o tabla de historial (hasta 13 meses), del más antiguo al más reciente',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { mes: { type: 'string', description: 'Ej. "Oct" o "Oct 2025"' }, kwh: { type: 'number' } },
        required: ['mes', 'kwh'],
      },
    },
    confianza: { type: 'string', enum: ['alta', 'media', 'baja'] },
    nota: { type: 'string', description: 'Observación breve para el cliente, en español' },
  },
  required: ['es_factura', 'total_a_pagar', 'consumo_kwh', 'periodo', 'dias', 'tarifa', 'historial', 'confianza', 'nota'],
};

const PROMPT = `Analiza esta factura de electricidad de Puerto Rico (normalmente de LUMA Energy).
Extrae SOLO lo que se lee claramente; si un dato no se ve, devuelve null. No inventes.
- total_a_pagar: cargos corrientes del mes (si hay balance anterior aparte, no lo sumes).
- consumo_kwh: kWh consumidos en el periodo.
- historial: lee la gráfica o tabla de consumo de meses anteriores si existe; estima cada barra con cuidado. Si no hay, devuelve [].
- Ignora y NO devuelvas número de cuenta, dirección ni datos personales.
- Si no es una factura de electricidad, es_factura=false.
- nota: una frase útil para el cliente (ej. "Tu consumo sube en verano").`;

export default async function handler(req: Req, res: Res) {
  if (!guard(req, res)) return;
  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as { file?: string; name?: string };
    const file = body.file ?? '';
    const m = /^data:([\w/+.-]+);base64,/.exec(file);
    if (!m) throw new HttpError(400, 'Archivo inválido');
    const mime = m[1];
    if ((file.length * 3) / 4 > MAX_BYTES) throw new HttpError(413, 'El archivo es muy grande para leerlo con IA. Escribe los datos manualmente.');

    const part =
      mime === 'application/pdf'
        ? { type: 'file', file: { filename: (body.name || 'factura.pdf').slice(0, 80), file_data: file } }
        : mime.startsWith('image/')
          ? { type: 'image_url', image_url: { url: file, detail: 'high' } }
          : null;
    if (!part) throw new HttpError(415, 'Formato no soportado. Usa PDF, JPG o PNG.');

    const data = await openai({
      messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, part] }],
      response_format: { type: 'json_schema', json_schema: { name: 'factura', strict: true, schema: SCHEMA } },
      max_completion_tokens: 900,
    });
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new HttpError(502, 'No se pudo leer la factura.');
    const bill = JSON.parse(raw);

    const hist = (bill.historial as { mes: string; kwh: number }[]).filter((h) => h.kwh > 0 && h.kwh < 100000);
    const values = [...hist.map((h) => h.kwh)];
    if (!values.length && bill.consumo_kwh) values.push(bill.consumo_kwh);
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
    const peak = values.length ? Math.max(...values) : null;
    const est = bill.total_a_pagar && avg ? estimate(bill.total_a_pagar, avg) : bill.total_a_pagar ? estimate(bill.total_a_pagar) : null;

    res.status(200).json({ ...bill, historial: hist, promedio_kwh: avg, pico_kwh: peak, estimate: est });
  } catch (e) {
    fail(res, e);
  }
}
