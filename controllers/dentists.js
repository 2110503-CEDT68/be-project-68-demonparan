const Dentist = require('../models/Dentist');
const Appointment = require('../models/Appointment');

// ==============================
// GET ALL DENTISTS
// GET /api/v1/dentists
// ==============================
exports.getDentists = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      match => `$${match}`
    );

    query = Dentist.find(JSON.parse(queryStr)).populate('appointments');

    // Select fields
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
    const total = await Dentist.countDocuments();

    query = query.skip(startIndex).limit(limit);

    const dentists = await query;

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: dentists.length,
      pagination,
      data: dentists
    });
  } catch (err) {
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
