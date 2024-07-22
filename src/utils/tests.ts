import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Game } from "../models/Splendor";
import { setGame } from "../redux/slices/game";

export const useTestGameSetup = (test: Game) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setGame(test));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export const multipleNoblesTest = JSON.parse(`{
  "players": [
    {
      "id": 0,
      "coins": {
        "white": 1,
        "blue": 2,
        "green": 2,
        "red": 1,
        "black": 0,
        "yellow": 0
      },
      "bought": [
        {
          "id": 16,
          "color": "blue",
          "cost": {
            "white": 1,
            "blue": 0,
            "green": 1,
            "red": 1,
            "black": 1,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 26,
          "color": "green",
          "cost": {
            "white": 0,
            "blue": 1,
            "green": 0,
            "red": 2,
            "black": 2,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 32,
          "color": "red",
          "cost": {
            "white": 1,
            "blue": 1,
            "green": 1,
            "red": 0,
            "black": 1,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 19,
          "color": "blue",
          "cost": {
            "white": 0,
            "blue": 1,
            "green": 3,
            "red": 1,
            "black": 0,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 1,
          "color": "white",
          "cost": {
            "white": 0,
            "blue": 1,
            "green": 2,
            "red": 1,
            "black": 1,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 2,
          "color": "white",
          "cost": {
            "white": 0,
            "blue": 2,
            "green": 2,
            "red": 0,
            "black": 1,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 37,
          "color": "red",
          "cost": {
            "white": 2,
            "blue": 0,
            "green": 0,
            "red": 2,
            "black": 0,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 30,
          "color": "green",
          "cost": {
            "white": 0,
            "blue": 0,
            "green": 0,
            "red": 3,
            "black": 0,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 15,
          "color": "black",
          "cost": {
            "white": 0,
            "blue": 4,
            "green": 0,
            "red": 0,
            "black": 0,
            "yellow": 0
          },
          "points": 1,
          "tier": "tier1"
        },
        {
          "id": 33,
          "color": "red",
          "cost": {
            "white": 2,
            "blue": 1,
            "green": 1,
            "red": 0,
            "black": 1,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 3,
          "color": "white",
          "cost": {
            "white": 3,
            "blue": 1,
            "green": 0,
            "red": 0,
            "black": 1,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 25,
          "color": "green",
          "cost": {
            "white": 1,
            "blue": 1,
            "green": 0,
            "red": 1,
            "black": 2,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 22,
          "color": "blue",
          "cost": {
            "white": 0,
            "blue": 0,
            "green": 0,
            "red": 0,
            "black": 3,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 13,
          "color": "black",
          "cost": {
            "white": 2,
            "blue": 0,
            "green": 2,
            "red": 0,
            "black": 0,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        }
      ],
      "reserved": [],
      "nobles": [],
      "points": 1
    },
    {
      "id": 1,
      "coins": {
        "white": 1,
        "blue": 2,
        "green": 2,
        "red": 0,
        "black": 2,
        "yellow": 0
      },
      "bought": [
        {
          "id": 62,
          "color": "green",
          "cost": {
            "white": 0,
            "blue": 0,
            "green": 5,
            "red": 0,
            "black": 0,
            "yellow": 0
          },
          "points": 2,
          "tier": "tier2"
        },
        {
          "id": 24,
          "color": "green",
          "cost": {
            "white": 1,
            "blue": 1,
            "green": 0,
            "red": 1,
            "black": 1,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 43,
          "color": "black",
          "cost": {
            "white": 0,
            "blue": 0,
            "green": 5,
            "red": 3,
            "black": 0,
            "yellow": 0
          },
          "points": 2,
          "tier": "tier2"
        },
        {
          "id": 5,
          "color": "white",
          "cost": {
            "white": 0,
            "blue": 2,
            "green": 0,
            "red": 0,
            "black": 2,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 38,
          "color": "red",
          "cost": {
            "white": 3,
            "blue": 0,
            "green": 0,
            "red": 0,
            "black": 0,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        },
        {
          "id": 18,
          "color": "blue",
          "cost": {
            "white": 1,
            "blue": 0,
            "green": 2,
            "red": 2,
            "black": 0,
            "yellow": 0
          },
          "points": 0,
          "tier": "tier1"
        }
      ],
      "reserved": [],
      "nobles": [],
      "points": 4
    }
  ],
  "deck": {
    "tier1": [
      {
        "id": 17,
        "color": "blue",
        "cost": {
          "white": 1,
          "blue": 0,
          "green": 1,
          "red": 2,
          "black": 1,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 0,
        "color": "white",
        "cost": {
          "white": 0,
          "blue": 1,
          "green": 1,
          "red": 1,
          "black": 1,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 12,
        "color": "black",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 2,
          "red": 1,
          "black": 0,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 35,
        "color": "red",
        "cost": {
          "white": 1,
          "blue": 0,
          "green": 0,
          "red": 1,
          "black": 3,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 39,
        "color": "red",
        "cost": {
          "white": 4,
          "blue": 0,
          "green": 0,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier1"
      },
      {
        "id": 27,
        "color": "green",
        "cost": {
          "white": 1,
          "blue": 3,
          "green": 1,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 20,
        "color": "blue",
        "cost": {
          "white": 1,
          "blue": 0,
          "green": 0,
          "red": 0,
          "black": 2,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 9,
        "color": "black",
        "cost": {
          "white": 1,
          "blue": 2,
          "green": 1,
          "red": 1,
          "black": 0,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 21,
        "color": "blue",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 2,
          "red": 0,
          "black": 2,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 31,
        "color": "green",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 0,
          "black": 4,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier1"
      },
      {
        "id": 23,
        "color": "blue",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 4,
          "black": 0,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier1"
      },
      {
        "id": 10,
        "color": "black",
        "cost": {
          "white": 2,
          "blue": 2,
          "green": 0,
          "red": 1,
          "black": 0,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 29,
        "color": "green",
        "cost": {
          "white": 0,
          "blue": 2,
          "green": 0,
          "red": 2,
          "black": 0,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 4,
        "color": "white",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 2,
          "black": 1,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 34,
        "color": "red",
        "cost": {
          "white": 2,
          "blue": 0,
          "green": 1,
          "red": 0,
          "black": 2,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 28,
        "color": "green",
        "cost": {
          "white": 2,
          "blue": 1,
          "green": 0,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 36,
        "color": "red",
        "cost": {
          "white": 0,
          "blue": 2,
          "green": 1,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      },
      {
        "id": 14,
        "color": "black",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 3,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 0,
        "tier": "tier1"
      }
    ],
    "tier2": [
      {
        "id": 65,
        "color": "red",
        "cost": {
          "white": 0,
          "blue": 3,
          "green": 0,
          "red": 2,
          "black": 3,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier2"
      },
      {
        "id": 42,
        "color": "black",
        "cost": {
          "white": 0,
          "blue": 1,
          "green": 4,
          "red": 2,
          "black": 0,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 58,
        "color": "green",
        "cost": {
          "white": 3,
          "blue": 0,
          "green": 2,
          "red": 3,
          "black": 0,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier2"
      },
      {
        "id": 67,
        "color": "red",
        "cost": {
          "white": 3,
          "blue": 0,
          "green": 0,
          "red": 0,
          "black": 5,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 48,
        "color": "blue",
        "cost": {
          "white": 5,
          "blue": 3,
          "green": 0,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 44,
        "color": "black",
        "cost": {
          "white": 5,
          "blue": 0,
          "green": 0,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 54,
        "color": "white",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 1,
          "red": 4,
          "black": 2,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 47,
        "color": "blue",
        "cost": {
          "white": 0,
          "blue": 2,
          "green": 3,
          "red": 0,
          "black": 3,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier2"
      },
      {
        "id": 68,
        "color": "red",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 0,
          "black": 5,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 50,
        "color": "blue",
        "cost": {
          "white": 0,
          "blue": 5,
          "green": 0,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 46,
        "color": "blue",
        "cost": {
          "white": 0,
          "blue": 2,
          "green": 2,
          "red": 3,
          "black": 0,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier2"
      },
      {
        "id": 66,
        "color": "red",
        "cost": {
          "white": 1,
          "blue": 4,
          "green": 2,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 41,
        "color": "black",
        "cost": {
          "white": 3,
          "blue": 0,
          "green": 3,
          "red": 0,
          "black": 2,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier2"
      },
      {
        "id": 64,
        "color": "red",
        "cost": {
          "white": 2,
          "blue": 0,
          "green": 0,
          "red": 2,
          "black": 3,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier2"
      },
      {
        "id": 61,
        "color": "green",
        "cost": {
          "white": 0,
          "blue": 5,
          "green": 3,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 53,
        "color": "white",
        "cost": {
          "white": 2,
          "blue": 3,
          "green": 0,
          "red": 3,
          "black": 0,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier2"
      },
      {
        "id": 55,
        "color": "white",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 5,
          "black": 3,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 59,
        "color": "green",
        "cost": {
          "white": 2,
          "blue": 3,
          "green": 0,
          "red": 0,
          "black": 2,
          "yellow": 0
        },
        "points": 1,
        "tier": "tier2"
      },
      {
        "id": 69,
        "color": "red",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 6,
          "black": 0,
          "yellow": 0
        },
        "points": 3,
        "tier": "tier2"
      },
      {
        "id": 49,
        "color": "blue",
        "cost": {
          "white": 2,
          "blue": 0,
          "green": 0,
          "red": 1,
          "black": 4,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 63,
        "color": "green",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 6,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 3,
        "tier": "tier2"
      },
      {
        "id": 60,
        "color": "green",
        "cost": {
          "white": 4,
          "blue": 2,
          "green": 0,
          "red": 0,
          "black": 1,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 56,
        "color": "white",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 5,
          "black": 0,
          "yellow": 0
        },
        "points": 2,
        "tier": "tier2"
      },
      {
        "id": 45,
        "color": "black",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 0,
          "black": 6,
          "yellow": 0
        },
        "points": 3,
        "tier": "tier2"
      }
    ],
    "tier3": [
      {
        "id": 70,
        "color": "black",
        "cost": {
          "white": 3,
          "blue": 3,
          "green": 5,
          "red": 3,
          "black": 0,
          "yellow": 0
        },
        "points": 3,
        "tier": "tier3"
      },
      {
        "id": 79,
        "color": "white",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 0,
          "black": 7,
          "yellow": 0
        },
        "points": 4,
        "tier": "tier3"
      },
      {
        "id": 85,
        "color": "green",
        "cost": {
          "white": 0,
          "blue": 7,
          "green": 3,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 5,
        "tier": "tier3"
      },
      {
        "id": 89,
        "color": "red",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 7,
          "red": 3,
          "black": 0,
          "yellow": 0
        },
        "points": 5,
        "tier": "tier3"
      },
      {
        "id": 81,
        "color": "white",
        "cost": {
          "white": 3,
          "blue": 0,
          "green": 0,
          "red": 0,
          "black": 7,
          "yellow": 0
        },
        "points": 5,
        "tier": "tier3"
      },
      {
        "id": 71,
        "color": "black",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 7,
          "black": 0,
          "yellow": 0
        },
        "points": 4,
        "tier": "tier3"
      },
      {
        "id": 80,
        "color": "white",
        "cost": {
          "white": 3,
          "blue": 0,
          "green": 0,
          "red": 3,
          "black": 6,
          "yellow": 0
        },
        "points": 4,
        "tier": "tier3"
      },
      {
        "id": 82,
        "color": "green",
        "cost": {
          "white": 5,
          "blue": 3,
          "green": 0,
          "red": 3,
          "black": 3,
          "yellow": 0
        },
        "points": 3,
        "tier": "tier3"
      },
      {
        "id": 72,
        "color": "black",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 3,
          "red": 6,
          "black": 3,
          "yellow": 0
        },
        "points": 4,
        "tier": "tier3"
      },
      {
        "id": 87,
        "color": "red",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 7,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 4,
        "tier": "tier3"
      },
      {
        "id": 73,
        "color": "black",
        "cost": {
          "white": 0,
          "blue": 0,
          "green": 0,
          "red": 7,
          "black": 3,
          "yellow": 0
        },
        "points": 5,
        "tier": "tier3"
      },
      {
        "id": 78,
        "color": "white",
        "cost": {
          "white": 0,
          "blue": 3,
          "green": 3,
          "red": 5,
          "black": 3,
          "yellow": 0
        },
        "points": 3,
        "tier": "tier3"
      },
      {
        "id": 88,
        "color": "red",
        "cost": {
          "white": 0,
          "blue": 3,
          "green": 6,
          "red": 3,
          "black": 0,
          "yellow": 0
        },
        "points": 4,
        "tier": "tier3"
      },
      {
        "id": 75,
        "color": "blue",
        "cost": {
          "white": 7,
          "blue": 0,
          "green": 0,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 4,
        "tier": "tier3"
      },
      {
        "id": 77,
        "color": "blue",
        "cost": {
          "white": 7,
          "blue": 3,
          "green": 0,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 5,
        "tier": "tier3"
      },
      {
        "id": 83,
        "color": "green",
        "cost": {
          "white": 0,
          "blue": 7,
          "green": 0,
          "red": 0,
          "black": 0,
          "yellow": 0
        },
        "points": 4,
        "tier": "tier3"
      }
    ]
  },
  "table": [
    {
      "id": 40,
      "color": "black",
      "cost": {
        "white": 3,
        "blue": 2,
        "green": 2,
        "red": 0,
        "black": 0,
        "yellow": 0
      },
      "points": 1,
      "tier": "tier2"
    },
    {
      "id": 57,
      "color": "white",
      "cost": {
        "white": 6,
        "blue": 0,
        "green": 0,
        "red": 0,
        "black": 0,
        "yellow": 0
      },
      "points": 3,
      "tier": "tier2"
    },
    {
      "id": 86,
      "color": "red",
      "cost": {
        "white": 3,
        "blue": 5,
        "green": 3,
        "red": 0,
        "black": 3,
        "yellow": 0
      },
      "points": 3,
      "tier": "tier3"
    },
    {
      "id": 84,
      "color": "green",
      "cost": {
        "white": 3,
        "blue": 6,
        "green": 3,
        "red": 0,
        "black": 0,
        "yellow": 0
      },
      "points": 4,
      "tier": "tier3"
    },
    {
      "id": 74,
      "color": "blue",
      "cost": {
        "white": 3,
        "blue": 0,
        "green": 3,
        "red": 3,
        "black": 5,
        "yellow": 0
      },
      "points": 3,
      "tier": "tier3"
    },
    {
      "id": 76,
      "color": "blue",
      "cost": {
        "white": 6,
        "blue": 3,
        "green": 0,
        "red": 0,
        "black": 3,
        "yellow": 0
      },
      "points": 4,
      "tier": "tier3"
    },
    {
      "id": 52,
      "color": "white",
      "cost": {
        "white": 0,
        "blue": 0,
        "green": 3,
        "red": 2,
        "black": 2,
        "yellow": 0
      },
      "points": 1,
      "tier": "tier2"
    },
    {
      "id": 51,
      "color": "blue",
      "cost": {
        "white": 0,
        "blue": 6,
        "green": 0,
        "red": 0,
        "black": 0,
        "yellow": 0
      },
      "points": 3,
      "tier": "tier2"
    },
    {
      "id": 6,
      "color": "white",
      "cost": {
        "white": 0,
        "blue": 3,
        "green": 0,
        "red": 0,
        "black": 0,
        "yellow": 0
      },
      "points": 0,
      "tier": "tier1"
    },
    {
      "id": 7,
      "color": "white",
      "cost": {
        "white": 0,
        "blue": 0,
        "green": 4,
        "red": 0,
        "black": 0,
        "yellow": 0
      },
      "points": 1,
      "tier": "tier1"
    },
    {
      "id": 11,
      "color": "black",
      "cost": {
        "white": 0,
        "blue": 0,
        "green": 1,
        "red": 3,
        "black": 1,
        "yellow": 0
      },
      "points": 0,
      "tier": "tier1"
    },
    {
      "id": 8,
      "color": "black",
      "cost": {
        "white": 1,
        "blue": 1,
        "green": 1,
        "red": 1,
        "black": 0,
        "yellow": 0
      },
      "points": 0,
      "tier": "tier1"
    }
  ],
  "nobles": [
    {
      "id": 7,
      "points": 3,
      "cards": {
        "white": 0,
        "blue": 0,
        "green": 3,
        "red": 3,
        "black": 3,
        "yellow": 0
      }
    },
    {
      "id": 2,
      "points": 3,
      "cards": {
        "white": 4,
        "blue": 0,
        "green": 0,
        "red": 0,
        "black": 4,
        "yellow": 0
      }
    },
    {
      "id": 1,
      "points": 3,
      "cards": {
        "white": 3,
        "blue": 3,
        "green": 0,
        "red": 0,
        "black": 3,
        "yellow": 0
      }
    }
  ],
  "coins": {
    "white": 2,
    "blue": 0,
    "green": 0,
    "red": 3,
    "black": 2,
    "yellow": 5
  },
  "turn": 48
}`) as Game;
