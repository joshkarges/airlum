import { useEffect, VFC } from "react";

/**
 * Hook to set the browser tab title.  It will change whenever the input string
 * changes.
 * @param title string - Title for the browser tab.
 */
export const useDocTitleEffect = (title: string) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};

/**
 * Props type for the <DocTitle/> component.
 */
export type DocTitleProps = { title: string };

/**
 * Null component to set the browser tab title.  It will change whenever the
 * input string changes.
 * @param props.title string - Title for the browser tab.
 * @returns
 */
export const DocTitle: VFC<DocTitleProps> = ({ title }) => {
  useDocTitleEffect(title);
  return null;
};
