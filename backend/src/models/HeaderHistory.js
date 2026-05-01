const mongoose = require('mongoose');

const headerHistorySchema = new mongoose.Schema({
  hotline: {
    type: String,
    required: false
  },
  notice: {
    type: String,
    required: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HeaderHistory', headerHistorySchema);
