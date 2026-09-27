import React from 'react';
import type { PluginComponentProps } from './hs-plugin';
import { frame, ink, Header, Icon, I, useNow, fmtTime, dayKey } from './ui';

type Pet = { name: string; jobs: string[] };
export function parsePets(s: string): Pet[] {
  return String(s || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [n, j = ''] = l.split(':'); return { name: n.trim(), jobs: j.split(',').map((x) => x.trim()).filter(Boolean) };
  }).filter((p) => p.name && p.jobs.length);
}
const KEY = 'pet-care:log';

export default function PetCare({ config, style, timezone: tz, ...rest }: PluginComponentProps & { timeFormat?: string }) {
  const now = useNow(30000);
  const pets = parsePets(String(config.pets ?? ''));
  const accent = String(config.accentColor || '#0d9488');
  const resetHour = Number(config.resetHour ?? 4);
  const day = dayKey(new Date(now.getTime() - resetHour * 3600000), tz);
  const [log, setLog] = React.useState<Record<string, Record<string, number>>>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } });
  const today = log[day] ?? {};
  const toggle = (k: string) => setLog((l) => {
    const t = { ...(l[day] ?? {}) }; if (t[k]) delete t[k]; else t[k] = Date.now();
    const n = { [day]: t }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ } return n;
  });
  const dom = Number(new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: tz }).format(now));
  const reminders = String(config.monthly ?? '').split('\n').map((l) => l.split('|')).filter((p) => p[0]?.trim() && Number(p[1]) === dom).map((p) => p[0].trim());
  const total = pets.reduce((a, p) => a + p.jobs.length, 0);
  const done = Object.keys(today).length;

  return (
    <div style={frame(style)}>
      <Header style={style} title={String(config.title || 'Pets')} meta={`${done}/${total} done today`} />
      {reminders.map((r) => (
        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5em', padding: '0.45em 0.7em', borderRadius: '0.5em', marginBottom: '0.5em', background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, fontSize: '0.8em', fontWeight: 500 }}>
          <Icon d={I.calendar} size="1.1em" /> Today: {r}
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8em', flex: 1, minHeight: 0 }}>
        {pets.map((p) => (
          <div key={p.name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em', fontSize: '0.8em', fontWeight: 600, marginBottom: '0.4em' }}><Icon d={I.paw} size="1.1em" style={{ opacity: 0.6 }} />{p.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(p.jobs.length, 4)}, 1fr)`, gap: '0.4em' }}>
              {p.jobs.map((j) => {
                const k = `${p.name}|${j}`; const at = today[k];
                return (
                  <button key={k} onClick={() => toggle(k)} style={{ appearance: 'none', border: 'none', font: 'inherit', cursor: 'pointer', textAlign: 'left', padding: '0.55em 0.7em', borderRadius: '0.6em', background: at ? `color-mix(in srgb, ${accent} 16%, transparent)` : ink(style, 0.06), color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                    <span style={{ width: '1.25em', height: '1.25em', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: at ? accent : 'transparent', border: at ? 'none' : `0.12em solid ${ink(style, 0.35)}`, color: '#fff' }}>
                      {at && <Icon d={I.check} size="0.8em" stroke={3} />}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '0.8em', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j}</span>
                      <span style={{ display: 'block', fontSize: '0.62em', opacity: at ? 0.7 : 0.35 }}>{at ? fmtTime(new Date(at), tz, (rest as any).timeFormat) : 'not yet'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
