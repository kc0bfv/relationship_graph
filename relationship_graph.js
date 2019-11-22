// Vital DOM IDs
const node_form_div = "add_node_form";
const cytoscape_div_id = "cytoscape_area";
const json_out_area_id = "json_out_area";
const LINK_TYPE_SEL = "link_type_select";

// Globals
window.GLOBAL_graph_schema = {};
window.GLOBAL_cytoscape = undefined;
window.GLOBAL_selected_nodes = [];
window.GLOBAL_selected_edges = [];
window.GLOBALS_default_node_color = "blue";
window.GLOBALS_selected_node_color = "red";
window.GLOBALS_selected_link_color = "red";

// Main API
function after_load() {
    start_cy();
    json_to_cy();
}

function add_node() {
    var node_data = get_edit_data();
    add_node_array([node_data]);
    node_to_top_left(node_data["id"]);
    clear_node_input_form();
}

function replace_selected_node() {
    const seld = get_selected_nodes();
    if( seld.length != 1 ) {
        alert("Select one node, and one node only.");
        return;
    }
    var node_data = get_edit_data();
    var cy_node = update_cy_node(seld[0], node_data);
    clear_node_input_form();
}

function select_matching_nodes() {
    const node_data = get_edit_data();
    const select_str = build_cy_node_selector(node_data);
    window.GLOBAL_cytoscape.$(":selected").unselect();
    window.GLOBAL_cytoscape.$(select_str).select();
}

function clear_node_input_form() {
    const form_div = get_elem(node_form_div);
    clear_input_element_recurse(form_div);
}

function delete_selected() {
    window.GLOBAL_cytoscape.remove(":selected");
}

function link_nodes() {
    const seld = get_selected_nodes();
    if( seld.length != 2 ) {
        alert("Select two nodes, and two nodes only.");
        return;
    }
    var edge_dat = get_edge_data(seld[0], seld[1]);
    add_edge_array([edge_dat]);
}

function edit_node() {
    clear_node_input_form();
    const seld = get_selected_nodes();
    if( seld.length != 1 ) {
        alert("Select one node, and one node only.");
        return;
    }
    var node = get_cy_elem_by_id(seld[0]);
    set_edit_data(node.scratch()["raw_dat"]);
}

function set_hierarchical() {
    var breadthfirst = get_cy_layout_defaults()["breadthfirst"];
    breadthfirst["roots"] = ":selected";
    window.GLOBAL_cytoscape.layout(breadthfirst).run();
}

function set_elastic_spring() {
    var cose = get_cy_layout_defaults()["cose"];
    window.GLOBAL_cytoscape.layout(cose).run();
}

function set_fit_view() {
    window.GLOBAL_cytoscape.fit();
}

function build_json() {
    cy_to_json();
}

function ingest_json() {
    if( window.confirm("Are you sure you want to replace your " +
            "graph with that described by the JSON?") ) {
        json_to_cy();
    }
}


// Utility functions

function cy_to_json() {
    const json_out_area = get_elem(json_out_area_id);
    var json_obj = {
            "schema": get_graph_schema(),
            "nodes": window.GLOBAL_cytoscape.$("node").map(
                    function(elem) {
                        return elem.scratch()["raw_dat"];
                    }
                ),
            "edges": window.GLOBAL_cytoscape.$("edge").map(
                    function(elem) {
                        return elem.scratch()["raw_dat"];
                    }
                )
        };
    json_out_area.value = JSON.stringify(json_obj, null, 2);
}

function json_to_cy() {
    const json_out_area = get_elem(json_out_area_id);
    const cur_json = JSON.parse(json_out_area.value);
    clear_cy_nodes_edges();
    set_graph_schema(cur_json["schema"]);
    build_input_forms();
    add_node_array(cur_json["nodes"]);
    add_edge_array(cur_json["edges"]);

    set_hierarchical();
}

