const { pool } = require('./db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log('📊 Connected to database for seeding');

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password', 10);

    // Clear existing data (optional - comment out if you want to keep existing data)
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM medical_records');
    await client.query('DELETE FROM chats');
    await client.query('DELETE FROM appointments');
    await client.query('DELETE FROM patients');
    await client.query('DELETE FROM doctors');
    await client.query('DELETE FROM users');

    // Insert sample users - FIXED: separate values for each user
    const userResult = await client.query(
      `INSERT INTO users (email, password, role, is_verified) VALUES
      ($1, $2, 'patient', true),
      ($3, $4, 'doctor', true)
      RETURNING id, role, email`,
      ['patient@example.com', hashedPassword, 'doctor@example.com', hashedPassword]
    );

    const patientUser = userResult.rows.find(u => u.role === 'patient');
    const doctorUser = userResult.rows.find(u => u.role === 'doctor');

    // Insert sample patient
    await client.query(
      `INSERT INTO patients (user_id, full_name, date_of_birth, gender, phone) VALUES
      ($1, 'John Doe', '1990-01-15', 'Male', '+1234567890')`,
      [patientUser.id]
    );

    // Insert sample doctors - FIXED: use the correct user ID
    await client.query(
      `INSERT INTO doctors (user_id, full_name, specialization, license_number, experience_years, phone, consultation_fee, availability) VALUES
      ($1, 'Dr. Sarah Smith', 'Cardiology', 'MED123456', 10, '+1234567891', 100.00, $2),
      ($1, 'Dr. Michael Brown', 'Dermatology', 'MED123457', 8, '+1234567892', 80.00, $3)`,
      [
        doctorUser.id,
        JSON.stringify({"monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"], "wednesday": ["09:00-17:00"], "thursday": ["09:00-17:00"], "friday": ["09:00-17:00"]}),
        JSON.stringify({"monday": ["10:00-16:00"], "wednesday": ["10:00-16:00"], "friday": ["10:00-16:00"]})
      ]
    );

    console.log('🌱 Sample data seeded successfully');
    console.log('📧 Patient login: patient@example.com / password');
    console.log('📧 Doctor login: doctor@example.com / password');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = seedDatabase;