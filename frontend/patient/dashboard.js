class PatientDashboard {
  constructor() {
    this.initEventListeners();
    this.loadAppointments();
    this.initDiagnosisTool();
  }

  initEventListeners() {
    // Booking modal
    const bookButtons = document.querySelectorAll('.book-appointment');
    const bookingModal = document.querySelector('.booking-modal');
    const closeModal = document.querySelector('.close-modal');

    bookButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const doctorId = e.target.dataset.doctorId;
        this.openBookingModal(doctorId);
      });
    });

    closeModal.addEventListener('click', () => {
      bookingModal.classList.remove('active');
    });

    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) {
        bookingModal.classList.remove('active');
      }
    });

    // Booking form submission
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => this.handleBooking(e));
    }
  }

  openBookingModal(doctorId) {
    const modal = document.querySelector('.booking-modal');
    const doctorName = document.querySelector(`[data-doctor-id="${doctorId}"]`).closest('.doctor-card').querySelector('h4').textContent;
    
    document.getElementById('modal-doctor-name').textContent = doctorName;
    document.getElementById('doctor_id').value = doctorId;
    
    modal.classList.add('active');
  }

  async handleBooking(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      const response = await fetch('/patient/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Appointment booked successfully!');
        document.querySelector('.booking-modal').classList.remove('active');
        this.loadAppointments();
      } else {
        alert('Error booking appointment: ' + result.error);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Error booking appointment');
    }
  }

  async loadAppointments() {
    try {
      const response = await fetch('/patient/appointments');
      const html = await response.text();
      
      // This would typically update a specific section of the page
      // For now, we'll just log success
      console.log('Appointments loaded');
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }

  initDiagnosisTool() {
    const diagnoseBtn = document.getElementById('diagnose-btn');
    const symptomsInput = document.getElementById('symptoms');
    const diagnosisResult = document.getElementById('diagnosis-result');

    if (diagnoseBtn) {
      diagnoseBtn.addEventListener('click', async () => {
        const symptoms = symptomsInput.value.trim();
        
        if (!symptoms) {
          alert('Please describe your symptoms');
          return;
        }

        diagnoseBtn.disabled = true;
        diagnoseBtn.textContent = 'Analyzing...';

        try {
          // This would call your ML service
          const response = await fetch('/api/diagnose', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symptoms })
          });

          const result = await response.json();
          
          diagnosisResult.innerHTML = `
            <h4>Preliminary Analysis</h4>
            <p>${result.diagnosis}</p>
            ${result.recommendation ? `<p><strong>Recommendation:</strong> ${result.recommendation}</p>` : ''}
            ${result.severity === 'high' ? '<div class="alert alert-error">Please consult a doctor immediately</div>' : ''}
          `;
          // Make sure the result is visible
          diagnosisResult.style.display = 'block';
          diagnosisResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
        } catch (error) {
          console.error('Diagnosis error:', error);
          diagnosisResult.innerHTML = '<div class="alert alert-error">Error analyzing symptoms. Please try again.</div>';
        } finally {
          diagnoseBtn.disabled = false;
          diagnoseBtn.textContent = 'Analyze Symptoms';
        }
      });
    }
  }

  initChat() {
    // Chat UI elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    if (!chatMessages || !chatInput || !chatSend) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const res = await fetch('/patient/chat/messages');
        const data = await res.json();
        chatMessages.innerHTML = '';
        (data.messages || []).forEach(m => {
          const el = document.createElement('div');
          el.className = 'chat-message ' + (m.sender === 'patient' ? 'me' : m.sender);
          el.innerHTML = `<div class="chat-text">${m.text}</div><div class="chat-time">${new Date(m.timestamp).toLocaleString()}</div>`;
          chatMessages.appendChild(el);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } catch (e) {
        console.error('Failed to fetch chat messages', e);
      }
    };

    fetchMessages();

    // Setup socket.io connection and realtime updates
    if (typeof io !== 'undefined') {
      try {
        const socket = io();
        // join patient room if patientId available
        if (window.CURRENT_USER && window.CURRENT_USER.patientId) {
          socket.emit('join-patient', window.CURRENT_USER.patientId);
        }

        socket.on('chat-message', (m) => {
          const el = document.createElement('div');
          el.className = 'chat-message ' + (m.sender === 'patient' ? 'me' : m.sender);
          el.innerHTML = `<div class="chat-text">${m.text}</div><div class="chat-time">${new Date(m.timestamp).toLocaleString()}</div>`;
          chatMessages.appendChild(el);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        });
      } catch (e) {
        console.warn('Socket.IO unavailable', e);
      }
    }

    // Send message handler
    chatSend.addEventListener('click', async () => {
      const text = chatInput.value.trim();
      if (!text) return;
      chatSend.disabled = true;
      try {
        const res = await fetch('/patient/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (data.success) {
          chatInput.value = '';
        } else {
          alert('Failed to send message');
        }
      } catch (e) {
        console.error('Chat send error', e);
        alert('Failed to send message');
      } finally {
        chatSend.disabled = false;
      }
    });
  }
}

// Initialize patient dashboard
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.patient-dashboard')) {
    const dashboard = new PatientDashboard();
    // initialize chat after constructor
    dashboard.initChat();
  }
});