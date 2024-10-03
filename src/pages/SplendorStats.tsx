import { round } from "lodash";
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
  ArcElement,
} from "chart.js";
import { Scatter, Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  ArcElement,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

export const SplendorStats = () => {
  const [allSpendorGames, fetchAllSplendorGames] =
    useFetchedResource(getAllSpendorGames);
  useEffectIfNotFetchedYet(allSpendorGames, fetchAllSplendorGames);
  return (
    <FetchedComponent resource={allSpendorGames}>
      {(unsortedGames) => {
        const games = unsortedGames.sort((a, b) => a.endTime - b.endTime);
        const numTurns = games.map(
          (game) =>
            game.players[0].cards.length +
            game.players[0].reserveActions +
            game.players[0].takeCoinsActions
        );
        const numCards0 = games.map((game) => game.players[0].cards.length);
        const { numWins, numTie, numLoss } = games.reduce(
          (acc, game) => {
            if (game.players[0].points > game.players[1].points) {
              acc.numWins++;
            } else if (game.players[0].points === game.players[1].points) {
              acc.numTie++;
            } else {
              acc.numLoss++;
            }
            return acc;
          },
          { numWins: 0, numTie: 0, numLoss: 0 }
        );
        const totalGames = games.length;
        const pieData = {
          labels: ["Win", "Tie", "Loss"],
          datasets: [
            {
              label: "Win Percentage",
              data: [
                (numWins / totalGames) * 100,
                (numTie / totalGames) * 100,
                (numLoss / totalGames) * 100,
              ],
              backgroundColor: [
                "rgba(75, 192, 192, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 99, 132, 0.2)",
              ],
              borderColor: [
                "rgba(75, 192, 192, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 99, 132, 1)",
              ],
              borderWidth: 1,
              datalabels: {
                anchor: "center" as "center",
                backgroundColor: null,
                borderWidth: 0,
                formatter: (value: string, context: any) =>
                  `${round(+value, 2)}%`,
              },
            },
          ],
        };
        const delta0 = games.map(
          (game) => game.players[0].points - game.players[1].points
        );
        const data1 = numCards0.map((numCards, i) => ({
          x: numCards,
          y: delta0[i],
        }));
        const data2 = numTurns.map((numTurns, i) => ({
          x: numTurns,
          y: delta0[i],
        }));
        const data3 = delta0.map((delta0, i) => ({ x: i, y: delta0 }));
        return (
          <Flex width="100vw" justifyContent="center">
            <Flex
              flexDirection="column"
              maxWidth="600px"
              flexGrow={1}
              rowGap="16px"
            >
              <Pie
                data={pieData}
                options={{
                  interaction: {
                    intersect: false,
                    mode: "index",
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        title: (tooltipItem) => "",
                        label: (tooltipItem) => {
                          return `${tooltipItem.label}: ${round(
                            +tooltipItem.formattedValue,
                            2
                          )}%`;
                        },
                      },
                    },
                  },
                }}
              />
              <Scatter
                data={{
                  datasets: [
                    {
                      label: "Delta over time",
                      data: data3,
                      backgroundColor: "rgba(255, 99, 132, 0.2)",
                      borderColor: "rgba(255, 99, 132, 1)",
                      borderWidth: 1,
                      datalabels: {
                        display: false,
                      },
                    },
                  ],
                }}
              />
              <Scatter
                data={{
                  datasets: [
                    {
                      label: "Delta per number of cards",
                      data: data1,
                      backgroundColor: "rgba(255, 99, 132, 0.2)",
                      borderColor: "rgba(255, 99, 132, 1)",
                      borderWidth: 1,
                      datalabels: {
                        display: false,
                      },
                    },
                  ],
                }}
              />
              <Scatter
                data={{
                  datasets: [
                    {
                      label: "Delta per number of turns",
                      data: data2,
                      backgroundColor: "rgba(255, 99, 132, 0.2)",
                      borderColor: "rgba(255, 99, 132, 1)",
                      borderWidth: 1,
                      datalabels: {
                        display: false,
                      },
                    },
                  ],
                }}
              />
            </Flex>
          </Flex>
        );
      }}
    </FetchedComponent>
  );
};
