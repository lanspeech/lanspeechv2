import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMicrophoneRecording } from '../hooks/useMicrophoneRecording';

export default function DebugRecord() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const { recording, audioUrl, recordingSaved, loading, error, startRecording, stopRecording, clearRecording, lastUploadResult, lastInsertResult } = useMicrophoneRecording();
  if (!import.meta.env.DEV) return null;

  const append = (msg: string) => setLogs(l => [new Date().toISOString() + ' - ' + msg, ...l].slice(0, 200));

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-3">Debug: Recording & Upload</h2>
        <p className="text-sm text-gray-600 mb-4">User: {user?.email ?? 'not signed in'} {user?.id && <span className="ml-2 text-xs text-gray-400">{user.id}</span>}</p>

        <div className="flex gap-3 mb-4">
          <button onClick={async () => { append('startRecording'); await startRecording(); }} disabled={recording} className="px-4 py-2 rounded bg-emerald-600 text-white">Start</button>
          <button onClick={async () => { append('stopRecording'); await stopRecording(); }} disabled={!recording} className="px-4 py-2 rounded bg-red-500 text-white">Stop</button>
          <button onClick={async () => { append('clearRecording'); await clearRecording(); }} className="px-4 py-2 rounded border">Clear</button>
        </div>

        <div className="mb-4">
          <div className="text-sm">Status: {recording ? 'recording' : recordingSaved ? 'saved' : 'idle'} {loading && '(loading...)'}</div>
          {error && <div className="mt-2 text-sm text-red-600">Error: {error}</div>}
        </div>

        {audioUrl && (
          <div className="mb-4">
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4">
          <div>
            <h3 className="font-medium mb-2">Recent logs</h3>
            <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto text-xs font-mono">
              {logs.length === 0 ? <div className="text-gray-400">No logs yet.</div> : logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Last storage upload response</h3>
            <pre className="bg-white p-3 rounded border max-h-40 overflow-y-auto text-xs font-mono">{JSON.stringify(lastUploadResult, null, 2)}</pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">Last DB insert response</h3>
            <pre className="bg-white p-3 rounded border max-h-40 overflow-y-auto text-xs font-mono">{JSON.stringify(lastInsertResult, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
