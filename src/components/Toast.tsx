import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

type Props = { message: string | null; onDone: () => void };

export default function Toast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 200);
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 transition-all sm:bottom-6 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        {message}
      </div>
    </div>
  );
}
