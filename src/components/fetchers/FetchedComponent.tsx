import React, { useEffect, useState } from "react";
import { Loading } from "./Loading";
import {
  anyIsError,
  anyIsIdle,
  anyIsPending,
  anyIsSuccess,
  errorMessage,
  MaybeFetchedResource,
} from "../../utils/fetchers";
import _ from "lodash";
import { Typography } from "@mui/material";

export type FetchedComponentProps<T> = {
  resource: MaybeFetchedResource<T> | MaybeFetchedResource<T>[];
  children: (...data: T[]) => React.ReactElement | null;
  circularLoading?: boolean;
  noReloads?: boolean;
  loadingClassName?: string;
  IdleComponent?: React.VFC<{ resources?: MaybeFetchedResource<T>[] }>;
  LoadingComponent?: React.VFC<{ resources?: MaybeFetchedResource<T>[] }>;
  ErrorComponent?: React.VFC<{ resources?: MaybeFetchedResource<T>[] }>;
};
export const FetchedComponent = <T extends unknown>({
  resource,
  children,
  circularLoading,
  noReloads,
  loadingClassName,
  IdleComponent,
  LoadingComponent,
  ErrorComponent,
}: FetchedComponentProps<T>) => {
  const [hasFinishedLoadingOnce, setHasFinishedLoadingOnce] = useState(false);
  const resources = _.isArray(resource) ? resource : [resource];

  useEffect(() => {
    if (anyIsSuccess(...resources) || anyIsError(...resources))
      setHasFinishedLoadingOnce(true);
    // The number of resources should be fixed, so this should be fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...resources]);

  return anyIsIdle(...resources) ? (
    IdleComponent ? (
      <IdleComponent resources={resources} />
    ) : null
  ) : anyIsPending(...resources) && !(noReloads && hasFinishedLoadingOnce) ? (
    LoadingComponent ? (
      <LoadingComponent resources={resources} />
    ) : (
      <Loading circular={circularLoading} className={loadingClassName} />
    )
  ) : anyIsError(...resources) ? (
    ErrorComponent ? (
      <ErrorComponent resources={resources} />
    ) : (
      <Typography color="red">
        {_.find(resources.map(errorMessage)) || "An unexpected error occurred"}
      </Typography>
    )
  ) : (
    children(..._.map(resources, "data"))
  );
};
