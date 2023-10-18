// Use https://peggyjs.org/online.html to recompile this if needed.
// The resulting parser.js file with compiled parser then belongs into
// this directory.

NullableType
	= nullable:"?" type:GenericType { type.nullable = nullable === "?"; return type }
    / type:UnionType { return type.length > 1 ? { union: [...type] } : type[0]	}

GenericType
	= type:Name template:Template? list:"[]"?
    	{ return {type: type, template: template || null, list: list === "[]" } }

Template
	= "<" Ws type:NullableType |.., Ws "," Ws| Ws ">" { return type }

UnionType
	= Ws type:GenericType |.., Ws "|" Ws| Ws
    	 {
         	return [...type]
         }

Name
	= $("\\"? (([a-zA-Z_][a-zA-Z0-9_]*) Name?))

Ws = [ \t]?
