// Requires cytoscape be script-tag-included prior to this...

function build_node_json_elem() {
  // Build a node in JSON and add it to the JSON source
  var new_node = {};
  for (var node_prop_ind in node_props) {
    var node_prop = node_props[node_prop_ind];
    var prop_name = node_prop[0];
    var prop_field = node_prop[1];
    var elem = document.getElementById(prop_field);
    //console.log(elem);
    new_node[prop_name] = elem.value;
  }
  var node_type_f = document.getElementById(node_type_prop[1]);
  //console.log(elem);
  new_node[node_type_prop[0]] = node_type_f.value;
  new_node[node_id_prop_name] = find_next_node_id();
  return new_node;
}

function build_link_json_elem(node_id_1, node_id_2) {
  // TODO - make sure a link doesn't already exist...
  var new_link = {};
  new_link["node_1_id"] = node_id_1;
  new_link["node_2_id"] = node_id_2;
  new_link[link_id_prop_name] = find_next_link_id();
  new_link[link_prop_name[0]] = prompt(link_prop_name[1]);
  return new_link;
}

function find_next_node_id() {
  return find_next_id("nodes", node_id_prop_name);
}

function find_next_link_id() {
  return find_next_id("links", link_id_prop_name);
}

function find_next_id(id_type, prop_name) {
  // Find the next available node ID
  var cur_json_text = document.getElementById(json_element_id).value;
  var cur_json = JSON.parse(cur_json_text)[id_type];

  var max_id = -1;
  for (var cur_ind = 0; cur_ind < cur_json.length; cur_ind += 1) {
    var cur_field = Number(cur_json[cur_ind][prop_name]);
    if (cur_field > max_id) {
      max_id = cur_field;
    }
  }

  if (max_id == -1) {
    return 0;
  }
  return max_id + 1;
}

/*
function add_node() {
  // Add a node to the node list
  var new_node = build_node_json_elem();

  var cur_json_text = document.getElementById(json_element_id).value;
  var cur_json = JSON.parse(cur_json_text);
  //console.log(cur_json);
  cur_json["nodes"] = cur_json["nodes"].concat([new_node]);
  document.getElementById(json_element_id).value = JSON.stringify(
    cur_json, null, 2);

  update_GUI();
}
*/

function add_node_graph_ver() {
    // Add a node to the node list
    var new_node = build_node_json_elem();
    global_cy.add(build_cy_node(new_node));
    produce_json_from_graph();
}

function edit_sel_node_graph_ver() {
    var sel_node = get_selected_nodes();
    if(sel_node.length != 1) {
        alert("Select one node, one node only.");
        return;
    }
    set_edit_vals(sel_node[0].scratch());
}

// Doesn't rely on JSON...
function link_nodes_graph_ver() {
    var sel_nodes = get_selected_nodes();
    if(sel_nodes.length != 2) {
        alert("Select two nodes.");
        return;
    }

    if(sel_nodes[0].edgesWith(sel_nodes[1]).length > 0) {
        alert("Nodes already connected.  Failing.");
        return;
    }
    
    // TODO
    var json_link_data = {};
    json_link_data["id"] = find_next_link_id_graph_ver();
    var new_edge_data = {};
    new_edge_data["id"] = l_pref + json_link_data["id"];
    new_edge_data["source"] = sel_nodes[0].id();
    new_edge_data["target"] = sel_nodes[1].id();

    var new_edge = {
            "data": new_edge_data,
            "group": "edges",
            "scratch": link_d
        };
}

function find_next_link_id_graph_ver(){
    
}


function change_node_graph_ver() {
    var sel_node = get_selected_nodes();
    if(sel_node.length != 1) {
        alert("Select one node, one node only.");
        return;
    }
    var new_node = build_cy_node(build_node_json_elem());
    global_cy.$(":selected").data(new_node["data"]);
    global_cy.$(":selected").scratch(new_node["scratch"]);
    produce_json_from_graph();
}

