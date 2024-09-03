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

let result = from(data.people)
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
let result = from(data.people).select({name: _})
```

### What is `_`?
`_` is a placeholder for JAQT methods, like `.select`. The `select` method requires a pattern object as its argument. In the previous example that is `{name: _}`. In a GraphQL query, this would be `{name}`, but this doesn't work in plain javascript. 

What JAQT needs is information about what value should be retrieved for the `name` property. The `_` parameter instructs JAQT to retrieve the value in each object, which matches the exact property name on the left side, here `name`.

There are other uses for `_`, which you'll get to later.

### Static values
The right hand side of the pattern properties doesn't have to be `_`. It can be any valid javascript value or expression. So this is perfectly valid:

```javascript
let result = from(data.people)
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
let result = from(data.people)
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
let result=from(data.people)
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

let result = from(data.people)
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

### One or Many

Sometimes data is inconsistent, a property on one object is a single value, whereas on another object it is an array of values. Ideally you want your query to return a consistent result. This is where the `one` and `many` functions help.

```javascript
let result = from(data.people)
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
let result = from(data.people)
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
let result = from(data.people)
.select({
	name: first(_.name, _.lastName, 'Unknown')
})
```

If all objects in your data have a `.name` property, this result will be an array of that property. However if some objects do not have a `.name` property, or it is empty, the `.lastName` property will be returned instead. If that is also unavailable, the string 'Unkown' is returned instead. A property is considered empty, if the property is undefined, its value is null or its value is an empty string. 

### Using Javascript Array Functions

Results from a JAQT query are just arrays. You can call all javascript array functions on them, e.g.:

```javascript
let result = from(data.people)
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

let result = from(data.people)
.slice(start, end)
.select({
	name: _
})
```

Similarly you can use the functions `sort`, `filter`, `map`, `reduce`, `indexOf`, etc. A full list of [Array functions is listed on mdn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).

<a name="filter-where"></a>
## Filtering with .where()

- exact match
- regular expressions
- anyOf and allOf
- not
- functions

<a name="sort-orderBy"></a>
## Sorting with .orderBy()

- ascending and descending
- custom sort function
- multiple sort fields

<a name="group-groupBy"></a>
## Grouping with .groupBy()


<a name="nesting-select"></a>
## Nesting select()

<a name="accessor-functions"></a>
### Custom Accessor Functions

JAQT provides a lot of options with the `select` function. But there are always other use cases. So if the default functions aren't enough, you can provide your own custom accessor functions, e.g:

```javascript
let result = from(data.people)
.select({
	name: o => o.name+' '+o.lastName
})
```

The right hand side of `name` is a custom function. It is passed the current object, and you can return whatever you like. In this case the concatenation of the `name` and `lastName` properties.

Note, you shouldn't use the `_` as a function parameter, or you will overwrite its default functionality.

### Using from().select() as value

