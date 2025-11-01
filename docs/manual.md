# JAQT Manual

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Basic Queries with .select()](#basic-queries)
- [Filtering with .where()](#filter-where)
- [Sorting with .orderBy()](#sort-orderBy)
- [Calculating with .reduce()](#reduce)
- [Grouping with .groupBy()](#group-groupBy)
- [Nesting select()](#nesting-select)
- [Performance](#performance)
- [More uses of `_`](#_)
- [Extending JAQT](#extending)

<a name="introduction"></a>
## Introduction

JAQT is a Javascript Query and Transformation library. It is meant to filter and select information from arrays of objects. For example:

```javascript
import { _, from } from '@muze-nl/jaqt'

const data = {
    people: [
        {
            name: 'Luke',
            lastName: 'Skywalker',
            height: 172,
            gender: 'male'
        },
        {
            name: 'Darth',
            lastName: 'Vader',
            height: 202,
            gender: 'male'
        }
    ]
}

result = from(data.people)
.select({
    name: _
})
```

Which results in:

```json
[
    {
        "name": "Luke"    
    },
    {
        "name": "Darth"
    }
]
```

<a name="getting-started"></a>
## Getting Started

### NodeJS

jaqt requires node version 13.2 or higher, as it uses the Proxy class and ES6 imports extensively.

Install it like this:

```
npm install @muze-nl/jaqt
```

Then use it like this:

```javascript
import * as jaqt from '@muze-nl/jaqt'
```

### Browsers

jaqt will work on any modern browser (as of 2024) with support for ES6 modules and the Proxy class.

Either install it using npm:

```
npm install jaqt
```

Or use it directly from a CDN like jsdeliver.net:

```html
<script type="module">
    import * as jaqt from 'https://cdn.jsdelivr.net/npm/@muze-nl/jaqt/src/jaqt.mjs'
</script>
```

### Importing all jaqt methods as global functions

In the remainder of this manual, examples will use the following import statement to make all methods available as global functions. This makes all the examples shorter and easier to read:

```javascript
import { _, from, not, anyOf, allOf, asc, desc, sum, avg, count, max, min, one, many, first } from 'jaqt'
```

### Running the example code

In the JAQT git repository you will find a directory called `repl`. This contains a node javascript file that allows you to test all the examples yourself. Start it up like this:

```shell
npm run repl
```

You will see something like this:

```
> jaqt@0.7.1 repl
> NODE_REPL_HISTORY=repl/history.repl node repl/repl.mjs

> Expression assignment to _ now disabled.

```

You can type javascript code after the `>` prompt. The contents of `repl/data.json` are loaded and available as the global variable `data`. E.g:

```
> from(data.people).select({name: _})
```

Will output:
```
Proxy [
  [
    { name: 'Luke' },
    { name: 'Darth' },
    { name: 'Leia' },
    { name: 'R2-D2' }
  ],
  { get: [Function: get] }
]
```

The `Proxy` is shown, because JAQT wraps all results in a javascript Proxy, so that you can chain the JAQT method calls `orderBy` and `groupBy` on the result. The result will behave like any normal array in all other regards.

The examples in the rest of this documentation will skip the Proxy part, and only show the resulting values.

Read more about the [Node REPL server here](https://nodejs.org/en/learn/command-line/how-to-use-the-nodejs-repl).

<a name="basic-queries"></a>
## Basic Queries with from().select()


### from()
All JAQT queries start with the `from` function:

```javascript
let result = from(data.people)
``` 

It has a single argument, which should be an array of objects. The result is still an array, but you can now also call the methods `select`,`where`,`orderBy` and `groupBy` on that result.

```javascript
result = from(data.people).select({name: _})
```

`select` here tells JAQT which properties of each object in the `data.people` array you are interested in. It will loop over all objects and only retrieve the `name` property. Result is now something like:

```
[
    {name: "Luke"},
    {name: "Darth"}
]
```

### What is `_`?
`_` is a placeholder for JAQT methods, like `.select`. The `select` method requires a pattern object as its argument. In the previous example that is `{name: _}`. In a GraphQL query, this would be `{name}`, but this doesn't work in plain javascript. 

What JAQT needs is information about what value should be retrieved for the `name` property. The `_` parameter instructs JAQT to retrieve the value in each object, which matches the exact property name on the left side, here `name`.

There are other uses for `_`, which you'll get to later.

### Static values
The right hand side of the pattern properties doesn't have to be `_`. It can be any valid javascript value or expression. So this is perfectly valid:

```javascript
result = from(data.people)
.select({
    name: _,
    origin: 'StarWars'
})
```

And will result in:
```
[
    { name: 'Luke', origin: 'StarWars' },
    { name: 'Darth', origin: 'StarWars' },
    { name: 'Leia', origin: 'StarWars' },
    { name: 'R2-D2', origin: 'StarWars' }
]
```

However, you should be aware that if you want to use javascript functions to change the right hand side of a key : value pair, you cannot just add any javascript. For example, this will not work:

```javascript
result = from(data.people)
.select({
    name: 'Foo' + _ // This is incorrect
})
```

The object you pass to `select` is a pattern that will be applied to each object in `data.people`. So it must be able to run with different objects as source. In javascript this means that it must be a function. Each javascript operation you add, must therefor be wrapped in a function as well. If you want to prepend `'Foo'` to a each value, you can [create your own function](#accessor-functions) to do that,


### Selecting nested object data

If you have objects containing objects, you can query those like this:

```javascript
result = from(data.people)
.select({
    name: _,
    metrics: {
        hair_color: _
    }
})
```

Which will result in:

```
[
  {
    "name": "Luke",
    "metrics": {
        "hair_color": "blond"
    }
  },
  {
    "name": "Darth",
    "metrics": {
        "hair_color": "none"
    }
  },
  ...
]

```

### Aliases

You can use a different property name in the result, compared to the source data. E.g:

```javascript
result  =from(data.people)
.select({
    firstName: _.name
})
```

Which will result in:
```
[
    { firstName: 'Luke' },
    { firstName: 'Darth' },
    { firstName: 'Leia' },
    { firstName: 'R2-D2' }
]
```

Notice that there is no `firstName` property in the data. But because we replaced the `_` with `_.name`, JAQT knows which property you want. 

### Re-usable Fragments

You can create re-usable select fragments using javascripts spread operator `...`

```javascript
const name = {
    name: _,
    lastName: _
}

result = from(data.people)
.select({
    ...name,
    gender: _
})
```

Which results in:
```
[
    { name: 'Luke', lastName: 'Skywalker', gender: 'male' },
    { name: 'Darth', lastName: 'Vader', gender: 'male' },
    { name: 'Leia', lastName: 'Organa', gender: 'female' },
    { name: 'R2-D2', lastName: undefined, gender: 'n/a' }
]
```

The `...` string is the spread syntax, which was introduced in ECMAScript 6 (ES6). Read more about [its use in creating objects in mdn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals).

### One or Many

Sometimes data is inconsistent, a property on one object is a single value, whereas on another object it is an array of values. Ideally you want your query to return a consistent result. This is where the `one` and `many` functions help.

```javascript
result = from(data.people)
.select({
    name: _,
    gender: one(_)
})
```

Which results in:
```
[
    { name: 'Luke', gender: 'male' },
    { name: 'Darth', gender: 'male' },
    { name: 'Leia', gender: 'female' },
    { name: 'R2-D2', gender: 'n/a' }
]
```

The function `one` will by default return the last value of an array. But you can specify different behaviour. Calling `one(_, 'first')` will return the first value of an array. If you need some other behaviour, you can pass a callback function as the second parameter. It will be called with the full array of values. It should return a single value.

Conversely, you may want to always have an array of values in your result:

```javascript
result = from(data.people)
.select({
    name: _,
    gender: many(_)
})
```

Which results in:
```
[
    { name: 'Luke', gender: ['male'] },
    { name: 'Darth', gender: ['male'] },
    { name: 'Leia', gender: ['female'] },
    { name: 'R2-D2', gender: ['n/a'] }
]
```

Note: you cannot use `Array.push` or `Array.pop`, or even `_[0]` here. The expressions in the select parameter are functions, not values. The values are created by select, by 'running' your select expression (the pattern object) over each object in the `from()` array.

### First

If your data is even more inconsistent, and some objects have property X and other objects have property Y, you can use the `first` function, like this:

```javascript
result = from(data.people)
.select({
    name: first(_.name, _.lastName, 'Unknown')
})
```

If all objects in your data have a `.name` property, this result will be an array of that property. However if some objects do not have a `.name` property, or it is empty, the `.lastName` property will be returned instead. If that is also unavailable, the string 'Unkown' is returned instead. A property is considered empty, if the property is undefined, its value is null or its value is an empty string. 

### Using Javascript Array Functions

Results from a JAQT query are just arrays. You can call all javascript array functions on them, e.g.:

```javascript
result = from(data.people)
.select({
    name: _
})
.slice(0,2)
```

Which results in:
```
[
    { name: 'Luke' },
    { name: 'Darth' }
]
```

A common use of `slice()` is to add paging to results. Given a `pageNr` and a `pageSize`, you can return specific slices of the entire result set like this:

```javascript
const pageNr   = 1
const pageSize = 100
const start    = (pageNr-1)*pageSize
const end      = start + pageSize

result = from(data.people)
.slice(start, end)
.select({
    name: _
})
```

Similarly you can use the functions `sort`, `filter`, `map`, `reduce`, `indexOf`, etc. A full list of [Array functions is listed on mdn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).

<a name="filter-where"></a>
## Filtering with .where()

`where` makes it easy to filter entries in a `from()` array by property value. This function will apply your filter criteria to each object in the array in turn. Only objects that match all criteria will be retained. Other objects are filtered out of the list.

Note: `where` doesn't use indexes, it will just loop over the full list of objects.

### Exact match

You can filter an array of objects by matching one or more specific properties exactly, like this:

```javascript
result = from(data.people)
.where({
    metrics: {
        hair_color: "blond"
    }
})
.select({
    name: _
})
```

And get this result:
```
[
    { name: 'Luke' }
]
```

The `where` function doesn't alter the source data, it will only filter it. You cannot create aliases or re-structure the object. That is left for the `select` function.

### Regular Expressions

You can filter the data by regular expression as well. Any data that matches the regular expression will pass through. Unless some other property doesn't match.

```javascript
result = from(data.people)
.where({
    metrics: {
        skin_color: /white/
    }
})
.select({
    name: _
})
```

Which results in:
```
[
    { name: 'Darth' },
    { name: 'R2-D2' }
]
```

Since both 'white' and 'white, blue' match with the regular expression `/white/`.

### Matching Array Values

`where` will match a property with an array of values, if any value matches the filter value. So if your data is:
```
const data = [
    {
        name: 'Luke',
        favorite_color: 'Red'
    },
    {
        name: 'Leia',
        favorite_color: ['Blue','Purple']
    }
]
```

You can match people with 'Blue' among their favorite colors like this:
```javascript
result = from(data)
.where({
    favorite_color: 'Blue'
})
.select({
    name: _
})
```

And the result will be:
```
[
    { name: 'Leia' }
]
```

### anyOf

By default `where` will only let objects through that match all of the given properties. However, if instead you want pass through objects that match any of a given set of property-value pairs, you can use the `anyOf` function. Like this:

```javascript
result = from(data.people)
.where({
    name: anyOf('Luke','Darth')
})
.select({
    name: _
})
```

You can get the same effect by passing an array, like this:
```javascript
result = from(data.people)
.where({
    name: ['Luke','Darth']
})
.select({
    name: _
})
```

Which results in:
```
[
    { name: 'Luke' },
    { name: 'Darth' }
]
```

You can pass any number of values to `anyOf`. These can be value that is accepted by `where`, so exact values, a regular expression or a custom match function.

### allOf

The javascript spread operator allows you to combine objects. This means that you can use it to make sure `where` only allows objects which match multiple properties, like this:

```javascript
const male = {
    gender: "male"
}
const blond = {
    metrics: {
        hair_color: /blond/
    }
}
result = from(data.people)
.where({
    ...male,
    ...blond
})
.select({
    name: _
})
```

However, you can't use this to match objects which have two where clauses on the same property. E.g:
```javascript
const whiteSkin = {
    metrics: {
        skin_color: /white/
    }
}
const blueSkin = {
    metrics: {
        skin_color: /blue/
    }
}
result = from(data.people)
.where({
    ...blueSkin,
    ...whiteSkin
})
.select({
    name: _
})
```

The `whiteSkin` value overwrites the `blueSkin` value. A simple solution is to call `where` twice:
```javascript
const whiteSkin = {
    metrics: {
        skin_color: /white/
    }
}
const blueSkin = {
    metrics: {
        skin_color: /blue/
    }
}
result = from(data.people)
.where({
    ...blueSkin
})
.where({
    ...whiteSkin
})
.select({
    name: _
})
```

And that will work, but is not always possible and can be slower than filtering all data in one pass. So `allOf` is there to make this a single `where` clause:

```javascript
const whiteSkin = {
    metrics: {
        skin_color: /white/
    }
}
const blueSkin = {
    metrics: {
        skin_color: /blue/
    }
}
result = from(data.people)
.where({
    allOf(blueSkin,whiteSkin)
})
.select({
    name: _
})
```

A special case is when you want to match on a number of values in an array of values. By default the match algorithm will match in any value matches. So if you want to match all values, you can force it by using `allOf`:

```javascript
result = from(data.people)
.where({
    metrics: {
        skin_color: allOf('blue','white')
    }
})
.select({
    name: _
})
```

And in all these cases, only R2-D2 has both blue and white skin.

### not

Finally, the `not` function returns the inverse of whatever match you pass. E.g:
```javascript
result = from(data.people)
.where({
    name: not('Luke')
})
```

You can pass multiple arguments to not, and it will be interpreted as `not(anyOf(...match))`. E.g:
```javascript
result = from(data.people)
.where({
    name: not('Luke','Darth')
})
```

Will result in only the people whose name is not Luke or Darth.

### Custom Match Functions

Just as the `select` function, `where` allows you to pass a custom match function. E.g:

```javascript
result = from(data.people)
.where({
    name: o => o.name[0]=='L'
})
.select({
    name: _
})
```

Which results in:
```
[
    {name: 'Luke'},
    {name: 'Leia'}
]
```

A custom match function takes one argument, the whole object to match, and should return either `true` or `false`. Only when it return `true` is the object considered matched. Otherwise the object is filtered out.

<a name="sort-orderBy"></a>
## Sorting with .orderBy()

### Sort Ascending and Descending

JAQT adds the `orderBy` method, to sort results. It works just like `select` and `where`, in that you give it an object with properties to sort by. However, the right hand side, the values of these properties define how to sort. Default function `asc` and `desc` stand for ascending and descending respectively. E.g:

```javascript
result = from(data.people)
.select({
    name: _
})
.orderBy({
    name: asc
})
```

Will result in:
```
[
    { name: 'Darth' },
    { name: 'Leia' },
    { name: 'Luke' },
    { name: 'R2-D2' }
]
```

You can reverse this, like so:
```javascript
result = from(data.people)
.select({
    name: _
})
.orderBy({
    name: desc
})
```

And the result is:
```
[
    { name: 'R2-D2' },
    { name: 'Luke' },
    { name: 'Leia' },
    { name: 'Darth' }
]
```

You can also order by values that are not in your select statement. Do this by first ordering and then selecting values:

```javascript
result = from(data.people)
.orderBy({
    metrics: {
        height: asc
    }
})
.select({
    name: _
})
```

Which gives the result:

```
[
    { name: 'R2-D2' },
    { name: 'Leia' },
    { name: 'Luke' },
    { name: 'Darth' }
]
```

### Multiple Sort Properties

You can order by more than one property. Suppose we want to sort on gender and then on name, e.g:
```javascript
result = from(data.people)
.orderBy({
    gender: asc,
    name: asc
})
.select({
    name: _,
    gender: _
})
```

And the result is:
```
[
    { name: 'Leia', gender: 'female' },
    { name: 'Darth', gender: 'male' },
    { name: 'Luke', gender: 'male' },
    { name: 'R2-D2', gender: 'n/a' }
]
```

The order in which you put the sort properties defines which property is used first. In this case `gender` is the first property, so that means `Leia` will be first.

### Custom Sort Function

Just like `select` and `where`, `orderBy` can use custom functions, e.g:

```javascript
result = from(data.people)
.orderBy({
    height: (a,b) => parseInt(a)>parseInt(b) ? 1 : parseInt(a)<parseInt(b) ? -1 : 0
})
```

Just like any sort function, a custom sort function is passed two values, `a` and `b` and the result is either 1 if `a>b`, -1 if `a<b` and 0 otherwise.

You can just use the normal Array.sort method as well, in this case the same sort result could be achieved with:

```javascript
result = from(data.people)
.sort((a,b) => parseInt(a.height)>parseInt(b.height) ? 1 : parseInt(a.height)<parseInt(b.height) ? -1 : 0)
```


<a name="reduce"></a>
## Calculating with .reduce()

JAQT adds a new capability to the default .reduce() function: You can add more than one reducer, just like with .select(). For example:

```javascript
from(data.people)
.reduce({
    avgHeight: avg(_.height),
    count: count()
})
```
Which results in:
```
{
    avgHeight: 155,
    count: 4
}
```

But you can still use the normal `reduce`, e.g:

```javascript
from(data.people)
.reduce((accu,ob) => accu+1, 0)
```

Which results in:
```
4
```

### count

The `count` function is meant to be used with `reduce`, and it counts the grouped values:

```javascript
result = from(data.people)
.groupBy(_.gender)
.reduce(count())
```

And the result is:
```
{ male: 2, female: 1, 'n/a': 1 }
```

### sum

If the grouped values contain a numeric property, you can use it to calculate the sum of the grouped values:

```javascript
result = from(data.people)
.groupBy(_.gender)
.reduce(sum(_.height))
```

Results in:
```
{ male: 374, female: 150, 'n/a': 90 }
```
### avg

This calculates the average of all matched values:

```javascript
result = from(data.people)
.groupBy(_.gender)
.reduce(avg(_.height))
```

It will assume a value of `0` for any value which can't be parsed as a number.
Note: the result is a Number object. To convert it to a plain number, use:

```
result = +result
```

One case where this is needed, is if you check the result with:
```
if (!result) {

}
```

This will fail if result is a Number, even if it is the Number(0). Objects will never be falsy. Instead check explicitly for 0, like this:

```
if (result==0) {

}
```



### min and max

These will return the minimum and maximum values of the data respectively:
```javascript
result = from(data.people)
.reduce({
    min: min(_.height),
    max: max(_.height)
})
```

Which returns:
```
{
    min: 96,
    max: 202
}
```

<a name="group-groupBy"></a>
## Grouping with .groupBy()

### Grouping by Property Value

Instead of sorting by gender, it is more common to group results by gender, so lets do that here:
```javascript
result = from(data.people)
.groupBy( _.gender )
.select({
    name: _
})
```

And the result is:
```
{
    "male": [
        { name: 'Darth' },
        { name: 'Luke' }
    ],
    "female": [
        { name: 'Leia' }
    ],
    "n/a": [
        { name: 'R2-D2' }
    ]
}
```

Note that the result is now an object and no longer an array. 

You can group by more than one property:
```javascript
result = from(data.people)
.groupBy( _.gender, _.metrics.hair_color )
.select({
    name: _
})
```

And the result is:
```
{
    "male": [
        "none": [
            { name: 'Darth' }
        ],
        "blond": [
            { name: 'Luke' }
        ]
    ],
    "female": [
        "brown": [
            { name: 'Leia' }
        ]
    ],
    "n/a": [
        "n/a": [
            { name: 'R2-D2' }
        ]
    ]
}
```

Just like previously, you can run `reduce` on the `groupBy` result, instead of `select`:

```javascript
result = from(data.people)
.groupBy( _.gender, _.metrics.hair_color )
.reduce(count())
```

And the result is:
```
{
    "male": [
        "none": 1,
        "blond": 1
    ],
    "female": [
        "brown": 1
    ],
    "n/a": [
        "n/a": 1
    ]
}
```

<a name="nesting-select"></a>
## Nesting select()

<a name="accessor-functions"></a>
### Custom Select Functions

JAQT provides a lot of options with the `select` function. But there are always other use cases. So if the default functions aren't enough, you can provide your own custom accessor functions, e.g:

```javascript
result = from(data.people)
.select({
    name: o => o.name+' '+o.lastName
})
```

The right hand side of `name` is a custom function. It is passed the current object, and you can return whatever you like. In this case the concatenation of the `name` and `lastName` properties.

Note, you shouldn't use the `_` as a function parameter, or you will overwrite its default functionality.

All the utility functions we've discussed here are written exactly like this, even `_`. Here is the definition of `first` for example (shortened for readability):

```javascript
function one(selectFn) {
    return (data) => {
        let result = selectFn(data)
        if (Array.isArray(result)) {
            result = result.pop()
        }
        return result
    }
}
```

As you can see, `one` doesn't return a value, it returns a function that returns a value. It also expects its parameter to be a function that selects a value.

### Custom Where Functions

Just as with `select`, you can also use custom functions in `where`. These work similar, except they should return `true` or `false`. If they return `true`, the object is passed on, otherwise the object is filtered from the result.

Here is the definition of `not` for example:
```javascript
function not(...pattern) 
{
    let matchFn = getMatchFn(pattern)
    return data => !matchFn(data)
}
```

`getMatchFn` is a helper function that is also part of JAQT, you can import it just like all the other JAQT functions. 

### Custom Reduce Functions

`reduce` also supports custom functions. These are identical to the normal array reduce functions. So this will work:

```javascript
from(data.people)
.reduce((acc,ob) => acc += ob.price, 0)
```

Here `0` is the initial value of the `acc` accumulator. The function is called on each object in `data.people`. The result of each call is then passed on to the next function call as the `acc` accumulator. The final result is returned.

Here is the definition of `sum` for example:
```javascript
export function sum(fetchFn) {
    return (a,o) => {
        if (Array.isArray(a)) {            
            a = 0
        }
        return a += parseFloat(fetchFn(o)) || 0
    }
}
```

Again `sum` just returns a function, and expects a single parameter that is also a function. The check if the `a` accumulator is an array, is because if you don't pass a initial value to reduce, it will default to an empty array.

### Using from().select() as value

You can create a sub-select, queries within a query, like this:

```javascript
from(data.people)
.select({
	name: _,
	friends: o => from(o.friends)
		where({
			name: not(o.name)
		})
		.select({
			name: _
		})
})
```

Here for each person in `data.people`, their name and a list of friends names is returned, where the friends name is not the same as the persons name.

Note however, that doing this can become slow rather quickly. Each `where` and `select` loop over a full list of objects. The inner `from().where().select()` loops over the full list of friends, for each person in the list.

<a name="performance"></a>
## Performance

In general `where` will perform just as fast as `Array.filter` would, and `select` just as fast as `Array.map` would. However, `where` and `select` have one advantage: it is easy to select or filter on multiple property values in one loop. This means that memory access and therefor cache invalidation is limited. Simple `Array.filter` and `Array.map` code often include multiple calls to each. Using JAQT you can easily do the same in a single pass over the data.

Since `where` is just a wrapper around `Array.filter`, you shouldn't do something like this:
```javascript
from(data.people)
.where({
	id: 18992
})
.select({
	name: _
})
```

This will loop over the entire list of people, which could be quite large, just to retrieve a single person by their `id`. It is much more efficient to create a separate index, and use that:

```javascript
const index = new Map()
for(let person of data.people) {
	index.set(person.id, person)
}

from(index.get(18992))
.select({
	name: _
})
```

Assuming you can re-use the index, so you only have to build it once.

### Joins

If you use JSON as your storage format, you will find that you can't store data that has cyclical references. Its worse, you can't reference any object that is already linked somewhere. The only option is to use some kind of id as a reference. This means that you will have to link up the data after reading the JSON. You can probably do this when running queries, but again, this is slow.

Instead of mimicking SQL joins, why not take advantage of the inherent graph nature of javascript objects? You can just link objects directly. All you need is some way to save and parse these links, e.g:

```javascript
const seen = new Map()
function replacer(key, value) {
	if (value && typeof value == 'object') {
		if (seen.has(value)) {
			let id = seen.get(value)
			return {
				'@type': 'link',
				'@ref': id
			}
		}
		let id = Crypto.randomUUID()
		value['@id'] = id
		seen.set(value, id)
	}
	return value
}
let jsonString = JSON.stringify(data, replacer)
```

This will replace all objects second or later occurance with a new object with a unique id. The original object is extended with a `@id` property.

Similarly, `JSON.parse` has a `reviver` function parameter, which you can use to change these link type objects with the original object reference.

```javascript
const seen = new Map()
function reviver(key, value) {
	if (value && typeof value == 'object') {
		if (value['@id']) {
			seen.set(value['@id'], value)
		} else if (value['@type']=='link') {
			value = seen.get(value['@ref'])
		}
	}
	return value
}
let data = JSON.parse(jsonString, reviver)
```

Or you can choose to use [JSONTag](https://github.com/muze-nl/jsontag) instead of JSON to parse and stringify data, which not only does this out of the box, but also adds optional metadata information to JSON.

<a name="_"></a>
## More Uses of `_`

Another name for `_` is the Pointer Function. Because it is a function and you can use it to point at specific parts of a dataset. In javascript a Functio is an object, and objects can have properties. So `_.name` can exist, even though `_` is a function. In fact `_.name` is also a function. And it too can have properties.

So this is perfectly valid:

```javascript
_.metrics(data.people)
```

It returns:
```
[
    { hair_color: 'blond', skin_color: 'fair', eye_color: 'blue' },
    { hair_color: 'none', skin_color: 'white', eye_color: 'yellow' },
    { hair_color: 'brown', skin_color: 'light', eye_color: 'brown' },
    { hair_color: 'n/a', skin_color: 'white, blue', eye_color: 'red' }
]
```

And similarly:

```javascript
_.metrics.hair_color(data.people)
```

Returns:
```
[ 'blond', 'none', 'brown', 'n/a' ]
```

This is also possible:
```javascript
from(_.metrics(data.people))
.select({
    hair_color: _
})
```

Which returns:
```
[
    { hair_color: 'blond' },
    { hair_color: 'none' },
    { hair_color: 'brown' },
    { hair_color: 'n/a' }
]
```

In the last example I both use `_` without any property or function call, and with. The first occurance, in the `from` statement, is a direct function call. This means that `_.metrics(data.people)` is a call to the function `_.metrics` with a single argument, `data.people`. And it returns the array of objects with the `metrics` parts of each person in `data.people`. So `select()` now uses that as its input.

The second occurance is in the `select` statement. There `_` is used without calling it. Instead the `select` function is given an object with a reference to the function. So for each object in the list returned by `from()`, `select` can call the `_` function, and get a different result each time.

In this case `select` actually calls the `_` function with two parameters: `_(data, key)`. `data` will be each of the `metrics` objects in `data.people`, `key` is the property on the left side in the `select` parameter. In this case `hair_color`. So now `_` knows to only return the `hair_color` part.

When you instead ask for a specific property, like this: `_.metrics`, you get a different function. This function is also called with `_(data, key)`, but the `key` part is ignored. Instead the property name used in `_.metrics` is used. And if you add more properties, all the properties will be kept, in order. Then when you call say `_.metrics.hair_color` function, it knows to search for the `metrics` object, and then the `hair_color` property, and return that.

If you've been paying attention, this is not all that `_` does. Remember that `data.people` is an array of objects. So `_.metrics(data.people)` is not the same `data.people.metrics`. Instead, `_` when called, sees that its input is an array (and the property name is not numeric.) So it will call each object in turn and return a new array with all results of the `metrics` property. And it will do so for each array encountered when resolvind the pointer--the list of properties to access.

You can specify a specific object in an array, e.g.:
```javascript
_[0].metrics(data.people)
```

Will only return the first entry:
```
{ hair_color: 'blond', skin_color: 'fair', eye_color: 'blue' }
```

Note that you must use the `[]` syntax to access numeric properties, only properties starting with a letter (or `$` or `_`) can be used with the `.` notation.

<a name="extending"></a>
## Extending JAQT

JAQT comes with a lot of helper functions out of the box, but you may want to add your own. Here is how you can do that for the different parts of JAQT - select, where, orderBy and reduce:

### Select functions

JAQT provides the functions `one`, `many`, `first` and `distinct` to be used inside the pattern for `select`. For example: `many` is defined as:

```javascript
export function many(pointerFn)
{
    return (data, key) => {
        let result = pointerFn(data, key)
        if (result == null) {
            result = []
        } else if (!Array.isArray(result)) {
            result = [result]
        }
        return result
    }
}
```
Any helper function for the `select` method, must return a function with 2 parameter:

- data: the object to select properties from
- key: the left hand name/property in the select pattern

The helper function itself can have any parameters, but should probably start with the pointer function, usually `_` or `_.some.property`.

### Where functions

JAQT provides the following matching functions: `not`,`anyOf` and `allOf`. Here is how you could create your own `between` matching function:

```javascript
export function between(min, max)
{
    return (data) => {
        return (data <= max && result >= min)
    }
}
```

Now you can use this as:

```javascript
from(data.people)
.where({
    metrics: {
        height: between(170, 190))
    }
})
.select({
    name: _
})
```

If you want to build a function like `anyOf`, which accepts multiple match criteria, you'll need to use the provided `getMatchFn` function, like this:

```javascript
import { getMatchFn } from '@muze-nl/jaqt'

function anyOf(...patterns)
{
    let matchFns = patterns.map(getMatchFn)
    return data => matchFns.some(fn => fn(data))
}
```

Now you can use any valid expression for the `where` function as parameter for your function.

### Reduce functions

JAQT provides `sum`, `avg`, `count`,`max`,`min` and `distinct` functions out of the box. Here is the definition of `avg`:

```javascript
function avg(fetchFn)
{
    return (accu, ob, index, list) => {
        accu += parseFloat(fetchFn(ob)) || 0
        if (index == (list.length-1)) {
            return accu / list.length
        }
        return +accu
    }
}
```

Usually if you want to calculate the average of an array of numbers, you just add them up and divide the remainder by the length of the array. In this case, reduce gives you the index of the current entry `ob` and the list itself, so we can check if the current entry is the last of the array. And only then divide the sum. This saves a lot of divisions, but you do risk the danger of overflowing the `accu` number, if you work with a lot of large numbers.

An alternative is to keep track of the average up to this point:

```javascript
function avg(fetchFn)
{
    return (accu, ob, index) => {
        return +accu + ((parseFloat(fetchFn(ob)) || 0) - accu) / (index+1)
    }
}
```

Now you have less risk of overflowing `accu`, but this will take longer to calculate.

You may have spotted these lines:
```javascript
    return +accu
```

This is because if you call reduce, like this:
```javascript
from(data.people)
.reduce(avg(_.metrics.height))
```

JAQT will automatically start the `accu` accumulator with an initial value of `[]`. By returning `+accu` this is automatically converted to `0`.

## Polyglot functions

You may have noticed that `distinct` is grouped in with functions for use with `select` as well as `reduce`. That is because `distinct` is written to be able to be used by both. The difference between a `reduce` function and a `select` function is that reducers are called like this:

```javascript
reducer(accumulator, currentValue, currentIndex, array)
```

Whereas selector functions are called like this:

```javascript
selector(data, key, 'select')
```

By testing if the third parameter is 'select', or a number, you can tell which context the function is running in. This is not a feature for the 'sort' or 'groupBy' contexts, as I found no overlap in functionality there. A sort function will always be called like this:

```javascript
sorter(a,b) // => -1, 0, or 1
```

And a group function is simply a selector. Whose return values will be used to group results by. Here however, the selector function is called with only the `data` parameter.

## Undefined and null

A deliberate design choice made is that if you query for a specific key, and that key is not available in the data--it is undefined--, jaqt will set a `null` value for that key. Any key present in the select object, will always be present in the resulting dataset.

The reason for this is that this makes code that reads the result simpler. You don't have to check if a specific key is present in the result, if you know the query used.

The drawback is that you cannot know if a property is undefined in the data, or explicitly set to null. But since the query is just javascript, you can always create your own function to check for that, in the query.

Simply setting a properties value to `undefined` won't work, since JSON (and therefor JSONTag as well) specifically skip properties set to `undefined` in the stringify function.
