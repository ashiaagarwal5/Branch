import { env } from '../config/env';

interface ClassificationRequest {
  title?: string;
  url?: string;
  domain?: string;
  text?: string;
}

export async function classifyActivity(payload: ClassificationRequest) {
  if (!env.classificationServiceUrl) {
    throw Object.assign(
      new Error('Classification service URL not configured'),
      {
        status: 503,
        code: 'classification_unavailable',
      }
    );
  }

  const response = await fetch(`${env.classificationServiceUrl}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw Object.assign(new Error('Classification request failed'), {
      status: 502,
      code: 'classification_failed',
      details: text,
    });
  }

  return response.json();
}
