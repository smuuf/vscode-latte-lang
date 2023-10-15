// Use https://peggyjs.org/online.html to recompile this if needed.
// The resulting parser.js file with compiled parser then belongs into
// this directory.

Type
    = type:Name template:Template? Ws "[]" union:Union?
	{ return (union)
		? {union: [{type, templateArgs: template, list: true}, union]}
		: {type, templateArgs: template, list: true, union: union}
	}
	/ type:Name template:Template? union:Union?
	{ return (union)
		? {union: [{type, templateArgs: template}, union]}
		: {type, templateArgs: template, list: false, union: union}
	}

Template
	= "<" Ws @Type |.., Ws "," Ws| Ws ">"

Union
	= Ws "|" Ws @Type

Name
	= $("\\"? (([a-zA-Z_][a-zA-Z0-9_]*) Name?))

Ws = [ \t]?