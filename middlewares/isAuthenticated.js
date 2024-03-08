const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  //   console.log("on est dedans !");
  const receivedToken = req.headers.authorization.replace("Bearer ", "");
  // console.log(receivedToken);

  const userConnected = await User.findOne({ token: receivedToken }).select(
    "account"
  );
  if (userConnected) {
    req.owner = userConnected;
    next();
  } else {
    return res.status(401).json("Unauthorized");
  }
};

module.exports = isAuthenticated;
