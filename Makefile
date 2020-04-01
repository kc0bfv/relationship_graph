index.html: index_top.html cytoscape.min.js relationship_graph.js index_mid.html relationship_graph.css opt_common.css index_bottom.html
	cat $^ > $@
