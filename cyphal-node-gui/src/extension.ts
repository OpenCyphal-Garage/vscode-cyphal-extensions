/* Copyright 2022 Amazon.com Inc., or its affiliates. All Rights Reserved. */

// EXTENSION 

import * as vscode from 'vscode';

let onenode: string = ""; // onenode stores one heartbeat log from one node at a time
let formDisplay: string = "block"; // formDisplay is initialized to block so that the network interface form is viewable
let tableDisplay: string = "none"; // tableDisplay determines if the node properties table is visible or not

// Persistent lists of each node's heartbeat message data fields
// The Cyphal Heartbeat message is defined here: 
// https://github.com/OpenCyphal/public_regulated_data_types/blob/master/uavcan/node/7509.Heartbeat.1.0.dsdl
let systemTimestamp: string[] = []; // ts_system list
let monotonic: string[] = []; // ts_monotonic list
let source: string[] = []; // source_node_id list
let transfer: string[] = []; // transfer_id list
let priority: string[] = []; // priority list
let uptime: string[] = []; // uptime list
let health: string[] = []; // health list
let mode: string[] = []; // mode list
let vssc: string[] = []; // vendor_specific_status_code list

let nodes = new Set<string>(); // A set of all distinct source node IDs from the heartbeats

let lightMode: boolean = false; // lightMode is the boolean that indicates whether or not the extension should be in 
                                // lightMode (true) or not (false)

// activate runs when the user runs the Cyphal Node GUI command in the command palette
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('cyphalNodeGUI.start', (extensionUri: vscode.Uri, webview: vscode.Webview) => {
      // Create and show panel
      const panel = vscode.window.createWebviewPanel(
        'cyphalNodeGUI',
        'Cyphal Node GUI',
        vscode.ViewColumn.One,
        {
          // Enables JavaScript for the webview
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      // Updates the webview
      const updateWebview = (extensionUri: vscode.Uri, webview: vscode.Webview) => {
          panel.title = 'Cyphal Node GUI';
          panel.webview.html = getWebviewContent(context.extensionUri, panel.webview);  
      };
    
      // Set initial content
      updateWebview(extensionUri, webview);

      // And set its HTML content
      panel.webview.html = getWebviewContent(context.extensionUri, panel.webview);

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'Toggled': // Handles the case when the user toggles the webview from light/dark mode
              lightMode = !lightMode;
              return;
            case 'InterfaceReceived': // Handles the case when the user submits a network interface from the webview
              let netInterface = message.text; 
              formDisplay = "none"; // Hides the network interface input field from the user 

              // Gets rid of extraneous "/out" directory for the value of the current working directory 
              let directory = __dirname; 
              directory = directory.substring(0, directory.length-4);

              // Creates a new hidden shell and runs commands to get a continuous stream of heartbeats from the given 
              // interface
              const { spawn } = require('child_process');

              // Uses the UDP interface export command if the user inputted a UDP address, otherwise it will use the 
              // CAN interface export command in the case that the user inputted a CAN interface
              let sensor: typeof spawn; 
              if (netInterface.indexOf("can") === -1)
              {
                sensor = spawn('export UAVCAN__UDP__IFACE=' + netInterface +
                                    ' && yakut sub --with-metadata uavcan.node.heartbeat', 
                                    {shell: true, cwd: directory, detached: true});
              }
              else
              {
                sensor = spawn('export UAVCAN__CAN__IFACE=' + netInterface +
                                    ' && yakut sub --with-metadata uavcan.node.heartbeat', 
                                    {shell: true, cwd: directory, detached: true});
              }

              // Handles destruction of the webview
              panel.onDidDispose(
                () => {
                  formDisplay = "inline";
                  tableDisplay = "none";
                  systemTimestamp = []; // ts_system list
                  monotonic = []; // ts_monotonic list
                  source = []; // source_node_id list
                  transfer = []; // transfer_id list
                  priority = []; // priority list
                  uptime = []; // uptime list
                  health = []; // health list
                  mode = []; // mode list
                  vssc = []; // vendor_specific_status_code list
                  nodes = new Set<string>(); // A set of all distinct source node IDs from the heartbeats
                  lightMode = false;
                  process.kill(-sensor.pid); // Kills the spawned shell
                },
                null,
                context.subscriptions
              );

              // Makes node properties table show up
              tableDisplay = "inline";
              updateWebview(context.extensionUri, panel.webview);

              // Handles error output
              sensor.stderr.on('data', function(data:string) {console.log(data);});

              // Handles continuous heartbeat data outputted from the yakut subscribe command and sends it to the webview
              // The following runs once for each and every heartbeat message 
              sensor.stdout.on('data', function(data:string) { 

                // Parses the data of one node heartbeat message and stores the information into corresponding temporary 
                // variables
                onenode = data;
                let parsedData = JSON.parse(onenode);
                let heartBeatID = Object.keys(parsedData)[0];
                let accessibleData = parsedData[heartBeatID];
                let systemData = accessibleData._meta_.ts_system;
                let monotonicData = accessibleData._meta_.ts_monotonic;
                let sourceData = accessibleData._meta_.source_node_id;
                let transferData = accessibleData._meta_.transfer_id;
                let priorityData = accessibleData._meta_.priority;
                let uptimeData = accessibleData.uptime;
                let healthData = accessibleData.health.value;
                let modeData = accessibleData.mode.value;
                let vsscData = accessibleData.vendor_specific_status_code;
                
                // Checks if the current node heartbeat message has a source node ID that's already been in a previous 
                // message. If it already has been seen before, then the message's new data will be used to update the 
                // existing node's data, otherwise a new node will be added to the lists with the message data. 
                if(nodes.has(sourceData))
                {
                  let index: number = source.indexOf(sourceData);
                  systemTimestamp[index] = systemData;
                  monotonic[index] = monotonicData;
                  transfer[index] = transferData;
                  priority[index] = priorityData.toUpperCase();
                  uptime[index] = uptimeData;
                  health[index] = healthData;
                  mode[index] = modeData;
                  vssc[index] = vsscData;
                }
                else
                {
                  nodes.add(sourceData);
                  systemTimestamp.push(systemData);
                  monotonic.push(monotonicData);
                  source.push(sourceData);
                  transfer.push(transferData);
                  priority.push(priorityData.toUpperCase());
                  uptime.push(uptimeData);
                  health.push(healthData);
                  mode.push(modeData);
                  vssc.push(vsscData);
                }

                // Sends over data on all the nodes and their corresponding heartbeat data to the webview as a JSON
                panel.webview.postMessage({
                  systemList: systemTimestamp, 
                  monotonicList: monotonic, 
                  sourceList: source, 
                  transferList: transfer, 
                  priorityList: priority, 
                  uptimeList: uptime, 
                  healthList: health, 
                  modeList: mode, 
                  vsscList: vssc
                });
                
              }); 
              return;
          }
        },
        undefined,
        context.subscriptions
      );
     
    })

  );

  
}

