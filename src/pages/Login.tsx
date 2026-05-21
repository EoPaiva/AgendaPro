import { CalendarCheck, LockKeyhole, Mail } from 'lucide-react';
import { Footer } from '../components/Footer';

const demoExternalUrl = import.meta.env.VITE_AGENDAPRO_DEMO_URL || 'https://agenda-pro-demo.vercel.app';

export function Login(){return <div className="auth-page"><div className="auth-card"><a className="brand center" href="#/"><span><CalendarCheck size={22}/></span><b>AgendaPro</b></a><h1>Área de acesso</h1><p>O login real do cliente fica em <b>Minha conta</b>. A demonstração agora roda em um projeto separado.</p><label><Mail size={18}/><input defaultValue="" aria-label="E-mail" placeholder="seu@email.com"/></label><label><LockKeyhole size={18}/><input type="password" defaultValue="" aria-label="Senha" placeholder="Sua senha"/></label><a href="#/conta/login" className="btn primary full">Entrar na minha conta</a><a href={demoExternalUrl} target="_blank" rel="noopener noreferrer" className="btn secondary full">Abrir demonstração externa</a><small>Ambiente principal separado dos dados fictícios da demo.</small></div><Footer/></div>}
