# jaqt: Getting Started

## prerequisites

jaqt is a pure or vanilla javascript library, with no other dependencies.

### node

jaqt requires node version 13.2 or higher, as it uses the [Proxy class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) and [ES6 imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) extensively.

Install it like this:

```shell
npm install jaqt
```

Then use it like this:

```javascript
import * as jaqt from 'jaqt'
```

### browsers

jaqt will work on any modern browser (as of 2024) with support for [ES6 modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) and the [Proxy class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

Either install it using a bundler, e.g. Parcel:

```shell
npm install jaqt
npx parcel build
```

Or use it directly from a CDN like jsdeliver.net:

```html
<script type="module">
	import * as jaqt from 'https://cdn.jsdelivr.net/npm/jaqt/src/jaqt.mjs'
</script>
```

### importing all jaqt methods as global functions

In the remainder of the documentation, we're using the following import statement to make all methods available as global functions. This makes all the examples shorter and easier to read:

```javascript
import { _, from, not, anyOf, allOf, asc, desc, sum, avg, count, max, min, one, many, first } from 'jaqt'
```

## First steps

Lets define a very simple dataset:

```javascript
let data = {
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
		},
		{
			name: 'Leia',
			lastName: 'Organa',
			height: 150,
			gender: 'female'
		},
		{
			name: 'R2-D2',
			height: 96,
			gender: 'n/a'
		}
	]
}
```

### select

Now list the name of all people, like this:

```javascript
from(data.people).select({
	name: _
})
```

and the result will be:

```javascript
[
	{
		name: 'Luke'
	},
	{
		name: 'Darth'
	},
	{
		name: 'Leia'
	},
	{
		name: 'R2-D2'
	}
]
````

Read more about the [features of `select` here](./select.md)

### where

You can also filter the results based on a property, e.g:

```javascript
from(data.people).where({
	gender: 'male'
}).select({
	name: _
})
````

And the result will be:

```javascript
[
	{
		name: 'Luke'
	},
	{
		name: 'Darth'
	}
]
```

Read more about the [features of `where` here](./where.md)

### orderBy

You can order results by one or more properties:

```
from(data.people).orderBy({
	name: asc
}).select({
	name: _
})
```

Which will result in:

```javascript
[
	{
		name: 'Darth'
	},
	{
		name: 'Leia'
	},
	{
		name: 'Luke'
	},
	{
		name: 'R2-D2'
	}
]
```

Read more about the [features of `orderBy` here](.orderBy.md)


### groupBy

Finally you can group results based on a property:

```
from(data.people).select({
	name: _,
	gender: _
}).groupBy({
	gender: _
})
```

And this results in:

```javascript
{
	male: [
		{
			name: "Luke",
			gender: "male"
		},
		{
			name: "Darth",
			gender: "male"
		}
	],
	female: [
		{
			name: "Leia",
			gender: "female"
		}
	],
	"n/a": [
		{
			name: "R2-D2",
			gender: "n/a"
		}
	]
}
```

Read more about the [features of `groupBy` here](./groupBy.md)

### javascript array functions

jaqt is just a javascript library, and `from()` wraps objects and arrays with a Proxy. This means that you can still use normal javascript array methods, for example.

```javascript
from(data.people)
.slice(0,2)
.select({
	name: _
})
```

Which will result in:

```javascript
[
	{
		name: "Luke"
	},
	{
		name: "Darth"
	}
]
```

If you call `from()` on an array, the `select`,`where` and `orderBy` methods will return an array Proxy, with all array methods available. `groupBy` returns an object Proxy, with keys grouping the values.

If you call `from()` on an object, the `select` method will return an object Proxy. The `where`, `orderBy` and `groupBy` methods aren't available in this case.

