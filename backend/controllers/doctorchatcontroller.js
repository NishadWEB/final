const chatController = require('./chatcontroller');
const chats = chatController.chats;

exports.listPatients = (req, res) => {
  try {
    if (!req.session || !req.session.user || req.session.user.role !== 'doctor') {
      return res.redirect('/auth/login');
    }

    const patientList = Array.from(chats.keys()).map(pid => {
      const msgs = chats.get(pid) || [];
      const last = msgs.length ? msgs[msgs.length - 1] : null;
      return {
        patientId: pid,
        lastMessage: last ? last.text : '',
        lastAt: last ? last.timestamp : null,
        count: msgs.length
      };
    });

    res.render('doctor/chat_list', { patients: patientList, user: req.session.user });
  } catch (e) {
    console.error('listPatients error', e);
    res.status(500).send('Server error');
  }
};

exports.viewPatient = (req, res) => {
  try {
    if (!req.session || !req.session.user || req.session.user.role !== 'doctor') {
      return res.redirect('/auth/login');
    }

    const patientId = req.params.patientId;
    const msgs = chats.get(patientId) || [];
    res.render('doctor/chat_view', { messages: msgs, patientId, user: req.session.user });
  } catch (e) {
    console.error('viewPatient error', e);
    res.status(500).send('Server error');
  }
};

exports.postMessage = (req, res) => {
  try {
    if (!req.session || !req.session.user || req.session.user.role !== 'doctor') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const patientId = req.params.patientId;
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Empty message' });

    const message = {
      sender: 'doctor',
      text,
      timestamp: new Date().toISOString()
    };

    const existing = chats.get(patientId) || [];
    existing.push(message);
    chats.set(patientId, existing);

    const io = req.app.get('io');
    if (io) {
      io.to(`patient-${patientId}`).emit('chat-message', message);
    }

    // respond JSON for fetch-based UI
    res.json({ success: true, message });
  } catch (e) {
    console.error('doctor postMessage error', e);
    res.status(500).json({ error: 'Server error' });
  }
};
