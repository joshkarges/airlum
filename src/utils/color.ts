import { grey } from "@mui/material/colors";
import Color from "color";

/**
 * Get the contrast text color for a given background color.
 * @param backgroundColor - The background color.
 * @param parentBackgroundColor - If the background color is transparent, the parent background color is considered to calculate the contrast text color.
 * @param lightTextColor - The light text color.
 * @param darkTextColor - The dark text color.
 * @returns The contrast text color.
 */
export const getContrastText = (
  backgroundColor: string,
  parentBackgroundColor = backgroundColor,
  lightTextColor = grey[900],
  darkTextColor = "#fff"
) => {
  const { alpha = 1, ...colorObject } = Color(backgroundColor).object();
  const backgroundObject = Color(parentBackgroundColor).object();
  const colorOnBackground = Color({
    r: alpha * colorObject.r + (1 - alpha) * backgroundObject.r,
    g: alpha * colorObject.g + (1 - alpha) * backgroundObject.g,
    b: alpha * colorObject.b + (1 - alpha) * backgroundObject.b,
  });
  return colorOnBackground.contrast(Color(lightTextColor)) > 4.5 // https://www.w3.org/TR/WCAG/#contrast-minimum
    ? lightTextColor
    : darkTextColor;
};