function build_cy_node(node_data) {
    // Turn node_data into a node suitable for cytoscape

    var elem_data = JSON.parse(JSON.stringify(node_data));
    elem_data["id"] = n_pref + elem_data[node_id_prop_name];

    var node_label = "";
    // Build the label from the cy_node_display list
    for(var node_prop_ind = 0; node_prop_ind < cy_node_display.length;
            node_prop_ind += 1) {
        if( node_prop_ind > 0 ) {
            node_label += " - ";
        }
        if( cy_node_display[node_prop_ind] == node_type_prop[0] ) {
            lookup = node_type_opts[
                    elem_data[cy_node_display[node_prop_ind]]
                ];
        } else {
            lookup = elem_data[cy_node_display[node_prop_ind]];
        }
        node_label += lookup;
    }

    elem_data["label"] = node_label;

    // Set node color, employed via style
    elem_data["color"] = default_node_color;
    if(elem_data[node_type_prop[0]] in node_type_colors) {
        elem_data["color"] = node_type_colors[
                elem_data[node_type_prop[0]]
            ];
    }

    var cur_elem = { 
        group: "nodes",
        data: elem_data,
        scratch: node_data,
        grabbable: true,
    };

    return cur_elem;
}

function build_cy_edge(link_data, nodes) {
    // Turn data about a link into a cytoscape edge
    // Returns null if an edge can no longer exist

    function does_node_exist(node_id_chk) {
        for(var node_ind = 0; node_ind < nodes.length; node_ind += 1) {
            var tst_node_id = nodes[node_ind]["scratch"][node_id_prop_name];
            if(tst_node_id == node_id_chk) {
                return true;
            }
        }
        return false;
    }
    
    var new_edge = JSON.parse(JSON.stringify(link_data));

    // Make sure the source and target nodes still exist...
    if( ! does_node_exist(new_edge["node_1_id"]) ||
            ! does_node_exist(new_edge["node_2_id"]) ) {
        console.log("Link " + new_edge[link_id_prop_name] + 
                " error resolving a node, either: " + 
                new_edge["node_1_id"] + " " +
                new_edge["node_2_id"]);
        return null;
    }

    // Build the edge
    new_edge["id"] = l_pref + new_edge[link_id_prop_name];
    new_edge["source"] = n_pref + new_edge["node_1_id"];
    new_edge["target"] = n_pref + new_edge["node_2_id"];
    var cur_elem = { 
        group: "edges",
        data: new_edge,
        scratch: link_data,
        grabbable: true
    };
    return cur_elem;
}

function get_selected_node() {
  // Find one selected node, or null for none
  // Return its element
  return get_sel_node_cls(selected_node_class_name);
}

function get_secondary_selected_node() {
  // Find one secondary selected node, or null for none
  // Return its element
  return get_sel_node_cls(secondary_sel_node_class_name);
}

function get_sel_node_cls(sel_cls_name) {
  // Find the selected node by class name
  // Class name options are selected_node_class_name or 
  // secondary_sel_node_class_name
  var disp_area = document.getElementById(node_list_id);
  var node_disp_list = disp_area.children;
  var sel_node = null;
  for (var node_disp_ind = 0; node_disp_ind < node_disp_list.length; node_disp_ind += 1) {
    var cur_node = node_disp_list[node_disp_ind];
    if (cur_node.classList.contains(sel_cls_name)) {
      if (sel_node === null) {
        sel_node = cur_node;
      } else {
        alert("Multiple nodes selected...  Failing operation.");
        return;
      }
    }
  }
  return sel_node;
}

function find_corresponding_json_node_ind(parsed_json, node_id) {
  // Return the index of the json element corresponding to a node id
  // Return null if none were found, or if multiple were
  var json_nodes = parsed_json["nodes"];
  var sel_elem_ind = null;
  for (var cur_elem_ind = 0; cur_elem_ind < json_nodes.length; cur_elem_ind += 1) {
    var cur_elem = json_nodes[cur_elem_ind];

    // Match on node_id
    if (cur_elem[node_id_prop_name] == node_id) {
      if (sel_elem_ind === null) {
        sel_elem_ind = cur_elem_ind;
      } else {
        alert("Multiple matching JSON entries found...  " +
              "Failing operation.");
        return null;
      }
    }
  }
  return sel_elem_ind;
}

