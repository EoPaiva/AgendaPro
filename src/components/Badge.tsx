import { ReactNode } from 'react';
const toneMap:Record<string,string>={blue:'badge blue',green:'badge green',amber:'badge amber',red:'badge red',slate:'badge slate',purple:'badge purple'};
export function Badge({children,tone='slate'}:{children:ReactNode;tone?:'blue'|'green'|'amber'|'red'|'slate'|'purple'}){return <span className={toneMap[tone]}>{children}</span>}
