export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('GROQ_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { messages, system } = req.body;

    const groqMessages = [
      { role: 'system', content: system },
      ...messages
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    console.log('Groq response status:', response.status);

    if (!response.ok) {
      console.error('Groq error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || 'Groq API error' });
    }

    const text = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";
    res.status(200).json({ content: [{ text }] });

  } catch (error) {
    console.error('Handler error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
    const data = await response.json();
    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      console.error('Gemini error:', JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || 'Gemini API error' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response.";
    res.status(200).json({ content: [{ text }] });

  } catch (error) {
    console.error('Handler error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
