import * as vscode from "vscode";

import {
  init,
  storeApiKey,
  getMyIssues,
  setContextIssueId,
  addContextIssueComment,
  getIssueByIdentifier,
  getWorkflowStates,
  setContextIssueStatus,
  createIssue,
  getMyTeams,
  getTeamMembers,
  getAvailablePriorities,
  getContextIssue,
} from "./linear";

// This method is called when the extension is activated.
// The extension is activated the very first time the command is executed.
export async function activate(context: vscode.ExtensionContext) {
  const hasApiKey = await init(context);

  if (!hasApiKey) {
    vscode.window.showInformationMessage(
      'Please run "Connect to Linear" to initialize the connection'
    );
  }

  // Commands have been defined in the package.json file
  // The commandId parameter must match the command field in package.json

  const connectDisposable = vscode.commands.registerCommand(
    "linear.connect",
    async () => {
      const apiKey = (
        await vscode.window.showInputBox({ placeHolder: "API key" })
      )?.toString();

      if (apiKey) {
        await storeApiKey(apiKey);
        vscode.window.showInformationMessage(
          "Your Linear client connection is all set!"
        );
      } else {
        vscode.window.showErrorMessage("No API key - no cookies!");
      }
    }
  );
  context.subscriptions.push(connectDisposable);

  const getMyIssuesDisposable = vscode.commands.registerCommand(
    "linear.getMyIssues",
    () => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: false,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
          });

          progress.report({ increment: 0, message: "Fetching issues..." });
          const issues = await getMyIssues();
          progress.report({ increment: 100 });

          const selectedIssue = await vscode.window.showQuickPick(
            issues?.map((issue) => ({
              label: `${issue.identifier} ${issue.title}`,
              description: issue.identifier,
              target: issue.id,
              issue,
            })) || [],
            {
              placeHolder: "Select an issue to save to the working context",
            }
          );
          if (selectedIssue) {
            setContextIssueId(selectedIssue.target);
            vscode.window.showInformationMessage(
              `Linear context issue is set to ${selectedIssue.description}`
            );

            const { issue } = selectedIssue;
            if (issue) {
              const action = await vscode.window.showInformationMessage(
                `Actions for issue ${issue.identifier}`,
                "Copy ID",
                "Copy branch name",
                "Open in browser"
              );
              if (action) {
                switch (action) {
                  case "Copy ID":
                    await vscode.env.clipboard.writeText(issue.identifier);
                    vscode.window.showInformationMessage(
                      `Copied ID ${issue.identifier} to clipboard!`
                    );
                    break;
                  case "Copy branch name":
                    await vscode.env.clipboard.writeText(issue.branchName);
                    vscode.window.showInformationMessage(
                      `Copied branch name ${issue.branchName} to clipboard!`
                    );
                    break;
                  case "Open in browser":
                    vscode.env.openExternal(vscode.Uri.parse(issue.url));
                    break;
                }
              }
            }
          }
        }
      );
    }
  );
  context.subscriptions.push(getMyIssuesDisposable);

  const addContextIssueCommentDisposable = vscode.commands.registerCommand(
    "linear.addContextIssueComment",
    async () => {
      const comment = (
        await vscode.window.showInputBox({ placeHolder: "Comment" })
      )?.toString();

      if (comment) {
        if (await addContextIssueComment(comment)) {
          vscode.window.showInformationMessage("Context issue comment added");
        } else {
          vscode.window.showErrorMessage("Error commenting the context issue");
        }
      } else {
        vscode.window.showErrorMessage("Comment cannot be empty");
      }
    }
  );
  context.subscriptions.push(addContextIssueCommentDisposable);

  const setContextIssueDisposable = vscode.commands.registerCommand(
    "linear.setContextIssue",
    () => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: false,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
          });

          const identifier = (
            await vscode.window.showInputBox({
              placeHolder: "Issue identifier",
            })
          )?.toString();

          if (!identifier) {
            return;
          }

          progress.report({
            increment: 0,
            message: `Fetching issue ${identifier}...`,
          });
          const selectedIssue = await getIssueByIdentifier(identifier);
          progress.report({ increment: 100 });

          if (selectedIssue) {
            setContextIssueId(selectedIssue.id);
            vscode.window.showInformationMessage(
              `Linear context issue is set to ${selectedIssue.identifier}`
            );
          } else {
            vscode.window.showErrorMessage(
              `Linear issue ${identifier} was not found`
            );
          }
        }
      );
    }
  );
  context.subscriptions.push(setContextIssueDisposable);

  const setContextIssueStatusDisposable = vscode.commands.registerCommand(
    "linear.setContextIssueStatus",
    async () => {
      vscode.window.showInformationMessage("Getting available statuses...");
      const statuses = await getWorkflowStates();

      const selectedStatus = await vscode.window.showQuickPick(
        statuses?.map((status) => ({
          label: status.name,
          target: status.id,
        })) || [],
        {
          placeHolder: "Select a status to set for the issue",
        }
      );
      if (selectedStatus) {
        setContextIssueStatus(selectedStatus.target);
        vscode.window.showInformationMessage(
          `Linear context issue status is set to ${selectedStatus.label}`
        );
      }
    }
  );
  context.subscriptions.push(setContextIssueStatusDisposable);

  const createIssueDisposable = vscode.commands.registerCommand(
    "linear.createIssue",
    async () => {
      const title = (
        await vscode.window.showInputBox({
          placeHolder: "Please provide a title for the issue",
        })
      )?.toString();

      let selectedTeam;

      const myTeams = await getMyTeams();
      if (myTeams && myTeams.length > 1) {
        selectedTeam = await vscode.window.showQuickPick(
          myTeams?.map((team) => ({
            label: team.name,
            target: team.id,
            linearTeam: team,
          })) || [],
          {
            placeHolder: "Select a team to set for the issue",
          }
        );
      } else if (myTeams && myTeams.length === 1) {
        const team = myTeams?.[0];
        selectedTeam = { label: team.name, target: team.id, linearTeam: team };
        vscode.window.showInformationMessage(
          `Creating issue in team ${selectedTeam.label}.`
        );
      }

      // They're mandatory
      if (title && selectedTeam) {
        const description = (
          await vscode.window.showInputBox({
            placeHolder: "Please provide a description",
          })
        )?.toString();

        const availableStatuses = await getWorkflowStates();
        const selectedStatus = await vscode.window.showQuickPick(
          availableStatuses?.map((status) => ({
            label: status.name,
            target: status.id,
          })) || [],
          {
            placeHolder: "Select a status to set for the issue",
          }
        );

        const availableAssignees = await getTeamMembers(
          selectedTeam.linearTeam
        );
        const selectedAssignee = await vscode.window.showQuickPick(
          availableAssignees?.map((assignee) => ({
            label: assignee.name,
            target: assignee.id,
          })) || [],
          {
            placeHolder: "Select an assignee to set for the issue",
          }
        );

        let estimateString = await vscode.window.showInputBox({
          placeHolder: "Please provide an estimate",
        });
        let estimate = estimateString
          ? parseInt(estimateString, 10)
          : undefined;

        const availablePriorities = await getAvailablePriorities();
        const selectedPriority = await vscode.window.showQuickPick(
          availablePriorities?.map((priority) => ({
            label: priority.label,
            target: priority.priority,
          })) || [],
          {
            placeHolder: "Select a priority to set for the issue",
          }
        );

        const issuePayload = await createIssue(
          title,
          selectedTeam.target,
          description,
          selectedAssignee?.target,
          selectedStatus?.target,
          estimate,
          selectedPriority?.target
        );

        if (issuePayload?.success) {
          const issue = await issuePayload.issue;
          if (issue) {
            const action = await vscode.window.showInformationMessage(
              `Issue ${issue.identifier} created`,
              "Set active",
              "Copy ID",
              "Copy branch name",
              "Open in browser"
            );
            if (action) {
              switch (action) {
                case "Set active":
                  setContextIssueStatus(issue.identifier);
                  vscode.window.showInformationMessage(
                    `Set ${issue.identifier} as active!`
                  );
                  break;
                case "Copy ID":
                  await vscode.env.clipboard.writeText(issue.identifier);
                  vscode.window.showInformationMessage(
                    `Copied ID ${issue.identifier} to clipboard!`
                  );
                  break;
                case "Copy branch name":
                  await vscode.env.clipboard.writeText(issue.branchName);
                  vscode.window.showInformationMessage(
                    `Copied branch name ${issue.branchName} to clipboard!`
                  );
                  break;
                case "Open in browser":
                  vscode.env.openExternal(vscode.Uri.parse(issue.url));
                  break;
              }
            }
          }
        }
      } else {
        vscode.window.showErrorMessage("Title cannot be empty");
      }
    }
  );
  context.subscriptions.push(createIssueDisposable);

  const showContextIssueActionsDisposable = vscode.commands.registerCommand(
    "linear.showContextIssueActions",
    async () => {
      const issue = await getContextIssue();
      if (issue) {
        const action = await vscode.window.showInformationMessage(
          `Actions for ${issue.identifier}`,
          "Copy ID",
          "Copy branch name",
          "Open in browser"
        );
        if (action) {
          switch (action) {
            case "Copy ID":
              await vscode.env.clipboard.writeText(issue.identifier);
              vscode.window.showInformationMessage(
                `Copied ID ${issue.identifier} to clipboard!`
              );
              break;
            case "Copy branch name":
              await vscode.env.clipboard.writeText(issue.branchName);
              vscode.window.showInformationMessage(
                `Copied branch name ${issue.branchName} to clipboard!`
              );
              break;
            case "Open in browser":
              vscode.env.openExternal(vscode.Uri.parse(issue.url));
              break;
          }
        }
      }
    }
  );
  context.subscriptions.push(showContextIssueActionsDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
