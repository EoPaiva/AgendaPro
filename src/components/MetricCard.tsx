import { ReactNode } from 'react';
import { motion } from 'framer-motion';
export function MetricCard({title,value,description,detail,icon}:{title:string;value:string|number;description?:string;detail?:string;icon:ReactNode}){return <motion.div className="metric-card" whileHover={{y:-3}} transition={{duration:.18}}><div className="metric-icon">{icon}</div><div><p>{title}</p><strong>{value}</strong><span>{description || detail}</span></div></motion.div>}
