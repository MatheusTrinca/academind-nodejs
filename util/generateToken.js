const crypto = require('crypto');

const generateToken = async () => {
  const buffer = await new Promise((resolve, reject) => {
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        reject('Error generating token');
      }
      resolve(buffer);
    });
  });
  const token = crypto.createHash('sha1').update(buffer).digest('hex');
  return token;
};

module.exports = generateToken;
