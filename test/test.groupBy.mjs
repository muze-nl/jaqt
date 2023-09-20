import { _, from, asc, desc } from '../src/whereselect.mjs'
import tap from 'tap'

const data = [
	{
		name: 'John',
		lastName: 'Doe',
		friends: [],
		dob: '1972-09-20'
	},
	{
		name: 'Jane',
		lastName: 'Doe',
		friends: [],
		dob: '1976-02-27'
	}
]

tap.test("groupby", t => {
	let grouped = from(data).groupBy({
		lastName: o => from(o).select({name:_})
	})
	t.same(grouped['Doe'][0].name, data[0].name)
	t.same(grouped['Doe'][1].name, data[1].name)
	t.end()
})