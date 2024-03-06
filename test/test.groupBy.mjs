import { _, from, asc, desc, sum, avg, count, max, min } from '../src/whereselect.mjs'
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
		]
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
		]

	}
]

tap.test("groupby", t => {
	let grouped = from(data).groupBy({
		lastName: _.name
	})
	t.same(grouped['Doe'][0], data[0].name)
	t.same(grouped['Doe'][1], data[1].name)
	t.end()
})

tap.test("groupby-array", t => {
	let grouped = from(data)
	.groupBy({
		pets: {
			name: _
		}
	})
	t.same(grouped.Lilo[0], data[0])
	t.same(grouped.Lilo[1], data[1])
	t.same(grouped.Stitch[0], data[0])
	t.end()
})

tap.test("groupby-array-string", t => {
	let grouped = from(data)
	.groupBy({
		pets: {
			name: (o,a) => { a.push(o.name) }
		}
	})
	t.equal(grouped.Lilo[0], data[0].name)
	t.equal(grouped.Lilo[1], data[1].name)
	t.equal(grouped.Stitch[0], data[0].name)
	t.end()
})

const products = [
	{
		category: "Car",
		name: "Cadillac",
		price: 50000
	},
	{
		category: "Car",
		name: "Mini",
		price: 25000
	},
	{
		category: "Bike",
		name: "Gazelle",
		price: 2000
	},
	{
		category: "Bike",
		name: "Sparte",
		price: 1500
	}
]	

tap.test("groupby-sum", t => {
	let grouped = from(products)
	.groupBy({
		category: sum(_.price)
	})
	t.equal(grouped.Car, 75000)
	t.equal(grouped.Bike, 3500)
	t.end()
})

tap.test("groupby-avg", t => {
	let grouped = from(products)
	.groupBy({
		category: avg(_.price)
	})
	t.ok(grouped.Car==37500)
	t.ok(grouped.Bike==1750)
	t.end()
})

tap.test("groupby-count", t => {
	let grouped = from(products)
	.groupBy({
		category: count()
	})
	t.ok(grouped.Car==2)
	t.ok(grouped.Bike==2)
	t.end()
})

tap.test("groupby-max", t => {
	let grouped = from(products)
	.groupBy({
		category: max(_.price)
	})
	t.ok(grouped.Car==50000)
	t.ok(grouped.Bike==2000)
	t.end()
})

tap.test("groupby-min", t => {
	let grouped = from(products)
	.groupBy({
		category: min(_.price)
	})
	t.ok(grouped.Car==25000)
	t.ok(grouped.Bike==1500)
	t.end()
})

tap.test("groupby-null", t => {
	let grouped = from(null)
	.groupBy({
		lastName: _.name
	})
	t.ok(grouped, null)
	t.end()
})
