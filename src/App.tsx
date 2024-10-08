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
import { GiftExchangeEventPage } from "./pages/GiftExchangeEventPage";
import { amber, blue } from "@mui/material/colors";
import { ExchangeEventListPage } from "./pages/ExchangeEventListPage";
import { Blog } from "./pages/Blog";
import { TimedTeams } from "./pages/TimedTeams";
import { SplendorStats } from "./pages/SplendorStats";

export const muiCache = createCache({
  key: "mui",
  prepend: true,
});

const theme = createTheme({
  palette: {
    primary: {
      main: blue[500],
    },
    secondary: {
      main: amber[500],
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
                    <Route path="/splendor-stats">
                      <SplendorStats />
                    </Route>
                    <Route path="/tattoo">
                      <TattooPage />
                    </Route>
                    <Route path="/gift-exchange-event/:exchangeEvent">
                      <GiftExchangeEventPage />
                    </Route>
                    <Route path="/exchange-events">
                      <ExchangeEventListPage />
                    </Route>
                    <Route path="/timed-teams">
                      <TimedTeams />
                    </Route>
                    <Route path="/blog">
                      <Blog />
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
