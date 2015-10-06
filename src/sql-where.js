

Array.prototype.where = function(str) {
    return where(this,str);
};

var employee =  [
	    {
		empid:100,
		ename:"Chuck"
	    },
	    {
		empid:101,
		ename:"Rick"
	    },
	    {
		empid:99,
		ename:"George"
	    }
	];

function runQuery() {
 
    alert(printObj(employee.where(" not(not empid > 100 or empid < 100)")));
}


function getPreced(op) {
    switch (op)
    {
	/*case "(": 
	case ")": return 15;*/
	case "/":
	case "*":
	case "%": return 9;
	case "+": 
	case "-": return 8;
	case ">":
	case "<":
	case "<=" :
	case ">=" :
	case "=":
        case "<>" : return 7;
	case "NOT" : return 6;
	case "AND" : 
	case "OR" : return 5;
	default : return 0;
    }
}


function numCompare(prop, order) {

    return function(a, b) {

	return (a[prop] - b[prop]) * order;
    };
}

function strCompare(prop, order) {

    return function(a, b) {

	return (a[prop].localeCompare(b[prop])) * order;
    };
}


function replaceIdsWithValues(tokens, objArray) {
    var i,l=tokens.length,token, newToken, idValue,output =[];
    for (i = 0;i < l;i++)
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
		switch(typeof(idValue)) {
		    case "string": newToken["type"] = "STR";
		    case "number": newToken["type"] = "NUM";
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
}

function  where(objArray, expr) {

    var newTokens, output=[], tokens = tokenize(expr),len= objArray.length;
    tokens = buildRPN(tokens);

    for(i=0;i<len;i++) {
        newTokens = replaceIdsWithValues(tokens,objArray[i]);
	
	if(evalRPN(newTokens).value) {
	    output.push(objArray[i]);
	}
    }
    
    return output;

}


function printObj(o) {

    var i,len;
    if (o == null)return null;
    var arr =[];

    if (Array.isArray(o))
    {
	len = o.length;
	for(i=0;i<len;i++) {
	    arr.push(printObj(o[i]));
	}
	return "[" + arr.join(",") + "]";
    }

    switch (typeof(o))
    {
	case "string" : return "\"" + o + "\"";

	case "object" : arr = [];
	    for(prop in o) {
		arr.push(prop + ":" + printObj(o[prop]));
	    }
	    return "{" + arr.join(",") + "}";
	default: return o;

    }


}

function compute(a, op, b) {
    var t = a.type;
    var val1,val2="";
    val1 = a.value; 
    if (b)
    {
	val2 = b.value;
    }

    

    switch (op.value)
    {
	case "+": return {type:t,value:val1 + val2};
	case "-": return {type:t,value:val1 - val2};
	case "*": return {type:t,value:val1 * val2};
	case "/": return {type:t,value:val1 / val2};
	case ">": return {type:t,value:val1 > val2};
	case "<": return {type:t,value:val1 < val2};
	case ">=": return {type:t,value:val1 >= val2};
	case "<=": return {type:t,value:val1 <= val2};
	case "=": return {type:t,value:val1 == val2};
	case "AND": return {type:t,value:val1 && val2};
	case "OR": return {type:t,value:val1 || val2};
	case "NOT": return {type:t,value:!val1};
    }
}

function evalRPN(tokens) {
    var token,stk =[],op1,op2,output;
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
		stk.push(compute(op2,  token));
	    }
	    else
	    {
		op1 = stk.pop();
		stk.push(compute(op1,  token, op2));
	    }
	}


    }

    if (stk.length != 1)
    {
	throw Error("Eval Syntax error");
    }

    output = stk.pop();
    
    
    
    return output;
}


function buildRPN(tokens) {
    var rpn =[], opstack=[],token;
    while (tokens.length > 0)
    {

	token = tokens.shift();
	
	
	
	if (token.type == "STR" || token.type == "NUM" || token.type == "ID")
	{
	    rpn.push(token);

	}
	else if (token.type == "OP")
	{

	    if (opstack.length == 0 || opstack[opstack.length - 1].value == "(")
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
                        /*alert("RPN"+printObj(rpn));
			alert("opstack"+printObj(opstack));*/
		    }while(optoken.value != "(" && opstack.length > 0);
		   var k= rpn.pop();
		   
		}
		else if (token.value == "(")
		{

		    opstack.push(token);

		}
		else
		{


		    while (opstack.length > 0 
		            && 
			    getPreced(opstack[opstack.length - 1].value) >= getPreced(token.value))
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
}


function tokenize(str) {
    var tokens = [], token = {},i=0;
    var OpsList = ["+","-","*","/","%","(",")",">=","<=","<>"];
    var Keywords = ["AND","OR", "NOT", "IN","BETWEEN"];
    str = str.replace("\r\n", " ");//.replace(/\s+/, " ");
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
		tempString += str[i];i++;
	    }while(str[i] && /[0-9\.]/.test(str[i]));

	    tokens.push({type : "NUM",value:parseFloat(tempString)});

	}

	else if (/[a-zA-Z_]/.test(str[i]))
	{
	    do {
		tempString += str[i];i++;
	    }while(str[i] && /[0-9a-zA-Z_]/.test(str[i]));

	    if (Keywords.indexOf(tempString.toUpperCase()) > -1)
	    {
		tokens.push({type : "OP",value:tempString.toUpperCase()});
	    }
	    else
	    {

		tokens.push({type : "ID",value:tempString});
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
	    tokens.push({type : "STR",value:tempString});
	}

	else if ("+-*/%><=(),".indexOf(str[i]) > -1)
	{

	    tempString = str[i];
	    i++;
	    if (str[i])
	    {
		if ((tempString == "<" && str[i] == "=")
		    || (tempString == ">" && str[i] == "=")
		    || (tempString == "<" && str[i] == ">"))
		{
		    tempString += str[i];
		    i++;
		}
	    }

	    tokens.push({type : "OP",value:tempString});
	}

	else
	{
	    throw Error("Character unrecognised");
	}


    }
    
    return tokens;

}

