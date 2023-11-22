import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import * as EasyForm from 'jk-form';
import PageWrapper from "./pages/PageWrapper";
import HomePage from "./pages/HomePage";
import { TattooPage } from "./components/Tattoo";
import { SplendorPage } from "./pages/SplendorPage";
import { Provider } from "react-redux";
import { store } from "./redux/configureStore";
// import { createTheme, ThemeProvider } from "@mui/material/styled";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { BangForBuckPage } from "./pages/BangForBuckPage";
import { ModalContextProvider } from "./components/modals/ModalContext";
import { ChristmasListPage } from "./pages/ChristmasListPage";

export const muiCache = createCache({
  key: "mui",
  prepend: true,
});

function App() {
  // const theme = createTheme({});
  return (
    <Provider store={store}>
      <CacheProvider value={muiCache}>
        <ModalContextProvider>
        <div className="App">
            <Router>
          <PageWrapper>
              <Switch>
                <Route path="/tasks">
                  <BangForBuckPage/>
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
                <Route path="/">
                  <HomePage />
                </Route>
              </Switch>
          </PageWrapper>
            </Router>
        </div>
        </ModalContextProvider>
      </CacheProvider>
    </Provider>
  );
}

export default App;
