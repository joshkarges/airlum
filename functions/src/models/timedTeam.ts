export type TimedTeam = {
  id: string;
  name: string;
  author: string;
  members: string[];
  numPerTeam: { teamName: string; numPlayers: number }[];
  duration: number;
  started: boolean;
  finished: boolean;
  startedAt: number;
};

export type TimedTeamMember = {
  user: string;
  memberKey: string;
  team: string;
  isAuthor: boolean;
};

// Create a timed team event
// This creates a new doc
export type UpsertTimedTeamRequest = {
  name: string;
  author: string;
  numPerTeam: { teamName: string; numPlayers: number }[];
  duration: number;
  gameId?: string;
};

export type UpsertTimedTeamResponse = {
  id: string;
};

export type ResetTimedTeamRequest = {
  id: string;
};

export type ResetTimedTeamResponse = void;

// Join a timed team event
// This will update the timed team with the new member
// Members will be notified that new members have joined with an onSnapshot listener
export type JoinTimedTeamRequest = {
  id: string;
  user: string;
  isAuthor: boolean;
};

export type EditMemberNameRequest = {
  id: string;
  memberKey: string;
  username: string;
};

export type EditMemberNameResponse = void;

export type DeleteMemberRequest = {
  id: string;
  user: string;
};

export type DeleteMemberResponse = void;

export type GetTimedTeamRequest = {
  id: string;
};

export type GetTimedTeamResponse = TimedTeam;

export type JoinTimedTeamResponse = { memberKey: string };

// Start a timed team event
// This will update the timed team with the started flag and the startedAt timestamp
// This will also put the members into teams
// Members will be notified that the event has started with on onSnapshot listener
export type StartTimedTeamRequest = {
  id: string;
};

export type StartTimedTeamResponse = void;

// Finish a timed team event
// This will update the timed team with the finished flag and put the members into teams
// Members will be notified that the event has finished with an onSnapshot listener
export type FinishTimedTeamRequest = {
  id: string;
};

export type FinishTimedTeamResponse = void;
