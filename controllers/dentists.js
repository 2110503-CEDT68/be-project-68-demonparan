const Dentist = require('../models/Dentist');
const Appointment = require('../models/Appointment');

// ==============================
// GET ALL DENTISTS
// GET /api/v1/dentists
// ==============================
exports.getDentists = async (req, res, next) => {
  try {
    let query;

    const reqQuery = { ...req.query };
    const searchStart = req.query.start;
    const searchEnd = req.query.end;

    // ลบออกก่อนเพื่อไม่ให้ไปปนกับ advanced filter
    delete reqQuery.start;
    delete reqQuery.end;

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Advanced filter ปกติ
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      match => `$${match}`
    );

    let normalFilter = JSON.parse(queryStr);

    //เพิ่ม working hour filter แยกต่างหาก
    if (searchStart && searchEnd) {
      normalFilter['workingHours.start'] = {
        $lte: Number(searchStart)
      };
      normalFilter['workingHours.end'] = {
        $gte: Number(searchEnd)
      };
    }

    query = Dentist.find(normalFilter);

    // ถ้าไม่ได้ใช้ search นี้ → populate ตามเดิม
    if (!searchStart || !searchEnd) {
      query = query.populate('appointments');
    }

    // Select
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const total = await Dentist.countDocuments(normalFilter);

    query = query.skip(startIndex).limit(limit);

    const dentists = await query;

    //ถ้าใช้ working hour search → สร้าง timeSlots แบบ clean
    let finalData;

    if (searchStart && searchEnd) {

      finalData = await Promise.all(
        dentists.map(async (dentist) => {

          const appointments = await Appointment.find({
            dentist: dentist._id
        });

        const bookedHours = appointments.map(appt => appt.hour);

        const timeSlots = [];

        for (
          let hour = dentist.workingHours.start;
          hour < dentist.workingHours.end;
          hour++
        ) {
          timeSlots.push({
            hour,
            status: bookedHours.includes(hour) ? "booked" : "available"
          });
        }

        return {
          _id: dentist._id,
          name: dentist.name,
          experience: dentist.experience,
          expertise: dentist.expertise,
          workingHours: dentist.workingHours,
          availability: timeSlots
        };
      })
    );

    }else {

      // กรณีปกติ → clean appointments
      finalData = dentists.map(d => ({
        _id: d._id,
        name: d.name,
        experience: d.experience,
        expertise: d.expertise,
        workingHours: d.workingHours,
        appointments: d.appointments
      }));
    }

    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: finalData.length,
      pagination,
      data: finalData
    });

  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false });
  }
};
// ==============================
// GET ONE DENTIST
// GET /api/v1/dentists/:id
// ==============================
exports.getDentist = async (req, res, next) => {
  try {
    const dentist = await Dentist.findById(req.params.id);

    if (!dentist) {
      return res.status(404).json({ success: false });
    }

    res.status(200).json({
      success: true,
      data: dentist
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// ==============================
// CREATE DENTIST (Admin)
// POST /api/v1/dentists
// ==============================
exports.createDentist = async (req, res, next) => {
  try {
    const dentist = await Dentist.create(req.body);

    res.status(201).json({
      success: true,
      data: dentist
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// ==============================
// UPDATE DENTIST
// PUT /api/v1/dentists/:id
// ==============================
exports.updateDentist = async (req, res, next) => {
  try {
    const dentist = await Dentist.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!dentist) {
      return res.status(404).json({ success: false });
    }

    res.status(200).json({
      success: true,
      data: dentist
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// ==============================
// DELETE DENTIST
// DELETE /api/v1/dentists/:id
// ==============================
exports.deleteDentist = async (req, res, next) => {
  try {
    const dentist = await Dentist.findById(req.params.id);

    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: `Dentist not found with id of ${req.params.id}`
      });
    }

    // ลบ appointment ของ dentist คนนี้ด้วย
    await Appointment.deleteMany({ dentist: req.params.id });
    await dentist.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};
