const User = require("../service/schemas/user.js");

const findUserByEmail = async (email) => {
  return User.findOne({ email });
};

const addToken = async (id, token) =>
  await User.findByIdAndUpdate(id, { token });

const logOut = async (id) => await User.findByIdAndUpdate(id, { token: null });

const updateSubscription = async (id, body) =>
  User.findByIdAndUpdate(id, { subscription: body }, { new: true });

const updateAvatar = async (id, avatarURL) => User.findByIdAndUpdate(id, { avatarURL });
 
const verifyToken = (verificationToken) =>User.findOneAndUpdate(
  { verificationToken }, { verify: true, verificationToken: null });

  
const emailVerification = async (email) => {
	const user = await findUserByEmail(email);
	return user ? user.verify : false;
};
const resendVerification = async (email) => {
	const user = await findUserByEmail(email);
	await sendEmail(email, user.verificationToken);
};


module.exports = {
  findUserByEmail,
  addToken,
  logOut,
  updateSubscription,
  updateAvatar,
  verifyToken,
};
