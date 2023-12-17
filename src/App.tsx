import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import PageWrapper from "./pages/PageWrapper";
import HomePage from "./pages/HomePage";
import { TattooPage } from "./components/Tattoo";
import { SplendorPage } from "./pages/SplendorPage";
import { Provider } from "react-redux";
import { store } from "./redux/configureStore";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { BangForBuckPage } from "./pages/BangForBuckPage";
import { ModalContextProvider } from "./components/modals/ModalContext";
import { ChristmasListPage } from "./pages/ChristmasListPage";
import { blue } from "@mui/material/colors";
import { ExchangeEventListPage } from "./pages/ExchangeEventListPage";

export const muiCache = createCache({
  key: "mui",
  prepend: true,
});

const theme = createTheme({
  palette: {
    primary: {
      main: blue[500],
    },
    tonalOffset: {
      light: 0.9,
      dark: 0.2,
    },
  },
});
function App() {
  return (
    <Provider store={store}>
      <CacheProvider value={muiCache}>
        <ModalContextProvider>
          <ThemeProvider theme={theme}>
            <div className="App">
              <Router>
                <PageWrapper>
                  <Switch>
                    <Route path="/tasks">
                      <BangForBuckPage />
                    </Route>
                    <Route path="/splendor">
                      <SplendorPage />
                    </Route>
                    <Route path="/tattoo">
                      <TattooPage />
                    </Route>
                    <Route path="/christmas-list/:exchangeEvent">
                      <ChristmasListPage />
                    </Route>
                    <Route path="/exchange-events">
                      <ExchangeEventListPage />
                    </Route>
                    <Route path="/">
                      <HomePage />
                    </Route>
                  </Switch>
                </PageWrapper>
              </Router>
            </div>
          </ThemeProvider>
        </ModalContextProvider>
      </CacheProvider>
    </Provider>
  );
}

export default App;
