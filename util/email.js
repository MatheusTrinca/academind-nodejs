const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

module.exports = class Email {
  constructor(user) {
    (this.to = user.email), (this.from = 'felipematheustrinca@gmail.com');
  }

  newTransport() {
    return nodemailer.createTransport(
      sendgridTransport({
        auth: {
          api_key: process.env.SENDGRID_API_KEY,
        },
      })
    );
  }

  async send(subject, body) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: body,
    };
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome to Shop', '<h2>Welcome!!</h2>');
  }
};
