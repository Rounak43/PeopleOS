const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const WorkingSchedule = require('../models/WorkingSchedule');

const IT_WORKING_SCHEDULES = [
  {
    name: 'Standard Tech Shift (Mon-Fri, 9:00 AM - 6:00 PM)',
    type: 'full_time',
    totalWeeklyHours: 40,
    lines: [
      { dayOfWeek: 'monday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'tuesday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'wednesday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'thursday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'friday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
    ],
  },
  {
    name: 'Flexible Core Shift (Mon-Fri, 11:00 AM - 8:00 PM)',
    type: 'full_time',
    totalWeeklyHours: 40,
    lines: [
      { dayOfWeek: 'monday', startTime: '11:00', endTime: '20:00', breakMinutes: 60 },
      { dayOfWeek: 'tuesday', startTime: '11:00', endTime: '20:00', breakMinutes: 60 },
      { dayOfWeek: 'wednesday', startTime: '11:00', endTime: '20:00', breakMinutes: 60 },
      { dayOfWeek: 'thursday', startTime: '11:00', endTime: '20:00', breakMinutes: 60 },
      { dayOfWeek: 'friday', startTime: '11:00', endTime: '20:00', breakMinutes: 60 },
    ],
  },
  {
    name: 'US Support Night Shift (Mon-Fri, 6:00 PM - 3:00 AM)',
    type: 'shift',
    totalWeeklyHours: 40,
    lines: [
      { dayOfWeek: 'monday', startTime: '18:00', endTime: '03:00', breakMinutes: 60 },
      { dayOfWeek: 'tuesday', startTime: '18:00', endTime: '03:00', breakMinutes: 60 },
      { dayOfWeek: 'wednesday', startTime: '18:00', endTime: '03:00', breakMinutes: 60 },
      { dayOfWeek: 'thursday', startTime: '18:00', endTime: '03:00', breakMinutes: 60 },
      { dayOfWeek: 'friday', startTime: '18:00', endTime: '03:00', breakMinutes: 60 },
    ],
  },
  {
    name: 'Part-Time / Intern Schedule (Mon-Fri, 4h/day)',
    type: 'part_time',
    totalWeeklyHours: 20,
    lines: [
      { dayOfWeek: 'monday', startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
      { dayOfWeek: 'tuesday', startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
      { dayOfWeek: 'wednesday', startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
      { dayOfWeek: 'thursday', startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
      { dayOfWeek: 'friday', startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
    ],
  },
];

const seedITSchedules = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected to database:', mongoUri);

    let createdCount = 0;
    for (const schedData of IT_WORKING_SCHEDULES) {
      const existing = await WorkingSchedule.findOne({ name: schedData.name });
      if (!existing) {
        await WorkingSchedule.create(schedData);
        createdCount++;
        console.log(`+ Created Working Schedule: ${schedData.name}`);
      } else {
        console.log(`= Schedule Exists: ${schedData.name}`);
      }
    }

    console.log(`\n✓ Successfully seeded ${createdCount} IT Working Schedule(s).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding IT working schedules:', error);
    process.exit(1);
  }
};

seedITSchedules();
