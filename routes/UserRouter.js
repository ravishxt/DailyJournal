const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const UserController = require('../controllers/userController');
const { validate } = require('../middleware/validate');
const { body, param } = require('express-validator');

// Validation rules
const entryValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required')
];

const entryIdValidation = [
  param('id').isMongoId().withMessage('Invalid entry ID')
];

// Protected routes (require authentication)
router.use(authenticateToken);

// Entry routes
router.route('/entries')
  .get(UserController.getAllEntries)          // Get all entries
  .post(entryValidation, validate, UserController.createEntry);  // Create new entry

router.route('/entries/:id')
  .get(entryIdValidation, validate, UserController.getEntry)     // Get single entry
  .put([...entryIdValidation, ...entryValidation], validate, UserController.updateEntry)  // Update entry
  .delete(entryIdValidation, validate, UserController.deleteEntry);  // Delete entry

// Search entries
router.get('/search', UserController.searchEntries);

module.exports = router;
