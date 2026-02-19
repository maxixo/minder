import mongoose from 'mongoose';

const energyPointSchema = new mongoose.Schema(
  { time: { type: Number, required: true, min: 6, max: 24 }, energy: { type: Number, required: true, min: 0, max: 10 } },
  { _id: false }
);

const todoItemSchema = new mongoose.Schema(
  { text: { type: String, required: true, trim: true, maxlength: 500 }, completed: { type: Boolean, default: false } },
  { _id: true }
);

const entrySchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:              { type: Date, required: true },
  weather:           { type: String, enum: ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'stormy', 'snowy', null], default: null },

  //  Daily Reflection 
  gratitude:         [{ type: String, trim: true, maxlength: 500 }],
  expectations:      { type: String, trim: true, maxlength: 1000 },
  positiveNotes:     [{ type: String, trim: true, maxlength: 500 }],
  whatMakesTodayGreat: { type: String, trim: true, maxlength: 1000 },
  goodThingsHappened: [{ type: String, trim: true, maxlength: 500 }],
  selfAssessmentNote: { type: String, trim: true, maxlength: 2000 },

  //  Trackers 
  mood:              { type: Number, min: 1, max: 5, default: null },
  waterIntake:       { type: Number, min: 0, max: 15, default: 0 },
  sleepHours:        { type: Number, min: 0, max: 24, default: null },
  sleepQuality:      { type: String, enum: ['poor', 'fair', 'good', 'great', 'excellent', null], default: null },
  meals: {
    breakfast: { type: Boolean, default: false },
    lunch:     { type: Boolean, default: false },
    dinner:    { type: Boolean, default: false },
    snack:     { type: Boolean, default: false },
  },
  energyLevels:      [energyPointSchema],

  //  Tomorrow's Plan 
  tomorrowPlan: {
    howToMakeBetter: { type: String, trim: true, maxlength: 1000 },
    expectations:    { type: String, trim: true, maxlength: 1000 },
  },

  //  Self-Care 
  selfLove:          { type: String, trim: true, maxlength: 1000 },
  gratitudeNote:     { type: String, trim: true, maxlength: 1000 },
  feeling:           { type: String, enum: ['happy','peace','sad','worried','excited','bored','relaxed','lonely','tired','angry','overwhelmed', null], default: null },
  additionalFeelings:[{ type: String, enum: ['happy','peace','sad','worried','excited','bored','relaxed','lonely','tired','angry','overwhelmed'] }],
  activities: {
    reading:      { type: Number, min: 0, max: 5, default: 0 },
    music:        { type: Number, min: 0, max: 7, default: 0 },
    mindfulness:  { type: Number, min: 0, max: 5, default: 0 },
  },
  mindThoughts:      { type: String, trim: true, maxlength: 2000 },
  nextStep:          { type: String, trim: true, maxlength: 1000 },
  ratings: {
    selfTalk:     { type: Number, min: 1, max: 5, default: null },
    energyPoint:  { type: Number, min: 1, max: 5, default: null },
    overall:      { type: Number, min: 1, max: 5, default: null },
  },
  selfCareChecklist: {
    ateBreakfast:    { type: Boolean, default: false },
    ateLunch:        { type: Boolean, default: false },
    ateDinner:       { type: Boolean, default: false },
    slept7to9Hours:  { type: Boolean, default: false },
    tookNap:         { type: Boolean, default: false },
    watchedMovie:    { type: Boolean, default: false },
    gotFreshAir:     { type: Boolean, default: false },
    exercised:       { type: Boolean, default: false },
    calledFriend:    { type: Boolean, default: false },
    journaled:       { type: Boolean, default: false },
    drankWater:      { type: Boolean, default: false },
  },

  //  Emotional Guidance 
  emotionalGuidance: {
    whereAreYou:       { type: String, trim: true, maxlength: 500 },
    howYoureFeeling:   { type: String, trim: true, maxlength: 1000 },
    whatYoureThinking: { type: String, trim: true, maxlength: 1000 },
    copingMethod:      { type: String, trim: true, maxlength: 1000 },
    feelingBeforeGo:   { type: String, trim: true, maxlength: 1000 },
  },
  selfCarePlanDays:    { type: Map, of: Boolean, default: {} },

  //  Review 
  priorities:          [{ type: String, trim: true, maxlength: 500 }],
  todoList:            [todoItemSchema],
  focus:               { type: String, trim: true, maxlength: 1000 },
  mindfulnessNotes:    { type: String, trim: true, maxlength: 2000 },
  todayNotes:          [{ type: String, trim: true, maxlength: 500 }],

  //  Meta 
  completedSections:   [{ type: String, enum: ['reflection','selfcare','emotional','review'] }],
}, { timestamps: true });

entrySchema.index({ userId: 1, date: 1 }, { unique: true });
entrySchema.index({ userId: 1 });

entrySchema.methods.getCompletionPercentage = function () {
  const checks = [
    this.gratitude?.length > 0, this.mood != null, this.waterIntake > 0,
    !!this.selfLove, this.feeling != null, this.ratings?.overall != null,
    !!this.emotionalGuidance?.whereAreYou, this.priorities?.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
};

export default mongoose.model('Entry', entrySchema);
