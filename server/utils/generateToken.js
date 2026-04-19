import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign(
    { 
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName,
        activeRole: user.activeRole,
        roles: user.roles
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m', // Shorter access token
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      address: user.address,
      activeRole: user.activeRole,
      roles: user.roles,
      status: user.status,
      website: user.website,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d', // Longer refresh token
    }
  );
};

export { generateToken, generateRefreshToken };
