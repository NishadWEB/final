const chats = new Map(); // patientId -> [messages]

// message: { sender: 'patient'|'doctor'|'system', text, timestamp }

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

    // emit via socket.io to patient room
    const io = req.app.get('io');
    if (io) {
      io.to(`patient-${patientId}`).emit('chat-message', message);
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('postMessage error', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
};
