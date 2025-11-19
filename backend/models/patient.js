const { query } = require('../config/db');

class Patient {
  static async create(userId, patientData) {
    const { full_name, date_of_birth, gender, phone, address, emergency_contact } = patientData;
    const result = await query(
      `INSERT INTO patients (user_id, full_name, date_of_birth, gender, phone, address, emergency_contact) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, full_name, date_of_birth, gender, phone, address, emergency_contact]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await query(
      `SELECT p.*, u.email FROM patients p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.user_id = $1`,
      [userId]
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
      `UPDATE patients SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }
}

module.exports = Patient;