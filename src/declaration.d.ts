import { PropsWithChildren, ReactNode } from "react";

type FC<P = {}> = FunctionComponent<P & { children?: ReactNode | undefined }>;
