import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider } from './contexts/AppContext';
import { ToastCenter } from './components/ToastCenter';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Booking } from './pages/Booking';
import './styles.css';

function getRoute() {
  return window.location.hash.replace('#', '') || '/';
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 56) || 'minha-agenda';
}

function readStoredClient() {
  try {
    return JSON.parse(localStorage.getItem('agendapro-client-account') || localStorage.getItem('agendapro-checkout-lead') || 'null');
  } catch {
    return null;
  }
}

function readStoredAgenda() {
  try {
    return JSON.parse(localStorage.getItem('agendapro-agenda-draft') || 'null');
  } catch {
    return null;
  }
}

function resolveStoredAgendaSlug() {
  const account = readStoredClient();
  const agenda = readStoredAgenda();
  return agenda?.slug || account?.publicSlug || slugify(account?.businessName || 'minha-agenda');
}

function hasClientAuth() {
  return Boolean(localStorage.getItem('agendapro-client-token') && readStoredClient());
}

function LegacyDashboardRedirect() {
  useEffect(() => {
    if (hasClientAuth()) {
      const slug = resolveStoredAgendaSlug();
      window.location.replace(`${window.location.pathname}#/conta/agenda/${slug}/dashboard`);
      return;
    }

    window.location.replace(`${window.location.pathname}#/conta/login`);
  }, []);

  return (
    <div className="legacy-dashboard-redirect">
      <div>
        <strong>Redirecionando para o dashboard correto.</strong>
        <span>O painel real do cliente usa a rota privada da agenda vinculada à conta.</span>
      </div>
    </div>
  );
}

function Router() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const page = route.startsWith('/dashboard') ? (
    <LegacyDashboardRedirect />
  ) : route.startsWith('/login') ? (
    <Login />
  ) : route.startsWith('/agendar') ? (
    <Booking />
  ) : (
    <Home route={route} />
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={route}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
      >
        {page}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
      <ToastCenter />
    </AppProvider>
  );
}
