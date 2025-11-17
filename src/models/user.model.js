// This file defines the 'User' model for our Admin Dashboard (FR-SEC2)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      // We will never return the password hash
      get() {
        return undefined;
      },
    },
    // We can add roles later if needed
    // role: {
    //   type: DataTypes.STRING,
    //   defaultValue: 'admin',
    // }
  },
  {
    timestamps: true,
    hooks: {
      // This 'hook' runs automatically before a user is created
      // It hashes the password using bcrypt
      beforeCreate: async (user) => {
        // --- THIS IS THE FIX ---
        // We must use getDataValue to bypass the 'get()' hook
        const password = user.getDataValue("password");
        if (password) {
          const salt = await bcrypt.genSalt(10);
          // And we use setDataValue to bypass any 'set()' hooks
          user.setDataValue("password", await bcrypt.hash(password, salt));
        }
        // --------------------
      },
    },
  }
);

/**
 * @function comparePassword
 * @description A custom method on the User model to check if a
 * password is valid.
 * @param {string} candidatePassword - The plain-text password from the login attempt
 * @returns {Promise<boolean>}
 */
User.prototype.comparePassword = async function (candidatePassword) {
  // We need to fetch the user again with the password field
  const userWithPassword = await User.scope(null).findOne({
    where: { id: this.id },
    attributes: ["id", "password"],
    raw: true, // <--- THIS IS THE FIX: Bypasses the 'get()' hook
  });

  if (!userWithPassword) {
    return false;
  }

  // This will now compare (string, string-hash)
  return await bcrypt.compare(candidatePassword, userWithPassword.password);
};

module.exports = User;
