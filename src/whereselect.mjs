/**
 * checks if data is an object and not null, String, Number, Boolean or Array
 * 
 * @param  {mixed}  data The data to check
 * @return {Boolean}     True if data is an object and not null, String, Number, Boolean or Array
 */
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

/**
 * implements a minimal graphql-alike selection syntax, using plain javascript
 * use with Array.prototype.select defined above
 * 
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
				let resultValue = null
        if (isObject(filterValue)) {
            if (Array.isArray(data[filterKey])) {
                resultValue = from(data[filterKey]).select(filterValue)
            } else if (isObject(data[filterKey])) {
                resultValue = select(data[filterKey], filterValue)
            } else { // data[filterKey] doesn't exist
                //result[filterKey] = null
            }
        } else if (filterValue instanceof Function) {
            resultValue = filterValue(data, filterKey)
        } else {
            resultValue = filterValue
        }
				if (resultValue!==undefined) {
					  result[filterKey] = resultValue
				}        
    }
    return result
}

/**
 * This function checks whether the given data matches the given pattern
 * Pattern can be a function, a regular expression, an object or a literal value
 * The pattern is matched recursively
 * 
 * @param  {mixed} data    The data to match to the pattern
 * @param  {mixed} pattern The pattern to test
 * @return {Boolean}         True if the pattern matches the data
 */
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
        return pattern==data
    }
}

/**
 * If used in a pattern for orderBy(), denotes that the key
 * value should be sorted ascending
 */
export const asc = Symbol('asc')

/**
 * If used in a pattern for orderBy(), denotes that the key
 * value should be sorted descending
 */
export const desc = Symbol('desc')

/**
 * Sorts an array according to the pattern. A pattern is
 * an object with keys which are a sub pattern object or
 * one of the asc/desc symbols, or a custom sort(a,b) function
 * @param  {mixed} a       The first entry to compare
 * @param  {mixed} b       The second entry to compare
 * @param  {mixed} pattern The comparison pattern
 * @return {int}           Either 1, 0 or -1
 */
export function orderBy(a, b, pattern)
{
		let comparisons = Object.entries(pattern)
		for (var [key,compare] of comparisons) {
				let result = 0
				if (typeof a[key] == 'undefined' && typeof b[key] == 'undefined') {
						continue
				}
				if (compare instanceof Function) {
						result = compare(a[key],b[key])
				}	else if (isObject(compare)) {
					  result = orderBy(a[key],b[key],compare)
				} else {
						if (compare==asc) {
							result = (a[key]>b[key] ? 1 : (a[key]<b[key] ? -1: 0) )
						} else {
							result = (a[key]<b[key] ? 1 : (a[key]>b[key] ? -1: 0) )
						}
				}
				if (result!==0) {
					 return result
				}
		}
		return 0
}

/**
 * Not inverts the result from the matches function.
 * It returns a function expecting a data parameter and inverts the result
 * of matching that data with the pattern given to not()
 * 
 * @param  {mixed} pattern The pattern to match not
 * @return {function}      A function that inverts the match, with a single data parameter
 */
export function not(pattern) 
{
    return data => !matches(pattern,data)
}

/**
 * AnyOf returns a function that returns true if any of the patterns match the data parameter
 * 
 * @param  {...mixed} patterns The patterns to test
 * @return {Boolean}           True if at least one pattern matches
 */
export function anyOf(...patterns) 
{
    return data => patterns.some(pattern => matches(data, pattern))
}

/**
 * AllOf returns a function that returns true if all of the patterns match the data parameter
 * 
 * @param  {...mixed} patterns The patterns to test
 * @return {Boolean}           True if all of the patterns match
 */
export function allOf(...patterns)
{
    return data => patterns
        .map(pattern => matches(data, pattern))
        .filter(value => !value)
        .length===0
}

/**
 * Handler for proxying functions like filter, map, etc. So that
 * results of those functions will still be proxied when using from()
 * and you can chain .select() after it
 * 
 * @type {Object}
 */
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

/**
 * Handler for proxying data returned with from()
 * 
 * @type {Object}
 */
const DataProxyHandler = {
    get(target, property) 
    {
        if (Array.isArray(target)) {
        		switch(property) {
		        		case 'where':
		                return function(shape) {
		                    return new Proxy(target.filter(element => matches(element, shape)), DataProxyHandler)
		                }
                break
                case 'select':
		                return function(filter) {
					              return new Proxy(target.map(element => select(element, filter)), DataProxyHandler)
		                }
              	break
                case 'orderBy':
		                return function(pattern) {
					              return new Proxy(target.sort((a,b) => orderBy(a, b, pattern)), DataProxyHandler)
		                }
               	break
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

/**
 * Handler for proxying null of undefined values, so that
 * you can still chain the from.where.select functions
 * 
 * @type {Object}
 */
const EmptyHandler = {
    get(target, property) 
    {
        if (property==='where') {
            return function() {
                return new Proxy([], EmptyHandler)
            }
        }
        if (property==='select') {
            return function() {
                return null
            }
        }
        return null
    }
}

/**
 * This returns a proxy object for the given data, that adds
 * .where() and .select() functions
 * 
 * @param  {mixed} data The data to proxy
 * @return {Proxy}      The proxy
 */
export function from(data) 
{
    if (!data || typeof data !== 'object') {
        return new Proxy([], EmptyHandler)
    }
    return new Proxy(data, DataProxyHandler)
}

/**
 * This is the function that _ is mapped to
 * It returns either the data given, or if a key is set, 
 * it returns the value of data[key]
 * This allows you to use either _ or _.key in the select()
 * queries
 * 
 * @param  {mixed} data Any data
 * @param  {string} key Optional key for data objects
 * @return {mixed}      Data or data[key]
 */
function getVal(data, key) 
{
  return key ? data[key] : data
}

/**
 * Handler for the getval proxy, used to implement _
 * The get trap handles things like _.key, it returns a function
 * so that select can apply it on result objects
 * 
 * @type {Object}
 */
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

/**
 * Placeholder in select queries that gets replaced with the 
 * object or value being selected, or a specific key of that object
 * 
 * @type {Proxy}
 */
export const _ = new Proxy(getVal, handler)
