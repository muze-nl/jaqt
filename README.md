# jaqt: javascript queries and transformations

jaqt (pronounced 'jacket') is a query engine for arrays and objects, inspired by graphql and sql. e.g:

```javascript
from(dataset).where({name: 'John'}).select({lastName:_})
```

## Table of Contents

1. [Background](#background)
2. [Install](#install)
3. [Usage](#usage)
4. [API](#api)
   - [from()](#from)
   - [select()](#select)
   - [orderBy()](#orderBy)
   - [groupBy()](#groupBy)
   	- [count()](#count)
   	- [sum()](#sum)
   	- [avg()](#avg)
   	- [min()](#min)
   	- [max()](#max)
   - [where()](#where)
	   - [not()](#not)
	   - [anyOf()](#anyOf)
	   - [allOf()](#allOf)
	- [nested queries](#nested)
5. [Contributions](#contributions)
6. [License](#license)

<a name="background"></a>
## Background

There are many libraries that add a kind of query language to javascript arrays. GraphQL is one of those. But all the libraries I have found add a custom query language. Either by adding specific functions that mimic SQL, or by explicitly defining a query language like GraphQL. In all cases this means that you give up the power of javascript itself and must switch to a different, less capable language.

So this library is explicitly not a query language itself, but it uses some javascript trickery to add some syntactic sugar to the native Array.map and Array.filter functions so that you can get most of the ease of use of something like GraphQL, while staying squarely in javascript country.

There are no speed improvements or indexes over normal Array.filter and Array.map.

<a name="install"></a>
## Install

Using NPM:

```bash
npm install jaqt
```

Then in your javascript:

```javascript
import { from, _ } from 'jaqt'
```

Or in a browser:

```html
<script src="path/to/jaqt/src/jaqt.mjs" type="module"></script>
```

This library uses ES6 import/export syntax, but there is only a single javascript file. You can include that directly, or use a bundler.

<a name="usage"></a>
## Usage

The examples below all use the data below. The data uses [JSONTag](https://www.npmjs.com/package/@muze-nl/jsontag), to allow for multiple links to the same object. This is not relevant for the remainder of the examples or needed to use this library.

```javascript
let data = JSONTag.parse(`[
	<object id="John">{
		name: "John",
		lastName: "Doe",
		friends: [
			<link>"Jane"
		]
	},
	<object id="Jane">{
		name: "Jane",
		lastName: "Doe",
		friends: [
			<link>"John"
		]
	}
]`)
```

And this is how you can use this library:

```javascript
import {from, _} from 'jaqt'

from(data)
.where({
	friends: {
		name: 'John'
	}
})
.select({
	name: o => o.name+' '+o.lastName
})
```

<a name="api"></a>
## API

<a name="from"></a>
### from()

From wraps its parameter in a Proxy, on which you can call where--if its an array-- and select, for either arrays or objects. 

<a name="select"></a>
### select()

Select describes which properties from a dataset you would like to have in your result set. This is similar to the way GraphQL works. For example: You can select just the name part like this:

```javascript
from(data)
.select({
	name: _
})
```

And the result array will be:
```json
[
	{
		"name": "John"
	},
	{
		"name": "Jane"
	}
]
```

The _ represents the identity function and will return the value matching with the key to the left, in this case 'name'.

You can also specify this like so:

```javascript
from(data)
.select({
	name: _.name
})
```

In addition you can also use a single object, like this:

```javascript
from(data[0])
.select({
	name: _
})
```

And the result will be a new object, not an array:

```json
{
	"name": "John"
}
```

Now lets show the name of each friend.

```javascript
from(data)
.select({
	name: _,
	friends: {
		name: _
	}
})
```

You can also use a different name, or alias, in the result:

```javascript
from(data)
.select({
	firstName: _.name,
	friends: {
		firstName: _.name
	}
})
```

Or you can use functions in the select parameter, like so:

```javascript
from(data)
.select({
	name: o => o.name+' '+o.lastName
})
```

You can also use the spread operator to include different fragments, like this:

```javascript
const names = {
	name: _,
	lastName: _
}
from(data)
.select({
	...names,
	foo: 'bar'
})
```

<a name="orderBy"></a>
### orderBy()

You can sort arrays using the orderBy() function, like this:

```javascript
from(data)
.select({
	name: _,
	lastName: _
})
.orderBy({
	lastName: asc,
	name: asc
})
```

This will sort the result array first by lastName, in ascending order, then by name, also in ascending order.

You can also sort by properties of object values in the results. And finally, instead of 'asc' or 'desc', you may also provide your own sort function like this:

```javascript
from(data)
.select({
	name: _,
	lastName: _
})
.orderBy({
	lastName: (a,b) => a<b ? -1 : 1
})
```

You can order results by fields that aren't in the result set, by moving the orderBy section up, like this:

```javascript
from(data)
.orderBy({
	lastName: asc
})
.select({
	name: _
})
```

<a name="groupBy"></a>
### groupBy()

Note: _This function is very experimental and likely to change._

Just like SQL, groupBy groups results with the same value for the groupBy field. Here is an example:

```javascript
from(data)
.groupBy({
	lastName: _
})
```

<a name="where"></a>
### where()

While select() allows you to select the properties for your result set, where() allows you to filter the result set only to matching objects. To match a specific property with a specific value do this:

```javascript
from(data)
.where({
	name: 'John'
})
```

Or use properties of nested objects like this:

```javascript
from(data)
.where({
	friends: {
		name: 'John'
	}
})
```

You can also use regular expressions:

```javascript
from(data)
.where({
	name: /J.*/
})
```

And finally you can use match functions:

```javascript
from(data)
.where({
	name: o => o.name[0] == 'J'
})
```

And you can combine where with select like this:

```javascript
from(data)
.where({
	friends: {
		name: 'John'
	}
})
.select({
	name: o => o.name+' '+o.lastName
})
```
_**Note**: if you use a function in a select() statement, don't use '\_' as the argument name. Though this looks nice, the _ parameter is a special function. By naming the function parameter '\_', you lose access to its properties inside that function._

<a name="not"></a>
### not()

This function can be used in combination with the `where()` function. It allows you to explicitly select objects that do not match the given template object or value.

```javascript
from(data)
.where({
	name: not('John')
})
.select({
	name: _
})
```

<a name="anyOf"></a>
### anyOf()
This function can be used in combination with the `where()` function. It allows you to select objects that match at least one of the template objects or values in anyOf().

```javascript
from(data)
.where({
	name: anyOf('John','Jane')
})
.select({
	name: _
})
```

<a name="allOf"></a>
### allOf()
Just like `anyOf()` this function can be used in a `where()` function. It allows you to select objects that match all of the template objects or values in `allOf()`.

```javascript
from(data)
.where(
	allOf(
		{
			name: 'John'
		},
		{
			lastName: 'Doe'
		}
	)
)
.select({
	name: _
})
```

<a name="nested"></a>
### Nested Queries

You can use functions in a select() statement, like this:
```javascript
from(data)
.select({
	name: o => o.name+' '+o.lastName
})
```

But you can also nest queries. If any property of the data is itself an array, you can use from().where().select() on that array again:

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

Unlike the Array.filter method, functions in select() are called with the full object as the first parameter. The name on the left hand side, here 'friends', doesn't have to exist or match the results of your function. You can do anything here.

Here the where() clause filters any people that have the same name, and only shows people in the friends array with a different name.

<a name="contributions"></a>
## Contributions

Contributions are welcome. Please fork the github repository and make your changes there, then open a pull request.
If you find any bugs or other issues, please use the github repository Issues. Check if your issue has already been posted before you add a new issue.

The github repository is at https://github.com/muze-nl/array-where-select

<a name="license"></a>
## License

This software is licensed under MIT open source license. See the [License](./LICENSE) file.
