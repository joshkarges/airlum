import PageWrapper from "./pages/PageWrapper";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { TattooPage } from "./components/Tattoo";
import { SplendorPage } from "./pages/SplendorPage";
import { Provider } from "react-redux";
import { store } from "./redux/configureStore";
// import { createTheme, ThemeProvider } from "@mui/material/styled";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

export const muiCache = createCache({
  key: "mui",
  prepend: true,
});

function App() {
  // const theme = createTheme({});
  return (
    <Provider store={store}>
      <CacheProvider value={muiCache}>
        <div className="App">
          <PageWrapper>
            <Router>
              <Switch>
                <Route path="/splendor">
                  <SplendorPage />
                </Route>
                <Route path="/tattoo">
                  <TattooPage />
                </Route>
                <Route path="/">
                  <HomePage />
                </Route>
              </Switch>
            </Router>
          </PageWrapper>
        </div>
      </CacheProvider>
    </Provider>
  );
}

export default App;
