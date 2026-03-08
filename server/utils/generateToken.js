import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign(
    { 
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m', // Shorter access token
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { _id: user._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d', // Longer refresh token
    }
  );
};

export { generateToken, generateRefreshToken };
