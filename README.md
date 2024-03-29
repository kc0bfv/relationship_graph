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

The JSON is an object with four keys: schema, nodes, edges, and view.  Schema and view are objects described below, nodes is a list of nodes, and edges is a list of edges.  Add some edges and nodes and click "build JSON" to see how the nodes and edges lists work.

Nodes now can include an "x" and "y" value in a "renderedPosition" object, and those correspond to the position as rendered, as returned by Cytoscape.

```
schema_object := {"node_types": node_types_object, "node_fields": node_fields_object, "edge_types": edge_types_object, "default_root_ids": root_ids_list}

node_types_object := {node_type_name: node_type_object, ...}
node_type_name : A string, any valid JSON key values permitted, that becomes a possible value for node types.
node_type_object := {"color": color_value}

node_fields_object := {node_field_name: node_field_object, ...}
node_field_name : A string, no spaces permitted and alpha-numeric ascii characters preferred, that becomes the name used to store and reference a new field of data storage for each node
node_field_object := {"size": size_descriptor, "nice_name": nice_name}
size_descriptor : A string, "textarea" the only one implemented now.  Specifying this will override the default input textbox with some text field of another size.
nice_name : A string, any valid JSON string permitted, that is the name of the field displayed on the input form.

edge_types_object := {edge_type_name: edge_type_object, ...}
edge_type_name := A string, any valid JSON key values permitted, that becomes a possible value for edge types.
edge_type_object := {"line-color": color_value, "label": edge_type_label}
edge_type_label := A string, the label to display on an edge.  Defaults to the type name if not specified.


color_value : A string describing any valid javascript color.  This will be the color of any item for the corresponding type.
root_ids_list := A list of the id numbers of nodes to use as the hierarchical root when no other root is selected.
```

```
view_object := {"zoom": zoom_value, "pan": pan_value, "display_only": display_value}
zoom_value : A float, the Cytoscape viewport zoom value as returned by Cytoscape
pan_value : A float, the Cytoscape viewport pan value as returned by Cytoscape
display_value : A boolean, true if the graph should be shown "display only", or false if it should provide the editing interface.
```

Unexpected keys and values in the schema objects should be ignored, and missing ones get default values.  Thus, schema setup can improve over time.

## Modifying the Source

Don't modify the `index.html` file...  Modify the `js`, `css`, and `index_*` files, then run `make` to rebuild `index.html`.  The Makefile just concatenates everything together...

## License

This is GPL v3.  It uses [Cytoscape.js](https://js.cytoscape.org/) - [which has their own license](CYTOSCAPE_LICENSE).
