index.html: index_top.html cytoscape.min.js relationship_graph.js index_mid.html relationship_graph.css index_bottom.html
	(cat index_top.html; cat cytoscape.min.js; cat relationship_graph.js; cat index_mid.html; cat relationship_graph.css; cat index_bottom.html;) > $@
