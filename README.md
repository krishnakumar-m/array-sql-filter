# array-sql-filter
Add SQL-like query capabilities to JS Object Arrays

For testing, include sql-where.js in your project

Example : 
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

Returns `[{ename:"Rick",empid:101},{ename:"Chuck",empid:100}]`


[Sample Fiddle](http://jsfiddle.net/krishnakumarm777/dgeLn5wa/12/)

Next iteration : Add IN and BETWEEN capabilities

Future : Add various SQL functions 
