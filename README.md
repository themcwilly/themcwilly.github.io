## ProcessFlow

ProcessFlow is an add-on to the existing OSH(http://opensensorhub.org/page/homepage) architecture that attempts to visualize process chains currently existing in XML format. This will be and adjuvant to the XML editor(~LINK~)

## Installation

Pull the entire branch and run through the server of your choice. Mine was tested with NodeJS... Or, see example (https://themcwilly.github.io).
jQuery.get request will be eliminated as soon as this is attached to the SensorML page.

## License

MIT License (https://opensource.org/licenses/MIT)

## Updates

### v1.0 
* Initial Commit: Setting up the process flow diagram using JointJS

### v1.2016.07.14   
* Updated graph so that it dynamically expands as user moves nodes
* Updated the license
* MAJOR UPDATE: Attached dom element to each port so we could eventually introduce html code. Each port is a vector graphic, therefore an extra node attached to each port was necessary. 