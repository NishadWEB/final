
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const { spawn } = require('child_process');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'medidiag-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user data available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Routes
app.use('/', require('./routes/launchpageroutes'));
app.use('/auth', require('./routes/authroutes'));
app.use('/patient', require('./routes/patientroutes'));
app.use('/doctor', require('./routes/doctorroutes'));

// expose io to route handlers via app
app.set('io', io);

// API Routes for ML Service
// Use the built-in local diagnoser directly so no external ML server is required.
app.post('/api/diagnose', async (req, res) => {
  const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  const payload = req.body || {};

  // Try Python ML service first with a short timeout, fall back to localDiagnose if unavailable
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.ML_TIMEOUT_MS || 3000));

    const resp = await fetch(`${mlUrl}/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const json = await resp.json();
      return res.json(json);
    } else {
      console.warn('ML service returned non-OK:', resp.status);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('ML service request timed out');
    } else {
      console.warn('ML service error:', err && err.message ? err.message : err);
    }
  }

  // Fallback to built-in diagnoser
  try {
    const { symptoms } = payload;
    const result = localDiagnose(symptoms || '');
    return res.json(result);
  } catch (err) {
    console.error('Fallback diagnosis error:', err);
    return res.status(500).json({ error: 'Diagnosis failed' });
  }
});

// optional health proxy so clients can call ML health via the Node app
// Health endpoint for the internal diagnoser
app.get('/api/ml-health', (req, res) => {
  res.json({ status: 'internal-diagnoser-ok' });
});

// Simple local rule-based diagnoser used as a fallback when ML service is unreachable
function localDiagnose(text) {
  // Normalize text to tokens (words/phrases)
  let raw = '';
  if (!text) text = '';
  if (Array.isArray(text)) {
    raw = text.join(' ');
  } else {
    raw = String(text || '');
  }
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleaned = normalize(raw);
  const tokens = cleaned.split(' ').filter(Boolean);

  // synonyms mapping: map common variants to canonical symptom tokens
  const synonyms = {
    fever: ['fever', 'temperature', 'febrile', 'high temperature'],
    cough: ['cough', 'coughing'],
    headache: ['headache', 'migraine', 'head pain'],
    nausea: ['nausea', 'nauseous', 'queasy'],
    vomiting: ['vomit', 'vomiting', 'throwing up'],
    diarrhea: ['diarrhea', 'loose stool', 'runny stools'],
    sore_throat: ['sore throat', 'throat pain', 'throat soreness'],
    runny_nose: ['runny nose', 'runny-nose', 'runny'],
    sneezing: ['sneezing', 'sneeze'],
    congestion: ['congestion', 'stuffy', 'blocked nose', 'nasal congestion'],
    fatigue: ['fatigue', 'tired', 'exhausted'],
    body_aches: ['body aches', 'muscle aches', 'myalgia'],
    painful_urination: ['painful urination', 'burning urine', 'dysuria'],
    itchy_eyes: ['itchy eyes', 'itchy eye', 'itching eyes']
  };

  // invert synonyms for quick lookup
  const synToCanon = {};
  Object.keys(synonyms).forEach(canon => {
    synonyms[canon].forEach(w => synToCanon[w] = canon);
  });

  // disease rules with canonical symptom tokens
  const rules = [
    { key: 'flu', keywords: ['fever', 'cough', 'body_aches', 'headache', 'fatigue', 'chills'], name: 'Influenza (Flu)', severity: 'medium', needs_doctor: true, rec: 'Rest, fluids, see doctor if high fever or worsening.' },
    { key: 'common_cold', keywords: ['cough', 'sore_throat', 'sneezing', 'runny_nose', 'congestion'], name: 'Common Cold', severity: 'low', needs_doctor: false, rec: 'Rest, hydration, over-the-counter cold medicines.' },
    { key: 'migraine', keywords: ['headache', 'nausea', 'sensitivity_to_light'], name: 'Migraine', severity: 'medium', needs_doctor: true, rec: 'Rest in a quiet/dark room; avoid triggers; seek care if severe.' },
    { key: 'gastro', keywords: ['nausea', 'vomiting', 'diarrhea', 'stomach_cramps'], name: 'Gastroenteritis', severity: 'medium', needs_doctor: false, rec: 'Hydration and bland diet; seek care if persistent or severe.' },
    { key: 'allergies', keywords: ['sneezing', 'runny_nose', 'itchy_eyes', 'congestion'], name: 'Allergic Rhinitis', severity: 'low', needs_doctor: false, rec: 'Antihistamines; avoid known allergens.' },
    { key: 'uti', keywords: ['painful_urination', 'frequent_urination', 'lower_abdominal_pain'], name: 'Urinary Tract Infection', severity: 'high', needs_doctor: true, rec: 'Seek medical attention for testing and antibiotics.' }
  ];

  // Map tokens to canonical symptom keys by substring matching against synonyms
  const found = new Set();
  const matchedTokens = [];
  tokens.forEach(tok => {
    // try direct synonym matches (multi-word synonyms included in synToCanon keys)
    Object.keys(synToCanon).forEach(phrase => {
      if (tok === phrase || cleaned.includes(phrase)) {
        found.add(synToCanon[phrase]);
        matchedTokens.push(phrase);
      }
    });
    // also match canonical words directly
    Object.keys(synonyms).forEach(canon => {
      const canonWord = canon.replace(/_/g, ' ');
      if (tok === canon || tok === canonWord || cleaned.includes(canonWord)) {
        found.add(canon);
        matchedTokens.push(canonWord);
      }
    });
  });

  // Score each rule by how many of its canonical keywords are present
  const scores = rules.map(rule => {
    let matched = 0;
    rule.keywords.forEach(kw => {
      const kwWord = kw.replace(/_/g, ' ');
      if (found.has(kw) || found.has(kwWord) || cleaned.includes(kwWord)) matched++;
    });
    return { rule, matched };
  }).filter(s => s.matched > 0);

  if (scores.length === 0) {
    return {
      diagnosis: 'Unable to identify specific symptoms. Please provide more details or select common symptoms.',
      recommendation: 'If symptoms are severe or worsening, consult a healthcare professional.',
      severity: 'unknown',
      needs_doctor: true,
      confidence: 0.0,
      identified_symptoms: Array.from(found),
      raw_input: raw
    };
  }

  // Choose best by normalized match fraction
  scores.forEach(s => {
    s.score = s.matched / Math.max(1, s.rule.keywords.length);
  });
  scores.sort((a, b) => b.score - a.score || b.matched - a.matched);
  const top = scores[0];
  // confidence scales with match fraction and amount of evidence
  const baseConf = Math.min(1.0, top.score);
  const evidenceFactor = Math.min(1.0, Math.log(1 + top.matched) / Math.log(1 + top.rule.keywords.length));
  const confidence = Number(Math.max(0.05, Math.min(0.99, baseConf * 0.8 + evidenceFactor * 0.2)).toFixed(2));

  return {
    diagnosis: `Possible ${top.rule.name}`,
    recommendation: top.rule.rec,
    severity: top.rule.severity,
    needs_doctor: top.rule.needs_doctor,
    confidence: confidence,
    identified_symptoms: Array.from(found),
    matched_keywords: top.matched,
    raw_input: raw
  };
}

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-appointment', (appointmentId) => {
    socket.join(`appointment-${appointmentId}`);
  });

  // allow clients to join a patient-specific room for chat
  socket.on('join-patient', (patientId) => {
    try {
      socket.join(`patient-${patientId}`);
    } catch (e) {
      console.error('join-patient error', e);
    }
  });

  socket.on('send-message', (data) => {
    io.to(`appointment-${data.appointmentId}`).emit('new-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  res.status(500).render('error', { 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
    user: req.session.user
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    error: 'Page not found',
    user: req.session.user
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 ML Service: ${process.env.ML_SERVICE_URL || 'http://localhost:5000'}`);
  console.log(`💾 Database: ${process.env.DB_NAME || 'medidiag'}`);
});

// Optionally auto-start the Python ML service when the Node server starts.
// Enable by setting AUTO_START_ML=true in your environment. This will spawn
// `python ml_service/model.py` from the repository root and inherit NODE env vars.
if (process.env.AUTO_START_ML === 'true') {
  try {
    const mlCmd = process.platform === 'win32' ? 'python' : 'python3';
    const mlProcess = spawn(mlCmd, ['ml_service/model.py'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: process.env.ML_PORT || '5000' },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    mlProcess.stdout.on('data', (d) => process.stdout.write(`[ml] ${d}`));
    mlProcess.stderr.on('data', (d) => process.stderr.write(`[ml err] ${d}`));

    mlProcess.on('close', (code) => {
      console.log(`ML process exited with code ${code}`);
    });

    process.on('exit', () => {
      try { mlProcess.kill(); } catch (e) {}
    });
  } catch (e) {
    console.error('Failed to auto-start ML service:', e.message || e);
  }
}
