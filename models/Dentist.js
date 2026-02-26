const mongoose = require('mongoose');

const DentistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add dentist name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    experience: {
      type: Number,
      required: [true, 'Please add years of experience']
    },
    expertise: {
      type: String,
      required: [true, 'Please add area of expertise']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Reverse populate (Dentist -> Appointments)
DentistSchema.virtual('appointments', {
  ref: 'Appointment',
  localField: '_id',
  foreignField: 'dentist',
  justOne: false
});

module.exports = mongoose.model('Dentist', DentistSchema);
