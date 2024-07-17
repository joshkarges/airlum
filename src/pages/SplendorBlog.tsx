import { Typography } from "@mui/material";
import splendorBox from "../assets/splendorBox.jpg";
import splendorTable from "../assets/splendorTable.png";
import splendorImage from "../assets/splendorImage.png";
import { Flex } from "../components/Flex";
import { useStyles } from "./styles";

export const SplendorBlog = () => {
  const classes = useStyles();
  return (
    <>
      <Typography variant="h2" className={classes.header}>
        Splendor Blog
      </Typography>
      <div className={classes.bodyContainer}>
        <Typography variant="body1">
          A few years ago, my brother got me this game called Splendor. It's a
          game where you collect gems to buy cards that give you points. The
          cards also give you discounts on future cards. The game is a lot of
          fun, and I played it a lot with my family and friends who also became
          enamoured with it quickly.
        </Typography>
        <br />
        <Flex flexWrap="wrap" justifyContent="space-evenly">
          <img
            src={splendorBox}
            alt="the splendor board game box"
            className={classes.img}
          />
          <img
            src={splendorTable}
            alt="An example of the splendor layout"
            className={classes.img}
          />
        </Flex>
        <br />
        <Typography variant="body1">
          But while others' interest seemed to wane, I became obsessed with
          figuring out the optimal strategy for the game. Should you go after
          the high point cards early while risking them getting stolen? Should
          you go after the low cards to get the discounts? Should you go after
          the cards that give you points for having a lot of cards? Something in
          between? The official mobile app version of the game has 3 different
          strategies for its AIs: balanced, opportunistic, and specialized. The
          balanced AI tries to balance all of the strategies, the opportunistic
          AI tries to get the best card available, and the specialized AI tries
          to get the cards that give it the most points. But what if we could
          let the AI learn the best strategy itself?
        </Typography>
        <br />

        <Typography variant="body1">
          I recreated the game in React and started working on an AI for it.
          This was no simple feat. Even though the game is very simple, there's
          quite a few rules to consider to get the game working the way it's
          supposed to with lots of edge cases to consider.
          <a href="/splendor">Give it a try here!</a>
        </Typography>
        <br />
        <Flex justifyContent="space-evenly">
          <img
            src={splendorImage}
            alt="screenshot of the splendor app"
            className={classes.img}
          />
        </Flex>
        <br />
        <Typography variant="body1">
          I researched different adversarial algorithms and decided to try
          minimax with alpha-beta pruning. Minimax essentially tries to maximize
          the AI's score and minimize the player's score. Alpha-beta pruning is
          a way to make minimax run faster by not checking branches that are
          worse than the current best branch. The key part here is that word
          "score". At each point in the game, how well is a particular player
          doing? This is called the cost function in many algorithms. Mine
          focuses on the number of points the player has, the number of cards
          they've bought, the number of cards they can currently afford, and the
          number of gems they have, in that order. A neural network could be
          utilized to generate a more accurate cost function, but we'll need a
          lot of data to train it. More on that later.
        </Typography>
        <br />
        <Typography variant="body1">
          The problem with minimax is that it usually only applies to games with
          2 players. Splendor can have up to 4 players. So I decided to try an
          approach to Generate the best move given that the other players will
          also try to make their best move. It still searches down a tree of
          possible moves similar to minimax, but it calculates the score
          relative to other players in a different way. I call it maxN, and I
          run it to a depth of 3 moves into the future currently. I run it using
          a webworker so that the game can still be played while the AI is
          thinking, but a faster way could be to write the algorithm in C++ to
          run on an external server.
        </Typography>
        <br />
        <Typography variant="body1">
          I've started recording the games I play using firestore to start
          generating some training data for a more generalized AI in the future,
          with a more accurate cost function and a faster processing time. I'm
          excited to see how it turns out!
        </Typography>
      </div>
    </>
  );
};
