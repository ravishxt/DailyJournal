const Entry = require('../models/Entry');
const ApiError = require('../utils/apiError');
const httpStatus = require('http-status-codes');
const { validationResult } = require('express-validator');

class UserController {
  /**
   * Get all entries for the current user
   */
  async getAllEntries(req, res, next) {
    try {
      // Default pagination values
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count of entries
      const totalEntries = await Entry.countDocuments({ userId: req.user.userId });
      
      // Get paginated entries
      const foundEntries = await Entry.find({ userId: req.user.userId })
        .sort({ createdAt: -1 }) // Sort by most recent first
        .skip(skip)
        .limit(limit);
      
      const entries = foundEntries.map((item) => ({
        id: item._id,
        title: item.title,
        content: item.body,
        date: item.createdAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        userId: item.userId
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalEntries / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return res.api.success({ 
        entries,
        pagination: {
          total: totalEntries,
          totalPages,
          currentPage: page,
          hasNextPage,
          hasPreviousPage,
          limit
        }
      });
    } catch (error) {
      next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch entries'));
    }
  }

  /**
   * Get a single entry by ID
   */
  async getEntry(req, res, next) {
    try {
      const entry = await Entry.findOne({ _id: req.params.id, userId: req.user.userId });
      
      if (!entry) {
        return res.api.notFound('Entry not found');
      }

      const entryData = {
        id: entry._id,
        title: entry.title,
        content: entry.body,
        date: entry.createdAt,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        userId: entry.userId
      };

      return res.api.success(entryData);
    } catch (error) {
      next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch entry'));
    }
  }


  /**
   * Create a new entry
   */
  async createEntry(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.api.validationError(errors.array());
      }

      const { title, content } = req.body;
      
      const newEntry = new Entry({
        title,
        body: content,
        userId: req.user.userId,
        author: req.user.username || 'Anonymous'
      });

      await newEntry.save();

      const entryData = {
        id: newEntry._id,
        title: newEntry.title,
        content: newEntry.body,
        date: newEntry.createdAt,
        createdAt: newEntry.createdAt,
        updatedAt: newEntry.updatedAt,
        userId: newEntry.userId
      };

      return res.api.created(entryData, 'Entry created successfully');
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.api.badRequest(error.message);
      }
      next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create entry'));
    }
  }

  /**
   * Update an existing entry
   */
  async updateEntry(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.api.validationError(errors.array());
      }

      const { title, content } = req.body;
      
      const updatedEntry = await Entry.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.userId },
        { title, body: content },
        { new: true, runValidators: true }
      );

      if (!updatedEntry) {
        return res.api.notFound('Entry not found or you do not have permission to update it');
      }

      const entryData = {
        id: updatedEntry._id,
        title: updatedEntry.title,
        content: updatedEntry.body,
        date: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt,
        userId: updatedEntry.userId
      };

      return res.api.success(entryData, 'Entry updated successfully');
    } catch (error) {
      next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update entry'));
    }
  }

  /**
   * Delete an entry
   */
  async deleteEntry(req, res, next) {
    try {
      const entry = await Entry.findOneAndDelete({ 
        _id: req.params.id, 
        userId: req.user.userId 
      });

      if (!entry) {
        return next(new ApiError(httpStatus.NOT_FOUND, 'Entry not found or you do not have permission to delete it'));
      }

      return res.api.success('Entry deleted successfully');
    } catch (error) {
      next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete entry'));
    }
  }

  /**
   * Search entries
   */
  async searchEntries(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return next(new ApiError(httpStatus.BAD_REQUEST, 'Search query is required'));
      }

      const entries = await Entry.find({
        userId: req.user.userId,
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { body: { $regex: q, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });

      res.json(entries.map(entry => ({
        id: entry._id,
        title: entry.title,
        content: entry.body,
        date: entry.createdAt,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        userId: entry.userId
      })));
    } catch (error) {
      next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Search failed'));
    }
  }
}

module.exports = new UserController();
