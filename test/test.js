
var cars = [
    {
	make:1989,
	maker:"Chevrolet",
	model:"Camarro"
    },
    {
	make:2001,
	maker:"Volkswagen",
	model:"Passat"
    },
    {
	make:1998,
	maker:"Ford",
	model:"GT"
    },
    {
	make:1995,
	maker:"Dodge",
	model:"Charger"
    },
    {
	make:1989,
	maker:"Dodge",
	model:"Challenger"
    },
    {
	make:2003,
	maker:"Shelby",
	model:"Mustang"
    }
];


function runQueries() {


    var stmts=[
	{ query:"make between (1990 and 2000)",orderByClause:"make"},
	{ query:"model like 'C%'"},
	{query:"make>=1990 and make<=2000"},
	{query:"maker='Dodge' or make>1990",selectClause:"maker,model",orderByClause:"maker"},
	{ query:"maker <> 'Ford' and model <>'Camarro'"},
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
}
