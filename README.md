# vscode-linear-extension

This (unofficial!) VSCode - Linear extension aims to make it easier to work with Linear as part of the development workflow.

**Note: This is currently WIP! There are most certainly many bugs and more functionality to implement. Any contributions will be appreciated.**

## Notable Features

We don't intend on fully supporting all Linear actions. Linear is a great tool in itself, and many actions should be performed directly within its interface.

However, some actions are more easily performed while in the development context. The idea here is to fit in well with the user's workflow.
For example, when someone's working on a specific issue, they may want to add comments as they stumble into things within the code.
Or maybe they'd like to change the status of the current issue and select another issue to work on.

* Connecting to linear account via user-specific API key.
* Setting an issue to the VSCode context manually, or by choosing from the user's assigned issues.
* Creating issues.
* Commenting on the current issue.
* Changing the status of the current issue.
* Showing a set of actions for the current issue.

## Requirements

Um... [VSCode](https://code.visualstudio.com/) and a [Linear](https://linear.app/) account.


## Getting Started

1. Generate your own API key @ https://linear.app/YOUR_ORG_NAME/settings/api
1. Search for Linear in your Extensions Tab
1. Click on the "Install" button
1. Reload or restart your VSCode
1. Open the Command Palette (Linux/Windows: `Ctrl+Shift+P`, Mac: `Cmd+Shift+P`).
1. Run the VSCode command: "Linear: Connect", enter the Linear API key and press enter.
1. Or type 'Linear:' to discover all available commands.


That's it! You can now browse through the different "Linear: ..." commands.

## Usage

TBD

## Release Notes

See [Changelog](https://github.com/strigo/vscode-linear-extension/blob/master/CHANGELOG.md) for more info.

## Contributions

All contribution are welcome :)
