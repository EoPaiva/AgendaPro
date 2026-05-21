import { CalendarCheck, Cookie, Globe2, Mail, Scale, ShieldCheck } from 'lucide-react';

const navigation = [
  ['Produto', '#/funcionalidades'],
  ['Planos', '#/planos'],
  ['Demonstração', '#/demo'],
  ['Minha conta', '#/conta'],
  ['Contratar', '#/contratar'],
  ['Termos', '#/termos'],
  ['Privacidade', '#/privacidade'],
  ['Cookies', '#/cookies'],
  ['LGPD', '#/lgpd'],
  ['Confiança', '#/confianca']
];

const system = ['Pagamentos Mercado Pago', 'Supabase preparado', 'Página pública por cliente', 'Implantação 24h a 48h*'];

export function Footer(){
  return <footer className="agenda-footer-full">
    <div className="agenda-footer-inner">
      <section className="agenda-footer-brand">
        <a href="#/" className="agenda-footer-logo" aria-label="AgendaPro">
          <span><CalendarCheck size={20}/></span>
          <strong>AgendaPro</strong>
        </a>
        <p>Agenda online profissional para negócios que vivem de horários marcados.</p>
      </section>

      <nav className="agenda-footer-links" aria-label="Navegação do rodapé">
        {navigation.map(([label,href])=><a key={href} href={href}>{label}</a>)}
      </nav>

      <div className="agenda-footer-system">
        {system.map(item=><span key={item}><ShieldCheck size={13}/>{item}</span>)}
      </div>

      <div className="agenda-footer-contact">
        <a href="mailto:mpaiiva21@gmail.com"><Mail size={14}/> E-mail</a>
        <a href="https://upaiva.dev/" target="_blank" rel="noopener noreferrer"><Globe2 size={14}/> upaiva.dev</a>
      </div>
    </div>

    <div className="agenda-footer-bottom">
      <span>© 2026 AgendaPro. Todos os direitos reservados.</span>
      <a href="#/termos"><Scale size={13}/> Termos</a>
      <a href="#/privacidade"><ShieldCheck size={13}/> Privacidade</a>
      <a href="#/cookies"><Cookie size={13}/> Cookies</a>
      <a href="#/lgpd">LGPD</a>
      <a href="https://upaiva.dev/" target="_blank" rel="noopener noreferrer">Software Architecture by Mateus Paiva</a>
      <small>*Prazo estimado após pagamento e briefing completo, caso não haja imprevistos.</small>
    </div>
  </footer>;
}
