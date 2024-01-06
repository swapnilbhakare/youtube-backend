import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  //  get user details from frontend
  const { userName, email, fullName, password } = req.body;

  // validation - not empty
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // checking if user already exits : username,email
  const existedUser = User.findOne({
    $or: [{ userName }, { email }],
  });
  console.log("existedUser", existedUser);
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exits");
  }

  // checking if for images, check for avatar

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverImage[0]?.path;

  console.log(
    "avatarLocalPath & coverLocalPath ",
    avatarLocalPath,
    coverLocalPath
  );
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avtar file is required");
  }
  // uploading  them to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avtar file is required");
  }

  // createing user object - createing-entry in db

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  // removing  password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // checking for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // returning respose else return error
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registerd Successfully"));
});

export { registerUser };
