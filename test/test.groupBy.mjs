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
			height: "175"
		}

	}
]

// tap.test('groupBy', t => {
// 	let grouped = from(data).groupBy(_.lastName)
// 	t.same(grouped['Doe'][0], data[0])
// 	t.same(grouped['Doe'][1], data[1])
// 	t.end()
// })

tap.test("groupby-array", t => {
	let grouped = from(data)
	.groupBy(_.pets.name)
	t.same(grouped.Lilo[0], data[0])
	t.same(grouped.Lilo[1], data[1])
	t.same(grouped.Stitch[0], data[0])
	t.end()
})

tap.test("groupby-error", t => {
	let grouped = from(data)
	.groupBy(_.pets)
	// console.warn gives information, should it throw? choosing not to for now, so inconsistent data
	// doesn't affect correct data.
	t.same(grouped, {})
	t.end()
})

tap.test('groupBy-select', t => {
	let grouped = from(data)
	.groupBy(_.pets.name)
	.select({
		name: _
	})
	t.equal(grouped.Lilo[0].name, data[0].name)
	t.equal(grouped.Lilo[1].name, data[1].name)
	t.equal(grouped.Stitch[0].name, data[0].name)
	t.end()
})

const products = [
	{
		category: "Car",
		name: "Cadillac",
		color: "red",
		price: 50000
	},
	{
		category: "Car",
		name: "Mini",
		price: 25000,
		color: "red"
	},
	{
		category: "Bike",
		name: "Gazelle",
		price: 2000,
		color: "blue"
	},
	{
		category: "Bike",
		name: "Sparte",
		price: 1500,
		color: "green"
	}
]

tap.test("groupby-sum", t => {
	let grouped = from(products)
	.groupBy(_.category)
	.reduce(sum(_.price))
	t.equal(grouped.Car, 75000)
	t.equal(grouped.Bike, 3500)
	t.end()
})

tap.test("groupby-avg", t => {
	let grouped = from(products)
	.groupBy(_.category)
	.reduce(avg(_.price))
	t.equal(grouped.Car, 37500)
	t.equal(grouped.Bike, 1750)
	t.end()
})

tap.test("groupby-count", t => {
	let grouped = from(products)
	.groupBy(_.category)
	.reduce(count())
	t.ok(grouped.Car==2)
	t.ok(grouped.Bike==2)
	t.end()
})

tap.test("groupby-max", t => {
	let grouped = from(products)
	.groupBy(_.category)
	.reduce(max(_.price))
	t.ok(grouped.Car==50000)
	t.ok(grouped.Bike==2000)
	t.end()
})

tap.test("groupby-min", t => {
	let grouped = from(products)
	.groupBy(_.category)
	.reduce(min(_.price))
	t.ok(grouped.Car==25000)
	t.ok(grouped.Bike==1500)
	t.end()
})

tap.test("groupby-null", t => {
	let grouped = from(null)
	.groupBy(_.name)
	t.ok(grouped, null)
	t.end()
})

tap.test("groupby-distinct", t => {
	let grouped = from(products)
	.groupBy(_.category)
	.reduce(distinct(_.color))
	t.same(Object.keys(grouped).length, 2)
	t.end()
})

tap.test("groupby-deep", t => {
	let grouped = from(data)
	.groupBy(_.lastName)
	.reduce(sum(_.metrics.height))
	t.same(grouped.Doe, 360)
	t.end()
})