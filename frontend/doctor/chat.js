document.addEventListener('DOMContentLoaded', () => {
  const data = JSON.parse(document.getElementById('PAGE_DATA').textContent || '{}');
  const patientId = data.patientId;
  const user = data.user || {};

  const socket = io();
  // join the patient room so we receive messages for that patient
  socket.emit('join-patient', { patientId });

  const messagesEl = document.getElementById('messages');
  function appendMessage(m) {
    const d = document.createElement('div');
    d.className = 'msg ' + (m.sender || 'unknown');
    d.innerHTML = `<strong>${m.sender}:</strong> ${m.text} <small>${new Date(m.timestamp).toLocaleString()}</small>`;
    messagesEl.appendChild(d);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  socket.on('chat-message', (m) => {
    appendMessage(m);
  });

  const form = document.getElementById('sendForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const textEl = document.getElementById('msgText');
    const text = (textEl.value || '').trim();
    if (!text) return;

    try {
      const resp = await fetch(`/doctor/chats/${encodeURIComponent(patientId)}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const j = await resp.json();
      if (j && j.success) {
        appendMessage(j.message);
        textEl.value = '';
      } else {
        alert('Failed to send message');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  });
});
