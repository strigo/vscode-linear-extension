import * as vscode from "vscode";

import {
  init,
  storeApiKey,
  getMyIssues,
  setContextIssueId,
  addContextIssueComment,
} from "./linear";

// This method is called when the extension is activated.
// The extension is activated the very first time the command is executed.
export async function activate(context: vscode.ExtensionContext) {
  const hasApiKey = await init(context);

  if (!hasApiKey) {
    vscode.window.showInformationMessage(
      'Please run "Connect to Linear" to initialize the connection.'
    );
  } else {
    vscode.window.showInformationMessage(
      "Your Linear client connection is all set!"
    );
  }

  // Commands have been defined in the package.json file
  // The commandId parameter must match the command field in package.json

  const connectDisposable = vscode.commands.registerCommand(
    "linear.connect",
    async () => {
      const apiKey = (await vscode.window.showInputBox())?.toString();

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
    async () => {
      const issues = await getMyIssues();
      const selectedIssue = await vscode.window.showQuickPick(
        issues?.map((issue) => ({
          label: issue.identifier,
          description: issue.title,
          target: issue.id,
        })) || [],
        {
          placeHolder: "Select an issue to save to the working context",
        }
      );
      if (selectedIssue) {
        setContextIssueId(selectedIssue.target);
        vscode.window.showInformationMessage(
          `Linear context issue is set to ${selectedIssue.label}.`
        );
      }
    }
  );
  context.subscriptions.push(getMyIssuesDisposable);

  const addContextIssueCommentDisposable = vscode.commands.registerCommand(
    "linear.addContextIssueComment",
    async () => {
      const comment = (await vscode.window.showInputBox())?.toString();

      if (comment) {
        if (await addContextIssueComment(comment)) {
          vscode.window.showInformationMessage("Context issue comment added!");
        } else {
          vscode.window.showErrorMessage("Error commenting the context issue.");
        }
      } else {
        vscode.window.showErrorMessage("Comment cannot be empty.");
      }
    }
  );
  context.subscriptions.push(addContextIssueCommentDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
