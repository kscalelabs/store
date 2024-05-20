import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders stompy urdf link", () => {
  render(<App />);
  const linkElement = screen.getByText(/Website/i);
  expect(linkElement).toBeInTheDocument();
});
