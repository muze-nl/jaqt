# JAQT Manual

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Basic Queries with .select()](#basic-queries)
- [Filtering with .where()](#filter-where)
- [Sorting with .orderBy()](#sort-orderBy)
- [Grouping with .groupBy()](#group-groupBy)
- [Nesting select()](#nesting-select)
- Troubleshooting and Performance

<a name="introduction"></a>
## Introduction

JAQT is a Javascript Query and Transformation library. It is meant to filter and select information from arrays of objects. For example:

```javascript
import { _, from } from 'jaqt'

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
npm install jaqt
```

Then use it like this:

```javascript
import * as jaqt from 'jaqt'
```

### Browsers

jaqt will work on any modern browser (as of 2024) with support for ES6 modules and the Proxy class.

Either install it using a bundler, e.g. Parcel:

```
npm install jaqt
npx parcel build
```

Or use it directly from a CDN like jsdeliver.net:

```
<script type="module">
    import * as jaqt from 'https://cdn.jsdelivr.net/npm/jaqt/src/jaqt.mjs'
</script>
```

### Importing all jaqt methods as global functions

In the remainder of this manual, examples will use the following import statement to make all methods available as global functions. This makes all the examples shorter and easier to read:

```javascript
import { _, from, not, anyOf, allOf, asc, desc, sum, avg, count, max, min, one, many, first } from 'jaqt'
```

### Running the example code

In the JAQT git repository you will find a directory called `repl`. This contains a node javascript file that allows you to test all the examples yourself. Start it up like this:

```
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
All JAQT queries start with the `from` method. It has a single argument, which must be an array of objects, or a single object. The from method creates a new Proxy object, which adds the methods `select`,`where`,`orderBy` and `groupBy`.

```javascript
result = from(data.people).select({name: _})
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

Notice that there is no `firstName` property in the data. But because we replaced the `_` with `_.name`, JAQT knows which property you want. This works only for properties on the current object. You can't use `_.metrics.hair_color`. For that see how you can add your own [accessor functions](#accessor-functions) later in the manual.

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

<a name="group-groupBy"></a>
## Grouping with .groupBy()

Note: This feature is still experimental, the workings could change quite a bit in the future.

### Grouping by Property Value

Instead of sorting by gender, it is more common to group results by gender, so lets do that here:
```javascript
result = from(data.people)
.select({
	name: _,
	gender: _
})
.groupBy({
	gender: _
})
```

And the result is:
```
{
    "male": [
	    { name: 'Darth', gender: 'male' },
	    { name: 'Luke', gender: 'male' }
	],
	"female": [
    	{ name: 'Leia', gender: 'female' }
    ],
    "n/a": [
	    { name: 'R2-D2', gender: 'n/a' }
	]
}
```

Note that the result is now an object and no longer an array. 

The value for each group doesn't have to be an array, a number of helper functions allow you to calculate a value for each group:

### count

This counts the grouped values:

```javascript
result = from(data.people)
.select({
	name: _,
	gender: _
})
.groupBy({
	gender: count()
})
```

And the result is:
```
{ male: 2, female: 1, 'n/a': 1 }
```

Note that you must call the `count()` function in the `groupBy` statement, unlike the functions used in `select`,`where` or `orderBy`. This is because the other `groupBy` functions need one or more parameters. To be consistent all of them work the same, so it is `count()` and not `count`.

### sum

If the grouped values contain a numeric property, you can use it to calculate the sum of the grouped values:

```javascript
result = from(data.people)
.groupBy({
	gender: sum(_.height)
})
```

Results in:
```
{ male: 374, female: 150, 'n/a': 0 }
```


### avg
```javascript
result = from(data.people)
.groupBy({
	gender: avg(_.height),
	hair_color: _
})
```
```javascript
.groupBy('gender', 'hair_color').select({gender: _, average_height: avg(_.height)})
```
```javascript
.groupBy(_.gender, _.hair_color).select({gender: _, average_height: avg(_.height)})
```
want: .groupBy(o => o.metric.height) werkt dan

```javascript
.groupBy(_.gender, o => o.metrics.hair_color).select(avg(_.height))
```

result:
```
{
	"male":{
		"blond": 180
	},
	"female": {
		"blond": 175
	}
}
```
probleem: avg() werkt anders dan in de normale select. Moet dit ook werken:
```javascript
from(data.people).select(avg(_.height))
```
lijkt me dan wel logisch...

### min and max

<a name="nesting-select"></a>
## Nesting select()

<a name="accessor-functions"></a>
### Custom Accessor Functions

JAQT provides a lot of options with the `select` function. But there are always other use cases. So if the default functions aren't enough, you can provide your own custom accessor functions, e.g:

```javascript
result = from(data.people)
.select({
    name: o => o.name+' '+o.lastName
})
```

The right hand side of `name` is a custom function. It is passed the current object, and you can return whatever you like. In this case the concatenation of the `name` and `lastName` properties.

Note, you shouldn't use the `_` as a function parameter, or you will overwrite its default functionality.

### Using from().select() as value

