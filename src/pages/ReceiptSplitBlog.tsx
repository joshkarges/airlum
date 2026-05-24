import { Typography } from "@mui/material";
import receiptSplit from "../assets/receiptSplit.png";
import receiptSplit2 from "../assets/receiptSplit2.png";
import { Flex } from "../components/Flex";
import { useStyles } from "./styles";
import { DocTitle } from "../utils/useDocTitleEffect";

export const ReceiptSplitBlog = () => {
  const classes = useStyles();
  return (
    <>
      <DocTitle title="Receipt Split Blog" />
      <Typography variant="h2" className={classes.header}>
        Receipt Split Blog
      </Typography>
      <div className={classes.bodyContainer}>
        <Flex justifyContent="center" flexWrap="wrap">
          <img
            src={receiptSplit}
            alt="screenshot of the receipt split app"
            className={classes.img}
          />
        </Flex>
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
          <a href="/receipt-split">Receipt Split</a> is an app where you upload
          a photo of a restaurant receipt. You can crop the image so only the
          paper matters—table, hands, and background drop away before parsing.
          Then the image gets sent to Google’s Gemini model to pull out line
          items, subtotal, tax, tip, and grand total when they appear on the
          slip.
        </Typography>
        <br />
        <Flex justifyContent="center" flexWrap="wrap">
          <img
            src={receiptSplit2}
            alt="screenshot of the receipt split function page"
            className={classes.img}
          />
        </Flex>
        <br />
        <Typography variant="body1">
          After lines are in the table, you add the people splitting the bill
          and assign each line to one or more names; shared lines split evenly.
          When you are ready to split with the table, sign in and tap{" "}
          <strong>Share</strong> to save the receipt and copy a link. Everyone
          opens the same URL, picks their name from the list, and uses{" "}
          <strong>+ Me</strong> on each line they ordered. Assignments sync in
          real time, so you are not passing one phone around or playing receipt
          secretary for the group.
        </Typography>
        <br />
        <Typography variant="body1">
          Tax and tip sit below the items and allocate in proportion to each
          person’s share of the line subtotal (including unassigned lines, if
          you leave any). Some charges do not belong in that pool—a kid’s meal
          might be tax-exempt, or a large shared appetizer might be excluded
          from tip. Each line has toggles to mark it exempt from tax, tip, or
          both, and only the remaining subtotal is used when those amounts are
          split. If Gemini returns a grand total and your lines plus tax and tip
          do not match within a penny, the app warns you so you can fix a bad
          line or rounding before you trust the breakdown.
        </Typography>
        <br />
        <Typography variant="body1">
          Once totals are settled, pick who paid the bill and add their payment
          handles—Venmo, PayPal, Zelle, or Cash App. The totals panel shows link
          buttons next to the payer with the amount everyone still owes,
          pre-filled where the app supports it, so friends can pay without
          hunting for usernames in the group chat.
        </Typography>
        <br />
        <Typography variant="body1">
          The goal is not perfect accounting software—it is a practical helper
          for the moment the server drops the folder on the table.
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