function find_corresponding_json_link_ind(parsed_json, link_id) {
  // Return the index of the json element corresponding to a link id
  // Return null if none were found, or if multiple were
  var json_links = parsed_json["links"];
  var sel_elem_ind = null;
  for (var cur_elem_ind = 0; cur_elem_ind < json_links.length;
        cur_elem_ind += 1)
  {
    var cur_elem = json_links[cur_elem_ind];

    // Match on link_id
    if (cur_elem[link_id_prop_name] == link_id) {
      if (sel_elem_ind === null) {
        sel_elem_ind = cur_elem_ind;
      } else {
        alert("Multiple matching JSON entries found...  " +
              "Failing operation.");
        return null;
      }
    }
  }
  return sel_elem_ind;
}

function change_node() {

  // Replace the selected node with the edit values entered
  // Maintain the original node ID.  Warn if multiple are selected.

  // Find the selected node
  var sel_node = get_selected_node();
  if (sel_node === null) {
    alert("No selected node found.  Failling operation.")
    return;
  }
  var sel_node_props = JSON.parse(
    sel_node.getAttribute("node_props"));
  var sel_node_id = sel_node_props[node_id_prop_name];

  // Find the corresponding JSON element for the selected node
  var cur_json_text = document.getElementById(json_element_id).value;
  var cur_json_all = JSON.parse(cur_json_text);
  var cur_json = cur_json_all["nodes"];

  var sel_elem_ind = find_corresponding_json_node_ind(
    cur_json_all, sel_node_id);
  if (sel_elem_ind === null) {
    alert("ERROR: unable to find corresponding JSON element " +
          "for selection...");
    return;
  }

  // Build the new JSON, and maintain the old node ID
  var new_node = build_node_json_elem();
  new_node[node_id_prop_name] =
    cur_json[sel_elem_ind][node_id_prop_name];
  cur_json[sel_elem_ind] = new_node;

  cur_json_all["nodes"] = cur_json;

  document.getElementById(json_element_id).value = JSON.stringify(
    cur_json_all, null, 2);

  update_GUI();
}

function delete_node_with_id(node_id) {
  // Delete one node with provided ID

  // Resolve the json into arrays
  var cur_json_text = document.getElementById(json_element_id).value;
  var cur_json_all = JSON.parse(cur_json_text);
  var cur_json = cur_json_all["nodes"];

  // Find the corresponding JSON element for the selected node
  var sel_elem_ind = find_corresponding_json_node_ind(
    cur_json_all, node_id);
  if (sel_elem_ind === null) {
    alert("ERROR: unable to find corresponding JSON element " +
          "for selection...");
    return;
  }

  // Remove the node
  cur_json.splice(sel_elem_ind, 1);
  cur_json_all["nodes"] = cur_json;

  // Store the json back to JSON element
  document.getElementById(json_element_id).value = JSON.stringify(
    cur_json_all, null, 2);

  update_GUI();
}

function delete_link_with_id(link_id) {
  // Delete one link with provided ID

  // Resolve the json into arrays
  var cur_json_text = document.getElementById(json_element_id).value;
  var cur_json_all = JSON.parse(cur_json_text);
  var cur_json = cur_json_all["links"];

  // Find the corresponding JSON element for the selected link
  var sel_elem_ind = find_corresponding_json_link_ind(
    cur_json_all, link_id);
  if (sel_elem_ind === null) {
    alert("ERROR: unable to find corresponding JSON element " +
          "for selection...");
    return;
  }

  // Remove the link
  cur_json.splice(sel_elem_ind, 1);
  cur_json_all["links"] = cur_json;

  // Store the json back to JSON element
  document.getElementById(json_element_id).value = JSON.stringify(
    cur_json_all, null, 2);

  update_GUI();
}

