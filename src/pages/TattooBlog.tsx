import { Theme, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import tattooImage from "../assets/tattooImage.png";
import tattooSliders from "../assets/tattooSliders.png";
import { Flex } from "../components/Flex";

const useStyles = makeStyles((theme: Theme) => ({
  bodyContainer: {
    padding: 16,
    maxWidth: 800,
  },
  img: {
    maxWidth: "100%",
    maxHeight: 300,
  },
}));

export const TattooBlog = () => {
  const classes = useStyles();
  return (
    <>
      <Typography variant="h2">Tattoo Blog</Typography>
      <div className={classes.bodyContainer}>
        <Typography variant="body1">
          In search of my next tattoo, I wanted it to represent my passion for
          mathematics, so I landed on Euler's identity. Called the "most
          beautiful theorem in mathematics" by Richard Feynman, it relates the
          five most important constants in mathematics: 0, 1, π, e, and i. The
          tattoo is a visual representation of the equation e^(iπ) + 1 = 0.
          Surrounding the equation is a border that matches the golden ratio,
          which is used extensively in art and architecture.
        </Typography>
        <br />
        <Typography variant="body1">
          Not knowing many design apps, I leaned on my experience with svgs to
          create my next tattoo. I used an svg because I knew it could be
          scalable since I didn't know the exact size I wanted yet. It was
          fairly straightforward to manipulate the svg, and I made variables
          that I could tweak to represent things like the line thickness, the
          gaps, and border radii.
        </Typography>
        <br />
        <Flex justifyContent="center" flexWrap="wrap">
          <img
            src={tattooImage}
            alt="screenshot of the tattoo svg"
            // height={300}
            className={classes.img}
          />
          <img
            src={tattooSliders}
            alt="screenshot of the tattoo sliders"
            // height={300}
            className={classes.img}
          />
        </Flex>
        <Typography variant="body1">
          <a href="/tattoo">See the svg version here.</a>
        </Typography>
        <br />
      </div>
    </>
  );
};
