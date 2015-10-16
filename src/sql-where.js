Array.prototype.where = Array.prototype.where || function (str) {
    "use strict";
    /*
     * Get precedence of operator op
     *
     */
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
	    case "!=":
                return 7;
            case "NOT":
	    case "!":
                return 6;
            case "AND":
            case "OR":
                return 5;
            case "NOTIN":
            case "IN":
            case "NOTBETWEEN":
            case "BETWEEN": return 4;
            default:
                return 0;
        }
    };

    /**
     * Replaces all IDs with corresponding values from the record
     * objArray
     */

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

    /*
     * Evaluate IN clause or NOT IN clause
     *
     */

    var computeInClause= function(oper, arr, flag) {
	var len = arr.length,i=0,result = false;

	if (flag && flag === "IN")
	{
	    result = true;

	}


	for (;i < len;i++)
	{

	    if (arr[i].value === oper.value)
	    {
		return {type:oper.type,value:result};
	    }
	}

	return {type:oper.type,value:!result};

    };



    /*
     * Perform expression evaluation
     */
    var compute = function (a, op, b, c) {
        var t = a.type;
        var val1, val2 = "",val3= "";

        val1 = a.value;

	if (b)
	{ val2 = b.value; }

	if (c)
	{ val3 = c.value; }

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
	    case "!=":
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
	    case "!":
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
	    case "BETWEEN": 
		return {
		    type:t,
		    value: val1 >= val2 && val1 <= val3
		};
            case "NOTBETWEEN":
		return {
		    type:t,
		    value: val1 < val2 || val1 > val3
		};

        }
    };

    var evalRPN = function (tokens) {
        var token, stk = [],op0,
            op1, op2, output, opndList=[];
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
                if (token.value == "NOT" || token.value == "!")
		{
                    stk.push(compute(op2, token));
                }
		else
		{
                    op1 = stk.pop();
                    stk.push(compute(op1, token, op2));
                }
            }
	    else if (token.type == "FUNC")
	    {
		if (token.value == "BETWEEN" || 
		    token.value == "NOTBETWEEN")
		{
		    op2 = stk.pop();
		    if (op2.type == "NUM" && op2.value == 2)
		    {
			op2 = stk.pop();
			op1 = stk.pop();
		        op0 = stk.pop();
		        stk.push(compute(op0, token, op1, op2));
		    }
		    else
		    {
			throw Error("BETWEEN syntax error");
		    }

		}
		else if (token.value == "IN" || 
			 token.value == "NOTIN")
		{
		    opndList = [];
		    op0 = stk.pop();

		    while (op0.value > 0)
		    {
			op1 = stk.pop();
			opndList.push(op1);
			op0.value--;
		    }


		    if (opndList.length > 1)
		    {
			op1 = stk.pop();

		        stk.push(computeInClause(op1, opndList, token.value));
		    }
		    else
		    {
			throw Error("IN syntax error");
		    }
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
            token,optoken,tokensLen=tokens.length,
	    opstackLen =0, funcsStack = [],tempFunc ={};



        while (tokensLen > 0)
	{

            token = tokens.shift();
	    tokensLen--;

            opstackLen = opstack.length;


            if (token.type == "STR" || token.type == "NUM" || token.type == "ID")
	    {
                rpn.push(token);

            }
	    else if (token.type == "OP")
	    {
		/*
		 */
		if (token.value == ",")
		{

		    while (opstack.length > 0)
		    {
			optoken = opstack.pop();
			if (optoken.value == "(")
			{
			    opstack.push(optoken);
			    break;
			}
			rpn.push(optoken);

		    } 

		    if (funcsStack.length > 0)
		    {
			funcsStack[funcsStack.length - 1].argCount++;
		    }

		} 


                else if (0 === opstack.length)
		{

                    opstack.push(token);

                }
		else

		{
		    if (token.value == ")")
		    {

                        while (opstack.length > 0)
			{
                            optoken = opstack.pop();
			    if (optoken.value == "(")
			    {
				break;
			    }
                            rpn.push(optoken);

                        } 

			if (funcsStack.length > 0 && opstack.length == funcsStack[funcsStack.length - 1].pos)
			{
			    tempFunc = funcsStack.pop();
			    rpn.push({type:"NUM",value:tempFunc.argCount + 1});
			    rpn.push({type:"FUNC",value:tempFunc.func});

			}

                    }
		    else if (token.value == "(")
		    {

                        opstack.push(token);

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
	    else if (token.type == "FUNC")
	    {
		funcsStack.push(
		    {
			func:token.value,
			pos:opstack.length,
			argCount:0
		    });
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
            i = 0,len,tempString ="",upperString="";
        var OpsList = ["+", "-", "*", "/", "%", "(", ")", ">=", "<=", "<>"];
        var Keywords = ["AND", "OR", "NOT","LIKE"];
	var Funcs = ["IN", "BETWEEN"];

	var checkNotClause = function(word) {
	    var  len = tokens.length;
	    if (word === "BETWEEN" || word === "IN")
	    {
		if (len > 1 && tokens[len - 2].value === "NOT")
		{
		    tokens.pop();
		    tokens.pop();
		    tokens.push({
				    type: "FUNC",
				    value: "NOT" + word
				});
		}
	    }
	};


	// Convert BETWEEN clause to FUNC expression, by changing AND to comma
	str = str.replace(/(BETWEEN\s*\(\s*\S+)(\s+AND\s+)(\S+\s*\))/gi, "$1,$2");

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

		upperString = tempString.toUpperCase();

                if (Keywords.indexOf(upperString) > -1)
		{
                    tokens.push({
				    type: "OP",
				    value: upperString
				});
                } 
		else if (Funcs.indexOf(upperString) > -1)
		{
		    tokens.push({
				    type: "FUNC",
				    value: upperString
				});

		    checkNotClause(upperString);
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
	    else if ("+-*/%><=(),!".indexOf(str[i]) > -1)
	    {

                tempString = str[i];
                i++;
                if (str[i])
		{
                    if ((tempString == "<" && str[i] == "=")
			|| (tempString == ">" && str[i] == "=")
			|| (tempString == "<" && str[i] == ">")
			|| (tempString == "!" && str[i] == "="))
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




Array.prototype.select = Array.prototype.select || function (str) {
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

	    if (typeof(thisValue) === "undefined")
	    {

		throw Error("Invalid property " + thisField);
	    }
	    else
	    {
		outputRecord[thisField] = thisValue;
	    }

        }
        outputArray.push(outputRecord);
    }

    return outputArray;

};


Array.prototype.orderBy = Array.prototype.orderBy || function (str) {
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

	    if (isNaN(Date.parse(fieldValue)))
	    {
		cmpr = dateCompare;
	    }
	    else
	    {

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
            return (date1 < date2 ?-1: 1) * order;
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


Array.prototype.joinOn = Array.prototype.joinOn || function(str,arr) {
    "use strict";
    
    var mergeRecords = function(rec1,rec2) {
	var outRec = rec1,prop;
	
	for(prop in rec2) {
	    if(rec2.hasOwnProperty(prop)) {
		if(!rec1[prop]) {
		    outRec[prop] = rec2[prop];
		} 
	    }
	}
	
	
	return outRec;
	
    };

    var join = function(firstArray,secondArray,str) {
	
	var outputArray =[],outRow = {};
	var joinFields = str.replace(/\s*/, "").split("=");
	var firstField="",secondField="";
	var t1len =firstArray.length,t2len = secondArray.length,i=0,j=0;
	var faRecord ={}, saRecord={};

	if (joinFields.length === 1)
	{
	    joinFields.push(joinFields[0]);
	}

	firstField = joinFields[0];
	secondField = joinFields[1];

	for (i = 0;i < t1len;i++)
	{
	    faRecord =firstArray[i];
	    for (j = 0;j < t2len;j++)
	    {
		saRecord = secondArray[j];
		if (faRecord[firstField] === saRecord[secondField])
		{
		    outRow = mergeRecords(faRecord, saRecord);
		    outputArray.push(outRow);

		}
	    }
	}
	
	return outputArray;
    };

    return join(this,arr,str);

};
