import { factorLabels } from '../mock/factorLabels.js';

const questions = {
  framing: 'Do you want a headshot, half-body, or full-body piece?',
  style: 'Which art style do you want?',
  characters: 'How many characters should be in the artwork?',
  background: 'Do you want no background, a simple one, or a detailed one?',
  usage: 'Is this for personal use or commercial use?'
};

function makeSelect(factor, selected, onCorrect) {
  const select = document.createElement('select');
  select.setAttribute('aria-label', factor);
  if (!selected) select.append(new Option('Choose one', ''));
  for (const label of factorLabels[factor]) {
    select.append(new Option(label, label, false, label === selected));
  }
  select.addEventListener('change', () => onCorrect(factor, select.value));
  return select;
}

export function renderEstimate(estimate, corrections, onCorrect) {
  const card = document.createElement('article');
  card.className = 'card';

  const price = document.createElement('h2');
  price.textContent = `${peso.format(estimate.low)} to ${peso.format(estimate.high)}`;

  const heading = document.createElement('h3');
  heading.textContent = 'What I understood (change anything that is wrong)';

  const list = document.createElement('ul');
  for (const item of estimate.understood) {
    const li = document.createElement('li');
    li.append(`${item.factor}: `, makeSelect(item.factor, corrections[item.factor] ?? item.label, onCorrect));
    list.append(li);
  }
  card.append(price, heading, list);

  for (const item of estimate.missing) {
    const p = document.createElement('p');
    p.append(`${questions[item.factor]} `, makeSelect(item.factor, corrections[item.factor] ?? '', onCorrect));
    card.append(p);
  }

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.textContent = 'Copy summary';
  copyButton.addEventListener('click', () => copySummary(estimate, corrections));
  card.append(copyButton);

  const note = document.createElement('p');
  note.textContent = 'This is an estimate. The artist gives the final quote.';
  card.append(note);

  messages.append(card);
  card.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return card;
}

export function addMessage(text, who) {
    const bubble = document.createElement('div');
    bubble.className = `bubble-${who}`;
    bubble.textContent = text;

    const messages = document.querySelector('#messages');
    messages.append(bubble);

    bubble.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
    });
}

const statusBanner = document.querySelector('#status');
const sendButton = document.querySelector('#request-form button');

export function setStatus(state, message = '') {
  statusBanner.dataset.state = state;
  statusBanner.setAttribute('role', state === 'error' ? 'alert' : 'status');
  statusBanner.textContent = message;
  sendButton.disabled = state === 'loading';
}

async function copySummary(estimate, corrections) {
  const parts = estimate.understood.map((item) => `${item.factor}: ${corrections[item.factor] ?? item.label}`);
  const summary = `Commission estimate ${peso.format(estimate.low)} to ${peso.format(estimate.high)} (${parts.join(', ')})`;
  try {
    await navigator.clipboard.writeText(summary);
    setStatus('ready', 'Summary copied. Paste it into your message to the artist.');
  } catch (error) {
    window.prompt('Copy this summary:', summary);
  }
}