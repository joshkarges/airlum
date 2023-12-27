import { Typography, TypographyProps } from "@mui/material";
import * as Prism from "prismjs";

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const grammar: Prism.Grammar = {
  url: URL_REGEX,
};

export type RichTextProps = TypographyProps & {
  content: string;
};
export const RichText = ({ content, ...typProps }: RichTextProps) => {
  const tokens = Prism.tokenize(content, grammar);
  return (
    <Typography {...typProps}>
      {tokens.map((token, i) => {
        return typeof token === "string" ? (
          token
        ) : (
          <a href={token.content as string}>{token.content as string}</a>
        );
      })}
    </Typography>
  );
};
