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

tap.test('select', t => {
	let result = from(data).select({
		name: _
	})
	t.same(result[0].name,data[0].name)
	t.same(result[1].name,data[1].name)
	t.end()
})

tap.test('select-alt', t => {
	let result = from(data).select({
		name: _.name
	})
	t.same(result[0].name,data[0].name)
	t.same(result[1].name,data[1].name)
	t.end()	
})

tap.test('select-alias', t => {
	let result = from(data).select({
		newname: _.name
	})
	t.same(result[0].newname,data[0].name)
	t.same(result[1].newname,data[1].name)
	t.end()	
})

tap.test('select-function', t => {
	let result = from(data).select({
		name: _ => _.name+' '+_.lastName
	})
	t.same(result[0].name,data[0].name+' '+data[0].lastName)
	t.same(result[1].name,data[1].name+' '+data[1].lastName)
	t.end()	
})

tap.test('select-deep', t => {
	let result = from(data).select({
		friends: {
			name: _
		}
	})
	t.same(result[0].friends[0].name, data[0].friends[0].name)
	t.same(result[1].friends[0].name, data[1].friends[0].name)
	t.end()
})

tap.test('object-select', t => {
	let object = data[0]
	let result = from(object).select({
		name: _
	})
	t.same(result.name, object.name)
	t.end()
})

tap.test('nested-from', t => {
	let result = from(data)
	.where({
		name: 'John'
	})
	.select({
		name: _,
		friends: d => {
			return from(data).where({
				name: 'Jane'
			}).select({
				name: _
			})
		}
	})
	t.same([{
		name: 'John',
		friends: [{
			name: 'Jane'
		}]
	}], result)
	t.end()
})