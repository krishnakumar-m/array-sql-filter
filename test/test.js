
var cars = [
    {
	make:1989,
	maker:"Chevrolet",
	model:"Camarro",
	regDate:"Sep 30,2014"
    },
    {
	make:2001,
	maker:"Volkswagen",
	model:"Passat",
	regDate:"May 12,2013"
    },
    {
	make:1998,
	maker:"Ford",
	model:"GT",
	regDate:"Dec 21, 2009"
    },
    {
	make:1995,
	maker:"Dodge",
	model:"Charger",
	regDate:"Dec 7, 2013"
    },
    {
	make:1989,
	maker:"Dodge",
	model:"Challenger",
	regDate:"Nov 14, 2012"
    },
    {
	make:2003,
	maker:"Shelby",
	model:"Mustang",
	regDate:"Nov 5, 2007"
    }
];


var makeYear =[
{
    make:1989,
    desc :"Pre Release"
},
{
    make:1995,
    desc :"Post Release"
},{
    make:2003,
    desc :""
},{
    make:2001,
    desc :""
},
{
    make:1998,
    desc :""
}
];


function runQueries() {


    var stmts=[
	{ query:"make between ( 1986,1990) or make between (1995,2000)"},
	{ query:"model like 'C%'"},
	{query:"maker='Dodge' or make>1990",selectClause:"maker,model",orderByClause:"maker"},
	{ query:"!(maker = 'Ford' or model ='Camarro')"},
	{orderByClause:"maker desc",selectClause:"make,model"}
	];

    var i,len=stmts.length,results,stmt,str="",resultDiv = document.getElementById("result");

    resultDiv.innerHTML = "<h5>Original Data</h5>"+printObj(cars)+"<br>";
    
    
    for (i = 0;i < len;i++)
    {
        stmt = stmts[i];
	str = "<p>";

	results = cars;
	if (stmt.query)
	{
	    str += "Condition : <b> " + stmt.query + "</b><br>";
	    results = results.where(stmt.query);
	}
	
	
        if (stmt.orderByClause)
	{
	    str += "Order By : <b> " + stmt.orderByClause + "</b><br>";
	    results = results.orderBy(stmt.orderByClause);
	}

	if (stmt.selectClause)
	{
	    str += "Columns : <b> " + stmt.selectClause + "</b><br>";
	    results = results.select(stmt.selectClause);
	}
	
	str += "<br>" + printObj(results);

	str += "</p>";

	resultDiv.innerHTML += str;
    }
    
    
    resultDiv.innerHTML +="Join Example : "+(JSON.stringify(cars.joinOn("make",makeYear)));
}
