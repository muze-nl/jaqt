import { _, from, asc, desc, many, one, first, avg, count } from '../src/jaqt.mjs'
import tap from 'tap'
let crypto;

try {
  crypto = await import('node:crypto');
} catch (err) {
  console.error('crypto support is disabled!');
}

const seen = new Map()

function replacer(key, value) {
	if (value && typeof value == 'object') {
		if (seen.has(value)) {
			let id = seen.get(value)
			return {
				'@type': 'link',
				'@ref': id
			}
		}
		let id = crypto.randomUUID()
		value['@id'] = id
		seen.set(value, id)
	}
	return value
}

function reviver(key, value) {
	if (value && typeof value == 'object') {
		if (value['@id']) {
			seen.set(value['@id'], value)
		} else if (value['@type']=='link') {
			value = seen.get(value['@ref'])
		}
	}
	return value
}

let data = [
	{
		name: 'Jane',
		friends: []
	},
	{
		name: 'John',
		friends: []
	}
]

data[0].friends.push(data[1])
data[1].friends.push(data[0])

tap.test('graph', t => {
	let jsonString = JSON.stringify(data, replacer)
	let jsonData = JSON.parse(jsonString, reviver)
	t.same(jsonData, data)
	t.end()
})
