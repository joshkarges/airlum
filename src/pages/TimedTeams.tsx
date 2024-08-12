import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { CreateTimedTeams } from "./CreateTimedTeams";
import { TimedGame } from "./TimedGame";

export const TimedTeams = () => {
  return (
    <Router>
      <Switch>
        <Route path="/timed-teams/:gameId">
          <TimedGame />
        </Route>
        <Route path="/timed-teams">
          <CreateTimedTeams />
        </Route>
      </Switch>
    </Router>
  );
};
