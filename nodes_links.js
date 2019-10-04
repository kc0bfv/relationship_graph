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

function edit_sel_node() {
  // Set the edit fields with the values of the selected node
  // Warn if multiple are selected
  var sel_node = get_selected_node();
  if (sel_node === null) {
    alert("No selected node found.  Failling operation.")
    return;
  }

  console.log(sel_node.node_props);
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
    refresh_graph();
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
    console.log(new_node_id);
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

global_cy = null;
function refresh_graph() {
    var n_pref = "node_id_";
    var l_pref = "link_id_";

    var cur_json_text = document.getElementById(json_element_id).value;
    var cur_json = JSON.parse(cur_json_text);

    var elements = [];
    for(var node_ind = 0; node_ind < cur_json["nodes"].length; node_ind += 1) {
        var cur_node = cur_json["nodes"][node_ind];
        var fixed_elem_data = cur_node;
        fixed_elem_data["id"] = n_pref + fixed_elem_data[node_id_prop_name];

        var node_label = "";
        for(var node_prop_ind = 0; node_prop_ind < cy_node_display.length;
                node_prop_ind += 1) {
            if( node_prop_ind > 0 ) {
                node_label += "\n";
            }
            lookup = cur_node[cy_node_display[node_prop_ind]];
            if( cy_node_display[node_prop_ind] == node_type_prop[0] ) {
                lookup = node_type_opts[
                        cur_node[cy_node_display[node_prop_ind]]
                    ];
            }
            node_label += lookup + " ";
        }

        fixed_elem_data["label"] = node_label;

        var cur_elem = { 
            group: "nodes",
            data: fixed_elem_data,
            grabbable: true
        };
        elements.push(cur_elem);
    }
    for(var link_ind = 0; link_ind < cur_json["links"].length; link_ind += 1) {
        var cur_link = cur_json["links"][link_ind];
        var fixed_elem_data = cur_link;
        fixed_elem_data["id"] = l_pref + fixed_elem_data[link_id_prop_name];
        fixed_elem_data["source"] = n_pref + fixed_elem_data["node_1_id"];
        fixed_elem_data["target"] = n_pref + fixed_elem_data["node_2_id"];
        var cur_elem = { 
            group: "edges",
            data: fixed_elem_data,
            grabbable: true
        };
        elements.push(cur_elem);
    }
    
    var edge_label_style = "data(" + link_prop_name[0] + ")";

    global_cy = cytoscape({
        container: document.getElementById(cy_div_id),
        elements: elements,
        layout: {
                name: "cose",
                fit: true,
                padding: 20,

            },
        style: [{
                selector: "node",
                style: {"label": "data(label)"}
            },
            {
                selector: "edge",
                style: {
                        "label": edge_label_style,
                        "width": 2,
                        "curve-style": "straight",
                        "target-arrow-shape": "triangle"
                    }
            }]
    });
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

    var add_button = document.createElement("input");
    add_button.type = "button";
    add_button.onClick = "add_node()";
    add_button.value = "Add Node";
    div_sec = document.createElement("div");
    div_sec.appendChild(add_button);
    form_div.appendChild(div_sec);
}

function after_load() {
    build_form();
}
