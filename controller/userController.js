const path = require("path");
const fs = require("fs/promises");

const service = require("../service/users.js");
const User = require("../service/schemas/user.js");
const { AVATAR_DIRECTORY } = require("../config/upload.js");
const { sendVerificationEmail } = require("../config/sendgrid");

const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const { v4 } = require("uuid");

require("dotenv").config();
const secret = process.env.JWT_SECRET;

const signUp = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await service.findUserByEmail(email);

  if (user) return res.status(409).json({ message: "Email in use" });

  try {
    const avatarURL = gravatar.url(email, {
      s: "200", //size
      r: "pg", //rating
      d: "mm", //default
    });
    const verificationToken = v4();
    const newUser = new User({ email, avatarURL, verificationToken });
    newUser.setPassword(password);
    await newUser.save();
    await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
      message: "Registration successful",
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL,
        verificationToken,
      },
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await service.findUserByEmail(email);

    if (!user || !user.validPassword(password))
      return res.status(401).json({ message: "Email or password is wrong" });
    const { id, subscription } = user;
    const payload = {
      id: id,
      email: email,
    };

    const token = jwt.sign(payload, secret, { expiresIn: "3h" });

    await service.addToken(id, token);
    res.status(200).json({ token, user: { email, subscription } });
  } catch (e) {
    next(e);
  }
};

const logout = async (req, res, next) => {
  const { id } = req.user;
  try {
    await service.logOut(id);
    res.status(204).json();
  } catch (e) {
    next(e);
  }
};

const currentUser = async (req, res, next) => {
  const { email, subscription } = req.user;
  try {
    res.json({
      status: "success",
      code: 200,
      user: {
        email,
        subscription,
      },
    });
  } catch (e) {
    next(e);
  }
};

const updateSubs = async (req, res, next) => {
  const { id, email } = req.user;
  const { subscription } = req.body;
  await service.updateSubscription(id, subscription);
  try {
    res.json({
      status: "success",
      code: 200,
      message: "Subscription has been changed",
      user: {
        email,
        subscription,
      },
    });
  } catch (e) {
    next(e);
  }
};

const avatarUpdate = async (req, res, next) => {
  const { path: temporaryName, filename } = req.file;
  const avatarURL = path.join(AVATAR_DIRECTORY, filename);

  Jimp.read(temporaryName)
    .then((avatar) => {
      return avatar.resize(250, 250).write(AVATAR_DIRECTORY);
    })
    .catch((err) => {
      console.error(err);
    });

  try {
    await fs.rename(temporaryName, avatarURL);
    await service.updateAvatar();
  } catch (e) {
    await fs.unlink(temporaryName);
    next(e);
  }
  res.status(200).json({ avatarURL });
};

const sendEmailConfirmation = async (req, res, next) => {
  const { verificationToken } = req.params;
  try {
    const user = await service.verifyToken(verificationToken);

    if (user) {
      res.status(200).json({ message: "Verification successful" });
    } else {
      res.status(404).json({ message: `User not found` });
    }
  } catch (e) {
    next(e);
  }
};

const resendEmailConfirmation = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await service.findUserByEmail(email);

    if (!user) {
      res.status(404).json({ message: `User not found`});
    }
    if (user.verify) {
      res.status(400).json({ message: `Verification has already been passed`, data: "Bad request"});
    }
    await sendVerificationEmail(email, user.verificationToken);
    res.status(200).json({ message: "Verification email sent" });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  signUp,
  login,
  logout,
  currentUser,
  updateSubs,
  avatarUpdate,
  sendEmailConfirmation,
  resendEmailConfirmation,
};
