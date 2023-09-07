# array-where-select: GraphQL-style Array.select() and Array.where()

array-where-select is a simple map/filter query engine for arrays and objects. e.g:

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
   - [where()](#where)
   - [not()](#not)
   - [anyOf()](#anyOf)
   - [allOf()](#allOf)
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
npm install array-where-select
```

Then in your javascript:

```javascript
import { from, _ } from 'array-where-select'
```

Or in a browser:

```html
<script src="path/to/array-where-select/src/whereselect.mjs" type="module"></script>
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
import {from, _} from 'array-where-select'

from(data)
.where({
	friends: {
		name: 'John'
	}
})
.select({
	name: _ => _.name+' '+_.lastName
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

<a name="contributions"></a>
## Contributions

Contributions are welcome. Please fork the github repository and make your changes there, then open a pull request.
If you find any bugs or other issues, please use the github repository Issues. Check if your issue has already been posted before you add a new issue.

The github repository is at https://github.com/muze-nl/array-where-select

<a name="license"></a>
## License

This software is licensed under MIT open source license. See the [License](./LICENSE) file.
