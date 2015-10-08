Array.prototype.where = function (str) {
    "use strict";
    var getPreced = function (op) {
        switch (op)
	{

            case "/":
            case "*":
            case "%":
                return 10;
            case "+":
            case "-":
                return 9;
	    case "LIKE":return 8;
            case ">":
            case "<":
            case "<=":
            case ">=":
            case "=":
            case "<>":
                return 7;
            case "NOT":
                return 6;
            case "AND":
            case "OR":
                return 5;
            case "BETWEEN": return 4;
            default:
                return 0;
        }
    };




    var replaceIdsWithValues = function (tokens, objArray) {
        var i, l = tokens.length,
            token, newToken, idValue, output = [];
        for (i = 0; i < l; i++)
	{
            token = tokens[i];
            newToken = {};
            newToken["value"] = token.value;

            if ("ID" === token.type)
	    {
                idValue = objArray[token.value];
                if (idValue)
		{
                    newToken["value"] = idValue;
                    switch (typeof (idValue))
		    {
                        case "string":
                            newToken["type"] = "STR";
                            break;
                        case "number":
                            newToken["type"] = "NUM";
                            break;
                    }

                }
		else
		{
                    throw Error("Undefined variable");
                }
            }
	    else
	    {
                newToken["value"] = token.value;
                newToken["type"] = token.type;
            }
            output.push(newToken);
        }

        return output;
    };

   var where = function (objArray, expr) {

        var newTokens, output = [],
            tokens = tokenize(expr),
            len = objArray.length,i;
	    
        tokens = buildRPN(tokens);

        for (i = 0; i < len; i++)
	{
            newTokens = replaceIdsWithValues(tokens, objArray[i]);

            if (evalRPN(newTokens).value)
	    {
                output.push(objArray[i]);
            }
        }

        return output;

    };




    var compute = function (a, op, b, c) {
        var t = a.type;
        var val1, val2 = "",val3= "";
        val1 = a.value;
        if (b)
	{
            val2 = b.value;
        }

	if (c)
	{
	    val3 = c.value;
	}


        switch (op.value)
	{
            case "+":
                return {
                    type: t,
                    value: val1 + val2
                };
            case "-":
                return {
                    type: t,
                    value: val1 - val2
                };
            case "*":
                return {
                    type: t,
                    value: val1 * val2
                };
            case "/":
                return {
                    type: t,
                    value: val1 / val2
                };
            case ">":
                return {
                    type: t,
                    value: val1 > val2
                };
            case "<":
                return {
                    type: t,
                    value: val1 < val2
                };
            case ">=":
                return {
                    type: t,
                    value: val1 >= val2
                };
            case "<=":
                return {
                    type: t,
                    value: val1 <= val2
                };
            case "=":
                return {
                    type: t,
                    value: val1 == val2
                };
            case "<>":
                return {
                    type: t,
                    value: val1 != val2
                };
            case "AND":
                return {
                    type: t,
                    value: val1 && val2
                };
            case "OR":
                return {
                    type: t,
                    value: val1 || val2
                };
            case "NOT":
                return {
                    type: t,
                    value: !val1
                };
	    case "LIKE":
	        val2 = val2.replace(/%/g, ".*");
	        var patt = new RegExp(val2);
                return {
                    type: t,
                    value: patt.test(val1)
                };
	    case "BETWEEN": return {type:t,
		    value: val1 >= val2 && val1 <= val3};
        }
    };

    var evalRPN = function (tokens) {
        var token, stk = [],op0,
            op1, op2, output;
        while (tokens.length > 0)
	{

            token = tokens.shift();

            if (token.type == "STR" || token.type == "NUM" || token.type == "ID")
	    {
                stk.push(token);
            }
	    else if (token.type == "OP")
	    {
                op2 = stk.pop();
                if (token.value == "NOT")
		{
                    stk.push(compute(op2, token));
                }
		else if (token.value == "BETWEEN")
		{
		    op1 = stk.pop();
		    op0 = stk.pop();

		    stk.push(compute(op0, token, op1, op2));
		}
		else
		{
                    op1 = stk.pop();
                    stk.push(compute(op1, token, op2));
                }
            }


        }

        if (stk.length != 1)
	{
            throw Error("Eval Syntax error");
        }

        output = stk.pop();

        return output;
    };


    var buildRPN = function (tokens) {
        var rpn = [],
            opstack = [],
            token,optoken;

	var isBetween = false, skipNextStartBrace = false;

        while (tokens.length > 0)
	{

            token = tokens.shift();

	    if (token.value === "AND" &&
		opstack.length >= 1 && opstack[opstack.length - 1].value == "BETWEEN")
	    {
		continue;
	    }


            if (token.type == "STR" || token.type == "NUM" || token.type == "ID")
	    {
                rpn.push(token);

            }
	    else if (token.type == "OP")
	    {

                if (0 === opstack.length || "(" === opstack[opstack.length - 1].value)
		{

                    opstack.push(token);

                }
		else
		{
		    if (token.value == ")")
		    {

                        do {
                            optoken = opstack.pop();
                            rpn.push(optoken);

                        } while (optoken.value != "(" && opstack.length > 0);

			optoken.value == "(" && rpn.pop();

                    }
		    else if (token.value == "(")
		    {

                        opstack.push(token);

			if (opstack.length > 1 && opstack[opstack.length - 2].value == "BETWEEN")
			{opstack.pop();}
                    }
		    else
		    {

                        while (opstack.length > 0 && getPreced(opstack[opstack.length - 1].value) >= getPreced(token.value))
			{
                            rpn.push(opstack.pop());
                        }

                        opstack.push(token);
                    }
                }
            }
        }

        while (opstack.length > 0)
	{
            rpn.push(opstack.pop());
        }

        return rpn;
    };


    var tokenize = function (str) {
        var tokens = [],
            token = {}, i = 0;
        var OpsList = ["+", "-", "*", "/", "%", "(", ")", ">=", "<=", "<>"];
        var Keywords = ["AND", "OR", "NOT", "IN", "BETWEEN","LIKE"];
        str = str.replace("\r\n", " "); //.replace(/\s+/, " ");
        token["type"] = "";
        token["value"] = "";
        var tempString = "";



        while (i < str.length && str[i])
	{

            tempString = "";

            // Skip all white spaces
            while (/[\s\t\r\n]/.test(str[i])) i++;

            if (/[0-9]/.test(str[i]))
	    {
                do {
                    tempString += str[i];
                    i++;
                } while (str[i] && /[0-9\.]/.test(str[i]));

                tokens.push({
				type: "NUM",
				value: parseFloat(tempString)
			    });

            }
	    else if (/[a-zA-Z_]/.test(str[i]))
	    {
                do {
                    tempString += str[i];
                    i++;
                } while (str[i] && /[0-9a-zA-Z_]/.test(str[i]));

                if (Keywords.indexOf(tempString.toUpperCase()) > -1)
		{
                    tokens.push({
				    type: "OP",
				    value: tempString.toUpperCase()
				});
                }
		else
		{

                    tokens.push({
				    type: "ID",
				    value: tempString
				});
                }

            }
	    else if (/'/.test(str[i]))
	    {
                i++;
                while (str[i] && str[i] != "'")
		{

                    tempString += str[i];
                    i++;
                }
                i++;
                tokens.push({
				type: "STR",
				value: tempString
			    });
            }
	    else if ("+-*/%><=(),".indexOf(str[i]) > -1)
	    {

                tempString = str[i];
                i++;
                if (str[i])
		{
                    if ((tempString == "<" && str[i] == "=") || (tempString == ">" && str[i] == "=") || (tempString == "<" && str[i] == ">"))
		    {
                        tempString += str[i];
                        i++;
                    }
                }

                tokens.push({
				type: "OP",
				value: tempString
			    });
            }
	    else
	    {
                throw Error("Character unrecognised");
            }


        }

        return tokens;

    };

    return where(this, str);
};




Array.prototype.select = function (str) {
    "use strict";
    var fieldNames = str.trim().split(","),
        nRecords = this.length,
        nFields, i, outputArray = [],
        outputRecord = {}, j, thisField, thisRecord,thisValue;

    nFields = fieldNames.length;

    for (i = 0; i < nRecords; i++)
    {
        outputRecord = {};
        thisRecord = this[i];

        for (j = 0; j < nFields; j++)
	{
            thisField = fieldNames[j].trim();

	    if ("" === thisField)
	    {
		throw Error("Field list is invalid");
	    }

	    thisValue = thisRecord[thisField];

	    if (thisValue)
	    {

		outputRecord[thisField] = thisValue;
	    }
	    else
	    {
		throw Error("Invalid property " + thisField);
	    }

        }
        outputArray.push(outputRecord);
    }

    return outputArray;

};


Array.prototype.orderBy = function (str) {
    "use strict";
    var sortBy = function (objArray, str) {
        var fieldNames = str.trim().split(",");
        var  i, nFields, sortField, sortFlag,
	    sortOrder, cmpr, fields,firstRecord,fieldValue;

        nFields = fieldNames.length;
        for (i = 0; i < nFields; i++)
	{
            fields = fieldNames[i].split(/\s+/);
            sortField = fields[0];
            sortFlag = fields[1];

            if (!sortFlag || /ASC/i.test(sortFlag))
	    {
                sortOrder = 1;
            }
	    else if (/DESC/i.test(sortFlag))
	    {
                sortOrder = -1;
            }
	    else
	    {
		throw Error("Invalid sort option");
	    }

	    firstRecord = objArray[0];
	    
	    fieldValue = firstRecord[sortField];
	    
	    if(isNaN(Date.parse(fieldValue))) {
		cmpr = dateCompare;
	    } else {
	    
            switch (typeof (fieldValue))
	    {
                case "string":
                    cmpr = strCompare;
                    break;
                case "number":
                    cmpr = numCompare;
                    break;
                default:
                    cmpr = strCompare;
            }
	    }

            objArray.sort(cmpr(sortField, sortOrder));
        }

        return objArray;
    };


    
    var dateCompare = function (prop, order) {

        return function (a, b) {
            var date1 = new Date(a[prop]);
	    var date2 = new Date(b[prop]);
            return (date1 < date2?-1:1) * order;
        };
    };

    var numCompare = function (prop, order) {

        return function (a, b) {

            return (a[prop] - b[prop]) * order;
        };
    };

    var strCompare = function (prop, order) {

        return function (a, b) {

            return (a[prop].localeCompare(b[prop])) * order;
        };
    };

    return sortBy(this, str);
};



