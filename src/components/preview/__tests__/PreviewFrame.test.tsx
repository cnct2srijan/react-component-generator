import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PreviewFrame } from "../PreviewFrame";

const mockGetAllFiles = vi.fn();
const mockRefreshTrigger = 0;

vi.mock("@/lib/contexts/file-system-context", () => ({
  useFileSystem: () => ({
    getAllFiles: mockGetAllFiles,
    refreshTrigger: mockRefreshTrigger,
  }),
}));

vi.mock("@/lib/transform/jsx-transformer", () => ({
  createImportMap: vi.fn(() => ({
    importMap: {},
    styles: "",
    errors: [],
  })),
  createPreviewHTML: vi.fn(() => "<html><body>Preview</body></html>"),
}));

vi.mock("lucide-react", () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("PreviewFrame", () => {
  test("shows welcome message on first load with no files", () => {
    mockGetAllFiles.mockReturnValue(new Map());

    render(<PreviewFrame />);

    expect(screen.getByText("Welcome to UI Generator")).toBeDefined();
    expect(
      screen.getByText("Start building React components with AI assistance")
    ).toBeDefined();
  });

  test("shows error when no React component files found", () => {
    mockGetAllFiles.mockReturnValue(
      new Map([["/readme.txt", "hello"]])
    );

    render(<PreviewFrame />);

    expect(screen.getByText("No Preview Available")).toBeDefined();
    expect(
      screen.getByText(
        "No React component found. Create an App.jsx or index.jsx file to get started."
      )
    ).toBeDefined();
  });

  test("renders iframe when App.jsx exists", () => {
    mockGetAllFiles.mockReturnValue(
      new Map([
        ["/App.jsx", 'export default function App() { return <div>Hello</div>; }'],
      ])
    );

    render(<PreviewFrame />);

    const iframe = screen.getByTitle("Preview");
    expect(iframe).toBeDefined();
    expect(iframe.tagName).toBe("IFRAME");
  });

  test("finds App.tsx as entry point", () => {
    mockGetAllFiles.mockReturnValue(
      new Map([
        ["/App.tsx", 'export default function App() { return <div>Hello</div>; }'],
      ])
    );

    render(<PreviewFrame />);

    expect(screen.getByTitle("Preview")).toBeDefined();
  });

  test("finds index.jsx as entry point", () => {
    mockGetAllFiles.mockReturnValue(
      new Map([
        ["/index.jsx", 'export default function App() { return <div>Hello</div>; }'],
      ])
    );

    render(<PreviewFrame />);

    expect(screen.getByTitle("Preview")).toBeDefined();
  });

  test("falls back to first JSX file when no standard entry points exist", () => {
    mockGetAllFiles.mockReturnValue(
      new Map([
        ["/components/Counter.jsx", 'export default function Counter() { return <div>0</div>; }'],
      ])
    );

    render(<PreviewFrame />);

    expect(screen.getByTitle("Preview")).toBeDefined();
  });

  test("shows prompt to start creating components on welcome screen", () => {
    mockGetAllFiles.mockReturnValue(new Map());

    render(<PreviewFrame />);

    expect(
      screen.getByText(
        "Ask the AI to create your first component to see it live here"
      )
    ).toBeDefined();
  });

  test("shows hint to start creating components on error screen", () => {
    mockGetAllFiles.mockReturnValue(
      new Map([["/readme.txt", "hello"]])
    );

    render(<PreviewFrame />);

    expect(
      screen.getByText(
        "Start by creating a React component using the AI assistant"
      )
    ).toBeDefined();
  });
});
