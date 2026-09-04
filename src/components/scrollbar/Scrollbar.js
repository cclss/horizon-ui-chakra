import { Box, useColorModeValue } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

/*
 * Design values for the scroll-area presentation.
 *
 * thickness / radius / transition are shared by both color modes; only the
 * thumb colors are mode dependent (resolved through useColorModeValue below).
 * The thumb is transparent while idle and is revealed on hover / keyboard
 * focus, which replaces the auto-hide behaviour the previous scroll library
 * provided.
 */
const SCROLLBAR_THICKNESS = "6px";
const THUMB_RADIUS = "9999px";
const REVEAL_TRANSITION = "background-color 200ms ease 0s";
const TRACK_COLOR = "transparent";
const THUMB_IDLE_COLOR = "transparent";

/*
 * Coarse pointers (touch) emit no hover signal, so the reveal interaction can
 * never fire there and the mobile drawer would expose no scrollbar at all.
 * Under this query the thumb rests in its revealed state instead of the
 * transparent idle state. This is a device-capability query, not a viewport
 * breakpoint: a touch laptop matches it, a narrow desktop window does not.
 */
const COARSE_POINTER_QUERY = "@media (hover: none), (pointer: coarse)";

/**
 * Scroll area with a thin, translucent, hover-revealed scrollbar.
 *
 * Uses the browser's native scrolling (`overflow-y: auto`) and only styles the
 * scrollbar chrome, so it stays correct in RTL (the native scrollbar follows
 * the document direction) and needs no measurement or resize observers.
 *
 * On coarse pointers the thumb stays visible, since hover cannot reveal it.
 */
export function Scrollbar({ children, ...rest }) {
  const thumbColor = useColorModeValue(
    "rgba(112, 144, 176, 0.35)",
    "rgba(222, 222, 222, 0.24)"
  );
  const thumbActiveColor = useColorModeValue(
    "rgba(112, 144, 176, 0.55)",
    "rgba(222, 222, 222, 0.4)"
  );

  return (
    <Box
      h='100%'
      w='100%'
      overflowY='auto'
      overflowX='hidden'
      sx={{
        // Firefox
        scrollbarWidth: "thin",
        scrollbarColor: `${THUMB_IDLE_COLOR} ${TRACK_COLOR}`,
        "&:hover, &:focus-within": {
          scrollbarColor: `${thumbColor} ${TRACK_COLOR}`,
        },
        // WebKit / Blink
        "&::-webkit-scrollbar": {
          width: SCROLLBAR_THICKNESS,
        },
        "&::-webkit-scrollbar-track": {
          background: TRACK_COLOR,
        },
        "&::-webkit-scrollbar-thumb": {
          background: THUMB_IDLE_COLOR,
          borderRadius: THUMB_RADIUS,
          transition: REVEAL_TRANSITION,
        },
        "&:hover::-webkit-scrollbar-thumb, &:focus-within::-webkit-scrollbar-thumb":
          {
            background: thumbColor,
          },
        "&::-webkit-scrollbar-thumb:hover": {
          background: thumbActiveColor,
        },
        // Declared last so it wins over the equally specific idle rules above
        // without outranking the hover / active rules, which are more specific.
        [COARSE_POINTER_QUERY]: {
          scrollbarColor: `${thumbColor} ${TRACK_COLOR}`,
          "&::-webkit-scrollbar-thumb": {
            background: thumbColor,
          },
        },
      }}
      {...rest}>
      {children}
    </Box>
  );
}

Scrollbar.propTypes = {
  children: PropTypes.node,
};

export default Scrollbar;
