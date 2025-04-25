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
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError("Username or Email is required", 400);
  }
  const user = await User.findOne({
    $or: [
      { username: username?.toLowerCase() },
      { email: email?.toLowerCase() },
    ],
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const isValidPassword = await user.isPasswordCorrect(password);
  if (!isValidPassword) {
    throw new ApiError("Invalid credentials", 401);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findByIdAndUpdate(user._id).select(
    "-password -refreshToken"
  );

  const cookiesOptions = {
    httpOnly: true,
    secure: true,
  };

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
    console.log("Logout request received:", req.user);
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    const cookiesOptions = {
      httpOnly: true,
      secure: true,
    };
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

  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError("Refresh Token expired", 401);
  }
  const decoded = await jwt.verify(
    incommingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  try {
    const user = await User.findById(decoded._id);

    if (!user) {
      throw new ApiError("Refresh Token expired", 401);
    }
    if (incommingRefreshToken != user?.refreshToken) {
      throw new ApiError("Refresh Token expired", 401);
    }
    const { newAccessToken, newRefreshToken } = generateAccessAndRefreshToken(
      user._id
    );

    const cookiesOptions = {
      httpOnly: true,
      secure: true,
    };

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
