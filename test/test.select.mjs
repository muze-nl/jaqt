import _ from '../src/whereselect.mjs'
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

data[0].friends = data[1]
data[1].friends = data[0]

tap.test('select-name', t => {
	let result = data.select({
		name: _
	})
	t.same(result[0].name,data[0].name)
	t.same(result[1].name,data[1].name)
	t.end()
})
