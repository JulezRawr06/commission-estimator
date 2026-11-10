// render.js: draws the chat and the estimate card. OWNER: Member 3.
import { factorLabels } from '../ai/labels.js';

// Formats numbers as Philippine pesos with no decimals, e.g. 1200 -> "₱1,200".
const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

// The chat area. Looked up once here instead of relying on the browser's
// automatic `window.messages` global for elements with an id.
const messages = document.querySelector('#messages');

const factorNames = {
  framing: 'Framing',
  style: 'Art style',
  characters: 'Characters',
  background: 'Background',
  usage: 'Use',
};

const questions = {
  framing: 'Do you want a headshot, half-body, or full-body piece?',
  style: 'Which art style do you want?',
  characters: 'How many characters should be in the artwork?',
  background: 'Do you want no background, a simple one, or a detailed one?',
  usage: 'Is this for personal use or commercial use?'
};

// Remembers whether the client opened "How this price was worked out", so the
// section stays open when a correction redraws the card.
let breakdownOpen = false;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function makeSelect(factor, selected, onCorrect) {
  const select = document.createElement('select');
  select.setAttribute('aria-label', factorNames[factor]);
  if (!selected) select.append(new Option('Choose one', ''));
  for (const label of factorLabels[factor]) {
    select.append(new Option(label, label, false, label === selected));
  }
  select.addEventListener('change', () => onCorrect(factor, select.value));
  return select;
}

// One line of the breakdown, e.g. "Two characters (+80%)".
function describeStep(step) {
  const name = factorNames[step.factor].toLowerCase();
  switch (step.kind) {
    case 'base':
      return `${step.label} base price`;
    case 'multiply':
      return `${step.label} ${name} (×${step.value.toFixed(2)})`;
    case 'add-percent':
      return step.value === 0
        ? `${step.label} character (included)`
        : `${step.label} characters (+${Math.round(step.value * 100)}%)`;
    case 'add':
      return step.value === 0
        ? `${step.label === 'none' ? 'no' : step.label} background (free)`
        : `${step.label} background (+${peso.format(step.value)})`;
    default:
      return `${name}: ${step.label}`;
  }
}

function renderBreakdown(estimate) {
  const details = el('details', 'breakdown');
  details.open = breakdownOpen;
  details.addEventListener('toggle', () => { breakdownOpen = details.open; });
  details.append(el('summary', null, 'How this price was worked out'));

  const list = el('ol');
  for (const step of estimate.breakdown) {
    const li = el('li');
    const what = el('span', null, describeStep(step));
    if (step.assumed) what.append(el('em', 'assumed', ' assumed'));
    li.append(what, el('span', 'amount', peso.format(step.subtotal)));
    list.append(li);
  }
  const range = el('li', 'range');
  range.append(
    el('span', null, `Range (±${Math.round(estimate.rangeFactor * 100)}%)`),
    el('span', 'amount', `${peso.format(estimate.low)} to ${peso.format(estimate.high)}`),
  );
  list.append(range);
  details.append(list);

  if (estimate.assumed.length) {
    details.append(el('p', 'hint', 'The range is wider while some details are missing. Answer the questions above to narrow it.'));
  }
  return details;
}

export function renderEstimate(estimate, corrections, onCorrect) {
  const card = el('article', 'card');

  const price = el('h2', null, `${peso.format(estimate.low)} to ${peso.format(estimate.high)}`);
  card.append(price);

  if (estimate.understood.length) {
    card.append(el('h3', null, 'What I understood (change anything that is wrong)'));
    const list = el('ul');
    for (const item of estimate.understood) {
      const li = el('li');
      const chosen = Boolean(corrections[item.factor]);
      const score = el('span', 'score', chosen ? 'your choice' : `${Math.round(item.score * 100)}% sure`);
      li.append(
        el('span', 'factor', factorNames[item.factor]),
        makeSelect(item.factor, corrections[item.factor] ?? item.label, onCorrect),
        score,
      );
      list.append(li);
    }
    card.append(list);
  }

  if (estimate.missing.length) {
    card.append(el('h3', null, 'A few questions to make the price more accurate'));
  }
  const assumedLabel = Object.fromEntries((estimate.assumed ?? []).map((a) => [a.factor, a.label]));
  for (const item of estimate.missing) {
    const p = el('p', 'followup', `${questions[item.factor]} `);
    p.append(makeSelect(item.factor, corrections[item.factor] ?? '', onCorrect));
    if (assumedLabel[item.factor]) {
      p.append(el('small', 'assumed-note', `For now the price assumes: ${assumedLabel[item.factor]}.`));
    }
    card.append(p);
  }

  if (estimate.breakdown) card.append(renderBreakdown(estimate));

  const copyButton = el('button', null, 'Copy summary');
  copyButton.type = 'button';
  copyButton.addEventListener('click', () => copySummary(estimate));
  card.append(copyButton);

  card.append(el('p', 'note', 'This is an estimate. The artist gives the final quote.'));

  messages.append(card);
  card.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return card;
}

export function addMessage(text, who) {
    const bubble = document.createElement('div');
    bubble.className = `bubble-${who}`;
    bubble.textContent = text;

    messages.append(bubble);

    bubble.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
    });
}

const statusBanner = document.querySelector('#status');
const sendButton = document.querySelector('#request-form button');

// state: 'loading' (send button disabled), 'busy' (message only), 'ready', 'error'
export function setStatus(state, message = '') {
  statusBanner.dataset.state = state;
  statusBanner.setAttribute('role', state === 'error' ? 'alert' : 'status');
  statusBanner.textContent = message;
  sendButton.disabled = state === 'loading';
}

// Text the client can paste into a message to the artist. Lists every factor,
// including follow-up answers (they arrive as understood after a correction)
// and anything the price only assumed.
export function summaryText(estimate) {
  const parts = estimate.breakdown
    ? estimate.breakdown.map((s) => `${factorNames[s.factor]}: ${s.label}${s.assumed ? ' (not specified)' : ''}`)
    : estimate.understood.map((item) => `${factorNames[item.factor]}: ${item.label}`);
  return `Commission estimate ${peso.format(estimate.low)} to ${peso.format(estimate.high)}. ${parts.join(', ')}.`;
}

async function copySummary(estimate) {
  const summary = summaryText(estimate);
  try {
    await navigator.clipboard.writeText(summary);
    setStatus('ready', 'Summary copied. Paste it into your message to the artist.');
  } catch (error) {
    window.prompt('Copy this summary:', summary);
  }
}
