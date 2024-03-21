# jaqt reference manual

- [from()](#from)
- [where()](#where)
   - [not()](#not)
   - [anyOf()](#anyOf)
   - [allOf()](#allOf)
- [select()](#select)
	- [one()](#one)
	- [meny()](#many)
- [orderBy()](#orderBy)
- [groupBy()](#groupBy)
	- [count()](#count)
	- [sum()](#sum)
	- [avg()](#avg)
	- [min()](#min)
	- [max()](#max)
- [nested queries](#nested)

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

<a name="one"></a>
### one()

If your select can return one or an array of values, and you want to make sure that it always returns just one value, you can use this function like this:

```javascript
const data = [
	{
		name: "John",
		friends: ["Jane","Joss"]
	},
	{
		name: "Jane",
		friends: "John"
	}
]

from(data)
.select({
	friends: one(_)
})
```

You can additionally specify which one to get, the first or the last (last is the default):

```javascript
from(data)
.select({
	friend: one(_.friends, 'first')
})
```

For even more control, you can also pass a function to return the correct value. This function
is only ever called if there are multiple values in an array:

```javascript
from(data)
.select({
	friend: one(_.friends, a => a.pop())
})
```

<a name="many"></a>
### many()

If your select can return one value or an array of values, and you want to make sure that it always returns an array, you can use this function like this:

```javascript
const data = [
	{
		name: "John",
		friends: ["Jane","Joss"]
	},
	{
		name: "Jane",
		friends: "John"
	}
]

from(data)
.select({
	friends: many(_)
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
