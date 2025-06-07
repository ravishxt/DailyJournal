const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  mood: {
    type: String,
    trim: true,
    enum: {
      values: ['happy', 'sad', 'excited', 'angry', 'grateful', 'tired', 'neutral'],
      message: 'Invalid mood value'
    },
    default: 'neutral'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
entrySchema.index({ userId: 1 });
entrySchema.index({ userId: 1, createdAt: -1 });
entrySchema.index({ userId: 1, updatedAt: -1 });

// Text index for search
entrySchema.index(
  { title: 'text', body: 'text' },
  { weights: { title: 3, body: 1 } }
);

// Middleware to update timestamps on update
entrySchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Entry = mongoose.model('Entry', entrySchema);

module.exports = Entry;
