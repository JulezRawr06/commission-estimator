// normalize.js: turns common Filipino / Taglish commission phrases into plain English
// BEFORE the model reads the message. The model is English-only, so this simple
// rule-based step covers its biggest weakness and is easy to explain in the demo.
//
// TO EXTEND: add rows as [regex, 'english replacement']. Ask a Filipino-speaking
// groupmate or the artist which phrases real clients use, and add every miss found
// in testRequests.js. Order matters: put longer phrases first.

const GLOSSARY = [
  // framing
  [/buong katawan|buo ang katawan|full[\s-]?body/gi, 'full body'],
  [/hanggang (bewang|baywang|beywang)|waist[\s-]?up|half[\s-]?body/gi, 'half body'],
  [/mukha lang|face lang|headshot|bust[\s-]?up/gi, 'headshot portrait'],

  // characters
  [/\b(dalawang|2) (tao|karakter|character|oc)s?\b/gi, 'two characters'],
  [/\b(tatlong|apat na|limang|maraming|3|4|5) (tao|karakter|character|oc)s?\b/gi, 'three or more characters'],
  [/\b(isang|1) (tao|karakter|character|oc)\b|\bsolo\b/gi, 'one character'],
  [/\bmagkapatid|mag-?jowa|mag-?bestfriend|mag-?kaibigan|couple\b/gi, 'two characters'],

  // background
  [/walang background|walang backdrop|no background/gi, 'no background'],
  [/simpleng background|simple lang ang background|plain background|blangko/gi, 'simple background'],
  [/detalyadong background|may detalyadong|maraming detalye sa background|buong eksena/gi, 'detailed background'],

  // usage
  [/pang-?negosyo|para sa negosyo|para sa business|pang-?business|pang-?merch|pang-?logo|para sa shop|pang-?benta/gi, 'commercial use'],
  [/pang-?personal|para sa sarili|pang-?pfp|pang-?profile pic|pang-?regalo|regalo/gi, 'personal use'],

  // style
  [/makatotohanan|parang totoo/gi, 'realistic'],
  [/pixel(?!\s*art)/gi, 'pixel art'],
];

export function normalize(text) {
  let out = String(text ?? '').trim();
  for (const [pattern, replacement] of GLOSSARY) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
