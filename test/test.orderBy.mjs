import { _, from, asc, desc, sum, avg, count, max, min, distinct } from '../src/jaqt.mjs'
import tap from 'tap'

const data = [
	{
		name: 'John',
		lastName: 'Doe',
		friends: [],
		dob: '1972-09-20',
		pets: [
			{
				name: "Lilo",
				type: "Dog"
			},
			{
				name: "Stitch",
				type: "Cat"
			}
		],
		metrics: {
			height: 185
		}
	},
	{
		name: 'Jane',
		lastName: 'Doe',
		friends: [],
		dob: '1976-02-27',
		pets: [
			{
				name: "Lilo",
				type: "Dog"
			}
		],
		metrics: {
			height: 175
		}
	}
]

tap.test('orderBy-name', t => {
	let result = from(data)
	.select({
		name: _
	})
	.orderBy({
		name: asc
	})
	t.same(result[0].name, 'Jane')
	t.same(result[1].name, 'John')
	t.end()
})

tap.test('orderBy-deep', t => {
	let result = from(data)
	.orderBy({
		metrics: {
			height: asc
		}
	})
	.select({
		name: _
	})
	t.same(result[0].name, 'Jane')
	t.same(result[1].name, 'John')
	t.end()
})