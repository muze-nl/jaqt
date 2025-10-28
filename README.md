[![GitHub License](https://img.shields.io/github/license/muze-nl/jaqt)](https://github.com/muze-nl/jaqt/blob/main/LICENSE)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/muze-nl/jaqt)]()
[![NPM Version](https://img.shields.io/npm/v/jaqt)](https://www.npmjs.com/package/@muze-nl/jaqt)
[![npm bundle size](https://img.shields.io/bundlephobia/min/jaqt)](https://bundlephobia.com/package/@muze-nl/jaqt)

# jaqt: javascript queries and transformations

jaqt (pronounced 'jacket') is a query engine for arrays and objects, inspired by graphql and sql. e.g:

<table>
<tr>
<th>
Javascript Query
</th>
<th>
Result
</th>
</tr>
<tr>
<td width=50%">

```javascript
from(data.people)
.select({
    metrics: {
        hair_color: _
    },
    lastName: _
})
```
<br><br><br>
<br><br><br>
</td>
<td width=50%">
	
```
[
    {
        "metrics": {
            "hair_color": "blond"
        },
        "lastName": "Skywalker"
    },
    {
        "metrics": {
            "hair_color": "none"
        },
        "lastName": "Vader"
    }
]
```

</td>
</tr>
</table>

## Table of Contents

1. [Background](#background)
2. [Quickstart](docs/quickstart.md)
3. [Usage](#usage)
4. [User Manual](docs/manual.md)
5. [Reference](docs/reference.md)
6. [Contributions](#contributions)
7. [License](#license)

<a name="background"></a>
## Background

There are many libraries that add a kind of query language to javascript arrays. GraphQL is one of those. But all the libraries I have found add a custom query language. Either by adding specific functions that mimic SQL, or by explicitly defining a query language like GraphQL. In all cases this means that you give up the power of javascript itself and must switch to a different, less capable language.

So this library is explicitly not a query language itself, but it uses some javascript trickery to add some syntactic sugar to the native Array.map and Array.filter functions so that you can get most of the ease of use of something like GraphQL, while staying squarely in javascript country.

There are no speed improvements or indexes over normal Array.filter and Array.map.

<a name="usage"></a>
## Usage

The examples below all use the data below:

```javascript
let data = JSON.parse(`[
	{
		"name": "John",
		"lastName": "Doe",
		"friends": [
			"Jane"
		]
	},
	{
		"name": "Jane",
		"lastName": "Doe",
		"friends": [
			"John"
		]
	}
]`)
```

And this is how you can use this library:

```javascript
import {from, _} from 'jaqt'

from(data)
.where({
	friends: 'John'
})
.select({
	name: o => o.name+' '+o.lastName
})
```

Which results in:
```
[
	{ name: 'Jane Doe'}
]
```

## Documentation

- The [Developers Manual](docs/manual.md) will guide you on how to get started and how to use JAQT.
- The [Reference](docs/reference.md) explains all the parts in detail.


<a name="contributions"></a>
## Contributions

Contributions are welcome. Please fork the github repository and make your changes there, then open a pull request.
If you find any bugs or other issues, please use the github repository Issues. Check if your issue has already been posted before you add a new issue.

The github repository is at https://github.com/muze-nl/jaqt

<a name="license"></a>
## License

This software is licensed under MIT open source license. See the [License](./LICENSE) file.
