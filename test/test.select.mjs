import { _, from, asc, desc } from '../src/jaqt.mjs'
import tap from 'tap'

const data = [
	{
		name: 'John',
		lastName: 'Doe',
		friends: [],
		dob: '1972-09-20',
		isnull: null,
		hasNull: [ null ]
	},
	{
		name: 'Jane',
		lastName: 'Doe',
		friends: [],
		dob: '1976-02-27',
		isNull: null,
		hasNull: [null]
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

// this makes sure that you can return static
// strings in a select that happen to be a
// property name
tap.test('select-string', t => {
	let result = from(data).select({
		naam: 'name'
	})
	t.same(result[0].naam, 'name')
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

tap.test('select-single-function', t => {
	let fn = (data) => {
		return { name: data.name + ' ' + data.lastName }
	}
	let result = from(data).select(fn)
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

tap.test('empty-from', t => {
	let result = from(null)
	.where({
		name: 'John'
	})
	.select({
		name: _
	})
	t.same(null, result)
	t.end()
})

tap.test('array-functions', t => {
	let result = from(data)
	.filter(o => o.name==='John')
	.select({
		dob: _
	})
	t.same(data[0].dob, result[0].dob)
	t.end()
})

tap.test('ignore undefined results', t => {
	let result = from(data)
	.select({
		foo: _.foo
	})
	t.notHas(result[0], {foo:{}})
	t.end()

})

tap.test('select-spread', t => {
	let names = {
		name: _,
		lastName: _
	}
	let result = from(data)
	.select({
		...names,
		foo: 'bar'
	})
	t.same(result[0].name, 'John')
	t.same(result[0].lastName, 'Doe')
	t.same(result[0].foo, 'bar')
	t.end()
})

tap.test('select-orderBy', t => {
	let result = from(data)
	.orderBy({
		name: asc
	})
	.select({
		name: _
	})
	t.same(result[0].name, 'Jane')
	t.same(result[1].name, 'John')
	t.end()
})

tap.test('select-orderBy-deep', t => {
	const data = [
		{
			name: 'Jane',
			job: {
				title: 'CFO',
				salary: 210000
			}
		},
		{
			name: 'John',
			job: {
				title: 'CEO',
				salary: 250000
			}
		}
	]

	let result = from(data)
	.orderBy({
		job: {
			salary: desc
		}
	})
	.select({
		name: _
	})
	t.same(result[0].name, 'John')
	t.same(result[1].name, 'Jane')
	t.end()
})

tap.test('select-null', t => {
	let result = from(data)
	.select({
		name: _,
		foo: _
	})
	let check = typeof result[0].foo == 'undefined'
	t.ok(check)
	t.end()
})

tap.test('select-from-null', t => {
	let result = from(null)
	.select({
		name: _,
		foo: _
	})
	let check = result == null
	t.ok(check)
	t.end()
})

tap.test('select-from-null-child', t => {
	let result = from(data)
	.select({
		name: _,
		foo: {
			name: _
		}
	})
	let check = result[0].foo == null
	t.ok(check)
	t.end()
})

tap.test('select-null-property', t => {
	let result = from(data)
	.select({
		name: _,
		isNull: {
			bar: _.name
		},
		hasNull: {
			bar: _.name
		}
	})
	let check = result[0].foo == null
	t.ok(check)
	t.end()	
})