function does_node_exist_in_json(node_id) {
  var cur_json_text = document.getElementById(json_element_id).value;
  var cur_json_all = JSON.parse(cur_json_text);
  var cur_json = cur_json_all["nodes"];

  // Find the corresponding JSON element for the selected node
  var sel_elem_ind = find_corresponding_json_node_ind(
    cur_json_all, node_id);

  return !(sel_elem_ind === null);
}

function does_link_exist_in_json(link_id) {
  var cur_json_text = document.getElementById(json_element_id).value;
  var cur_json_all = JSON.parse(cur_json_text);
  var cur_json = cur_json_all["links"];

  // Find the corresponding JSON element for the selected link
  var sel_elem_ind = find_corresponding_json_link_ind(
    cur_json_all, link_id);

  return !(sel_elem_ind === null);
}

function edit_sel_node() {
  // Set the edit fields with the values of the selected node
  // Warn if multiple are selected
  var sel_node = get_selected_node();
  if (sel_node === null) {
    alert("No selected node found.  Failling operation.")
    return;
  }

  //console.log(sel_node.node_props);
  set_edit_vals(JSON.parse(sel_node.getAttribute("node_props")));
}

function set_edit_vals(node_info) {
  // Set the edit fields to the values in node_info
  for (var node_prop_ind in node_props) {
    var node_prop = node_props[node_prop_ind];
    var prop_name = node_prop[0];
    var prop_field = node_prop[1];
    var elem = document.getElementById(prop_field);
    elem.value = node_info[prop_name];
  }
  var node_prop = node_type_prop;
  var prop_name = node_prop[0];
  var prop_field = node_prop[1];
  var elem = document.getElementById(prop_field);
  elem.value = node_info[prop_name];
}

function select_node(event, node_id) {
  // Select a given node, or select a second node if ctrl is held
  var sel_class = selected_node_class_name;
  var other_sel = secondary_sel_node_class_name;
  if (event.ctrlKey) {
    sel_class = secondary_sel_node_class_name;
    other_sel = selected_node_class_name;
  }

  var sel_node = get_sel_node_cls(sel_class);

  // Unselect the currently selected node
  if (sel_node !== null && sel_node.id != node_id) {
    sel_node.classList.remove(sel_class);
  }

  // Toggle selection of the clicked node
  var node = document.getElementById(node_id);
  node.classList.remove(other_sel);
  if (node.classList.contains(sel_class)) {
    node.classList.remove(sel_class);
  } else {
    node.classList.add(sel_class);
  }
}

function update_GUI() {
    update_node_list();
    update_link_list();
    refresh_graph_from_json();
}

function update_node_list() {
  // Update the list of nodes with the JSON in the JSON field
  var cur_json_text = document.getElementById(json_element_id).value;
  var cur_json = JSON.parse(cur_json_text)["nodes"];

  var node_id_base = "node_list_id_";

  // Clear the list area
  var disp_area = document.getElementById(node_list_id);
  disp_area.innerHTML = "";

  function build_click_callback(n_id) {
    return function(event) {
      select_node(event, n_id);
    };
  }

  for (var cur_elem_ind = 0; cur_elem_ind < cur_json.length; cur_elem_ind += 1) {
    var cur_elem = cur_json[cur_elem_ind];

    // Build the new node for display
    var new_node_disp = document.createElement("div");
    var new_node_id = node_id_base + cur_elem_ind;
    //console.log(new_node_id);
    new_node_disp.id = new_node_id;
    new_node_disp.classList.add(node_class_name);
    new_node_disp.addEventListener("click",
                                   build_click_callback(new_node_id), null);
    new_node_disp.setAttribute("node_props",
                               JSON.stringify(cur_elem, null, 2));

    // Add the node's display elements
    for (var node_prop_ind in node_props) {
      var node_prop = node_props[node_prop_ind];
      var prop_name = node_prop[0];
      var prop_nicename = node_prop[2];
      var elem_val = "";
      if (cur_elem[prop_name] !== undefined) {
        elem_val = cur_elem[prop_name];
      }
      var new_disp_elem = document.createElement("pre");
      new_disp_elem.innerHTML = prop_nicename + ": " + elem_val;
      new_node_disp.appendChild(new_disp_elem);
    }

    disp_area.appendChild(new_node_disp);
  }
}

