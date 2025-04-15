import React, { useCallback } from "react";
import { Flex } from "../components/Flex";
import { StyleRules, makeStyles } from "@mui/styles";
import { AppBar, Theme, Typography } from "@mui/material";
import { blue } from "@mui/material/colors";
import _ from "lodash";
import classNames from "classnames";
import { getContrastText } from "../utils/color";
import gifterImg from "../assets/gifterImage.png";
import tattooImg from "../assets/tattooImage.png";
import splendorImg from "../assets/splendorImage.png";
import plansImg from "../assets/plansImage.jpg";
import timedTeamsImage from "../assets/timedTeamsImage.png";
import resumeImage from "../assets/resumeImage.png";

const PAGES = [
  {
    title: "Resume",
    path: "https://docs.google.com/document/d/1RUhfpbxBKend6wdX3yEg2YxJZvNm05MZbHirTAqhAhc/edit?usp=sharing",
    backgroundColor: blue[50],
    img: { src: resumeImage, alt: "screen shot of my resume" },
  },
  {
    title: "Tattoo",
    path: "/tattoo",
    blog: "/blog/tattoo",
    backgroundColor: blue[100],
    img: { src: tattooImg, alt: "screen shot of the tattoo app" },
  },
  {
    title: "CBRE Plans",
    path: "https://web.archive.org/web/20200518141749/https://www.cbrebuild.com/nyc/plans/",
    blog: "/blog/cbre-plans",
    backgroundColor: blue[200],
    img: { src: plansImg, alt: "screen shot of the plans app" },
  },
  {
    title: "Timed Teams",
    path: "/timed-teams",
    blog: "/blog/timed-teams",
    backgroundColor: blue[400],
    img: { src: timedTeamsImage, alt: "screen shot of the timed teams app" },
  },
  {
    title: "Splendor",
    path: "/splendor",
    blog: "/blog/splendor",
    stats: "/splendor-stats",
    backgroundColor: blue[600],
    img: { src: splendorImg, alt: "screen shot of the splendor app" },
  },
  {
    title: "Gifter",
    path: "https://thegifter.app",
    blog: "/blog/gifter",
    backgroundColor: blue[800],
    img: { src: gifterImg, alt: "screen shot of the gifter app" },
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
    overflowX: "auto",
    overflowY: "hidden",
    background: blue[50],
    height: "calc(100vh - 64px)",
    marginTop: 64,
  },
  appBar: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    justifyContent: "center",
    alignItems: "center",
    height: 64,
  },
}));

const useStyles2 = makeStyles<
  Theme,
  { idx: number; total: number; bg: string },
  string
>((theme: Theme) => ({
  pageLinkContainer: {
    textDecoration: "none",
    fontSize: 32,
    fontWieght: "bold",
  },
  ...pageClasses,
  exchangeEventListCircle: {
    borderRadius: 10000,
    aspectRatio: "1/1",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  pgram: {
    position: "absolute",
    top: 0,
    right: ({ idx, total }) => `${(idx / total) * 125 - 35}%`,
    backgroundColor: ({ bg }) => bg,
    color: ({ bg }) => theme.palette.getContrastText(bg),
    transform: "skew(20deg)",
    width: "100vw",
    justifyContent: "flex-end",
    alignItems: "center",
    height: "calc(100vh - 64px)",
    padding: 32,
    boxSizing: "border-box",
    transition: "right 0.5s",
    columnGap: 16,
  },
  linkText: {
    bottom: 1.5,
    position: "relative",
  },
}));

const PGram = ({
  idx,
  total,
  text,
  href,
  hoverIndex,
  setHoverIndex,
}: {
  idx: number;
  total: number;
  text: string;
  href: string;
  hoverIndex: number;
  setHoverIndex: (idx: number) => void;
}) => {
  const classes = useStyles2({
    idx: hoverIndex === -1 || idx <= hoverIndex ? idx + 0.5 : idx + 2,
    total: hoverIndex === -1 ? total + 0.5 : total + 2,
    bg: PAGES[idx].backgroundColor,
  });
  const onMouseEnter = useCallback(
    (idx: number) => () => {
      setHoverIndex(idx);
    },
    [setHoverIndex]
  );
  return (
    <a
      key={href}
      href={href}
      className={classNames(classes.pageLinkContainer)}
      onMouseEnter={onMouseEnter(idx)}
    >
      <Flex className={classes.pgram}>
        <div
          style={{
            transform: "skew(-20deg)",
            position: "absolute",
            right: 100,
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {PAGES[idx].img && <img height="300px" {...PAGES[idx].img} />}
        </div>
        <Typography
          variant="h4"
          style={{
            transform: "skew(-20deg)translateX(50%)rotate(70deg)",
            display: "flex",
            whiteSpace: "pre",
          }}
        >
          <div className={classes.linkText}>{text}</div>
          {PAGES[idx].blog && (
            <>
              <div> | </div>
              <a className={classes.linkText} href={PAGES[idx].blog}>
                Blog
              </a>
            </>
          )}
          {PAGES[idx].stats && (
            <>
              <div> | </div>
              <a
                className={classes.linkText}
                onClick={() => (window.location.href = PAGES[idx].stats!)}
                href={PAGES[idx].stats!}
              >
                Stats
              </a>
            </>
          )}
        </Typography>
      </Flex>
    </a>
  );
};

const HomePage = () => {
  const classes = useStyles();
  const [hoverIndex, setHoverIndex] = React.useState<number>(-1);
  const onMouseLeave = useCallback(() => setHoverIndex(-1), []);

  // When the user scrolls vertically, scroll horizontally instead.
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.target) {
      _.set(
        e,
        "currentTarget.scrollLeft",
        (_.get(e, "currentTarget.scrollLeft") || 0) + e.deltaY
      );
    }
    e.preventDefault();
    e.stopPropagation();
  }, []);
  return (
    <div>
      <AppBar className={classes.appBar}>
        <Typography variant="h4">Josh Karges</Typography>
      </AppBar>
      <Flex
        width="100%"
        flexGrow={1}
        className={classes.homeContainer}
        onMouseLeave={onMouseLeave}
        onWheel={onWheel}
      >
        {PAGES.map(({ title, path }, idx) => {
          return (
            <PGram
              key={path}
              idx={idx}
              total={PAGES.length}
              text={title}
              href={path}
              hoverIndex={hoverIndex}
              setHoverIndex={setHoverIndex}
            />
          );
        })}
      </Flex>
    </div>
  );
};

export default HomePage;
