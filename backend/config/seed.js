const { pool } = require('./db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database with hashed data');

    const hashedPassword = await bcrypt.hash('password', 10);

    /* ================= PATIENT USERS ================= */

    const patientUsers = await client.query(
      `INSERT INTO users (email, password, role, is_verified) VALUES
       ('johndoe@gmail.com',   $1, 'patient', true),
       ('janesmith@gmail.com', $1, 'patient', true)
       RETURNING id`,
      [hashedPassword]
    );

    await client.query(
      `INSERT INTO patients (user_id, full_name, date_of_birth, gender, phone) VALUES
       ($1, 'John Doe',  '1990-01-15', 'Male',   '+911234567890'),
       ($2, 'Jane Smith','1995-06-20', 'Female', '+919876543210')`,
      [patientUsers.rows[0].id, patientUsers.rows[1].id]
    );

    /* ================= DOCTOR USERS ================= */

    const doctorUsers = await client.query(
      `INSERT INTO users (email, password, role, is_verified) VALUES
       -- General Physician (3)
       ('suresh.kumar@gmail.com', $1, 'doctor', true),
       ('anita.sharma@gmail.com', $1, 'doctor', true),
       ('ramesh.patel@gmail.com', $1, 'doctor', true),

       -- Pulmonologist (5)
       ('neha.verma@gmail.com',   $1, 'doctor', true),
       ('arjun.mehra@gmail.com',  $1, 'doctor', true),
       ('kiran.rao@gmail.com',    $1, 'doctor', true),
       ('meena.nair@gmail.com',   $1, 'doctor', true),
       ('vijay.iyer@gmail.com',   $1, 'doctor', true),

       -- Neurologist (6)
       ('rajesh.mishra@gmail.com',$1,'doctor',true),
       ('anand.pillai@gmail.com',$1,'doctor',true),
       ('pallavi.shah@gmail.com',$1,'doctor',true),
       ('sunil.chopra@gmail.com',$1,'doctor',true),
       ('deepak.bansal@gmail.com',$1,'doctor',true),
       ('kavita.desai@gmail.com',$1,'doctor',true),

       -- Gastroenterologist (4)
       ('priya.nair@gmail.com',$1,'doctor',true),
       ('rohit.malhotra@gmail.com',$1,'doctor',true),
       ('naveen.kumar@gmail.com',$1,'doctor',true),
       ('kavitha.reddy@gmail.com',$1,'doctor',true),

       -- Urologist (5)
       ('sanjay.jain@gmail.com',$1,'doctor',true),
       ('deepak.aggarwal@gmail.com',$1,'doctor',true),
       ('harish.rao@gmail.com',$1,'doctor',true),
       ('manju.shetty@gmail.com',$1,'doctor',true),
       ('ashok.mehta@gmail.com',$1,'doctor',true),

       -- Endocrinologist (4)
       ('kavita.rao@gmail.com',$1,'doctor',true),
       ('ramesh.pillai@gmail.com',$1,'doctor',true),
       ('anita.gupta@gmail.com',$1,'doctor',true),
       ('vikram.joshi@gmail.com',$1,'doctor',true)

       RETURNING id`,
      [hashedPassword]
    );

    const d = doctorUsers.rows.map(r => r.id);

    /* ================= DOCTOR PROFILES ================= */

    await client.query(
  `INSERT INTO doctors
   (user_id, full_name, specialization, license_number, experience_years, phone, consultation_fee, availability)
   VALUES
   -- General Physician
   ($1,'Suresh Kumar','General Physician','GP1001',10,'+911111111111',500,'{"monday":["09:00-17:00"]}'),
   ($2,'Anita Sharma','General Physician','GP1002',12,'+911111111112',550,'{"tuesday":["09:00-17:00"]}'),
   ($3,'Ramesh Patel','General Physician','GP1003',8,'+911111111113',450,'{"wednesday":["09:00-17:00"]}'),

   -- Pulmonologist
   ($4,'Neha Verma','Pulmonologist','PU2001',11,'+922222222221',700,'{"monday":["10:00-16:00"]}'),
   ($5,'Arjun Mehra','Pulmonologist','PU2002',9,'+922222222222',680,'{"tuesday":["10:00-16:00"]}'),
   ($6,'Kiran Rao','Pulmonologist','PU2003',13,'+922222222223',750,'{"wednesday":["10:00-16:00"]}'),
   ($7,'Meena Nair','Pulmonologist','PU2004',8,'+922222222224',650,'{"thursday":["10:00-16:00"]}'),
   ($8,'Vijay Iyer','Pulmonologist','PU2005',15,'+922222222225',780,'{"friday":["10:00-16:00"]}'),

   -- Neurologist
   ($9,'Rajesh Mishra','Neurologist','NE3001',16,'+933333333331',1000,'{"tuesday":["09:00-15:00"]}'),
   ($10,'Anand Pillai','Neurologist','NE3002',14,'+933333333332',950,'{"wednesday":["09:00-15:00"]}'),
   ($11,'Pallavi Shah','Neurologist','NE3003',12,'+933333333333',900,'{"thursday":["09:00-15:00"]}'),
   ($12,'Sunil Chopra','Neurologist','NE3004',18,'+933333333334',1100,'{"friday":["09:00-15:00"]}'),
   ($13,'Deepak Bansal','Neurologist','NE3005',10,'+933333333335',850,'{"monday":["09:00-15:00"]}'),
   ($14,'Kavita Desai','Neurologist','NE3006',20,'+933333333336',1200,'{"saturday":["09:00-15:00"]}'),

   -- Gastroenterologist
   ($15,'Priya Nair','Gastroenterologist','GA4001',12,'+944444444441',900,'{"thursday":["11:00-17:00"]}'),
   ($16,'Rohit Malhotra','Gastroenterologist','GA4002',10,'+944444444442',850,'{"monday":["11:00-17:00"]}'),
   ($17,'Naveen Kumar','Gastroenterologist','GA4003',15,'+944444444443',950,'{"tuesday":["11:00-17:00"]}'),
   ($18,'Kavitha Reddy','Gastroenterologist','GA4004',11,'+944444444444',880,'{"wednesday":["11:00-17:00"]}'),

   -- Urologist
   ($19,'Sanjay Jain','Urologist','UR5001',14,'+955555555551',950,'{"wednesday":["10:00-16:00"]}'),
   ($20,'Deepak Aggarwal','Urologist','UR5002',12,'+955555555552',900,'{"thursday":["10:00-16:00"]}'),
   ($21,'Harish Rao','Urologist','UR5003',17,'+955555555553',1000,'{"friday":["10:00-16:00"]}'),
   ($22,'Manju Shetty','Urologist','UR5004',9,'+955555555554',850,'{"monday":["10:00-16:00"]}'),
   ($23,'Ashok Mehta','Urologist','UR5005',15,'+955555555555',980,'{"tuesday":["10:00-16:00"]}'),

   -- Endocrinologist
   ($24,'Kavita Rao','Endocrinologist','EN6001',10,'+966666666661',850,'{"saturday":["10:00-14:00"]}'),
   ($25,'Ramesh Pillai','Endocrinologist','EN6002',16,'+966666666662',950,'{"tuesday":["10:00-14:00"]}'),
   ($26,'Anita Gupta','Endocrinologist','EN6003',12,'+966666666663',900,'{"wednesday":["10:00-14:00"]}'),
   ($27,'Vikram Joshi','Endocrinologist','EN6004',14,'+966666666664',920,'{"thursday":["10:00-14:00"]}')`,
  d
);


    console.log('✅ Seeding completed');
    console.log('🔐 Demo password for all users: password');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
