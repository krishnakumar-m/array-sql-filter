function printObj(o) {

    var i, len,prop;
    if (o === null) return null;
    var arr = [];

    if (Array.isArray(o))
    {
        len = o.length;
        for (i = 0; i < len; i++)
	{
            arr.push(printObj(o[i]));
        }
        return "[" + arr.join(",") + "]";
    }

    switch (typeof (o))
    {
        case "string":
            return "\"" + o + "\"";

        case "object":
            arr = [];
            for (prop in o) {
		if (o.hasOwnProperty(prop))
		{
		    arr.push(prop + ":" + printObj(o[prop]));
		}
            }
            return "{" + arr.join(",") + "}";
        default:
            return o;

    }


}


