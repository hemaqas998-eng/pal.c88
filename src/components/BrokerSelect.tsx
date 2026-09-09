import React, { useEffect, useState } from 'react';

type Broker = { id: string; name: string; asset: string; api: string[]; docs?: string };

export default function BrokerSelect({ onSelect }: { onSelect?: (b: Broker)=>void }) {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/supported-brokers', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setBrokers(data.supported || []);
      } catch (e) {
        console.warn('Failed to load brokers', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelected(id);
    const b = brokers.find(x=>x.id===id);
    if (b && onSelect) onSelect(b);
  }

  if (loading) return <div>Loading brokers...</div>;
  return (
    <div>
      <label htmlFor="brokerSelect">اختر الوسيط / المنصة:</label>
      <select id="brokerSelect" value={selected} onChange={handleChange} style={{width:'100%',padding:8,borderRadius:6}}>
        <option value="">-- اختر وسيلة ربط --</option>
        {brokers.map(b => (
          <option key={b.id} value={b.id} data-api={b.api.join(',')}>{b.name} ({b.asset})</option>
        ))}
      </select>
    </div>
  );
}
