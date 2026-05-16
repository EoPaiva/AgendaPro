import { CalendarCheck, LogOut, Menu, ShieldCheck, Sparkles, UserCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const nav = [
  ['Funcionalidades', '#/funcionalidades'],
  ['Para quem é', '#/para-quem'],
  ['Planos', '#/planos'],
  ['Demo', '#/demo'],
  ['Contratar', '#/contratar'],
];

type HeaderAccount = {
  fullName?: string;
  email?: string;
  businessName?: string;
  planName?: string;
};

function readHeaderAccount(): HeaderAccount | null {
  try {
    const token = localStorage.getItem('agendapro-client-token');
    const raw = localStorage.getItem('agendapro-client-account');
    if (!token || !raw) return null;
    const parsed = JSON.parse(raw) as HeaderAccount;
    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

function shortAccountLabel(account: HeaderAccount) {
  return account.businessName || account.fullName || account.email || 'Conta ativa';
}

export function Header(){
  const [open,setOpen]=useState(false);
  const [account,setAccount]=useState<HeaderAccount|null>(() => readHeaderAccount());

  useEffect(() => {
    const syncAccount = () => setAccount(readHeaderAccount());
    window.addEventListener('storage', syncAccount);
    window.addEventListener('focus', syncAccount);
    window.addEventListener('hashchange', syncAccount);
    window.addEventListener('agendapro:client-auth-changed', syncAccount as EventListener);
    return () => {
      window.removeEventListener('storage', syncAccount);
      window.removeEventListener('focus', syncAccount);
      window.removeEventListener('hashchange', syncAccount);
      window.removeEventListener('agendapro:client-auth-changed', syncAccount as EventListener);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('agendapro-client-token');
    localStorage.removeItem('agendapro-client-session');
    setAccount(null);
    setOpen(false);
    window.dispatchEvent(new Event('agendapro:client-auth-changed'));
    window.location.hash = '#/conta/login';
  };

  return <header className="site-header executive-header-v3">
    <a className="executive-brand-v3" href="#/" onClick={()=>setOpen(false)} aria-label="AgendaPro - página inicial">
      <div className="executive-brand-mark"><CalendarCheck size={22}/></div>
      <strong>AgendaPro</strong>
    </a>

    <nav className={open?'open':''}>
      {nav.map(([label,href])=><a key={href} href={href} onClick={()=>setOpen(false)}>{label}</a>)}
      {account ? <>
        <a className="nav-login client-session-link" href="#/conta/painel" onClick={()=>setOpen(false)} title={`Logado como ${account.email}`}><UserCircle2 size={16}/><span><b>Logado</b><small>{shortAccountLabel(account)}</small></span></a>
        <button className="nav-logout" type="button" onClick={logout} title="Sair da conta"><LogOut size={15}/> Sair</button>
      </> : <a className="nav-login" href="#/conta" onClick={()=>setOpen(false)}><ShieldCheck size={16}/> Minha conta</a>}
    </nav>

    <div className={account ? 'header-signal logged' : 'header-signal'} aria-label={account ? `Conta logada: ${account.email}` : 'AgendaPro online'}><Sparkles size={14}/><span>{account ? 'conta logada' : 'online'}</span></div>
    <button className="menu-btn" aria-label="Abrir menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
  </header>
}
