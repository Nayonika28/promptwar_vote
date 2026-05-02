export async function translateText(text: string, targetLanguage: string) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLanguage }),
  });
  if (!response.ok) throw new Error('Translation failed');
  return response.json();
}

export async function textToSpeech(text: string, languageCode: string) {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, languageCode }),
  });
  if (!response.ok) throw new Error('TTS failed');
  return response.json();
}

export async function speechToText(audioContent: string, languageCode: string) {
  const response = await fetch('/api/stt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioContent, languageCode }),
  });
  if (!response.ok) throw new Error('STT failed');
  return response.json();
}
