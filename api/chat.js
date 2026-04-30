const https = require('https');

const SYSTEM_PROMPT = `You are AceCoach, an expert AI tennis coach with 20+ years of experience coaching recreational players from beginner to advanced club level.
Your personality: encouraging, precise, practical. You speak like a seasoned coach on a courtside bench — direct, warm, knowledgeable.
You help players with technique problems, practice routines, mental game, match strategy, rules, gear advice, and drills.
Always ask follow-up questions to personalize advice. Keep responses focused and actionable. Use short paragraphs. Never be vague.
IMPORTANT: Always respond in the same language the user writes in. If they write in Spanish respond in Spanish, French in French, Italian in Italian, German in German, Arabic in Arabic, Chinese in Chinese.

At the end of every response, on a new line, add exactly this format if a video would help:
VIDEO_QUERY: [specific youtube search query in english, max 6 words]

Only include VIDEO_QUERY if a video would genuinely help illustrate your answer (technique, drill, exercise).
Do NOT include VIDEO_QUERY for strategy questions, mental game, rules, gear advice, or general conversation.
Example: VIDEO_QUERY: tennis topspin forehand technique drill`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Basic token check to prevent casual abuse
  const appToken = req.headers['x-app-token'];
  if (appToken !== process.env.APP_SECRET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { messages } = req.body;

    // Strip any extra fields Groq doesn't accept
    const cleanMessages = messages.map(({ role, content }) => ({ role, content }));

    const payload = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...cleanMessages],
      max_tokens: 1000
    });

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const request = https.request(options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          try { resolve({ status: response.statusCode, data: JSON.parse(body) }); }
          catch(e) { reject(new Error('Invalid JSON response')); }
        });
      });

      request.on('error', reject);
      request.write(payload);
      request.end();
    });

    if (data.status !== 200) {
      return res.status(500).json({ error: data.data.error?.message || 'Groq error' });
    }

    const raw = data.data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";
    const videoMatch = raw.match(/VIDEO_QUERY:\s*(.+)$/m);
    const videoQuery = videoMatch ? videoMatch[1].trim() : null;
    const text = raw.replace(/\nVIDEO_QUERY:.*$/m, '').trim();

    res.status(200).json({ content: [{ text, videoQuery }] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
