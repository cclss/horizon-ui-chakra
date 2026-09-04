import "@testing-library/jest-dom";
import { ColorModeContext, ThemeProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import React from "react";

import { Scrollbar } from "components/scrollbar/Scrollbar";
import theme from "theme/theme";

const REVEALED_THUMB = {
  light: "rgba(112, 144, 176, 0.35)",
  dark: "rgba(222, 222, 222, 0.24)",
};
const IDLE_THUMB = "var(--chakra-colors-transparent)";
const COARSE_POINTER_QUERY = "@media (hover: none), (pointer: coarse)";
const THUMB = "::-webkit-scrollbar-thumb";

/** The serialiser's whitespace is not part of the contract; the rules are. */
const normalize = (css) => css.replace(/\s+/g, " ").replace(/\s*\{\s*/g, "{");

/**
 * The emitted CSS rules that target `element`, in insertion order.
 *
 * The scroll-area contract lives entirely in scrollbar pseudo-elements and a
 * media query — neither is reachable through jsdom's computed style, so the
 * stylesheet is the only place the behaviour can be observed.
 */
function rulesFor(element) {
  const classNames = Array.from(element.classList).filter((name) =>
    name.startsWith("css-")
  );

  return Array.from(document.querySelectorAll("style"))
    .filter((tag) => tag.sheet)
    .flatMap((tag) => Array.from(tag.sheet.cssRules))
    .map((rule) => normalize(rule.cssText))
    .filter((css) => classNames.some((name) => css.includes(`.${name}`)));
}

function renderScrollArea(colorMode) {
  render(
    <ThemeProvider theme={theme}>
      <ColorModeContext.Provider
        value={{
          colorMode,
          setColorMode: () => {},
          toggleColorMode: () => {},
        }}>
        <Scrollbar>
          <div data-testid='overflowing-content' />
        </Scrollbar>
      </ColorModeContext.Provider>
    </ThemeProvider>
  );

  const rules = rulesFor(
    screen.getByTestId("overflowing-content").parentElement
  );
  expect(rules.length).toBeGreaterThan(0);
  return rules;
}

describe.each([
  ["light", REVEALED_THUMB.light],
  ["dark", REVEALED_THUMB.dark],
])("Scroll area in %s mode", (colorMode, revealedThumb) => {
  it("keeps the thumb visible without hover on coarse pointers", () => {
    const rules = renderScrollArea(colorMode);
    const coarse = rules.find((css) => css.startsWith(COARSE_POINTER_QUERY));

    expect(coarse).toBeDefined();
    expect(coarse).toContain(`${THUMB}{background: ${revealedThumb};`);
    expect(coarse).toContain(`scrollbar-color: ${revealedThumb} transparent;`);
  });

  it("orders the coarse-pointer rules after the idle rules they override", () => {
    const rules = renderScrollArea(colorMode);

    expect(
      rules.findIndex((css) => css.startsWith(COARSE_POINTER_QUERY))
    ).toBeGreaterThan(
      rules.findIndex((css) => css.includes(`${THUMB}{background: ${IDLE_THUMB};`))
    );
  });

  it("still hides the idle thumb and reveals it on hover or focus", () => {
    const rules = renderScrollArea(colorMode);
    const finePointer = rules.filter(
      (css) => !css.startsWith(COARSE_POINTER_QUERY)
    );

    expect(
      finePointer.some((css) =>
        css.includes(`${THUMB}{background: ${IDLE_THUMB};`)
      )
    ).toBe(true);
    expect(
      finePointer.some(
        (css) =>
          css.includes(`:hover${THUMB}`) &&
          css.includes(`:focus-within${THUMB}{background: ${revealedThumb};`)
      )
    ).toBe(true);
  });

  it("scrolls overflowing content through the native scroll area", () => {
    const rules = renderScrollArea(colorMode);

    expect(
      rules.some(
        (css) =>
          css.includes("overflow-y: auto") &&
          css.includes("overflow-x: hidden")
      )
    ).toBe(true);
  });
});
