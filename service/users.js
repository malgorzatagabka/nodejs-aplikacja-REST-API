const User = require("../service/schemas/user.js");

const findUserbyEmail = async (email) => {
  return User.findOne({ email });
};

const addToken = async (id, token) =>
  await User.findByIdAndUpdate(id, { token });

const logOut = async (id) => await User.findByIdAndUpdate(id, { token: null });

const updateSubscription = async (id, body) =>
  User.findByIdAndUpdate(id, { subscription: body }, { new: true });

module.exports = {
  findUserbyEmail,
  addToken,
  logOut,
  updateSubscription,
};
