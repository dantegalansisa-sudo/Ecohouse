import { useMemo, useState } from 'react';
import { STAGES, toCsv, type Lead, type Source } from '../lib/crm';
import { Download, FileText, Search } from '../components/Icons';
import { download, initials, StageChip } from './ui';

const SOURCES: Source[] = ['Cotización web', 'Contacto', 'Calculadora de respaldo', 'Tienda', 'Agenda'];

export default function Clients({ leads, onOpen, query, setQuery }: { leads: Lead[]; onOpen: (l: Lead) => void; query: string; setQuery: (q: string) => void }) {
  const [stage, setStage] = useState('');
  const [source, setSource] = useState('');
  const [onlyBills, setOnlyBills] = useState(false);

  const rows = useMemo(() => {
    const q = query.toLowerCase().trim();
    const qd = q.replace(/\D/g, '');
    return leads
      .filter((l) => (!stage || l.stage === stage) && (!source || l.source === source) && (!onlyBills || !!l.file || !!l.bill))
      .filter((l) => !q || `${l.name} ${l.email} ${l.town} ${l.code} ${l.address ?? ''}`.toLowerCase().includes(q) || (qd.length >= 3 && l.phone.replace(/\D/g, '').includes(qd)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [leads, query, stage, source, onlyBills]);

  return (
    <div className="adm-card clients">
      <div className="clients__filters">
        <label className="adm-search adm-search--in">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre, email, pueblo, código…" />
        </label>
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">Todas las etapas</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Todos los orígenes</option>
          {SOURCES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="toggle">
          <input type="checkbox" checked={onlyBills} onChange={(e) => setOnlyBills(e.target.checked)} />
          <span /> Con factura
        </label>
        <button className="btn btn--ghost btn--sm" onClick={() => download(`clientes-ecohouse-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows))}>
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Localización</th>
              <th>Factura</th>
              <th>Etapa</th>
              <th>Origen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} onClick={() => onOpen(l)}>
                <td>
                  <div className="cell-user">
                    <span className="avatar">{initials(l.name)}</span>
                    <div>
                      <strong>{l.name}</strong>
                      <small>
                        {l.code} · {new Date(l.createdAt).toLocaleDateString('es-PR')}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="cell-stack">
                    <span>{l.phone || '—'}</span>
                    <small>{l.email}</small>
                  </div>
                </td>
                <td>
                  <div className="cell-stack">
                    <span>{l.town}</span>
                    <small>{l.address ?? (l.coords ? 'GPS guardado' : '—')}</small>
                  </div>
                </td>
                <td>
                  <div className="cell-stack">
                    <span>{l.bill ? `$${l.bill}/mes` : '—'}</span>
                    {l.file && (
                      <small className="cell-file">
                        <FileText size={12} /> {l.file.name}
                      </small>
                    )}
                  </div>
                </td>
                <td>
                  <StageChip stage={l.stage} />
                  {l.lost && <span className="lost">Perdido</span>}
                </td>
                <td>
                  <small>{l.source}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="adm-empty">Sin resultados.</p>}
      </div>
      <small className="clients__count">
        {rows.length} de {leads.length} clientes
      </small>
    </div>
  );
}
