if (typeof document !== 'undefined') {
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    root.innerHTML =
      '<div style="font-family:ui-monospace,Menlo,Consolas,monospace;color:#94a3b8;background:#0f172a;display:flex;align-items:center;justify-content:center;height:100%;font-size:14px;">Loading FlavorFlow…</div>';
  }

  const escape = (s: string) =>
    s.replace(/[<>&]/g, (c) =>
      c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'
    );

  const paintError = (label: string, err: unknown) => {
    const target = document.getElementById('root');
    if (!target) return;
    const detail =
      err instanceof Error
        ? `${err.name}: ${err.message}\n\n${err.stack ?? ''}`
        : String(err);
    target.innerHTML =
      '<div style="font-family:ui-monospace,Menlo,Consolas,monospace;color:#fee2e2;background:#0f172a;padding:24px;height:100%;box-sizing:border-box;overflow:auto;font-size:13px;line-height:1.5;"><h1 style="color:#fca5a5;margin:0 0 8px 0;font-size:18px;">' +
      escape(label) +
      '</h1><pre style="white-space:pre-wrap;background:#1e293b;padding:12px;border-radius:8px;border:1px solid #334155;">' +
      escape(detail) +
      '</pre></div>';
  };

  window.addEventListener('error', (e) =>
    paintError('FlavorFlow runtime error', e.error ?? e.message)
  );
  window.addEventListener('unhandledrejection', (e) =>
    paintError('FlavorFlow unhandled promise', e.reason)
  );
}

export {};
