import PageWrapper from "./pages/PageWrapper";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { TattooPage } from "./components/Tattoo";
import { SplendorPage } from "./pages/SplendorPage";

function App() {
  return (
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
  );
}

export default App;
