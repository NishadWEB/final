const Patient = require('../models/patient');
const Appointment = require('../models/appointment');
const Doctor = require('../models/doctor');
const axios = require('axios');

exports.getDashboard = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'patient') {
      return res.redirect('/auth/login');
    }

    const patient = await Patient.findByUserId(req.session.user.id);
    if (!patient) {
      return res.redirect('/auth/login');
    }

    const appointments = await Appointment.findByPatientId(patient.id);

    res.render('patient/dashboard', {
      title: 'Patient Dashboard',
      user: req.session.user,
      patient,
      appointments
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { error: 'Internal server error' });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'patient') {
      return res.redirect('/auth/login');
    }

    const doctors = await Doctor.getAllAvailable();
    const patient = await Patient.findByUserId(req.session.user.id);

    res.render('patient/doctors', {
      title: 'Find Doctors',
      user: req.session.user,
      patient,
      doctors
    });
  } catch (error) {
    console.error('Doctors list error:', error);
    res.status(500).render('error', { error: 'Internal server error' });
  }
};

exports.bookAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, symptoms } = req.body;
    
    if (!req.session.user || req.session.user.role !== 'patient') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const patient = await Patient.findByUserId(req.session.user.id);
    
    // Get preliminary diagnosis from ML service
    let preliminary_diagnosis = '';
    try {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/diagnose`, {
        symptoms: symptoms
      });
      preliminary_diagnosis = mlResponse.data.diagnosis;
    } catch (mlError) {
      console.error('ML service error:', mlError);
      preliminary_diagnosis = 'Preliminary analysis unavailable. Please consult with doctor.';
    }

    const appointment = await Appointment.create({
      patient_id: patient.id,
      doctor_id,
      appointment_date,
      symptoms,
      preliminary_diagnosis
    });

    res.json({ 
      success: true, 
      appointment,
      message: 'Appointment booked successfully' 
    });
  } catch (error) {
    console.error('Appointment booking error:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'patient') {
      return res.redirect('/auth/login');
    }

    const patient = await Patient.findByUserId(req.session.user.id);
    const appointments = await Appointment.findByPatientId(patient.id);

    res.render('patient/appointments', {
      title: 'My Appointments',
      user: req.session.user,
      patient,
      appointments
    });
  } catch (error) {
    console.error('Appointments error:', error);
    res.status(500).render('error', { error: 'Internal server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'patient') {
      return res.redirect('/auth/login');
    }

    const patient = await Patient.findByUserId(req.session.user.id);
    if (!patient) return res.redirect('/auth/login');

    res.render('patient/profile', {
      title: 'My Profile',
      user: req.session.user,
      patient
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).render('error', { error: 'Internal server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'patient') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updateData = {
      full_name: req.body.full_name,
      date_of_birth: req.body.date_of_birth,
      gender: req.body.gender,
      phone: req.body.phone,
      address: req.body.address,
      emergency_contact: req.body.emergency_contact
    };

    const updated = await Patient.updateProfile(req.session.user.id, updateData);
    if (!updated) return res.status(400).json({ error: 'No fields to update' });

    res.json({ success: true, patient: updated, message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};