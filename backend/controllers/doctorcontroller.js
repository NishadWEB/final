const Doctor = require('../models/doctor');
const Appointment = require('../models/appointment');
const Patient = require('../models/patient');

exports.getDashboard = async (req, res) => {
  try {
    const user = req && req.session ? req.session.user : null;
    if (!user) return res.redirect('/auth/login');

    const doctor = await Doctor.findByUserId(user.id);
    if (!doctor) {
      console.warn('Doctor profile not found for user', user && user.id);
      return res.redirect('/auth/login');
    }
    const appointments = await Appointment.findByDoctorId(doctor && doctor.id);

    // Calculate statistics
    const totalAppointments = appointments.length;
    const pendingAppointments = appointments.filter(a => a.status === 'scheduled').length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;

    res.render('doctor/dashboard', {
      title: 'Doctor Dashboard',
      user: req.session.user,
      doctor,
      appointments: appointments.slice(0, 5), // Show only recent 5
      stats: {
        total: totalAppointments,
        pending: pendingAppointments,
        completed: completedAppointments
      }
    });
  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).render('error', { error: 'Internal server error' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const user = req && req.session ? req.session.user : null;
    if (!user) return res.redirect('/auth/login');
    const doctor = await Doctor.findByUserId(user.id);
    if (!doctor) return res.redirect('/auth/login');
    const appointments = await Appointment.findByDoctorId(doctor.id);

    res.render('doctor/appointments', {
      title: 'My Appointments',
      user: req.session.user,
      doctor,
      appointments
    });
  } catch (error) {
    console.error('Doctor appointments error:', error);
    res.status(500).render('error', { error: 'Internal server error' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointment_id, status, doctor_notes, prescription } = req.body;
    
    if (!req.session || !req.session.user || req.session.user.role !== 'doctor') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const appointment = await Appointment.updateStatus(
      appointment_id, 
      status, 
      doctor_notes, 
      prescription
    );

    res.json({ 
      success: true, 
      appointment,
      message: 'Appointment updated successfully' 
    });
  } catch (error) {
    console.error('Appointment update error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    
    const user = req && req.session ? req.session.user : null;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const doctor = await Doctor.findByUserId(user.id);
    if (!doctor) return res.status(401).json({ error: 'Unauthorized' });
    const updatedDoctor = await Doctor.updateAvailability(doctor.id, availability);

    res.json({ 
      success: true, 
      doctor: updatedDoctor,
      message: 'Availability updated successfully' 
    });
  } catch (error) {
    console.error('Availability update error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = req && req.session ? req.session.user : null;
    if (!user) return res.redirect('/auth/login');
    const doctor = await Doctor.findByUserId(user.id);
    if (!doctor) {
      // Allow doctors without a profile record to see the profile form and create one
      return res.render('doctor/profile', {
        title: 'My Profile',
        user: req.session.user,
        doctor: {},
        newProfile: true
      });
    }

    res.render('doctor/profile', {
      title: 'My Profile',
      user: req.session.user,
      doctor
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).render('error', { error: 'Internal server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = req && req.session ? req.session.user : null;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const updateData = {
      full_name: req.body.full_name,
      specialization: req.body.specialization,
      license_number: req.body.license_number,
      experience_years: req.body.experience_years,
      phone: req.body.phone,
      hospital_affiliation: req.body.hospital_affiliation,
      consultation_fee: req.body.consultation_fee
    };
    // If doctor profile doesn't exist yet, create one
    const existing = await Doctor.findByUserId(user.id);
    if (!existing) {
      const created = await Doctor.create(user.id, updateData);
      return res.json({ success: true, doctor: created, message: 'Profile created' });
    }

    const updated = await Doctor.updateProfile(user.id, updateData);
    if (!updated) return res.status(400).json({ error: 'No fields to update' });

    res.json({ success: true, doctor: updated, message: 'Profile updated' });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};