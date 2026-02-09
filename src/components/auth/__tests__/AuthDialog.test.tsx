import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { AuthDialog } from "../AuthDialog";

vi.mock("../SignInForm", () => ({
  SignInForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="sign-in-form">
      <button onClick={onSuccess}>Mock Sign In</button>
    </div>
  ),
}));

vi.mock("../SignUpForm", () => ({
  SignUpForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="sign-up-form">
      <button onClick={onSuccess}>Mock Sign Up</button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("AuthDialog", () => {
  test("renders sign in mode by default", () => {
    render(
      <AuthDialog open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText("Welcome back")).toBeDefined();
    expect(screen.getByText("Sign in to your account to continue")).toBeDefined();
    expect(screen.getByTestId("sign-in-form")).toBeDefined();
  });

  test("renders sign up mode when defaultMode is signup", () => {
    render(
      <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
    );

    expect(screen.getByText("Create an account")).toBeDefined();
    expect(
      screen.getByText(
        "Sign up to start creating AI-powered React components"
      )
    ).toBeDefined();
    expect(screen.getByTestId("sign-up-form")).toBeDefined();
  });

  test("switches from sign in to sign up mode", () => {
    render(
      <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signin" />
    );

    expect(screen.getByTestId("sign-in-form")).toBeDefined();

    fireEvent.click(screen.getByText("Sign up"));

    expect(screen.getByTestId("sign-up-form")).toBeDefined();
    expect(screen.getByText("Create an account")).toBeDefined();
  });

  test("switches from sign up to sign in mode", () => {
    render(
      <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
    );

    expect(screen.getByTestId("sign-up-form")).toBeDefined();

    fireEvent.click(screen.getByText("Sign in"));

    expect(screen.getByTestId("sign-in-form")).toBeDefined();
    expect(screen.getByText("Welcome back")).toBeDefined();
  });

  test("calls onOpenChange(false) when form succeeds", () => {
    const onOpenChange = vi.fn();
    render(
      <AuthDialog open={true} onOpenChange={onOpenChange} />
    );

    fireEvent.click(screen.getByText("Mock Sign In"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("does not render when open is false", () => {
    render(
      <AuthDialog open={false} onOpenChange={vi.fn()} />
    );

    expect(screen.queryByText("Welcome back")).toBeNull();
  });

  test("shows 'Don't have an account?' in sign in mode", () => {
    render(
      <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signin" />
    );

    expect(screen.getByText(/Don't have an account/)).toBeDefined();
  });

  test("shows 'Already have an account?' in sign up mode", () => {
    render(
      <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
    );

    expect(screen.getByText(/Already have an account/)).toBeDefined();
  });
});
