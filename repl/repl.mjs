import fs from 'fs'
import repl from 'repl';
import * as jaqt from '../src/jaqt.mjs'
import * as util from 'util'

const data = JSON.parse(fs.readFileSync('repl/data.json'))

	let server = repl.start({
		ignoreUndefined: true
	})

	server.context.data = data; // leave ; here
	['_', 'from', 'not', 'anyOf', 'allOf', 'asc', 'desc', 
		'sum', 'avg', 'count', 'max', 'min', 'one', 'many', 'first'].forEach(f => {
		server.context[f] = jaqt[f]
	})

	server.context.show = (data) => {
		console.log(JSON.stringify(data, null, 2))
	}

	if (process.env.NODE_REPL_HISTORY) {
		server.setupHistory(process.env.NODE_REPL_HISTORY, e => {
			if (e) console.log(e)
		})
	} else {
		console.log('Set environment variable NODE_REPL_HISTORY=.repl_history to enable persistent REPL history')
	}

