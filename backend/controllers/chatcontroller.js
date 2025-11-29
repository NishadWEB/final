const axios = require('axios');
const OPENAI_KEY = process.env.OPENAI_API_KEY || null;

async function callOpenAI(promptText) {
  if (!OPENAI_KEY) throw new Error('OpenAI API key not configured');

  const payload = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful, cautious medical assistant. Provide informative, non-diagnostic guidance. Always include a disclaimer that this is not medical advice and recommend consulting a qualified healthcare professional for diagnosis and treatment.' },
      { role: 'user', content: promptText }
    ],
    max_tokens: 500,
    temperature: 0.7
  };

  const resp = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  if (resp && resp.data && resp.data.choices && resp.data.choices[0] && resp.data.choices[0].message) {
    return resp.data.choices[0].message.content.trim();
  }
  throw new Error('Invalid OpenAI response');
}
const chats = new Map(); // patientId -> [messages]

// message: { sender: 'patient'|'doctor'|'system'|'ai', text, timestamp }

const ML_SERVICE = process.env.ML_SERVICE_URL || 'http://localhost:5000';

async function generateAIResponse(text) {
  // Simple heuristics: if user mentions common symptom keywords, call ML /diagnose
  const symptomKeywords = ['fever', 'cough', 'headache', 'nausea', 'vomit', 'diarrhea', 'pain', 'sore throat', 'temperature', 'urination'];
  const t = (text || '').toLowerCase();
  const containsSymptom = symptomKeywords.some(k => t.includes(k));

  if (containsSymptom) {
    // Prefer OpenAI LLM first if configured to produce a friendly, context-aware reply
    if (OPENAI_KEY) {
      try {
        const prompt = `Patient describes: "${text}"\nProvide a concise, empathetic summary, possible explanations, suggested next steps and a clear disclaimer that this is not medical advice.`;
        const llmReply = await callOpenAI(prompt);
        return llmReply;
      } catch (e) {
        console.warn('OpenAI call failed, falling back to ML diagnose:', e.message || e.toString());
        // fall through to ML service
      }
    }

    try {
      const resp = await axios.post(`${ML_SERVICE}/diagnose`, { symptoms: text }, { timeout: 5000 });
      if (resp && resp.data) {
        const d = resp.data;
        const lines = [];
        if (d.diagnosis) lines.push(d.diagnosis + '.');
        if (d.recommendation) lines.push('Recommendation: ' + d.recommendation + '.');
        lines.push('Confidence: ' + (d.confidence !== undefined ? d.confidence : 'n/a'));
        lines.push('Note: This information is informational and not a substitute for professional medical advice.');
        return lines.join(' ');
      }
    } catch (e) {
      console.warn('AI diagnose call failed', e.message || e.toString());
      // fallback friendly reply
      return "I couldn't run a full analysis right now — please provide more details about your symptoms or consult a doctor.";
    }
  }

  // Non-symptom conversational replies (simple, safe canned responses)
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(g => t.startsWith(g))) {
    return 'Hello! I am MediDiag Assistant. How can I help you today? You can describe symptoms or ask about appointments and profiles.';
  }

  if (t.includes('appointment')) {
    return 'To book an appointment, go to "Find Doctors" and choose a time. If you want, tell me which specialty or preferred date and I can help.';
  }

  // Default fallback
  return "Thanks for your message — could you provide a bit more detail so I can assist you?";
}

exports.getMessages = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'patient') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const patientId = req.session.user.patient_id || req.session.user.id || (req.body.patientId);
    const msgs = chats.get(patientId) || [];
    res.json({ messages: msgs });
  } catch (error) {
    console.error('getMessages error', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

exports.postMessage = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'patient') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const patient = req.session.user;
    const patientId = patient.patient_id || patient.id;
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Empty message' });

    const message = {
      sender: 'patient',
      text,
      timestamp: new Date().toISOString()
    };

    const existing = chats.get(patientId) || [];
    existing.push(message);
    chats.set(patientId, existing);

    // emit patient message via socket.io to patient room
    const io = req.app.get('io');
    if (io) {
      io.to(`patient-${patientId}`).emit('chat-message', message);
    }

    // Generate AI reply asynchronously
    (async () => {
      try {
        const aiText = await generateAIResponse(text);
        const aiMessage = {
          sender: 'ai',
          text: aiText,
          timestamp: new Date().toISOString()
        };
        const cur = chats.get(patientId) || [];
        cur.push(aiMessage);
        chats.set(patientId, cur);
        if (io) {
          io.to(`patient-${patientId}`).emit('chat-message', aiMessage);
        }
      } catch (e) {
        console.error('AI response generation failed', e);
      }
    })();

    res.json({ success: true, message });
  } catch (error) {
    console.error('postMessage error', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
};

// expose chats map for other controllers (doctor views, admin tools)
exports.chats = chats;
