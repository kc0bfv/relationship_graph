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
// Pallette - https://coolors.co/8c7919-f4d97f-9b4477-756de8-b45cc4
var node_type_colors = {
        "inl_team": "#39192C",
        "inl_member": "#8D3E6D",

        "research_thrust": "#B5A96C",
        "research_field": "#806E17",

        "AF_unit": "#2B2855",
        "AF_mission": "#6B64D3",
        "AF_member": "#A7A2F0"
    }
var default_node_color = "blue";
var selected_node_color = "red";
var selected_link_color = "red";

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
var cy_node_display = ["node_name"];

// Entry Form Div ID
var entry_form_id = "add_ref_frm";
