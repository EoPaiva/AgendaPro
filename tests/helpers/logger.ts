import fs from 'node:fs';
import path from 'node:path';

type LogLevel = 'START' | 'STEP' | 'PASS' | 'FAIL' | 'WARN' | 'END';

const runId = new Date().toISOString().replace(/[:.]/g, '-');
const logsDir = path.join(process.cwd(), 'tests', 'logs');
const logFile = path.join(logsDir, `e2e-run-${runId}.log`);
const jsonFile = path.join(logsDir, `e2e-run-${runId}.json`);
const events: Array<Record<string, unknown>> = [];

function mask(value: unknown) {
  const text = String(value ?? '');
  if (!text) return '';
  return text
    .replace(/(password|senha|token|secret|key|service_role)[=:]\s*[^,\s]+/gi, '$1=********')
    .replace(/[A-Za-z0-9_-]{28,}\.[A-Za-z0-9_-]{20,}/g, '********.********');
}

export function logStep(level: LogLevel, message: string, details?: Record<string, unknown>) {
  fs.mkdirSync(logsDir, { recursive: true });
  const timestamp = new Date().toISOString();
  const safeDetails = details ? Object.fromEntries(Object.entries(details).map(([k, v]) => [k, mask(v)])) : undefined;
  const line = `[${timestamp}] [${level}] ${message}${safeDetails ? ` ${JSON.stringify(safeDetails)}` : ''}\n`;
  fs.appendFileSync(logFile, line, 'utf8');
  events.push({ timestamp, level, message, details: safeDetails || {} });
  fs.writeFileSync(jsonFile, JSON.stringify(events, null, 2), 'utf8');
}
