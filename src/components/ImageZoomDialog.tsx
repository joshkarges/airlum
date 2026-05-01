import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Box, Dialog, IconButton, Stack } from "@mui/material";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";

type ImageZoomDialogProps = {
  open: boolean;
  src: string | null;
  alt?: string;
  onClose: () => void;
};

export const ImageZoomDialog = ({
  open,
  src,
  alt = "Image",
  onClose,
}: ImageZoomDialogProps) => {
  if (!open || !src) {
    return null;
  }

  return (
    <Dialog
      fullScreen
      open
      onClose={onClose}
      keepMounted={false}
      PaperProps={{
        sx: {
          bgcolor: "rgba(0,0,0,0.92)",
          m: 0,
          maxHeight: "100%",
          overflow: "hidden",
        },
      }}
    >
      <TransformWrapper
        key={src}
        initialScale={1}
        minScale={1}
        maxScale={6}
        centerOnInit
        wheel={{ step: 0.2 }}
        doubleClick={{ mode: "toggle" }}
        pinch={{ step: 5 }}
      >
        {(controls: ReactZoomPanPinchContentRef) => (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              minHeight: "100vh",
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 2,
                bgcolor: "rgba(0,0,0,0.45)",
                borderRadius: 1,
                p: 0.5,
              }}
            >
              <IconButton
                size="small"
                onClick={() => controls.zoomIn()}
                sx={{ color: "common.white" }}
                aria-label="Zoom in"
              >
                <AddIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => controls.zoomOut()}
                sx={{ color: "common.white" }}
                aria-label="Zoom out"
              >
                <RemoveIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => controls.resetTransform()}
                sx={{ color: "common.white" }}
                aria-label="Reset zoom"
              >
                <RestartAltIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: "common.white" }}
                aria-label="Close"
              >
                <CloseIcon />
              </IconButton>
            </Stack>
            <Box
              sx={{
                width: "100%",
                height: "100%",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                touchAction: "none",
              }}
            >
              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "100vh",
                }}
                contentStyle={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                <Box
                  component="img"
                  src={src}
                  alt={alt}
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "100vh",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    userSelect: "none",
                    WebkitUserDrag: "none",
                  }}
                />
              </TransformComponent>
            </Box>
          </Box>
        )}
      </TransformWrapper>
    </Dialog>
  );
};
