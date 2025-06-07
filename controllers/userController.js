const Entry = require('../models/Entry');
const ApiError = require('../utils/apiError');
const httpStatus = require('http-status-codes');

class UserController {
  /**
   * Get all entries for the current user
   */
  async getAllEntries(req, res, next) {
    try {
      const foundEntries = await Entry.find({ userId: req.user.userId });
      
      const entries = foundEntries.map((item) => ({
        id: item._id,
        title: item.title,
        content: item.body,
        date: item.createdAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        userId: item.userId
      }));

      res.json(entries);
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
        return next(new ApiError(httpStatus.NOT_FOUND, 'Entry not found'));
      }

      res.json({
        id: entry._id,
        title: entry.title,
        content: entry.body,
        date: entry.createdAt,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        userId: entry.userId
      });
    } catch (error) {
      next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch entry'));
    }
  }


  /**
   * Create a new entry
   */
  async createEntry(req, res, next) {
    try {
      const { title, content } = req.body;
      
      const newEntry = new Entry({
        title,
        body: content,
        userId: req.user.userId,
        author: req.user.username || 'Anonymous'
      });

      await newEntry.save();

      res.status(httpStatus.CREATED).json({
        id: newEntry._id,
        title: newEntry.title,
        content: newEntry.body,
        date: newEntry.createdAt,
        createdAt: newEntry.createdAt,
        updatedAt: newEntry.updatedAt,
        userId: newEntry.userId
      });
    } catch (error) {
      next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create entry'));
    }
  }

  /**
   * Update an existing entry
   */
  async updateEntry(req, res, next) {
    try {
      const { title, content } = req.body;
      
      const updatedEntry = await Entry.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.userId },
        { title, body: content },
        { new: true, runValidators: true }
      );

      if (!updatedEntry) {
        return next(new ApiError(httpStatus.NOT_FOUND, 'Entry not found'));
      }

      res.json({
        id: updatedEntry._id,
        title: updatedEntry.title,
        content: updatedEntry.body,
        date: updatedEntry.createdAt,
        updatedAt: updatedEntry.updatedAt,
        userId: updatedEntry.userId
      });
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
        return next(new ApiError(httpStatus.NOT_FOUND, 'Entry not found'));
      }

      res.status(httpStatus.NO_CONTENT).send();
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
