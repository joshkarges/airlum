import React from "react";
import SkyLanternCanvas from "../components/SkyLanternCanvas";
import { Flex } from "../components/Flex";
import { StyleRules, makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";
import { blue, green, red, yellow } from "@mui/material/colors";
import _ from "lodash";
import classNames from "classnames";
import { getContrastText } from "../utils/color";

const PAGES = [
  {
    title: "Bang for Buck",
    path: "/tasks",
    backgroundColor: yellow[500],
  },
  {
    title: "Splendor",
    path: "/splendor",
    backgroundColor: red[500],
  },
  {
    title: "Tattoo",
    path: "/tattoo",
    backgroundColor: green[500],
  },
  {
    title: "Exchange Events",
    path: "/exchange-events",
    backgroundColor: blue[500],
  },
];

const pageClasses = PAGES.reduce((acc, { title, backgroundColor }, i) => {
  const camelTitle = _.camelCase(title);
  acc[`${camelTitle}Container`] = {
    animation: `$${camelTitle}spin 20s linear infinite`,
    "& > div": {
      backgroundColor,
      color: getContrastText(backgroundColor),
    },
  };
  acc[`@keyframes ${camelTitle}spin`] = {
    "0%": {
      transform: `translate(-50%, -50%)rotate(${
        (i * 360) / PAGES.length
      }deg)translateY(-200px)rotate(${-(i * 360) / PAGES.length}deg)`,
    },
    "100%": {
      transform: `translate(-50%, -50%)rotate(${
        (i * 360) / PAGES.length + 360
      }deg)translateY(-200px)rotate(${-((i * 360) / PAGES.length + 360)}deg)`,
    },
  };
  return acc;
}, {} as StyleRules<{}, string>);

const useStyles = makeStyles((theme: Theme) => ({
  homeContainer: {
    position: "relative",
  },
  pageLinkContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    textDecoration: "none",
    fontSize: 32,
    fontWieght: "bold",
  },
  // "@keyframes spin": {
  //   "0%": {
  //     transform: "translate(-50%, -50%)rotate(0deg)translateY(-200px)",
  //   },
  //   "100%": {
  //     transform:
  //       "translate(-50%, -50%)rotate(360deg)translateY(-200px)rotate(-360deg)",
  //   },
  // },
  ...pageClasses,
  exchangeEventListCircle: {
    borderRadius: 10000,
    aspectRatio: "1/1",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  linkText: {
    bottom: 1.5,
    position: "relative",
  },
}));

const HomePage = () => {
  const classes = useStyles();
  return (
    <Flex width="100%" flexGrow={1} className={classes.homeContainer}>
      {PAGES.map(({ title, path }) => {
        const camelTitle = _.camelCase(title);
        return (
          <a
            key={camelTitle}
            href={path}
            className={classNames(
              classes.pageLinkContainer,
              classes[`${camelTitle}Container` as keyof typeof classes]
            )}
          >
            <Flex className={classes.exchangeEventListCircle}>
              <div className={classes.linkText}>{title}</div>
            </Flex>
          </a>
        );
      })}
    </Flex>
  );
};

export default HomePage;
