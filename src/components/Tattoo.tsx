import { makeStyles } from 'tss-react/mui';
import { VFC } from "react";

const useStyles = makeStyles()((theme) => ({
  container: {
    display: "flex",
    width: "100%",
    height: "100%",
    maxHeight: "100vh",
    justifyContent: "space-between",
    flexDirection: "column",
  },
  svgContainer: {
    display: "flex",
    background: "white",
    padding: theme.spacing(4),
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(2),
    maxHeight: "calc(100vh - 80px - 66px - 16px)",
  },
  formContainer: {
    width: "100%",
    justifyContent: "center",
    "& > div": {
      width: 600,
    },
  },
  form: {
    width: 400,
  },
  svg: {
    display: "block",
    maxHeight: "100%",
    maxWidth: "100%",
  },
}));

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

export const TattooPage: VFC = () => {
  const { classes } = useStyles();
  const strokeWidth = 32;
  const halfHeight = (4 * strokeWidth) / 2;
  const gap = (halfHeight - 1.5 * strokeWidth) / 2;
  const eWidth = 2 * halfHeight + strokeWidth;
  const iWidth = strokeWidth;
  const piWidth = (3 * halfHeight) / 4 + strokeWidth;
  const minusWidth = piWidth;
  const oneWidth = strokeWidth;
  const boxWidth =
    strokeWidth / 2 +
    eWidth +
    iWidth +
    piWidth +
    oneWidth +
    5 * gap +
    strokeWidth / 2;
  const boxHeight = boxWidth / GOLDEN_RATIO;
  const borderRadius = 0; //(boxHeight - 2 * halfHeight - strokeWidth) / 2;
  return (
    <div className={classes.container}>
      <div className={classes.svgContainer}>
        <svg
          className={classes.svg}
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox={`-${minusWidth / 2 + borderRadius + gap} -${
            strokeWidth / 2 + borderRadius + gap
          } ${boxWidth + minusWidth / 2 + strokeWidth / 2 + 2 * gap} ${
            boxHeight + strokeWidth + 2 * gap
          }`}
          fill="none"
          stroke="black"
          strokeLinecap="butt"
          strokeMiterlimit="10"
          strokeWidth={strokeWidth}
          strokeLinejoin="miter"
        >
          <path
            d={`
             M-${borderRadius} ${
              boxHeight / 2 - borderRadius - strokeWidth / 2 - gap
            }
             v-${boxHeight / 2 - borderRadius - strokeWidth / 2 - gap}
             a${borderRadius} ${borderRadius} 0 0 1 ${borderRadius} -${borderRadius}
             h${boxWidth - 2 * borderRadius}
             a${borderRadius} ${borderRadius} 0 0 1 ${borderRadius} ${borderRadius}
             v${boxHeight - 2 * borderRadius}
             a${borderRadius} ${borderRadius} 0 0 1 -${borderRadius} ${borderRadius}
             h-${boxWidth - 2 * borderRadius}
             a${borderRadius} ${borderRadius} 0 0 1 -${borderRadius} -${borderRadius}
             v-${boxHeight / 2 - borderRadius - strokeWidth / 2 - gap}

            `}
          />
          <path
            d={`
          M-${minusWidth - strokeWidth / 2 + borderRadius} ${
              boxHeight / 2 - borderRadius
            }
          h${minusWidth}

          m${gap + halfHeight + strokeWidth / 2} ${halfHeight}
          a${halfHeight} ${halfHeight} 0 1 1 ${halfHeight} -${halfHeight}
          h-${2 * halfHeight}

          m${2 * halfHeight + gap + strokeWidth} 0v-${
              halfHeight + strokeWidth / 2 - strokeWidth
            }
          m0 -${gap}v-${strokeWidth - gap}

          m${gap + strokeWidth} ${
              halfHeight + strokeWidth / 2
            }v-${halfHeight}h${piWidth - strokeWidth}v${halfHeight}

          m-${piWidth + gap + strokeWidth / 2} ${halfHeight} h${
              piWidth + gap + strokeWidth
            }
          m-${piWidth + gap + strokeWidth} -${gap + strokeWidth} h${
              piWidth + gap + strokeWidth
            }

          m${gap + strokeWidth / 2} ${gap + (3 * strokeWidth) / 2} v-${
              2 * halfHeight + strokeWidth
            }
          `}
          />
          <circle
            cx={-borderRadius + strokeWidth / 2 + eWidth + iWidth / 2 + 2 * gap}
            cy={boxHeight / 2 - borderRadius - halfHeight}
            r={strokeWidth / 2}
            fill="black"
            stroke="none"
          />
          {/* <path d={`
          M-${minusWidth - strokeWidth / 2 + borderRadius} ${
            boxHeight / 2 - borderRadius
          }
          m${minusWidth} 0

          m${gap + halfHeight + strokeWidth / 2} ${halfHeight}
          m${halfHeight} -${halfHeight}
          m-${2 * halfHeight} 0

          m${2 * halfHeight + gap + strokeWidth} 0
          m0 -${halfHeight + strokeWidth / 2 - strokeWidth - gap / 2}

          m0 -${gap / 2 + strokeWidth / 2}
          
          `}
          /> */}
          {/* <path
            d={`
          M${halfHeight} ${2 * halfHeight}
          a${halfHeight} ${halfHeight} 0 1 1 ${halfHeight} -${halfHeight}
          h-${2 * halfHeight}

          m${2 * halfHeight + gap + strokeWidth} 0v-${halfHeight}

          m${gap + strokeWidth} ${halfHeight}v-${halfHeight}h${
              piWidth - strokeWidth
            }v${halfHeight}

          m${gap + strokeWidth / 2} -${(gap + strokeWidth) / 2} h${halfHeight}
          m-${halfHeight} ${gap + strokeWidth} h${halfHeight}

          m${gap} -${(gap + strokeWidth) / 2} h${halfHeight}
          
          m${gap + strokeWidth / 2} -${halfHeight} v${2 * halfHeight}
          `}
          /> */}
        </svg>
      </div>
    </div>
  );
};
