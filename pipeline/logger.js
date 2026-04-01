// ─── logger.js ────────────────────────────────────────────────────────────────
// Lightweight structured logger with log levels and Railway-friendly output.
// Uses ISO timestamps so Railway's log viewer can parse them correctly.
// ──────────────────────────────────────────────────────────────────────────────

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const LEVEL  = LEVELS[process.env.LOG_LEVEL?.toLowerCase() ?? "info"] ?? 1;

function timestamp() {
  return new Date().toISOString();
}

function log(level, message) {
  if (LEVELS[level] < LEVEL) return;
  const line = JSON.stringify({ ts: timestamp(), level, msg: message });
  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

export default {
  debug: (msg) => log("debug", msg),
  info:  (msg) => log("info",  msg),
  warn:  (msg) => log("warn",  msg),
  error: (msg) => log("error", msg),
};