function add_node_array(node_data_array) {
    add_elem_array(node_data_array, build_cy_node);
}
function add_edge_array(edge_data_array) {
    add_elem_array(edge_data_array, build_cy_edge);
}
function add_elem_array(elem_array, build_cy_func) {
    elem_array.forEach(
            function(elem_data) {
                var cy_elem = build_cy_func(elem_data);
                window.GLOBAL_cytoscape.add(cy_elem);
            }
        );
}

function get_elem(elem_id) {
    return document.getElementById(elem_id);
}

function start_cy() {
    window.GLOBAL_cytoscape = cytoscape({
            "container": get_elem(cytoscape_div_id),
            "layout": get_cy_layout_defaults()["cose"],
            "style": get_cy_style()
        });

    window.GLOBAL_cytoscape.on("select", "node", cy_node_select);
    window.GLOBAL_cytoscape.on("unselect", "node", cy_node_unselect);
    window.GLOBAL_cytoscape.on("select", "edge", cy_edge_select);
    window.GLOBAL_cytoscape.on("unselect", "edge", cy_edge_unselect);
}

function clear_cy_nodes_edges() {
    // This unselect causes our selection tracking code
    // more accurately track what's going on.  Without it,
    // cytoscape doesn't send unselect commands when removing
    // selected nodes so our selection tracking code doesn't
    // see them as unselected.
    window.GLOBAL_cytoscape.$(":selected").unselect();
    window.GLOBAL_cytoscape.remove("");
}

function node_to_top_left(node_id) {
    var node = get_cy_elem_by_id(node_id);
    node.renderedPosition({"x": 50, "y": 50});
}

function get_selected_nodes() {
    return window.GLOBAL_selected_nodes;
}
function cy_node_select(in_event) {
    window.GLOBAL_selected_nodes.push(in_event.target.id());
    // TODO make sure this data structure isn't out of sync with cytoscape
}
function cy_node_unselect(in_event) {
    var loc = window.GLOBAL_selected_nodes.indexOf(in_event.target.id());
    if( loc == -1 ) {
        return;
    }
    window.GLOBAL_selected_nodes.splice(loc, 1);
    // TODO make sure this data structure isn't out of sync with cytoscape
    if( window.GLOBAL_cytoscape.$(":selected").length == 0 ) {
        // Just make sure the data structures are cleared out when
        // nothing is selected
        window.GLOBAL_selected_nodes = [];
        window.GLOBAL_selected_edges = [];
    }
}

function get_selected_edges() {
    return window.GLOBAL_selected_edges;
}
function cy_edge_select(in_event) {
    window.GLOBAL_selected_edges.push(in_event.target.id());
    // TODO make sure this data structure isn't out of sync with cytoscape
}
function cy_edge_unselect(in_event) {
    var loc = window.GLOBAL_selected_edges.indexOf(in_event.target.id());
    if( loc == -1 ) {
        return;
    }
    window.GLOBAL_selected_edges.splice(loc, 1);
    // TODO make sure this data structure isn't out of sync with cytoscape
    if( window.GLOBAL_cytoscape.$(":selected").length == 0 ) {
        // Just make sure the data structures are cleared out when
        // nothing is selected
        window.GLOBAL_selected_nodes = [];
        window.GLOBAL_selected_edges = [];
    }
}

function get_cy_layout_defaults() {
    return {
            "cose": {
                    "name": "cose",
                    "fit": true,
                    "padding": 20
                },
            "breadthfirst": {
                    "name": "breadthfirst"
                }
        };
}

function form_id_from_name(field) {
    return "node_" + field + "_entry";
}

function build_input_forms() {
    build_node_input_form();
    build_link_type_input();
}

function build_link_type_input() {
    const type_sel = get_elem(LINK_TYPE_SEL);
    const graph_schema = get_graph_schema();
    type_sel.innerHTML = "";

    Object.keys(graph_schema["edge_types"]).forEach(
            function (key) {
                var opt = document.createElement("option");
                opt.value = key;
                opt.innerHTML = key;
                type_sel.appendChild(opt);
            }
        );
}

