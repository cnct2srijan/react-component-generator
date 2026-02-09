import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "../SignUpForm";

const mockSignUp = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    isLoading: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("SignUpForm", () => {
  test("renders email, password, and confirm password fields", () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByLabelText("Confirm Password")).toBeDefined();
  });

  test("renders sign up button", () => {
    render(<SignUpForm />);

    expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();
  });

  test("shows password requirements hint", () => {
    render(<SignUpForm />);

    expect(screen.getByText("Must be at least 8 characters long")).toBeDefined();
  });

  test("submits form with matching passwords", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<SignUpForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  test("calls onSuccess when sign up succeeds", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<SignUpForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test("shows error when passwords do not match", async () => {
    const user = userEvent.setup();

    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "different");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeDefined();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  test("shows error when sign up fails", async () => {
    mockSignUp.mockResolvedValue({
      success: false,
      error: "Email already registered",
    });
    const user = userEvent.setup();

    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByText("Email already registered")).toBeDefined();
    });
  });

  test("shows default error message when no error string provided", async () => {
    mockSignUp.mockResolvedValue({ success: false });
    const user = userEvent.setup();

    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to sign up")).toBeDefined();
    });
  });

  test("does not call onSuccess when sign up fails", async () => {
    mockSignUp.mockResolvedValue({ success: false, error: "Error" });
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<SignUpForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test("password field has minLength attribute", () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText("Password").getAttribute("minLength")).toBe("8");
  });
});
