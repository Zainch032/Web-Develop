const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, { collection: 'users' });

// Add a pre-save middleware to sync isAdmin with role
userSchema.pre('save', function(next) {
  if (this.isAdmin) {
    this.role = 'admin';
  }
  next();
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;