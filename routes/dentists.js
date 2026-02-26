const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

const {
  getDentists,
  getDentist,
  createDentist,
  updateDentist,
  deleteDentist
} = require('../controllers/dentists');

// include other resource routers
const appointmentRouter = require('./appointments');

// re-route into other resource routers
// /api/v1/dentists/:dentistId/appointments
router.use('/:dentistId/appointments', appointmentRouter);

router
  .route('/')
  .get(getDentists)
  .post(protect, authorize('admin'), createDentist);

router
  .route('/:id')
  .get(getDentist)
  .put(protect, authorize('admin'), updateDentist)
  .delete(protect, authorize('admin'), deleteDentist);

module.exports = router;
