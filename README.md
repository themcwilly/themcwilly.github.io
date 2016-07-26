## ProcessFlow
* Devloped by: Brett McWilliams
* ProcessFlow is an add-on to the existing OSH(http://opensensorhub.org/page/homepage) architecture that attempts to visualize process chains currently existing in XML format. This will be and adjuvant to the XML editor(~LINK~)

## Credited Libraries
* jointjs (http://jointjs.com)
* jQuery (https://jquery.com)
* underscore (http://underscorejs.org)
* dagre (https://github.com/cpettitt/dagre)
* graphlib (https://github.com/cpettitt/graphlib)
* backbone (http://backbonejs.org)
* lodash (https://lodash.com)

## Installation

Pull the entire branch and run through the server of your choice. Mine was tested with NodeJS... Or, see example (https://themcwilly.github.io).
jQuery.get request will be eliminated as soon as this is attached to the SensorML page.

## License

MIT License (https://opensource.org/licenses/MIT)

## Updates

### v1.0 
* Initial Commit: Setting up the process flow diagram using JointJS

### v1.2016.07.20   
* Updated graph so that it dynamically expands as user moves nodes
* Updated the license
* Included credits to external libraries
* MAJOR UPDATE: Attached dom element to each port for html embedding. Each port is a vector graphic, therefore an extra node attached to each port was necessary. 
* Colored the links to make it easier to distinguish pathways
* Implemented a Directed Graph to organize the nodes
* Wrote code to re-organize nodes that were subjected to improper placement by the Directed Graph (The DG only organizes as a function of the whole graph... not as a function of which nodes are contained in which groups.)
* Wrote code to retroactively modify node colors based on their type (input,output,parameter)
* Implemented eventing that will trigger a "waterfall" effect determined by the chain... and, as a result, change values to other nodes

### v1.2016.07.26   
* Removed "waterfall" effect
* Added ability to import from file as well as a URL
* Add POST function to post changes - only post being done is updating the users input values
* Updated CSS to account for embedding the graph in nested elements
* Added test functionality to home page
* Next version will be able to update the XML values and output to server.. as well as contain user-specific changes
* Began writing generic API for simple functions