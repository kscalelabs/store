import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders stompy urdf link", () => {
  render(<App />);
  const linkElement = screen.getByText(/robolist/i);
  expect(linkElement).toBeInTheDocument();
});
