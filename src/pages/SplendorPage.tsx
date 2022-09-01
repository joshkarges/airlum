import { useEffect, useState /* useRef, useMemo */ } from "react";
import { runGame, Strategy } from "../utils/splendor";

export const SplendorPage = () => {
  // const ref = useRef([] as string[]);
  const [gameLogs, setGameLogs] = useState<string[]>([]);
  // const gameLogs = useMemo(() => runGame(4), []);

  useEffect(() => {
    if (!gameLogs.length) {
      setGameLogs(runGame(4, Strategy.AlphaBeta));
    }
  }, [gameLogs.length]);

  return (
    <div>
      {gameLogs.map((log) => (
        <>
          <div>{log}</div>
          <br />
        </>
      ))}
    </div>
  );
};
