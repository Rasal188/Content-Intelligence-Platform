import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { ResendOTP } from "./ResendOTP";
import { ResendOTPReset, ResendOTPVerify } from "./passwordProviders";

// Full auth: email+password (with strength policy, email verification, and password reset)
// and magic email OTP.
const PasswordWithFlows = Password({
  verify: ResendOTPVerify,
  reset: ResendOTPReset,
  validatePasswordRequirements: (password: string) => {
    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password)
    ) {
      throw new ConvexError(
        "Password must be at least 8 characters and include upper, lower, and a number.",
      );
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    PasswordWithFlows,
    ResendOTP,
  ],
  // Brute-force protection: per-email token bucket (default is 10/hr) on password + OTP.
  signIn: { maxFailedAttempsPerHour: 5 },
});