function build_node_input_form() {
    const form_div = get_elem(node_form_div);
    const graph_schema = get_graph_schema();
    form_div.innerHTML = "";
    var temp_div;

    // Build node label entry
    temp_div = document.createElement("div");
    var node_label_ent = document.createElement("input");
    node_label_ent.type = "text";
    node_label_ent.id = form_id_from_name("label"); 
    var node_label_ent_label = document.createElement("label");
    node_label_ent_label.innerHTML = "Label:";
    node_label_ent_label.for = node_label_ent.id;
    temp_div.appendChild(node_label_ent_label);
    temp_div.appendChild(node_label_ent);
    form_div.appendChild(temp_div);

    // Build node types entry
    temp_div = document.createElement("div");
    var node_types_ent = document.createElement("select");
    node_types_ent.id = form_id_from_name("type");
    var node_types_blank_ent = document.createElement("option");
    node_types_blank_ent.value = "";
    node_types_blank_ent.innerHTML = "";
    node_types_ent.appendChild(node_types_blank_ent);
    var node_types_ent_label = document.createElement("label");
    node_types_ent_label.innerHTML = "Type:";
    node_types_ent_label.for = node_types_ent.id;

    // Add the types options to the entry
    Object.keys(graph_schema["node_types"]).forEach(
            function (key) {
                var type_opt = document.createElement("option");
                type_opt.value = key;
                type_opt.innerHTML = key;
                node_types_ent.appendChild(type_opt);
            }
        );

    temp_div.appendChild(node_types_ent_label);
    temp_div.appendChild(node_types_ent);
    form_div.appendChild(temp_div);

    // Build other node field entries
    Object.keys(graph_schema["node_fields"]).forEach(
            function (key) {
                temp_div = document.createElement("div");
                var field_ent;
                if( graph_schema["node_fields"][key]["size"] == "textarea" ) {
                    field_ent = document.createElement("textarea");
                    field_ent.cols = "40";
                    field_ent.rows = "20";
                } else {
                    field_ent = document.createElement("input");
                }
                field_ent.type = "text";
                field_ent.id = form_id_from_name(key);
                var field_ent_label = document.createElement("label");
                var label_text = key;
                if( graph_schema["node_fields"][key]["nice_name"] ) {
                    label_text = graph_schema["node_fields"][key]["nice_name"];
                }
                field_ent_label.innerHTML = label_text + ":";
                field_ent_label.for = field_ent.id;
                temp_div.appendChild(field_ent_label);
                temp_div.appendChild(field_ent);
                form_div.appendChild(temp_div);
            }
        );

    clear_node_input_form();
}

function clear_input_element_recurse(elem) {
    const tag_name = elem.tagName.toLowerCase();
    if( tag_name == "div" ) {
        Object.keys(elem.children).forEach(
                function(key) {
                    clear_input_element_recurse(elem.children[key]);
                }
            );
    } else if( tag_name == "input" || tag_name == "textarea" ||
            tag_name == "select" ) {
        elem.value = "";
    } else {
        // labels, other...  just ignore it
    }
}

function get_next_unused_id() {
    const all_elem = window.GLOBAL_cytoscape.$();
    var max_id = -1;
    all_elem.forEach(
            function (elem) {
                if( Number(elem.id()) > max_id ) {
                    max_id = Number(elem.id());
                }
            }
        );
    return max_id + 1;
}

function set_edit_data(node_data) {
    Object.keys(node_data).forEach(
            function(key) {
                if( key == "id" ) {
                    return;
                }
                const form_id = form_id_from_name(key);
                const elem = get_elem(form_id);
                if( elem ) {
                    elem.value = node_data[key];
                }
            }
        );
}

function get_edit_data() {
    const graph_schema = get_graph_schema();
    var node_data = {
            "id": get_next_unused_id()
        };
    const fields = ["label", "type"].concat(
            Object.keys(graph_schema["node_fields"]));
    fields.forEach(
            function (key) {
                const form_id = form_id_from_name(key);
                const elem = get_elem(form_id);
                node_data[key] = elem.value;
            }
        );
    return node_data;
}