// WEBVIEW 

function getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview) {
  // Local path to main script run in the webview
  const stylePathOnDisk = vscode.Uri.joinPath(extensionUri, 'media', 'style.css');
	// And the uri we use to load this script in the webview
	const styleUri = webview.asWebviewUri(stylePathOnDisk);
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cyphal Node GUI</title>
      <script> 
      // Toggles the table between dark and light mode
      function changeTableColorScheme() {
          let elements = document.getElementsByClassName('nodeTable');
          for (let i = 0; i < elements.length; i++) {
              elements[i].classList.toggle('light');
          }
      }
  
      // Translates health value to a message indicated by the DSDL
      function healthTranslator(x) {
          if (x === 0) {
              return "NOMINAL";
          }
          else if (x === 1) {
              return "ADVISORY";
          }
          else if (x === 2) {
              return "CAUTION";
          }
          else {
              return "WARNING";
          }
      }
  
      // Translates mode value to a message indicated by the DSDL
      function modeTranslator(x) {
          if (x === 0) {
              return "OPERATIONAL";
          }
          else if (x === 1) {
              return "INITIALIZATION";
          }
          else if (x === 2) {
              return "MAINTENANCE";
          }
          else {
              return "SOFTWARE_UPDATE";
          }
  
      }
  
      window.onload = () => {
  
          // Upon user input of network interface, the following code will send the submitted interface
          // back to the VS Code extension
          const networkInterfaceForm = document.getElementById("networkInterfaceForm");
          const vscode = acquireVsCodeApi();
          networkInterfaceForm.onsubmit = () => {
              vscode.postMessage({
                  command: 'InterfaceReceived',
                  text: '' + document.getElementById('netInterface').value
              });
              document.body.style.display = "none";
          };
          // Handles toggling between light mode and dark mode
          const checkbox = document.getElementById('checkbox');
          if (${lightMode}) {
              changeTableColorScheme();
              document.body.classList.toggle('light');
              document.getElementById("checkbox").checked = true;
          }
          checkbox.addEventListener('change', () => {
              document.body.classList.toggle('light');
              changeTableColorScheme();
              vscode.postMessage({
                  command: 'Toggled',
              }); 
          });
          
          window.addEventListener('message', event => {
              const message = event.data; // The JSON data the extension sent
              let size = message.sourceList.length;
              // Loops through every node's heartbeat data that was sent to the webview by the extension
              for (let i = 0; i < size; i++) {
                  // Sets the color of the health table cell according to it's values 
                  let healthNumber = message.healthList[i];
                  let healthColor = "green";
                  if (healthNumber === 1) {
                      healthColor = "#f0d83c";
                  }
                  else if (healthNumber === 2) {
                      healthColor = "orange";
                  }
                  else if (healthNumber === 3) {
                      healthColor = "red";
                  }
                  // If the node is already in the table, then it will update the node accordingly in the table. 
                  // Otherwise, it will create a new row in the table with the node's information
                  if (!!document.getElementById(i)) {
                      let tds = document.getElementById(i).children;
                      tds[0].innerHTML = message.sourceList[i];
                      tds[1].innerHTML = message.transferList[i];
                      tds[2].innerHTML = message.priorityList[i];
                      tds[3].innerHTML = message.uptimeList[i];
                      tds[4].innerHTML = healthTranslator(healthNumber);
                      tds[4].setAttribute("bgcolor", healthColor);
                      tds[5].innerHTML = modeTranslator(message.modeList[i]);
                      tds[6].innerHTML = message.vsscList[i];
                      tds[7].innerHTML = message.systemList[i];
                      tds[8].innerHTML = message.monotonicList[i];
                  }
                  else {
                      let tableRow = document.createElement('tr');
                      tableRow.setAttribute('id', i);
                      let dataDisplay = document.getElementById('dataDisplay');
                      dataDisplay.appendChild(tableRow);
                      let newTableRow = document.getElementById(i);
                      newTableRow.classList.add("nodeTable");
  
                      let system = document.createElement('td');
                      let monotonic = document.createElement('td');
                      let source = document.createElement('td');
                      let transfer = document.createElement('td');
                      let priority = document.createElement('td');
                      let uptime = document.createElement('td');
                      let health = document.createElement('td');
                      let mode = document.createElement('td');
                      let vssc = document.createElement('td');
  
                      system.classList.add("nodeTable");
                      monotonic.classList.add("nodeTable");
                      source.classList.add("nodeTable");
                      transfer.classList.add("nodeTable");
                      priority.classList.add("nodeTable");
                      uptime.classList.add("nodeTable");
                      health.classList.add("nodeTable");
                      mode.classList.add("nodeTable");
                      vssc.classList.add("nodeTable");
  
                      health.setAttribute("bgcolor", healthColor);
  
                      system.innerHTML = message.systemList[i];
                      monotonic.innerHTML = message.monotonicList[i];
                      source.innerHTML = message.sourceList[i];
                      transfer.innerHTML = message.transferList[i];
                      priority.innerHTML = message.priorityList[i];
                      uptime.innerHTML = message.uptimeList[i];
                      health.innerHTML = healthTranslator(healthNumber);
                      mode.innerHTML = modeTranslator(message.modeList[i]);
                      vssc.innerHTML = message.vsscList[i];
                      // Helps handle toggling light mode and dark mode
                      if (${lightMode}) {
                          system.classList.toggle('light');
                          monotonic.classList.toggle('light');
                          source.classList.toggle('light');
                          transfer.classList.toggle('light');
                          priority.classList.toggle('light');
                          uptime.classList.toggle('light');
                          health.classList.toggle('light');
                          mode.classList.toggle('light');
                          vssc.classList.toggle('light');
                          document.getElementById("checkbox").checked = true;
                      }
  
                      newTableRow.appendChild(source);
                      newTableRow.appendChild(transfer);
                      newTableRow.appendChild(priority);
                      newTableRow.appendChild(uptime);
                      newTableRow.appendChild(health);
                      newTableRow.appendChild(mode);
                      newTableRow.appendChild(vssc);
                      newTableRow.appendChild(system);
                      newTableRow.appendChild(monotonic);
                  }
              }
  
          });
  
  
      };
  
      </script>
      <link href="${styleUri}" rel="stylesheet">
  </head>
  <body>
      <form action = "" id = "networkInterfaceForm" style = "display: ${formDisplay};">
          <label for="netInterface">Network Interface: </label><br>
          <input type="text" id="netInterface" name="netInterface" placeholder = "Enter Network Interface"><br><br>
          <input type="submit" value="Submit" style = "color: white; background-color: green;">
        </form>
        <h id = "test"></h>
      <table id = "dataDisplay" style = "display: ${tableDisplay}" class = "nodeTable">
        <th class = "nodeTable">source_node_id</th>
        <th class = "nodeTable">transfer_id</th>
        <th class = "nodeTable">priority</th>
        <th class = "nodeTable">uptime</th>
        <th class = "nodeTable">health</th>
        <th class = "nodeTable">mode</th>
        <th class = "nodeTable">vendor_specific_status_code</th>
        <th class = "nodeTable">ts_system</th>
        <th class = "nodeTable">ts_monotonic</th>
    </table>
      <div>
        <input type="checkbox" class="checkbox" id="checkbox">
        <label for="checkbox" class="label">
        <div class = "sun"> </div> 
        <div class = "moon"> </div>
        <div class='ball'>
      </label>
    </div>
     
  </body>
  </html>`;
}




