import { sampleEstimate } from '../mock/sampleEstimate.js';

// request = { text: 'what the client typed', corrections: { factor: 'label' } }
export async function getEstimate(request) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return sampleEstimate;
}