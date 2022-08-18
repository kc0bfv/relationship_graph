// Vital DOM IDs
const node_form_div = "add_node_form";
const cytoscape_div_id = "cytoscape_area";
const json_out_area_id = "json_out_area";
const LINK_TYPE_SEL = "link_type_select";
const project_name_elem_id = "project_name";

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
    window.GLOBAL_cytoscape.$(":selected").unselect();
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
    const seld = get_selected_nodes();
    const graph_schema = get_graph_schema();
    if( seld.length < 1 &&
            Object.keys(graph_schema).includes("default_root_ids") ) {
        const id_sels = graph_schema["default_root_ids"].map( function(elem_id) {
                return "node" + get_cy_elem_selector_by_id(elem_id);
            });
        breadthfirst["roots"] = id_sels.join(", ");
    } else {
        breadthfirst["roots"] = ":selected";
    }
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

function save_url(url, download_name) {
    let anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = download_name;

    let click = document.createEvent("MouseEvents");
    click.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

    anchor.dispatchEvent(click);
}

function save_file() {
    let proj_name_box = document.getElementById(project_name_elem_id);
    let proj_name = proj_name_box.value;

    // Sync the value with the DOM html
    proj_name_box.setAttribute("value", proj_name);

    build_json();

    let cy_area = document.getElementById(cytoscape_div_id);
    let cy_elems = Object.values(cy_area.childNodes).map(function(val){return val;});
    cy_area.innerHTML = "";
    let content = document.getElementsByTagName("html")[0].outerHTML;
    cy_elems.forEach(function(val){cy_area.appendChild(val);});

    let blob = new Blob([content], { type: "text/html; charset=utf-8" });
    let url = URL.createObjectURL(blob);

    save_url(url, proj_name);
}

function export_to_png() {
    const png_dat = window.GLOBAL_cytoscape.png();
    save_url(png_dat, "graph");
}

function toggle_additive() {
    if( window.GLOBAL_cytoscape.selectionType() != "additive" ) {
        window.GLOBAL_cytoscape.selectionType("additive");
    } else {
        window.GLOBAL_cytoscape.selectionType("single");
    }
}


// Utility functions
function cy_to_json() {
    const json_out_area = get_elem(json_out_area_id);
    var json_obj = {
            "schema": get_graph_schema(),
            "nodes": window.GLOBAL_cytoscape.$("node").map(
                    function(elem) {
                        let ret_val = elem.scratch()["raw_dat"];
                        ret_val["renderedPosition"] = elem.renderedPosition();
                        return ret_val;
                    }
                ),
            "edges": window.GLOBAL_cytoscape.$("edge").map(
                    function(elem) {
                        return elem.scratch()["raw_dat"];
                    }
                ),
            "view": {
                "zoom": window.GLOBAL_cytoscape.zoom(),
                "pan": window.GLOBAL_cytoscape.pan(),
                "display_only": get_display_only()
            }
        };
    new_json = JSON.stringify(json_obj, null, 2);
    json_out_area.innerHTML = new_json;
    json_out_area.value = new_json;
}

function json_to_cy() {
    const json_out_area = get_elem(json_out_area_id);
    try {
        var cur_json = JSON.parse(json_out_area.value);
    } catch ( error ) {
        alert("Error parsing JSON:\n" + error);
        return;
    }
    
    if( !validate_json(cur_json) ) {
        return;
    }

    // Sync the innerHTML with the value...
    cur_json.innerHTML = cur_json;

    clear_cy_nodes_edges();
    window.GLOBAL_cytoscape.reset()

    set_graph_schema(cur_json["schema"]);
    build_input_forms();

    if( cur_json["view"] !== undefined ) {
        window.GLOBAL_cytoscape.zoom(cur_json["view"]["zoom"]);
        window.GLOBAL_cytoscape.pan(cur_json["view"]["pan"]);
        set_display_only(cur_json["view"]["display_only"]);
    } else {
        set_display_only(false);
    }

    add_node_array(cur_json["nodes"]);
    add_edge_array(cur_json["edges"]);

    if( cur_json["view"] !== undefined ) {
        window.GLOBAL_cytoscape.fit();
    } else {
        set_hierarchical();
    }
}

function validate_json(cur_json) {
    // Validate JSON a little...
    json_keys = Object.keys(cur_json);
    if( ! json_keys.includes("schema") ||
        ! json_keys.includes("nodes") ||
        ! json_keys.includes("edges") ) {
        alert("JSON did not include one or more of: schema, nodes, edges");
        return false;
    }
    if( cur_json["schema"]["node_types"] === undefined ||
        cur_json["schema"]["node_fields"] === undefined ) {
        alert("Invalid schema:" +
                "did not contain either node_types or node_fields");
        return false;
    }
    return true;
}

function err_wrap(func) {
    try { func(); } catch(error) { alert("ERROR:\n" + error); }
}

function get_display_only() {
    return window.document.body.classList.contains("display_only");
}

function set_display_only(value) {
    if( value === true ) {
        window.document.body.classList.add("display_only");
    } else {
        window.document.body.classList.remove("display_only");
    }
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
    window.GLOBAL_cytoscape.on("zoom", zoom_handler);
    window.GLOBAL_cytoscape.on("dbltap", cy_node_doubleclick);
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
function cy_node_doubleclick(in_event) {
    set_hierarchical();
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
function zoom_handler(in_event) {
    window.GLOBAL_cytoscape.style().update();
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
    node_label_ent.title = "Node label, or name"
    var node_label_ent_label = document.createElement("label");
    node_label_ent_label.innerHTML = "Node Label:";
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
    node_types_ent_label.innerHTML = "Node Type:";
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
                    field_ent.rows = "10";
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
            "grabbable": true,
            "renderedPosition": node_data["renderedPosition"]
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
                    "color": "black",
                    "text-outline-color": "white",
                    "text-outline-opacity": ".8",
                    "text-outline-width": "2",
                    "text-background-color": "white",
                    "text-background-padding": "1px",
                    "text-background-shape": "roundrectangle",
                    "text-background-opacity": ".4",
                    "text-wrap": "wrap",
                    "text-max-width": "200px",
                    "font-family": "sans-serif",
                    "font-size": function() {
                            return "" + 1 / window.GLOBAL_cytoscape.zoom() + "em";
                        },
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
                    "color": "black",
                    "text-outline-color": "white",
                    "text-outline-opacity": ".5",
                    "text-outline-width": "2",
                    "font-size": function() {
                            return "" + 1 / window.GLOBAL_cytoscape.zoom() + "em";
                        },
                }
        }];
    return style;
}

// Globals Management
// TODO: avoid globals
function set_graph_schema(schema) {
    let base_schema = {
        "node_types": {},
        "node_fields": {},
        "edge_types": {},
        "default_root_ids": []
    };

    let out_schema = {};
    Object.keys(base_schema).forEach(function(key) {
        if( schema === undefined || schema[key] === undefined ) {
            out_schema[key] = base_schema[key];
        } else {
            out_schema[key] = schema[key];
        }
    });

    window.GLOBAL_graph_schema = out_schema;
}
function get_graph_schema(schema) {
    return window.GLOBAL_graph_schema;
}
