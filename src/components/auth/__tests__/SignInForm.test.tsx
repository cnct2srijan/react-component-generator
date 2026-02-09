import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "../SignInForm";

const mockSignIn = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    isLoading: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("SignInForm", () => {
  test("renders email and password fields", () => {
    render(<SignInForm />);

    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
  });

  test("renders sign in button", () => {
    render(<SignInForm />);

    expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
  });

  test("submits form with email and password", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<SignInForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  test("calls onSuccess when sign in succeeds", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<SignInForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test("shows error when sign in fails", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
    const user = userEvent.setup();

    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeDefined();
    });
  });

  test("shows default error message when no error string provided", async () => {
    mockSignIn.mockResolvedValue({ success: false });
    const user = userEvent.setup();

    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to sign in")).toBeDefined();
    });
  });

  test("does not call onSuccess when sign in fails", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "Invalid" });
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<SignInForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test("email input has type email", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
  });

  test("password input has type password", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("password");
  });
});
