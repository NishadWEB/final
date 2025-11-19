class DoctorDashboard {
  constructor() {
    this.initEventListeners();
    this.loadAppointments();
    this.initAvailabilityToggle();
  }

  initEventListeners() {
    // Appointment action buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('view-appointment')) {
        this.viewAppointment(e.target.dataset.appointmentId);
      }
      
      if (e.target.classList.contains('complete-appointment')) {
        this.completeAppointment(e.target.dataset.appointmentId);
      }
    });

    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
          modal.classList.remove('active');
        });
      });
    });

    // Appointment form submission
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
      appointmentForm.addEventListener('submit', (e) => this.handleAppointmentUpdate(e));
    }
  }

  async viewAppointment(appointmentId) {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`);
      const appointment = await response.json();
      
      this.showAppointmentModal(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      alert('Error loading appointment details');
    }
  }

  showAppointmentModal(appointment) {
    const modal = document.getElementById('appointment-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
      <div class="modal-header">
        <h3>Appointment Details</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="patient-details">
        <h4>Patient Information</h4>
        <p><strong>Name:</strong> ${appointment.patient_name}</p>
        <p><strong>Phone:</strong> ${appointment.patient_phone}</p>
      </div>
      <div class="appointment-info">
        <p><strong>Date & Time:</strong> ${new Date(appointment.appointment_date).toLocaleString()}</p>
        <p><strong>Symptoms:</strong> ${appointment.symptoms}</p>
        ${appointment.preliminary_diagnosis ? `<p><strong>Preliminary Diagnosis:</strong> ${appointment.preliminary_diagnosis}</p>` : ''}
      </div>
      <form id="appointment-form">
        <input type="hidden" name="appointment_id" value="${appointment.id}">
        <div class="form-group">
          <label class="form-label">Doctor Notes</label>
          <textarea name="doctor_notes" class="form-control" rows="4">${appointment.doctor_notes || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Prescription</label>
          <textarea name="prescription" class="form-control prescription-input" rows="6" placeholder="Enter prescription details...">${appointment.prescription || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select name="status" class="form-control">
            <option value="scheduled" ${appointment.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
            <option value="completed" ${appointment.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${appointment.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Update Appointment</button>
      </form>
    `;

    modal.classList.add('active');

    // Re-attach event listener to the new form
    const form = document.getElementById('appointment-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleAppointmentUpdate(e));
    }
  }

  async handleAppointmentUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      const response = await fetch('/doctor/update-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Appointment updated successfully!');
        document.querySelector('.modal-overlay.active').classList.remove('active');
        this.loadAppointments();
      } else {
        alert('Error updating appointment: ' + result.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating appointment');
    }
  }

  async completeAppointment(appointmentId) {
    if (!confirm('Mark this appointment as completed?')) return;
    
    try {
      const response = await fetch('/doctor/update-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          status: 'completed'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Appointment marked as completed!');
        this.loadAppointments();
      } else {
        alert('Error completing appointment: ' + result.error);
      }
    } catch (error) {
      console.error('Completion error:', error);
      alert('Error completing appointment');
    }
  }

  initAvailabilityToggle() {
    const toggle = document.getElementById('availability-toggle');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        this.updateAvailability(e.target.checked);
      });
    }
  }

  async updateAvailability(isAvailable) {
    try {
      const response = await fetch('/doctor/update-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availability: isAvailable
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        alert('Error updating availability');
        // Revert toggle
        document.getElementById('availability-toggle').checked = !isAvailable;
      }
    } catch (error) {
      console.error('Availability update error:', error);
      alert('Error updating availability');
      // Revert toggle
      document.getElementById('availability-toggle').checked = !isAvailable;
    }
  }

  async loadAppointments() {
    try {
      // This would refresh the appointments list
      console.log('Loading appointments...');
      // In a real implementation, you'd fetch and update the DOM
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }
}

// Initialize doctor dashboard
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.doctor-dashboard')) {
    new DoctorDashboard();
  }
});