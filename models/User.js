const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true
  },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  facebook: String,
  twitter: String,
  google: String,
  github: String,
  instagram: String,
  linkedin: String,
  steam: String,
  tokens: Array,
  currentSentence: {
    type: String,
    default: ''
  },
  currentSentenceText: {
    type: String,
    default: ''
  },
  SentencesText: [{
    type: String,
    default: ''
  }],
  profile: {
    name: String,
    gender: String,
    location: String,
    year_of_birth: Number,
    // website: String,
    picture: String,
    accent: String,
    bankAccountHolder: String,
    bankAccountNumber: String,
    bankAccountBank: String,
    bankAccountBranch: String
  },
  active: {
    type: Boolean,
    default: false
  },
  rank: {
    type: String,
    default: 'Trial'
  },
  statistics: {
    number_of_sentences: {
      type: Number,
      default: 0
    },
    total_duration: {
      type: Number,
      default: 0
    }
  },
  wallet: {
    collected: {
      type: Number,
      default: 0
    },
    paid: {
      type: Number,
      default: 0
    },
    remaining: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});
/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});
/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};
/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};
userSchema.methods.trialCompleted = function trialCompleted() {
  if (!this.active) {
    return true;
  }
  if (this.rank == 'Trial') {
    if (this.statistics.number_of_sentences > 10 || (this.statistics.number_of_sentences == 10 && !this.currentSentence)) {
      return true;
    } else {
      return false;
    }
  }
  return false;
}
userSchema.methods.quotaExceeded = function quotaExceeded() {
  if (!this.active) {
    return true;
  }
  return false;
}
userSchema.methods.missingInfos = function missingInfos() {
  return (!this.profile.gender || !this.profile.accent || !this.profile.year_of_birth)
}
const User = mongoose.model('User', userSchema);
module.exports = User;