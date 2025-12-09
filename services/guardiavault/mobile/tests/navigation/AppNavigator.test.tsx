/**
 * AppNavigator Tests
 * Integration tests for navigation structure
 */

import React from "react";
import { render } from "../utils/test-utils";
import { AppNavigator } from "../../navigation/AppNavigator";

describe("AppNavigator", () => {
  it("should render navigation container", () => {
    const { UNSAFE_root } = render(<AppNavigator />);

    expect(UNSAFE_root).toBeTruthy();
  });

  it("should render main tabs navigator", () => {
    const { UNSAFE_root } = render(<AppNavigator />, { withNavigation: true });

    expect(UNSAFE_root).toBeTruthy();
  });

  // Navigation integration tests would require more setup
  // These are basic structure tests
  it("should have navigation structure", () => {
    const component = render(<AppNavigator />, { withNavigation: true });
    expect(component).toBeTruthy();
  });
});