function update_cy_node(node_id, node_data) {
    node_data["id"] = node_id;

    var node = get_cy_elem_by_id(node_id);
    var cy_node = build_cy_node(node_data);

    node.data(cy_node["data"]);
    node.scratch(cy_node["scratch"]);
}

function get_cy_elem_selector_by_id(elem_id) {
    return "[id='" + elem_id + "']"
}
function get_cy_elem_by_id(elem_id) {
    return window.GLOBAL_cytoscape.$(get_cy_elem_selector_by_id(elem_id))[0];
}

function build_cy_node_selector(node_data) {
    const sel_entries = Object.keys(node_data).map(
            function(key) {
                if( key == "id" ) {
                    return "";
                }
                if( node_data[key] == "" ) {
                    return "";
                }
                return "[" + key + " @*= '" + node_data[key] + "']";
            }
        );
    const selector = "node" + sel_entries.reduce(
            function(prev, cur) {
                return prev + cur;
            }
        );
    console.log(selector);
    return selector;
}

function deep_copy_dict(to_copy) {
    return JSON.parse(JSON.stringify(to_copy));
}

function build_cy_node(node_data) {
    var cy_data = deep_copy_dict(node_data);
    cy_data["label"] = build_node_cy_label(node_data);
    cy_data["color"] = build_node_cy_color(node_data);
    var cy_node = {
            "group": "nodes",
            "data": cy_data,
            "scratch": {
                    "raw_dat": node_data
                },
            "grabbable": true
        };
    return cy_node;
}

function get_edge_data(source_id, target_id) {
    var edge_data = {
            "id": get_next_unused_id(),
            "source": source_id,
            "target": target_id,
            "type": get_elem(LINK_TYPE_SEL).value
        };
    return edge_data;
}

function build_cy_edge(edge_data) {
    var cy_data = {
            "id": edge_data["id"],
            "source": edge_data["source"],
            "target": edge_data["target"],
            "label": build_edge_cy_label(edge_data)
        };
    var cy_edge = {
            "group": "edges",
            "data": cy_data,
            "scratch": {
                    "raw_dat": edge_data
                },
            "grabbable": true
        };
    return cy_edge;
}

function build_node_cy_label(node_data) {
    return node_data["label"];
}

function build_edge_cy_label(edge_data) {
    return edge_data["type"];
}

function build_node_cy_color(node_data) {
    const graph_schema = get_graph_schema();
    var node_type_entry = graph_schema["node_types"][node_data["type"]];
    if( node_type_entry ) {
        var sch_color = node_type_entry["color"];
        if( sch_color ) {
            return sch_color;
        }
    }
    return window.GLOBALS_default_node_color;
}

function get_cy_style() {
    var style = [
        {
            selector: "node",
            style: {
                    "label": "data(label)",
                    "background-color": "data(color)",
                    "compound-sizing-wrt-labels": "include",
                    "width": "30px",
                    "height": "30px",
                    "padding": "50px",
                    "text-valign": "center",
                    "color": "white",
                    "text-outline-color": "black",
                    "text-outline-opacity": ".8",
                    "text-outline-width": "1",
                }
        },
        {
            selector: ":selected",
            style: {
                    "label": "data(label)",
                    "background-color": window.GLOBALS_selected_node_color,
                    "line-color": window.GLOBALS_selected_link_color,
                }
        },
        {
            selector: "edge",
            style: {
                    "label": "data(label)",
                    "width": 2,
                    "curve-style": "straight",
                    "target-arrow-shape": "triangle",
                    "compound-sizing-wrt-labels": "include",
                    "color": "white",
                    "text-outline-color": "black",
                    "text-outline-opacity": ".8",
                    "text-outline-width": "1",
                }
        }];
    return style;
}

// Globals Management
// TODO: avoid globals
function set_graph_schema(schema) {
    window.GLOBAL_graph_schema = schema;
}
function get_graph_schema(schema) {
    return window.GLOBAL_graph_schema;
}