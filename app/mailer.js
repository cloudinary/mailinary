const nodemailer = require('nodemailer');

function send(html, options = {}) {
  return new Promise(function (resolve, reject) {
    let smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE == '1',
      auth: {
        user: process.env.SMTP_AUTH_USER,
        pass: process.env.SMTP_AUTH_PASS
      }
    };
    let transporter = nodemailer.createTransport(smtpConfig);

    let subject = typeof (options.subject) == 'function' ? options.subject(html, options) : options.subject;
    // setup email data with unicode symbols
    let mailOptions = Object.assign({ subject }, (({ from, to, bcc }) => ({ from, to, bcc }))(options));
    log.debug(mailOptions);
    mailOptions.html = html;
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        let msg = 'failed sending email';
        log.warn({ error }, msg);
        reject(msg, error);
      } else {
        let msg = `Message sent: ${info.messageId}`;
        resolve(msg);
        log.debug(msg);
      }
    });
  });
}


module.exports = {
  send
};
