export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { messages, system } = req.body;

    // Strip any extra fields Groq doesn't accept (e.g. videoQuery)
    const cleanMessages = messages.map(({ role, content }) => ({ role, content }));

    const enhancedSystem = system + `

At the end of every response, on a new line, add exactly this format if a video would help:
VIDEO_QUERY: [specific youtube search query in english, max 6 words]

Only include VIDEO_QUERY if a video would genuinely help illustrate your answer (technique, drill, exercise). 
Do NOT include VIDEO_QUERY for strategy questions, mental game, rules, gear advice, or general conversation.
Example: VIDEO_QUERY: tennis topspin forehand technique drill`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: enhancedSystem }, ...cleanMessages],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'Groq error' });

    const raw = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";

    // Extract VIDEO_QUERY if present
    const videoMatch = raw.match(/VIDEO_QUERY:\s*(.+)$/m);
    const videoQuery = videoMatch ? videoMatch[1].trim() : null;

    // Clean the text — remove the VIDEO_QUERY line from displayed response
    const text = raw.replace(/\nVIDEO_QUERY:.*$/m, '').trim();

    res.status(200).json({ content: [{ text, videoQuery }] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'Groq error' });

    const raw = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";

    // Extract VIDEO_QUERY if present
    const videoMatch = raw.match(/VIDEO_QUERY:\s*(.+)$/m);
    const videoQuery = videoMatch ? videoMatch[1].trim() : null;

    // Clean the text — remove the VIDEO_QUERY line from displayed response
    const text = raw.replace(/\nVIDEO_QUERY:.*$/m, '').trim();

    res.status(200).json({ content: [{ text, videoQuery }] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
