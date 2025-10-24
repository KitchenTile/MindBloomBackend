import { isPasswordValid } from "../utils/passwordUtils.js";
import { supabase } from "../config/db.js";

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber } = req.body;

    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).send("Missing required fields");
    }

    if (!isPasswordValid(password)) {
      return res.status(400).send("Password not strong enough");
    }

    // Sign up with email, add metadata like user name and phone number
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
          phone_number: phoneNumber,
        },
      },
    });

    //get the new user
    const newUser = data.user;

    if (!newUser) {
      return res.status(202).json({
        message:
          "User created. Please check your email to confirm registration.",
      });
    }
    if (error)
      return res
        .status(400)
        .json({ message: "Sign Up Failed: " + error.message });

    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: newUser.id,
      role: role === "admin" ? "admin" : "student",
    });

    if (roleError)
      return res
        .status(500)
        .json({ message: "Registration failed during role assignment." });

    return res.status(201).json({
      message: "User and Role created successfully.",
      user_id: newUser.id,
    });
  } catch (error) {
    console.log(error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email);

    if (!email || !password)
      return res.status(400).send("Missing required fields");

    // Sign in with email
    const { user, error } = await supabase.auth.signIn({
      email: "example@email.com",
      password: "example-password",
    });
  } catch (error) {
    console.log(error);
  }
};
