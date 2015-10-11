# array-sql-filter
Adds SQL-like query capabilities to JS Object Arrays.

Inclusion of the library adds where(), select() and orderBy() capabilities to object arrays.

1. where() - Accepts SQL query string as parameter. Simulates SQL WHERE clause.

2. select() - Simulates SQL SELECT.

3. orderBy() - Simulates SQL ORDER BY.



For testing, include [sql-where.js](https://github.com/krishnakumar-m/array-sql-filter/blob/master/src/sql-where.js) in your project

###Example
```javascript
var employee = [{
    empid: 100,
    ename: "Chuck"
}, {
    empid: 101,
    ename: "Rick"
}, {
    empid: 99,
    ename: "George"
}];
```

Calling 
```javascript
employee.where("ename like '%ck'").select("ename,empid").orderBy("empid desc")
```
returns `[{ename:"Rick",empid:101},{ename:"Chuck",empid:100}]`.


[Sample Fiddle](http://jsfiddle.net/krishnakumarm777/dgeLn5wa/13/)



###Future 
Add various SQL functions 

