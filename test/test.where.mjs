import { _, from, not, anyOf, allOf } from '../src/whereselect.mjs'
import tap from 'tap'

const data = [
	{
		name: 'John',
		lastName: 'Doe',
		friends: []
	},
	{
		name: 'Jane',
		lastName: 'Doe',
		friends: []
	}
]

data[0].friends.push(data[1])
data[1].friends.push(data[0])

tap.test('match-exact', t => {
	let result = from(data).where({
		name: 'John'
	})
	t.equal(result[0], data[0])
	t.end()
})

tap.test('match-regexp', t => {
	let result = from(data).where({
		name: new RegExp('J.*')
	})
	t.same(result, data)
	t.end()
})

tap.test('match-deep', t => {
	let result = from(data).where({
		friends: {
			name: 'John'
		}
	})
	t.equal(result[0],data[1])
	t.end()
})

tap.test('match-function', t => {
	let result = from(data).where({
		name: name => name[1]==='o'
	})
	t.equal(result[0], data[0])
	t.end()
})

tap.test('where-select', t => {
	let result = from(data).where({
		name: 'John'
	}).select({
		name: _,
		lastName: _
	})
	t.same(result[0], {
		name: 'John',
		lastName: 'Doe'
	})
	t.end()
})

tap.test('where-not', t => {
	let result = from(data).where({
		name: not('John')
	}).select({
		name: _
	})
	t.same(result[0], { name: 'Jane'})
	t.end()
})

tap.test('where-anyOf', t => {
	let result = from(data).where({
		name: anyOf('John','Jane')
	}).select({
		name: _
	})
	t.same(result[0], { name: 'John'})
	t.same(result[1], { name: 'Jane'})
	t.end()
})

tap.test('where-allOf', t => {
	let result = from(data).where(
		 allOf(
		 	{
		 		name: 'John'
		 	},
		 	{
			 	lastName: 'Doe'
		 	}
		 )
	).select({
		name: _
	})
	t.same(result[0], { name: 'John'})
	t.equal(result.length, 1)
	t.end()
})

tap.test('where-string-object', t => {
	const data = [
		{
			name: new String('John'),
			lastName: 'Doe',
			friends: []
		},
		{
			name: new String('Jane'),
			lastName: 'Doe',
			friends: []
		}
	]
	let result = from(data).where({
	 	name: 'John'
	}).select({
		name: _
	})
	t.same(JSON.stringify(result[0]), '{"name":"John"}')
	t.equal(result.length, 1)
	t.end()
})
