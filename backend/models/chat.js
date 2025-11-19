const { query } = require('../config/db');

class Chat {
  static async createMessage(appointmentId, senderId, senderRole, message) {
    const result = await query(
      `INSERT INTO chats (appointment_id, sender_id, sender_role, message) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [appointmentId, senderId, senderRole, message]
    );
    return result.rows[0];
  }

  static async getAppointmentMessages(appointmentId) {
    const result = await query(
      `SELECT * FROM chats 
       WHERE appointment_id = $1 
       ORDER BY created_at ASC`,
      [appointmentId]
    );
    return result.rows;
  }

  static async getUnreadMessages(userId, role) {
    const result = await query(
      `SELECT c.*, a.patient_id, a.doctor_id 
       FROM chats c
       JOIN appointments a ON c.appointment_id = a.id
       WHERE c.sender_role != $1 
       AND (a.patient_id = $2 OR a.doctor_id = $2)
       AND c.id > COALESCE((SELECT last_read_message_id FROM users WHERE id = $2), 0)`,
      [role, userId]
    );
    return result.rows;
  }
}

module.exports = Chat;