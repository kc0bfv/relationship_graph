BUILDDIR := .builddir
BUILDDIRDEP := ${BUILDDIR}/.dirstamp
DEPSDIR := dependencies

all: index.html

${BUILDDIRDEP}:
	mkdir -p ${BUILDDIR} && touch $@

${BUILDDIR}/favicon.html: ${BUILDDIRDEP} ${DEPSDIR}/favicon.png
	(echo -n '<link rel="icon" type="image/png" href="data:image/png;base64,'; base64 -w 0 ${DEPSDIR}/favicon.png; echo '">') > $@

${BUILDDIR}/js_parts.html: ${BUILDDIRDEP} ${DEPSDIR}/cytoscape.min.js relationship_graph.js
	echo '<script>' > $@
	cat ${DEPSDIR}/cytoscape.min.js >> $@
	echo '' >> $@
	cat relationship_graph.js >> $@
	echo '</script>' >> $@

${BUILDDIR}/css_parts.html: ${BUILDDIRDEP} ${DEPSDIR}/cytoscape.css relationship_graph.css
	echo '<style>' > $@
	cat ${DEPSDIR}/cytoscape.css >> $@
	echo '' >> $@
	cat relationship_graph.css >> $@
	echo '</style>' >> $@

${BUILDDIR}/head.html: ${BUILDDIR}/css_parts.html ${BUILDDIR}/js_parts.html ${BUILDDIR}/favicon.html
	echo '<!doctype html>' > $@
	echo '<html>' >> $@
	echo '<head>' >> $@
	cat ${BUILDDIR}/favicon.html >> $@
	cat ${BUILDDIR}/js_parts.html >> $@
	cat ${BUILDDIR}/css_parts.html >> $@
	echo '</head>' >> $@
	
${BUILDDIR}/body.html: ${BUILDDIRDEP} body_template.html default_json.json
	JSON_OUT_AREA=$$(cat default_json.json) envsubst < body_template.html > $@

index.html: ${BUILDDIR}/head.html ${BUILDDIR}/body.html
	cat $^ > $@
	echo '</html>' >> $@

server: index.html
	python3 -m http.server 8000

autorebuild:
	watch -n 1 make

clean:
	rm -rf ${BUILDDIR}

.PHONY: clean server autorebuild
