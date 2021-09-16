import * as vscode from "vscode";

import {
  init,
  storeApiKey,
  getMyIssues,
  setContextIssueId,
  addContextIssueComment,
  getIssueByIdentifier,
  getWorkflowStates,
  setContextIssueStatus
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

          progress.report({ increment: 0, message: "Fetching issues..." });
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

      console.error({ statuses });

      const selectedStatus = await vscode.window.showQuickPick(
        statuses?.map((status) => ({
          label: status.name,
          // description: issue.identifier,
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

  // Roadmap:
  // V linear.connect
  // V linear.getMyIssues
  // V linear.setContextIssue
  // X linear.getContextIssueDetails
  // V linear.addContextIssueComment
  // V linear.changeContextIssueStatus
  // X linear.getIssueDetails
  // X linear.getProjects
  // X linear.setContextProject
}

// This method is called when your extension is deactivated
export function deactivate() {}
