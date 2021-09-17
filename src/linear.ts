import { ExtensionContext, SecretStorage, Memento } from "vscode";
import { Issue, IssuePayload, IssuePriorityValue, LinearClient, Team, User, WorkflowState } from "@linear/sdk";

let _secretStorage: SecretStorage;
let _storage: Memento;
let _apiKey: string | undefined;
let _client: LinearClient | null = null;

export const init = async (context: ExtensionContext): Promise<boolean> => {
  _secretStorage = context.secrets;
  _storage = context.workspaceState;
  try {
    _apiKey = (await _secretStorage.get("apiKey"))?.toString();
    _client = new LinearClient({
      apiKey: _apiKey,
    });
  } catch (err) {
    console.error("No API key stored", err);
  }
  return !!_apiKey;
};

export const storeApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    await _secretStorage.store("apiKey", apiKey);
  } catch (err) {
    console.error("Error storing API key", err);
    return false;
  }
  return true;
};

export const getMyIssues = async (): Promise<Issue[] | null> => {
  if (_client) {
    try {
      const me = await _client.viewer;
      const myIssues = await me.assignedIssues();

      return myIssues.nodes;
    } catch (err) {
      console.error("Error getting my issues", err);
    }
  } else {
    console.error("No initialized Linear client found");
  }
  return null;
};

export const getMyTeams = async (): Promise<Team[] | null> => {
  if (_client) {
    try {
      const me = await _client.viewer;
      const myTeams = await me.teams();

      return myTeams.nodes;
    } catch (err) {
      console.error("Error getting my teams", err);
    }
  } else {
    console.error("No initialized Linear client found");
  }
  return null;
};

export const getIssueByIdentifier = async (
  identifier: string
): Promise<Issue | null> => {
  if (_client) {
    try {
      const issue = await _client.issue(identifier);

      return issue || null;
    } catch (err) {
      console.error("Error getting issue by identifier", err);
    }
  } else {
    console.error("No initialized Linear client found");
  }
  return null;
};

export const setContextIssueId = async (issueId?: string): Promise<boolean> => {
  if (!issueId) {
    return false;
  }
  try {
    await _storage.update("linearContextIssueId", issueId);
  } catch (err) {
    console.error("Error setting context issue", err);
    return false;
  }
  return true;
};

export const addContextIssueComment = async (
  comment: string
): Promise<boolean> => {
  if (!_client) {
    return false;
  }
  if (!comment) {
    return false;
  }
  try {
    const issueId = (await _storage.get("linearContextIssueId")) as string;
    if (!issueId) {
      return false;
    }
    const commentPayload = await _client.commentCreate({
      issueId,
      body: comment,
    });
    if (!commentPayload.success) {
      return false;
    }
  } catch (err) {
    console.error("Error commenting context issue", err);
    return false;
  }
  return true;
};

export const getWorkflowStates = async (): Promise<WorkflowState[] | null> => {
  if (_client) {
    try {
      const workflowStates = await _client.workflowStates();

      return workflowStates.nodes;
    } catch (err) {
      console.error("Error getting workflow states", err);
    }
  } else {
    console.error("No initialized Linear client found");
  }
  return null;
};

export const setContextIssueStatus = async (
  status: string
): Promise<boolean> => {
  if (!_client) {
    return false;
  }
  if (!status) {
    return false;
  }
  try {
    const issueId = (await _storage.get("linearContextIssueId")) as string;
    if (!issueId) {
      return false;
    }
    const statusPayload = await _client.issueUpdate(
      issueId,
      { stateId: status },
    );
    if (!statusPayload.success) {
      return false;
    }
  } catch (err) {
    console.error("Error setting context issue status", err);
    return false;
  }
  return true;
};

export const getAvailablePriorities = async (): Promise<IssuePriorityValue[] | null> => {
  if (_client) {
    try {
      const availablePriorities = await _client.issuePriorityValues;

      return availablePriorities;
    } catch (err) {
      console.error("Error getting priorities", err);
    }
  } else {
    console.error("No initialized Linear client found");
  }
  return null;
};

export const getTeamMembers = async (team: Team): Promise<User[] | null> => {
  if (_client) {
    try {
      const teamMembers = await team.members();

      return teamMembers.nodes;
    } catch (err) {
      console.error("Error getting team members", err);
    }
  } else {
    console.error("No initialized Linear client found");
  }
  return null;
};

export const createIssue = async (
  title: string,
  teamId: string,
  description: string | undefined,
  assigneeId: string | undefined,
  stateId: string | undefined,
  estimate: number | undefined,
  priority: number | undefined,
): Promise<IssuePayload | undefined> => {
  if (!_client) {
    return;
  }

  try {
    const issuePayload = await _client.issueCreate({ title, teamId, description, assigneeId, stateId, estimate, priority });
    if (!issuePayload.success) {
      return;
    }
    return issuePayload;
  } catch (err) {
    console.error("Error creating issue", err);
    return;
  }
};

export const getContextIssue = async (): Promise<Issue | undefined> => {
  if (!_client) {
    return;
  }
  try {
    const issueId = (await _storage.get("linearContextIssueId")) as string;
    if (!issueId) {
      return;
    }
    const issue = await _client.issue(issueId);
    return issue;
  } catch (err) {
    console.error("Error retrieving context issue", err);
    return;
  }
  return;
};
