'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function FocusTimer() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="card p-6">
      <div className="text-sm text-[color:var(--muted)] mb-2">Focus Timer</div>
      <div className="text-4xl font-semibold tracking-tight">
        {mm}:{ss}
      </div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="default" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Start'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSeconds(25 * 60)}>
          Reset
        </Button>
      </div>
    </div>
  );
}


