BUILDDIR := .builddir
BUILDDIRDEP := ${BUILDDIR}/.dirstamp
DEPSDIR := dependencies

all: index.html demos/research_org_chart.html demos/acq_training_rqmts.html demos/call_tree_demo.html demos/vacation_plan.html

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
	echo '<meta charset="utf-8">' >> $@
	echo '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">' >> $@
	cat ${BUILDDIR}/favicon.html >> $@
	cat ${BUILDDIR}/js_parts.html >> $@
	cat ${BUILDDIR}/css_parts.html >> $@
	echo '</head>' >> $@
	
${BUILDDIR}/res_body.html: ${BUILDDIRDEP} body_template.html json_examples/research_org_chart.json
	JSON_OUT_AREA=$$(cat json_examples/research_org_chart.json) envsubst < body_template.html > $@

${BUILDDIR}/acq_body.html: ${BUILDDIRDEP} body_template.html json_examples/acq_training.json
	JSON_OUT_AREA=$$(cat json_examples/acq_training.json) envsubst < body_template.html > $@

${BUILDDIR}/call_body.html: ${BUILDDIRDEP} body_template.html json_examples/call_tree.json
	JSON_OUT_AREA=$$(cat json_examples/call_tree.json) envsubst < body_template.html > $@

${BUILDDIR}/vaca_body.html: ${BUILDDIRDEP} body_template.html json_examples/vacation_plan.json
	JSON_OUT_AREA=$$(cat json_examples/vacation_plan.json) envsubst < body_template.html > $@

demos/research_org_chart.html: ${BUILDDIR}/head.html ${BUILDDIR}/res_body.html
	cat $^ > $@
	echo '</html>' >> $@

demos/acq_training_rqmts.html: ${BUILDDIR}/head.html ${BUILDDIR}/acq_body.html
	cat $^ > $@
	echo '</html>' >> $@

demos/call_tree_demo.html: ${BUILDDIR}/head.html ${BUILDDIR}/call_body.html
	cat $^ > $@
	echo '</html>' >> $@

demos/vacation_plan.html: ${BUILDDIR}/head.html ${BUILDDIR}/vaca_body.html
	cat $^ > $@
	echo '</html>' >> $@

index.html: demos/research_org_chart.html
	cp $^ $@

server: index.html
	python3 -m http.server 8000

autorebuild:
	watch -n 2 make

clean:
	rm -rf ${BUILDDIR}
	rm demos/* index.html

.PHONY: clean server autorebuild
