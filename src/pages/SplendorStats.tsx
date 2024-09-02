import { getAllSpendorGames } from "../api/SplendorApi";
import { FetchedComponent } from "../components/fetchers/FetchedComponent";
import { Flex } from "../components/Flex";
import {
  useEffectIfNotFetchedYet,
  useFetchedResource,
} from "../utils/fetchers";
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { Scatter } from "react-chartjs-2";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

export const SplendorStats = () => {
  const [allSpendorGames, fetchAllSplendorGames] =
    useFetchedResource(getAllSpendorGames);
  useEffectIfNotFetchedYet(allSpendorGames, fetchAllSplendorGames);
  return (
    <FetchedComponent resource={allSpendorGames}>
      {(games) => {
        const numTurns = games.map(
          (game) =>
            game.players[0].cards.length +
            game.players[0].reserveActions +
            game.players[0].takeCoinsActions
        );
        const numCards0 = games.map((game) => game.players[0].cards.length);
        const delta0 = games.map(
          (game) => game.players[0].points - game.players[1].points
        );
        const data1 = numTurns.map((numTurns, i) => ({
          x: numTurns,
          y: numCards0[i],
        }));
        const data2 = numTurns.map((numTurns, i) => ({
          x: numTurns,
          y: delta0[i],
        }));
        const data3 = delta0.map((delta0, i) => ({ x: i, y: delta0 }));
        return (
          <Flex flexDirection="column">
            <Scatter
              data={{
                datasets: [
                  {
                    label: "Delta over time",
                    data: data3,
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                  },
                ],
              }}
            />
            <Scatter
              data={{
                datasets: [
                  {
                    label: "Number of cards per turrns",
                    data: data1,
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                  },
                ],
              }}
            />
            <Scatter
              data={{
                datasets: [
                  {
                    label: "Delta per turns",
                    data: data2,
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                  },
                ],
              }}
            />
          </Flex>
        );
      }}
    </FetchedComponent>
  );
};