function update_link_list() {
  // TODO
}

function link_node() {
  var primary_sel = get_selected_node();
  var secondy_sel = get_secondary_selected_node();

  if (primary_sel === secondy_sel) {
    alert("Primary and secondary selection are the same!");
    return null;
  } else if (primary_sel === null || secondy_sel === null) {
    alert("Two selections required (hold ctrl to make second).");
    return null;
  }

  var primary_sel_props = JSON.parse(
    primary_sel.getAttribute("node_props"));
  var secondy_sel_props = JSON.parse(
    secondy_sel.getAttribute("node_props"));
  var primary_sel_node_id = primary_sel_props[node_id_prop_name];
  var secondy_sel_node_id = secondy_sel_props[node_id_prop_name];

  var json_link = build_link_json_elem(primary_sel_node_id,
                                       secondy_sel_node_id);

  var cur_json_text = document.getElementById(json_element_id).value;
  var cur_json = JSON.parse(cur_json_text);
  //console.log(cur_json);
  cur_json["links"] = cur_json["links"].concat([json_link]);
  document.getElementById(json_element_id).value = JSON.stringify(
    cur_json, null, 2);

  update_GUI();
}

function build_form() {
    var form_div = document.getElementById(entry_form_id);

    var type_sel = document.createElement("select");
    type_sel.id = node_type_prop[1];
    var type_label = document.createElement("label");
    type_label.for = node_type_prop[1];
    type_label.innerHTML = node_type_prop[2];

    var node_type_keys = Object.keys(node_type_opts);
    for(var key_ind = 0; key_ind < node_type_keys.length; key_ind += 1) {
        var key = node_type_keys[key_ind];
        var val = node_type_opts[key];
        var opt = document.createElement("option");
        opt.value = key;
        opt.innerHTML = val;
        type_sel.appendChild(opt);
    }

    var div_sec = document.createElement("div");
    div_sec.appendChild(type_label);
    div_sec.appendChild(type_sel);
    form_div.appendChild(div_sec);

    for(var prop_ind = 0; prop_ind < node_props.length; prop_ind += 1) {
        div_sec = document.createElement("div");
        var prop = node_props[prop_ind];
        var elem = null;
        if( node_textareas.includes(prop[1]) ) {
            elem = document.createElement("textarea");
            elem.cols = "80";
            elem.rows = "20";
        } else {
            elem = document.createElement("input");
            elem.type = "text";
        }
        elem.id = prop[1];
        var label = document.createElement("label");
        label.for = prop[1];
        label.innerHTML = prop[2];
        div_sec.appendChild(label);
        div_sec.appendChild(elem);
        form_div.appendChild(div_sec);
    }

    /*
    var add_button = document.createElement("input");
    add_button.type = "button";
    add_button.onclick = add_node;
    add_button.value = "Add Node";
    */

    var add_button_2 = document.createElement("input");
    add_button_2.type = "button";
    add_button_2.onclick = add_node_graph_ver;
    add_button_2.value = "Add Node";

    div_sec = document.createElement("div");
    //div_sec.appendChild(add_button);
    div_sec.appendChild(add_button_2);
    form_div.appendChild(div_sec);
}

function after_load() {
    build_form();
}



// Cytoscape specific stuff
var global_cy = null;
var n_pref = "node_id_";
var l_pref = "link_id_";
var layout_opts = {
        "cose": {
                name: "cose",
                fit: true,
                padding: 20,
            },
        "breadthfirst": {
                name: "breadthfirst",
                roots: "[id = \"" + n_pref + "0" + "\"]",
            },
    }

function get_selected_nodes_and_edges() {
    selected = global_cy.$(":selected");
    return selected;
}

