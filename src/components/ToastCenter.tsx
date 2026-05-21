import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
const icons={success:<CheckCircle2/>,info:<Info/>,warning:<TriangleAlert/>,error:<XCircle/>};
export function ToastCenter(){const {toasts,dismissToast}=useApp(); return <div className="toast-center">{toasts.map(t=><div className={'toast '+t.tone} key={t.id}><div className="toast-icon">{icons[t.tone]}</div><div><strong>{t.title}</strong><p>{t.message}</p></div><button aria-label="Fechar" onClick={()=>dismissToast(t.id)}><X size={16}/></button></div>)}</div>}
