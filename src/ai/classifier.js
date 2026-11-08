// classifier.js: the public API of the AI layer. OWNER: Member 1.
//
//   preloadClassifier(onProgress?)  -> Promise<void>
//       Start downloading the model. Call once when the page opens, so the model
//       is ready by the time the client finishes typing.
//
//   classify(text, onProgress?)     -> Promise<ClassifierResult>
//       Label one commission request. Safe to call repeatedly with the same text:
//       the last results are cached, so changing a dropdown does not re-run the model.
//
// ClassifierResult = {
//   text, normalizedText, model, elapsedMs,
//   factors: {
//     framing:    { label: 'full-body', score: 0.82, confident: true,
//                   scores: { 'headshot': 0.05, 'half-body': 0.13, 'full-body': 0.82 } },
//     style, characters, background, usage   // same shape
//   }
// }
//
// onProgress receives Transformers.js download events, e.g.
//   { status: 'progress', file: 'onnx/model_quantized.onnx', progress: 42.5 }  // percent
//   { status: 'ready' }
// Use `downloadPercent(event)` below to turn them into one 0 to 100 number.

let worker = null;
let nextId = 0;
const pending = new Map(); // id -> { resolve, reject }
const progressListeners = new Set();
const fileProgress = {};
const cache = new Map(); // text -> result (last 10)

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./classifier.worker.js', import.meta.url), { type: 'module' });

  worker.onmessage = ({ data }) => {
    if (data.type === 'progress') {
      for (const listener of progressListeners) listener(data.progress);
      return;
    }
    const call = pending.get(data.id);
    if (!call) return;
    pending.delete(data.id);
    if (data.type === 'error') call.reject(new Error(data.message));
    else call.resolve(data.result);
  };

  worker.onerror = (event) => {
    const error = new Error(event.message || 'The AI worker crashed.');
    for (const call of pending.values()) call.reject(error);
    pending.clear();
    worker = null; // a later call will start a fresh worker
  };
  return worker;
}

function send(message, onProgress) {
  const id = nextId++;
  if (onProgress) progressListeners.add(onProgress);
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, ...message });
  }).finally(() => {
    if (onProgress) progressListeners.delete(onProgress);
  });
}

export function preloadClassifier(onProgress) {
  return send({ type: 'load' }, onProgress);
}

export async function classify(text, onProgress) {
  const key = String(text ?? '').trim();
  if (cache.has(key)) return cache.get(key);

  const result = await send({ type: 'classify', text: key }, onProgress);
  cache.set(key, result);
  if (cache.size > 10) cache.delete(cache.keys().next().value);
  return result;
}

// Combine per-file download events into one overall percentage (0 to 100).
export function downloadPercent(event) {
  if (event?.status === 'progress' && event.file) {
    fileProgress[event.file] = event.progress ?? 0;
  }
  const values = Object.values(fileProgress);
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
