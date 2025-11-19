const { query } = require('../config/db');

class Doctor {
  static async create(userId, doctorData) {
    const { full_name, specialization, license_number, experience_years, phone, hospital_affiliation, consultation_fee } = doctorData;
    const result = await query(
      `INSERT INTO doctors (user_id, full_name, specialization, license_number, experience_years, phone, hospital_affiliation, consultation_fee) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, full_name, specialization, license_number, experience_years, phone, hospital_affiliation, consultation_fee]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await query(
      `SELECT d.*, u.email FROM doctors d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async getAllAvailable() {
    const result = await query(
      `SELECT d.*, u.email FROM doctors d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.is_available = true`
    );
    return result.rows;
  }

  static async findBySpecialization(specialization) {
    const result = await query(
      `SELECT d.*, u.email FROM doctors d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.specialization ILIKE $1 AND d.is_available = true`,
      [`%${specialization}%`]
    );
    return result.rows;
  }

  static async updateAvailability(doctorId, availability) {
    const result = await query(
      'UPDATE doctors SET availability = $1, is_available = $2 WHERE id = $3 RETURNING *',
      [availability, true, doctorId]
    );
    return result.rows[0];
  }

  static async updateProfile(userId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    values.push(userId);
    const result = await query(
      `UPDATE doctors SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }
}

module.exports = Doctor;