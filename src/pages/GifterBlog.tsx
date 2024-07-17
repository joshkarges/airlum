import { Divider, Typography } from "@mui/material";
import { Flex } from "../components/Flex";
import twoWayDrawNames from "../assets/twoWayDrawNames.png";
import someTwoWayDrawNames from "../assets/someTwoWayDrawNames.png";
import noTwoWayDrawNames from "../assets/noTwoWayDrawNames.png";
import oneLoopDrawNames from "../assets/oneLoopDrawNames.png";
import matches from "../assets/matches.png";
import gifterImage from "../assets/gifterImage.png";
import { useStyles } from "./styles";

export const GifterBlog = () => {
  const classes = useStyles();
  return (
    <>
      <Typography variant="h2">Gifter Blog</Typography>
      <div className={classes.bodyContainer}>
        <Typography variant="body1">
          During the holidays our family would draw names to exchange gifts,
          then people would write down some gift ideas for themselves as
          suggestions for their gifter. The ideas would be written down in
          texts, emails, or chats, and eventually in a shared google sheets doc.
          The grandparents would give gifts to everyone, everyone would give
          gifts to all of the young children, and the others would have a secret
          santa style exchange. To keep the gifts a suprise, a plethora of chats
          would be created that excluded just one person to discuss who got what
          gifts for them.
        </Typography>
        <br />
        <Flex justifyContent="center">
          <img
            src={gifterImage}
            alt="screenshot of the the gifter app"
            className={classes.img}
          />
        </Flex>
        <br />
        <Typography variant="body1">
          I wanted to make this process more fun, convenient, and manageable, so
          I created a webapp where people could create an account, join an
          event, and create a wishlist. The app would also keep track of who had
          gotten gifts for who without letting the original giftee know, and
          would have a countdown to the gift exchange event. The app also
          allowed the organizer to draw names with a few different options for
          how to draw names. All two-way, where each gifters giftee is also
          their gifter (in the case of an odd number of gifters a three-way loop
          would have to be made). Some Two-way, where some two-way connections
          were allowed, but it would also make larger gifter loops. No two-way,
          where no two-way connections were allowed, and it could have multiple
          loops. And one-loop, where the gifter-to-giftee chain made one single
          loop.
        </Typography>
        <Flex justifyContent="center">
          <img
            src={matches}
            alt="screenshot of the matches modal in the gifter app"
            className={classes.img}
          />
          <Divider flexItem />
        </Flex>
        <Flex flexWrap="wrap" justifyContent="space-evenly">
          <img
            src={twoWayDrawNames}
            alt="diagram of the all two way method of drawing names"
            className={classes.img}
          />
          <Divider orientation="vertical" flexItem />
          <img
            src={someTwoWayDrawNames}
            alt="diagram of the some two way method of drawing names"
            className={classes.img}
          />
          <Divider orientation="vertical" flexItem />
          <img
            src={noTwoWayDrawNames}
            alt="diagram of the no two way method of drawing names"
            className={classes.img}
          />
          <Divider orientation="vertical" flexItem />
          <img
            src={oneLoopDrawNames}
            alt="diagram of the one loop method of drawing names"
            className={classes.img}
          />
        </Flex>
        <br />
        <Typography variant="body1">
          The app was a hit with the family, and we continued to use it for
          birthdays as well. Friends and coworkers are starting to use it and
          I'm hoping to roll it out to the public soon. I have plans to add more
          features to the app in the future.{" "}
          <a href="https://thegifter.app">Try it out here!</a>
        </Typography>
        <br />
        <Typography variant="h4">Tech Stack</Typography>
        <Typography variant="body1">
          The app is built with React, Redux, and Firebase. The app is hosted on
          firebase hosting, and the database is firestore. The app uses firebase
          authentication for user accounts.
        </Typography>
      </div>
    </>
  );
};
