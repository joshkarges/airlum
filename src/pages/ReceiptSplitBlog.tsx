import { Typography } from "@mui/material";
import receiptSplit from "../assets/receiptSplit.png";
import { Flex } from "../components/Flex";
import { useStyles } from "./styles";

export const ReceiptSplitBlog = () => {
  const classes = useStyles();
  return (
    <>
      <Typography variant="h2" className={classes.header}>
        Receipt Split Blog
      </Typography>
      <div className={classes.bodyContainer}>
        <Typography variant="body1">
          I wanted to test an example of using AI to help with a problem I was
          having. The following blog and the related app were all built in a few
          hours of work, what would otherwise have taken days of work.
        </Typography>
        <br />
        <Typography variant="body1">
          Eating out with friends is easy until the check arrives. Someone
          ordered appetizers to share, someone skipped drinks, and the receipt
          is a long strip of abbreviations and taxes. Mental math works for
          simple cases, but I wanted a small tool that keeps the receipt as the
          source of truth and makes “who owes what” explicit.
        </Typography>
        <br />
        <Typography variant="body1">
          <a href="/receipt-split">Receipt Split</a> is a page on this site
          where you upload a photo of a restaurant receipt. You can crop the
          image so only the paper matters—table, hands, and background drop away
          before parsing. Then you can run OCR in the browser with Tesseract
          (free, private, and a bit rough on fuzzy thermal prints) or send the
          image to Google’s Gemini model to pull out line items, subtotal, tax,
          tip, and grand total when they appear on the slip.
        </Typography>
        <br />
        <Flex justifyContent="center" flexWrap="wrap">
          <img
            src={receiptSplit}
            alt="screenshot of the receipt split app"
            className={classes.img}
          />
        </Flex>
        <br />
        <Typography variant="body1">
          After lines are in the table, you add the people splitting the bill
          and assign each line to one or more names; shared lines split evenly.
          Tax and tip sit below the items and allocate in proportion to each
          person’s share of the line subtotal (including unassigned lines, if
          you leave any). If Gemini returns a grand total and your lines plus
          tax and tip do not match within a penny, the app warns you so you can
          fix a bad line or rounding before you trust the breakdown.
        </Typography>
        <br />
        <Typography variant="body1">
          You can also skip the camera entirely and paste plain text, or add
          rows by hand when automation misses a line. The goal is not perfect
          accounting software—it is a practical helper for the moment the server
          drops the folder on the table.
        </Typography>
        <br />
        <Typography variant="body1">
          <a href="/receipt-split">Try Receipt Split here.</a>
        </Typography>
        <br />
      </div>
    </>
  );
};
