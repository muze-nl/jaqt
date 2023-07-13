import { _, from } from '../src/whereselect.mjs'
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
		name: /J.*/
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
		name: _ => _.name[1]==='o'
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