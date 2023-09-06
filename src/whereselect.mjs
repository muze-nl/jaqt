function isObject(data) 
{
	return typeof data === 'object' && !(
		data instanceof String
		|| data instanceof Number
		|| data instanceof Boolean
		|| Array.isArray(data)
		|| data === null
	)
}

function isString(data) 
{
	return typeof data === 'string' || data instanceof String
}

/**
 * implements a minimal graphql-alike selection syntax, using plain javascript
 * use with Array.prototype.select defined above
 * @param  {any}             data   The data to select keys and values from
 * @param  {object|function} filter Which keys with which values you want
 * @return {object}                 The result object 
 */
export function select(data, filter) 
{
	let result = {} // make sure that arrays are handled somewhere else
	if (filter instanceof Function) {
		filter = filter(data)
	}

	for (const [filterKey,filterValue] of Object.entries(filter)) {

		let source, target
		
		if (filterKey == '_') {
			target = result
			source = data
		} else {
			if (!result[filterKey]) {
				result[filterKey] = {}
			}
			target = result[filterKey]
			source = data[filterKey]
		}
		
		if (isObject(filterValue)) {
			if (Array.isArray(source)) {
				Object.assign(target, from(source).select(filterValue))
			} else if (isObject(source)) {
				Object.assign(target, select(source, filterValue))
			} else { // data[filterKey] doesn't exist
				target = null
			}
		} else if (filterValue instanceof Function) {
			target = filterValue(data, filterKey)
		} else {
			target = filterValue
		}
		
		if (target!==result[filterKey]) { 
			// target is a new value, so update result[filterKey]
			if (filterKey=='_' && isObject(target)) {
				// promote target into result
				Object.assign(result, target)
			} else if (target !== null) { 
				// if target is not an object, assign it to filterKey, even if it is '_', 
				// since I can't promote a non object into an object
				result[filterKey] = target
			} else {
				// target is null, so remove the key from result, to mimic GrapQL behaviour
				delete result[filterKey]
			}
		}
	}
	return result
}

export function matches(data, pattern) 
{
	if (Array.isArray(pattern)) {
		//return from(data).where(pattern).length>0
		throw new Error('not yet implemented')
	} else if (pattern instanceof RegExp) {
		return pattern.test(data)
	} else if (pattern instanceof Function) {
		return pattern(data)
	} else if (isObject(pattern)) {
		if (Array.isArray(data)) {
			return data.filter(element => matches(element,pattern)).length>0
		}
		if (!isObject(data)) {
			return false
		}
		for (const [wKey, wVal] of Object.entries(pattern)) {
		  if (!matches(data[wKey], wVal)) {
		  	return false
		  }
		}
		return true
	} else {
		return pattern===data
	}
}

export function not(match) 
{
	return data => !matches(match,data)
}

export function anyOf(...variants) 
{
	return data => variants
		.find(variant => matches(data, variant))
		.length>0
}

export function allOf(...variants)
{
	return data => variants
		.map(variant => matches(data, variant))
		.filter(value => !value)
		.length===0
}

const FunctionProxyHandler = {
	apply(target, thisArg, argumentsList) 
	{
		let result = target.apply(thisArg,argumentsList)
		if (typeof result === 'object') {
			return new Proxy(result, DataProxyHandler)
		}
		return result
	}
}

const DataProxyHandler = {
	get(target, property) 
	{
		if (Array.isArray(target)) {
			if (property==='where') {
				return function(shape) {
					return new Proxy(target.filter(element => matches(element, shape)), DataProxyHandler)
				}
			}
			if (property==='select') {
				return function(filter) {
  		    return new Proxy(target.map(element => select(element, filter)), DataProxyHandler)
				}
			}
		}
		if (target && typeof target==='object') {
			if (property==='select') {
				return function(filter) {
					return new Proxy(select(target, filter), DataProxyHandler)
				}
			}
		}
		if (target && typeof target[property]==='function') {
			return new Proxy(target[property], FunctionProxyHandler)
		}
		return target[property]
	}
}

const EmptyHandler = {
	get(target, property) 
	{
		if (property==='where') {
			return function(shape) {
				return new Proxy([], EmptyHandler)
			}
		}
		if (property==='select') {
			return function(filter) {
				return null
			}
		}
		return null
	}
}

export function from(data) 
{
	if (!data || typeof data !== 'object') {
		return new Proxy([], EmptyHandler)
	}
	return new Proxy(data, DataProxyHandler)
}

function getVal(data, key) 
{
	if (key==='_') {
		key = false
	}
  return key ? data[key] : data
}

const handler = {
	get(target, property) 
	{
		return element => element[property]
	},
	apply(target, thisArg, argumentsList) 
	{
		return target(...argumentsList)
	}
}

export const _ = new Proxy(getVal, handler)
