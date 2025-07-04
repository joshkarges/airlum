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
  BarElement,
  CategoryScale,
} from "chart.js";
import { Scatter, Pie, Bar, Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import _ from "lodash";
import moment from "moment";

ChartJS.register(
  CategoryScale,
  BarElement,
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
        const slidingWindowSize = 50;
        const slidingWindowGames = [_.sumBy(games.slice(0, slidingWindowSize), game => game.players[0].points > game.players[1].points ? 1 : 0) / slidingWindowSize];
        for (let i = slidingWindowSize; i < totalGames; i++) {
          const game = games[i];
          const prevGame = games[i - slidingWindowSize];
          const win = game.players[0].points > game.players[1].points;
          const prevWin = prevGame.players[0].points > prevGame.players[1].points;
          slidingWindowGames.push(slidingWindowGames[slidingWindowGames.length - 1] + (win ? 1 : 0) / slidingWindowSize - (prevWin ? 1 : 0) / slidingWindowSize);
        }
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
        const minData = Math.min(...delta0);
        const maxData = Math.max(...delta0);
        const histogramLabels = _.range(minData, maxData + 1);
        const histogramDataMap = delta0.reduce((acc, delta) => {
          if (delta in acc) {
            acc[delta]++;
          } else {
            acc[delta] = 1;
          }
          return acc;
        }, {} as Record<number, number>);
        const histogramData = histogramLabels.map(
          (label) => histogramDataMap[+label] ?? 0
        );
        const histogramTimeData = games.reduce((acc, game) => {
          const sundayUnix = moment(game.endTime).startOf("week").unix();
          acc[sundayUnix] = (acc[sundayUnix] ?? 0) + 1;
          return acc;
        }, {} as Record<number, number>);
        const histogramTimeLabels = Object.keys(histogramTimeData)
          .sort((a, b) => +a - +b)
          .map((unix) => moment.unix(+unix).format("YYYY-MM-DD"));
        const histogramTimeDataValues = histogramTimeLabels.map(
          (label) =>
            histogramTimeData[moment(label).startOf("week").unix()] ?? 0
        );
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
              <Line
                data={{
                  labels: _.range(slidingWindowSize, totalGames),
                  datasets: [
                    {
                      label: "Win percentage (sliding window)",
                      data: slidingWindowGames,
                      backgroundColor: "rgba(75, 192, 192, 0.2)",
                      borderColor: "rgba(255, 99, 132, 1)",
                      borderWidth: 3,
                      fill: true,
                      datalabels: {
                        display: false,
                      },
                    },
                  ],
                }}
                options={{
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: "Game Number",
                      },
                    },
                    y: {
                      title: {
                        display: true,
                        text: "Win Percentage",
                      },
                    },
                  },
                  elements: {
                    point:{
                        radius: 0
                    }
                  }
                }}
              />
              <Bar
                data={{
                  labels: histogramLabels,
                  datasets: [
                    {
                      label: "Delta distribution",
                      data: histogramData,
                      backgroundColor: "rgba(255, 99, 132, 0.2)",
                      borderColor: "rgba(255, 99, 132, 1)",
                      borderWidth: 1,
                    },
                  ],
                }}
              />
              <Bar
                data={{
                  labels: histogramTimeLabels,
                  datasets: [
                    {
                      label: "Games per week",
                      data: histogramTimeDataValues,
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
