import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// ACCESS AND REFRESH TOKEN GENERATER
const generateAccessAndRefreshToken = async (id) => {
  try {
    console.log("User ID received for token generation:", id); // Debug log

    const user = await User.findById(id);
    if (!user) {
      throw new ApiError("User not found", 404); // Change error message for clarity
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError("Error creating access and refresh token", 500);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Get user data from request body
  const { username, email, role, password } = req.body;

  // validation - fields not empty string
  if (!username || !email || !password) {
    throw new ApiError("All fields are required", 400);
  }

  // check if user already exists
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError("Email already exists", 409);
  }

  const duplicateUsername = await User.findOne({ username });
  if (duplicateUsername) {
    throw new ApiError("Username already exists", 409);
  }

  // create user object - create user in database
  const user = await User.create({
    username: username.toLowerCase(),
    role,
    email,
    password,
  });

  //remove password and refresh
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError("User creation failed", 500);
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse("User registered Successfully", 200, createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from body
  const { username, email, password } = req.body;

  // check username and email
  if (!username && !email) {
    throw new ApiError("Username or Email is required", 400);
  }

  // find user
  const user = await User.findOne({
    $or: [
      { username: username?.toLowerCase() },
      { email: email?.toLowerCase() },
    ],
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  // authenticate password
  const isValidPassword = await user.isPasswordCorrect(password);
  if (!isValidPassword) {
    throw new ApiError("Invalid credentials", 401);
  }

  // generate acces and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // console.log(accessToken,refreshToken)

  // update the user
  const loggedInUser = await User.findByIdAndUpdate(user._id).select(
    "-password -refreshToken"
  );

  // generate cookies
  const cookiesOptions = {
    httpOnly: true,
    secure: true,
  };

  // send cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookiesOptions)
    .cookie("refreshToken", refreshToken, cookiesOptions)
    .json(
      new ApiResponse("User logged in Successfully", 200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    // we don't have the access of the user so we will take a middleware that
    // takes accessToken and finds the user and injects the user in req

    await User.findByIdAndUpdate(
      // taking access of user form req.user
      req.user._id,
      {
        // $set: {
        //     refreshToken: undefined,
        // },
        // instead of setting the refreshToken to undefined we will unset the value of refreshToken
        $unset: {
          refreshToken: 1,
        },
      },
      // get the updated user
      {
        new: true,
      }
    );

    const cookiesOptions = {
      httpOnly: true,
      secure: true,
    };

    // clear the cookies

    return res
      .status(200)
      .clearCookie("accessToken", cookiesOptions)
      .clearCookie("refreshToken", cookiesOptions)
      .json(new ApiResponse("User logged out Successfully", 200));
  } catch (error) {
    console.error("Error during logout:", error);
    throw new ApiError("Logout failed", 500);
  }
});

// generating a new access token if refereshToken exists
const refreshAccessToken = asyncHandler(async (req, res) => {
  // store incomming referesh token

  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // if refreshToken exists verify if its correct

  if (!incommingRefreshToken) {
    throw new ApiError("Refresh Token expired", 401);
  }

  // verify the token

  const decoded = await jwt.verify(
    incommingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  // if correct make db call to get user

  try {
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new ApiError("Refresh Token expired", 401);
    }

    // check if user has a valid refershToken

    if (incommingRefreshToken != user?.refreshToken) {
      throw new ApiError("Refresh Token expired", 401);
    }

    // generate new accessToken and refreshToken

    const { newAccessToken, newRefreshToken } = generateAccessAndRefreshToken(
      user._id
    );

    // generate cookiesOptions
    const cookiesOptions = {
      httpOnly: true,
      secure: true,
    };

    // respond with new accessToken and refreshToken
    return res
      .status(200)
      .cookie("accessToken", newAccessToken, cookiesOptions)
      .cookie("refreshToken", newRefreshToken, cookiesOptions)
      .json(
        new ApiResponse(
          {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
          200
        )
      );
  } catch (error) {
    throw new ApiError(error?.message || "Invalid Refresh Token", 401);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Hash the token before lookup
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with matching token and check expiration
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  // change password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // return success response
  return res.status(200).json(
    new ApiResponse(
      {
        message: "Password changed successfully",
      },
      200
    )
  );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // get user from req.user using middleware validate JWT
  const user
   = await User.findById(req.user._id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  // return success response
  return res.status(200).json(
    new ApiResponse(
      {
        user,
      },
      200
    )
  );
}
);

const forgotPassword = asyncHandler(async (req, res) => {
  try {
    console.log("Forgot password request received:", req.body);

    const { email } = req.body;
    if (!email) {
      throw new ApiError("Email is required", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError("User not found", 404);
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `Click the link below to reset your password: \n\n${resetUrl}\n\nThis link is valid for 10 minutes.`;

    await sendEmail({
      email: email,
      subject: "Password Reset",
      message,
    });

    console.log("Email sent successfully");

    res
      .status(200)
      .json(new ApiResponse({ message: "Password reset email sent" }, 200));
  } catch (error) {
    console.error("Forgot password error:", error);
    throw new ApiError("Something went wrong. Try again later.", 500);
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  getCurrentUser,
  resetPassword,
};
