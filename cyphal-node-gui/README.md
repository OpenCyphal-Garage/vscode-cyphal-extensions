# cyphal-node-gui README


## Features

- This extension is built to display PyCyphal node heartbeat data in a compact GUI. 
- It creates a table that displays all the online nodes that are currently being subscribed to in the user's shell.
- It also displays corresponding information for each node in every row, specifically the following fields: 
                    source_node_id
                    transfer_id
                    priority 
                    uptime
                    health 
                    mode 
                    vendor_specific_status_code 
                    ts_system 
                    ts_monotonic 
- As new nodes come online, new rows will be automatically created with their heartbeat information in real-time.
- The extension also includes a dark mode/light mode toggle button which changes the color scheme of the entire extension 
  accordingly. 
- The extension can handle both Cyphal UDP networks and Cyphal CAN networks


## Requirements

- PyCyphal and Yakut must be installed and activated in your working directory


## Usage 

- Make sure your PyCyphal UDP or CAN network is running in the background in another terminal.
- Run the extension with `F5` and select `Cyphal Online Nodes`.
- Enter your network interface and press submit in the extension's webview.
- Now watch as the node data populates the table! 
- To switch to light mode/dark mode, just press the toggle button. The sun indicates light mode and the moon indicates 
- dark mode.
- To connect to a different interface, close the tab that running the `Cyphal Online Nodes` command opened up and then 
  run the `Cyphal Online Nodes` command again.


## Known Issues


## Release Notes


### 1.0.0

Initial release of Cyphal Online Nodes includes table display GUI of online nodes in real-time and dark mode/light mode 
toggle.

**Enjoy!**
