const Appointment = require('../models/Appointment');
const Dentist = require('../models/Dentist');

// @desc    Get all appointments
// @route   GET /api/v1/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  let query;

  if (req.user.role !== 'admin') {
    query = Appointment.find({ user: req.user.id }).populate({
      path: 'dentist',
      select: 'name experience expertise'
    });
  } else {
    if (req.params.dentistId) {
      query = Appointment.find({
        dentist: req.params.dentistId
      }).populate({
        path: 'dentist',
        select: 'name experience expertise'
      });
    } else {
      query = Appointment.find().populate({
        path: 'dentist',
        select: 'name experience expertise'
      });
    }
  }

  try {
  const appointments = await query;

  res.status(200).json({
    success: true,
    count: appointments.length,
    data: appointments
  });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Cannot find Appointment'
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/v1/appointments/:id
// @access  Public
exports.getAppointment = async (req, res, next) => {
  try {
  const appointment = await Appointment.findById(req.params.id).populate({
    path: 'dentist',
    select: 'name experience expertise'
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: `No appointment with id ${req.params.id}`
    });
  }

  res.status(200).json({
    success: true,
    data: appointment
  });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Cannot find Appointment'
    });
  }
};

// @desc    Add appointment
// @route   POST /api/v1/hospitals/:hospitalId/appointments
// @access  Private
exports.addAppointment = async (req, res, next) => {
  try {
  req.body.dentist = req.params.dentistId;
  req.body.user = req.user.id;

  const dentist = await Dentist.findById(req.params.dentistId);

  if (!dentist) {
    return res.status(404).json({
      success: false,
      message: `No dentist with id ${req.params.dentistId}`
    });
  }

  // ❌ user จองได้ครั้งเดียว
    // 🔥 ถ้าไม่ใช่ admin → ตรวจว่ามีนัดแล้วหรือยัง
    if (req.user.role !== 'admin') {
      const existed = await Appointment.findOne({ user: req.user.id });

      if (existed) {
        return res.status(400).json({
          success: false,
          message: 'User can create only one appointment'
        });
      }
    }

  const appointment = await Appointment.create(req.body);

  res.status(201).json({
    success: true,
    data: appointment
  });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Cannot create Appointment'
    });
  }
};

//@desc    Update appointment
//@route   PUT /api/v1/appointments/:id
//@access  Private
exports.updateAppointment = async (req, res, next) => {
  try {
  let appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: `No appointment with id ${req.params.id}`
    });
  }

  if (
    appointment.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(401).json({
      success: false,
      message: `User ${req.user.id} is not authorized to update this appointment`
    });
  }

  appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: appointment
  });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot update Appointment"
    });
  }
};

//@desc    Delete appointment
//@route   DELETE /api/v1/appointments/:id
//@access  Private
exports.deleteAppointment = async (req, res, next) => {
  try {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: `No appointment with id ${req.params.id}`
    });
  }

  if (
    appointment.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(401).json({
      success: false,
      message: `User ${req.user.id} is not authorized to delete this appointment`
    });
  }

  await appointment.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot delete Appointment"
    });
  }
};
