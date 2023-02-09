const sgMail = require("@sendgrid/mail");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = (email, verificationToken) => {
  return {
    to: { email },
    from: "malgorzata.dycha@gmail.com", // Change to your verified sender
    subject: "Email confirmation",
    text: "Click the link below to confirm your email address",
    html: `<strong>Click this <a href="${`http://localhost:3000/api/users/verify/${verificationToken}`}">link</a> to confirm your email address: </strong>`,
  };
};

const sendVerificationEmail = async (email, verificationToken) => {
  await sgMail
    .send(msg(email, verificationToken))
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.error(error);
    });
};

module.exports = { sendVerificationEmail };