function get_selected_nodes() {
    var all_seld = get_selected_nodes_and_edges();
    var nodes_seld = [];
    for( var ind = 0; ind < all_seld.length; ind += 1 ) {
        if( all_seld[ind].is("node") ) {
            nodes_seld.push(all_seld[ind]);
        }
    }
    return nodes_seld;
}

function get_selected_edges() {
    var all_seld = get_selected_nodes_and_edges();
    var edges_seld = [];
    for( var ind = 0; ind < all_seld.length; ind += 1 ) {
        if( all_seld[ind].is("edge") ) {
            edges_seld.push(all_seld[ind]);
        }
    }
    return edges_seld;
}

function node_select(in_event) {
    console.log("link");
    console.log(in_event);
    console.log(in_event.target.id());
}

function hierarchical_layout(root_node_id) {
    var breadthfirst_root = layout_opts["breadthfirst"];
    breadthfirst_root["roots"] = "[id = \"" + root_node_id + "\"]";
    global_cy.layout(breadthfirst_root).run();
}

function set_hierarchical() {
    var selected_nodes = get_selected_nodes();
    if(selected_nodes.length != 1) {
        alert("One node, one node only.");
        return;
    }
    hierarchical_layout(selected_nodes[0].id());
}

function delete_link() {
    var selected_links = get_selected_edges();
    if(selected_links.length != 1) {
        alert("One edge, one edge only.");
        return;
    }
    var id_to_del = selected_links[0].scratch()["link_id"];
    delete_link_with_id(id_to_del);
}

function delete_node() {
    var selected_nodes = get_selected_nodes();
    if(selected_nodes.length != 1) {
        alert("One node, one node only.");
        return;
    }
    var id_to_del = selected_nodes[0].scratch()["node_id"];
    delete_node_with_id(id_to_del);
}

function set_elastic_spring() {
    global_cy.layout(layout_opts["cose"]).run();
}

function link_select(in_event) {
    console.log("link");
    console.log(in_event);
    console.log(in_event.target.id());
}

function refresh_graph_from_json() {
    var cur_json_text = document.getElementById(json_element_id).value;
    var cur_json = JSON.parse(cur_json_text);

    var nodes = [];
    // Add the nodes
    for(var node_ind = 0; node_ind < cur_json["nodes"].length; node_ind += 1) {
        nodes.push(build_cy_node(cur_json["nodes"][node_ind]));
    }
    // Add the links (edges)
    var edges = [];
    for(var link_ind = 0; link_ind < cur_json["links"].length; link_ind += 1) {
        var cy_edge = build_cy_edge(cur_json["links"][link_ind], nodes);
        if(cy_edge !== null) {
            edges.push(cy_edge);
        }
    }
    var elements = nodes.concat(edges);
    var edge_label_style = "data(" + link_prop_name[0] + ")";

    global_cy = cytoscape({
        container: document.getElementById(cy_div_id),
        elements: elements,
        layout: layout_opts["cose"],
        style: [
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
                        "background-color": selected_node_color,
                        "line-color": selected_link_color,
                    }
            },
            {
                selector: "edge",
                style: {
                        "label": edge_label_style,
                        "width": 2,
                        "curve-style": "straight",
                        "target-arrow-shape": "triangle",
                        "compound-sizing-wrt-labels": "include",
                        "color": "white",
                        "text-outline-color": "black",
                        "text-outline-opacity": ".8",
                        "text-outline-width": "1",
                    }
            }]
    });

    global_cy.on("select", "node", node_select)
    global_cy.on("select", "edge", link_select)
}

function produce_json_from_graph() {
    var all_data = {"nodes": [], "links": []};

    for(var node_ind = 0; node_ind < global_cy.nodes().length; node_ind += 1) {
        all_data["nodes"].push(global_cy.nodes()[node_ind].scratch());
    }

    for(var link_ind = 0; link_ind < global_cy.edges().length; link_ind += 1) {
        all_data["links"].push(global_cy.edges()[link_ind].scratch());
    }


    document.getElementById(json_element_id).value = JSON.stringify(
        all_data, null, 2);
}
