# vscode-cyphal-extensions
VS Code extensions for Cyphal diagnostics

# Developer Instructions

## Running Extensions
- `cd` into the directory of the extension you want to run
- `npm install`
- `npm run compile`
- `code .` (OR Open VisualStudio and navigate to the directory of the extension you want to run)
- In package.json, make sure that the VsCode version in "engines": { "vscode": "^1.67.2"} is less than or equal to the VsCode version found from the VS Code GUI options "Code" -> "About Visual Studio Code"
- Press `F5` to Launch the Extension Development Host (This should open a new VS Code Window)
- In the new VS Code Window, open the Command Palette and type the name of the extension you want to run, e.g Cyphal Online Nodes
- See the README in each sample extension for more information.
