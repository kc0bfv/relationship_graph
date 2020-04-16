all: index.html

favicon.html: favicon.png
	(echo -n '<link rel="icon" type="image/png" href="data:image/png;base64,'; base64 -w 0 favicon.png; echo '">') > $@

index.html: index_top.html favicon.html index_after_favicon.html cytoscape.min.js relationship_graph.js index_mid.html relationship_graph.css opt_common.css index_bottom.html
	cat $^ > $@
