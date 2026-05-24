import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  expirationTime: { type: Number, default: null },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String, default: null },
}, { _id: false, timestamps: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 50 },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  password: { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
  avatar: { type: String, default: null },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    notifications: {
      dailyReminder: { type: Boolean, default: true },
      reminderTime: { type: String, default: '20:00' },
      weeklyReport: { type: Boolean, default: true },
      timezone: { type: String, default: 'UTC' },
      lastReminderSentAt: { type: Date, default: null },
    },
    privacy: { shareStats: { type: Boolean, default: false } },
  },
  pushSubscriptions: { type: [pushSubscriptionSchema], default: [] },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);
