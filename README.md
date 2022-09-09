# vscode-cyphal-extensions
VS Code extensions for Cyphal diagnostics

# Developer Instructions

## Running Extensions
- `cd` into the directory of the extension you want to run
- `npm install`
- `npm run compile`
- Open VisualStudio, connect to your Cloud Desktop, and then navigate to the directory of the extension you want to run
- In package.json, make sure that "engines": { "vscode": "^1.67.2"} indicates the vscode version found from the VS Code GUI options "Code" -> "About Visual Studio Code"
- `F5` to start debugging **OR**
- Run the `Run Extension` target in the Debug View. This will:
	- Start a task `npm: watch` to compile the code
	- Run the extension in a new VS Code window
- See the README in each sample extension for more information.
