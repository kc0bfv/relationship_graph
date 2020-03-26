# Relationship Graph

## Tool Location
https://kc0bfv.github.io/relationship_graph

## Purpose
This tool provides a flexible way to graph the relationships between entities of different types.  The example schema, for instance, is setup for relationships between INL teams, leaders, research areas, and the Air Force units that might be interested in each.

This began as a way to track references during research in such a way that can be converted to bibtex with little effort.  For that I just needed a list...  But then, I also needed something to track relationships between entities, so I decided to make them the same tool.

### Privacy
Additionally - none of the data you enter is passed over the network.  The cytoscape.js library doesn't do that, and my code doesn't do that.  All the data stays in your browser instance.  This makes it more reasonable for handling sensitive data, but it also means that you had better remember to save often.

## Requirements
A modern, updated browser.

## Usage
Usage instructions are available under "Help", at the top of the tool.

## JSON Format Details
Your data is stored inside a copy of the page.  It gets represented as JSON when you save or "build JSON".

The JSON is an object with three keys: schema, nodes, and edges.  Schema is an object described below, nodes is a list of nodes, and edges is a list of edges.  Add some edges and nodes and click "build JSON" to see how the nodes and edges lists work.

```
schema_object := {"node_types": node_types_object, "node_fields": node_fields_object, "edge_types": edge_types_object}

node_types_object := {node_type_name: node_type_object, ...}
node_type_name : A string, any valid JSON key values permitted, that becomes a possible value for node types.
node_type_object := {"color": color_value}
color_value : A string describing any valid javascript color.  This will be the color of any nodes for the corresponding type.

node_fields_object := {node_field_name: node_field_object, ...}
node_field_name : A string, no spaces permitted and alpha-numeric ascii characters preferred, that becomes the name used to store and reference a new field of data storage for each node
node_field_object := {"size": size_descriptor, "nice_name": nice_name}
size_descriptor : A string, "textarea" the only one implemented now.  Specifying this will override the default input textbox with some text field of another size.
nice_name : A string, any valid JSON string permitted, that is the name of the field displayed on the input form.

edge_types_object := {edge_type_name: edge_type_object, ...}
edge_type_name := A string, any valid JSON key values permitted, that becomes a possible value for edge types.
edge_type_object := {}
```

Unexpected keys and values in the schema objects should be ignored, and missing ones get default values.  Thus, schema setup can improve over time.

## Modifying the Source

Don't modify the `index.html` file...  Modify the `js`, `css`, and `index_*` files, then run `make` to rebuild `index.html`.  The Makefile just concatenates everything together...

## License

This is GPL v3.  It uses [Cytoscape.js](https://js.cytoscape.org/) - [which has their own license](CYTOSCAPE_LICENSE).
