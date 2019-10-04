// The properties each node can possess
// Also, the mapping between field name in JSON, HTML form field id, and
// "nice name" for printing on screen
// prop_name, form_field_id, nice_name
var node_id_prop_name = "node_id";
var link_id_prop_name = "link_id";
var node_type_prop = ["node_type", "node_type", "Node Type"];
var node_type_opts = {
        "inl_team": "INL Team",
        "inl_member": "INL Member",
        "research_field": "General Research Field",
        "research_thrust": "Specific Research Thrust",
        "AF_unit": "Air Force Unit",
        "AF_mission": "Air Force Mission",
        "AF_member": "Air Force Member"
    }
var node_props = [
["node_name", "node_name", "Name"],
["node_notes", "node_notes", "Notes"],
];
// The node properties that should be large text areas
var node_textareas = ["node_notes"];
// prop_name, nice_name
var link_prop_name = ["link_name", "Relationship"];

// Additional HTML element IDs for placing of input and output
// The container that'll contain the friendly, selectable list of references
var node_list_id = "nodes_cont";
// The element that'll contain the JSON output
var json_element_id = "json_out";

// The CSS class to apply to selected reference list members
var selected_node_class_name = "node_list_selected_node";
var secondary_sel_node_class_name = "node_list_sec_sel_node";
// The CSS class to apply to all reference list members by default
var node_class_name = "node_list_node";

// Div element for cytoscape
var cy_div_id = "cytoscape_div";
var cy_node_display = ["node_name", "node_type"];

// Entry Form Div ID
var entry_form_id = "add_ref_frm";
