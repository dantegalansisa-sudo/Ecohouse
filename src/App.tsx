import { lazy, Suspense, useEffect } from 'react';
import Site from './Site';
import { useRoute } from './lib/router';

const Admin = lazy(() => import('./admin/Admin'));
const Portal = lazy(() => import('./portal/Portal'));

export default function App() {
  const route = useRoute();
  const area = route.startsWith('/admin') ? 'admin' : route.startsWith('/portal') ? 'portal' : 'site';

  useEffect(() => {
    document.documentElement.dataset.area = area;
    document.title =
      area === 'admin' ? 'Panel Eco House · CRM' : area === 'portal' ? 'Mi proyecto · Eco House' : 'Eco House · Energía solar en Puerto Rico | Make your house eco-friendly';
  }, [area]);

  if (area === 'site') return <Site />;
  return (
    <Suspense fallback={<div className="app-loading" />}>
      {area === 'admin' ? <Admin /> : <Portal />}
    </Suspense>
  );
}
