import { useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  message: string;
  type?: 'success' | 'error';
  onDone: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onDone, duration = 2800 }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div className="fixed bottom-6 left-4 right-4 mx-auto z-[60] animate-bounce-in sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
      <div className={`mx-auto max-w-xl flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium ${
        type === 'success'
          ? 'bg-emerald-700 text-white'
          : 'bg-red-600 text-white'
      }`}>
        {type === 'success'
          ? <CheckCircle size={16} className="shrink-0" />
          : <AlertCircle size={16} className="shrink-0" />}
        {message}
      </div>
    </div>
  );
}
