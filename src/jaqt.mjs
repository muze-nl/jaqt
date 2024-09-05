/**
 * checks if data is a plain object and not null, String, Number, Boolean or Array or other classes
 * 
 * @param  {mixed}  data The data to check
 * @return {Boolean}     True if data is a plain object
 */
function isPlainObject(data) 
{
    return data?.constructor === Object 
        || data?.constructor === undefined // object with null prototype: Object.create(null)
}

export function one(selectFn, whichOne='last') {
    return (data, key, context) => {
        let result = selectFn(data, key, context)
        if (Array.isArray(result)) {
            if (whichOne=='last') {
                result = result.pop()
            } else if (whichOne=='first') {
                result = result.shift()
            } else if (typeof whichOne == 'function') {
                result = whichOne(result)
            }
        }
        return result
    }
}

export function many(selectFn) {
    return (data, key, context) => {
        let result = selectFn(data, key, context)
        if (result == null) {
            result = []
        } else if (!Array.isArray(result)) {
            result = [result]
        }
        return result
    }
}

export function first(...args) {
    return (data, key, context) => {
        let result = null
        for (let arg of args) {
            if (typeof arg == 'function') {
                result = arg(data, key, context)
                if (result!=null && result!==undefined && result!=="") {
                    return result
                }
            } else {
                return arg
            }
        }
        return null
    }
}

/**
 * implements a minimal graphql-alike selection syntax, using plain javascript
 * use with from(...arr).select
 * 
 * @param  {object|function} filter Which keys with which values you want
 * @return Function a function that selects values from objects as defined by filter
 */
function getSelectFn(filter) {
    let fns = []
    if (filter instanceof Function) {
        fns.push(filter)
    } else for (const [filterKey, filterValue] of Object.entries(filter)) {
        if (isPlainObject(filterValue)) {
            fns.push( (data) => { 
                return {
                    [filterKey]: from(data[filterKey]).select(filterValue)
                }
            })
        } else if (filterValue instanceof Function) {
            fns.push( (data) => {
                return {
                    [filterKey]: filterValue(data, filterKey, 'select')
                }
            })
        } else {
            fns.push( (data) => {
                return {
                    [filterKey]: filterValue 
                }
            })
        }
    }
    if (fns.length==1) {
        return fns[0]
    }
    return (data) => {
        let result = {}
        for (let fn of fns) {
            Object.assign(result, fn(data))
        }
        return result
    }
}

/**
 * This function checks whether the given data matches the given pattern
 * Pattern can be a function, a regular expression, an object or a literal value
 * The pattern is matched recursively
 * Use with from(...arr).where
 * 
 * @param  {mixed} pattern The pattern to test
 * @return Function        The filter function
 */
export function getMatchFn(pattern)
{
    let fns = []
    if (Array.isArray(pattern)) {
        fns.push(anyOf(...pattern))
    } else if (pattern instanceof RegExp) {
        fns.push((data) => pattern.test(data))
    } else if (pattern instanceof Function) {
        fns.push((data) => pattern(data))
    } else if (isPlainObject(pattern)) {
        let patternMatches = {}
        for (const [wKey, wVal] of Object.entries(pattern)) {
            patternMatches[wKey] = getMatchFn(wVal)
        }
        let matchFn = (data) => {
            if (Array.isArray(data)) {
                return data.filter(element => matchFn(element)).length>0
            }
            if (!isPlainObject(data)) {
                return false
            }
            for (let wKey in patternMatches) {
                let patternMatchFn = patternMatches[wKey]
                if (!patternMatchFn(data[wKey])) {
                    return false
                }
            }
            return true
        }
        fns.push(matchFn)
    } else {
        fns.push((data) => {
            if (Array.isArray(data)) {
                return data.filter(element => pattern==element).length>0
            } else {
                return pattern==data
            }
        })
    }
    if (fns.length==1) {
        return fns[0]
    }
    return (data) => {
        let result = {}
        for (let fn of fns) {
            if (!fn(data)) {
                return false
            }
        }
        return true
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
 * Returns a function to sort an array according to the pattern. A pattern is
 * an object with keys which are a sub pattern object or
 * one of the asc/desc symbols, or a custom sort(a,b) function
 * @param  {mixed} pattern The comparison pattern
 * @return Function The function to use with toSorted()
 */
export function getSortFn(pattern) {
    let comparisons = Object.entries(pattern)
    let fns = []
    for (let [key,compare] of comparisons) {
        if (compare instanceof Function) {
            fns.push(compare)
        } else if (isPlainObject(compare)) {
            let subFn = getSortFn(compare)
            fns.push((a,b) => subFn(a[key],b[key]))
        } else if (compare === asc) {
            fns.push((a,b) => (a[key]>b[key] ? 1 : a[key]<b[key] ? -1: 0))
        } else if (compare === desc) {
            fns.push((a,b) => (a[key]<b[key] ? 1 : a[key]>b[key] ? -1: 0))
        } else {
            throw new Error('Unknown sort order',compare)
        }
    }
    if (fns.length==1) {
        return fns[0] // special case, if you only have one sort element, just return that, it is faster
    }
    return (a,b) => {
        for (let fn of fns) {
            let result = fn(a,b)
            if (result!==0) {
                return result
            }
        }
        return 0
    }
}

/**
 * Like getSelectFn this accepts an object, but function values must be
 * reducers.
 * @param  {object|function} filter Which keys with which values you want
 * @return Function a function that reduces values
 */
export function getAggregateFn(filter) {
    let fns = []
    if (filter instanceof Function) {
        fns.push(filter)
    } else for (const [filterKey, filterValue] of Object.entries(filter)) {
        if (isPlainObject(filterValue)) {
            fns.push( (a, o) => { 
                if (!isPlainObject(a)) {
                    a = {}
                }
                a[filterKey] = from(o[filterKey]).reduce(filterValue, [])
                return a
            })
        } else if (filterValue instanceof Function) {
            fns.push( (a, o) => {
                if (!isPlainObject(a)) {
                    a = {}
                }
                if (o.reduce) {
                    a[filterKey] = o.reduce(filterValue, a[filterKey] || [])
                } else {
                    a[filterKey] = filterValue(a[filterKey] || [], o)
                }
                return a
            })
        } else {
            fns.push( (a, o) => {
                if (!isPlainObject(a)) {
                    a = {}
                }
                a[filterKey] = filterValue 
                return a
            })
        }
    }
    if (fns.length==1) {
        return fns[0]
    }
    return (a, o) => {
        let result = {}
        for (let fn of fns) {
            Object.assign(result, fn(a,o))
        }
        return result
    }
}

/**
 * This is an alternative implementation of Object.groupBy
 * With support for objects being part of multiple groups
 * So if pointerFn() returns an array, each element of the
 * array is a group
 * 
 */
function getMatchingGroups(data, pointerFn) {
    let result = {}
    for (let entity of data) {
        let groups = pointerFn(entity)
        if (!Array.isArray(groups)) {
            groups = [groups]
        }
        for (let group of groups) {
            if (typeof group!='string' && !(group instanceof String)) {
                console.warn('JAQT: groupBy(selector) can only handle string values, got:',group)
                continue
            }
            if (!result[group]) {
                result[group] = []
            }
            result[group].push(entity)
        }
    }
    return result
}

/**
 * Returns a function that groups an array by one or more values defined in the pattern
 * 
 * @param (object) data     The data to parse and get the group from
 * @param (array) properties  The properties to group by, in order, should be pointer functions
 */
function groupBy(data, pointerFunctions) {
    let pointerFn = pointerFunctions.shift()
    let groups = getMatchingGroups(data, pointerFn)
    if (pointerFunctions.length) {
        for (let group in groups) {
            groups[group] = groupBy(groups[group], pointerFunctions)
        }
    }
    return groups
}

/**
 * Creates a function to sum (add) all grouped values, assumes/enforces all values are floats
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.price
 * @return Function function (value, accumulator) => accumulator + value
 */
export function sum(fetchFn) {
    return (a,o) => {
        if (Array.isArray(a)) {            
            a = 0
        }
        a += parseFloat(fetchFn(o)) || 0
        return a
    }
}

/**
 * Creates a function to average all grouped values, assumes/enforces all values are floats 
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.price
 * @return Function function (value, accumulator) => average(accumulator + value)
 */
export function avg(fetchFn) {
    return (a,o) => {
        if (Array.isArray(a)) {
            a = new Number(0)
            a.count = 0
        }
        let count = a.count+1
        a = new Number(a + ((parseFloat(fetchFn(o)) || 0) - a) / count)
        a.count = count
        return a
    }
}

/**
 * Creates a function that removes duplicate values from the grouped data
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.name
 * @return Function 
 */
export function distinct(fetchFn) {
    return (a, o) => {
        let v = fetchFn(o)
        if (!a.includes[v]) {
            a.push(v)
        }
        return a
    }
}

/**
 * Creates a function to count all grouped values
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.price
 * @return Function function (value, accumulator) => accumulator + 1
 */
export function count() {
    return (a, o) => {
        if (Array.isArray(a)) {
            a = 0
        }
        return a+1
    }
}

/**
 * Creates a function to find the maximum value in all grouped values, assumes/enforces all values are floats 
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.price
 * @return Function function (value, accumulator) => Math.max(accumulator, value)
 */
export function max(fetchFn) {
    return (a,o) => {
        if (Array.isArray(a)) {
            a = Number.NEGATIVE_INFINITY
        }
        let value = parseFloat(fetchFn(o))
        if (!isNaN(value) && value>a) {
            a = value
        }
        return a
    }
}

/**
 * Creates a function to find the minimum value in all grouped values, assumes/enforces all values are floats 
 * 
 * @param fetchFn   the function that fetches the correct value, e.g. _.price
 * @return Function function (value, accumulator) => Math.min(accumulator, value)
 */
export function min(fetchFn) {
    return (a,o) => {
        if (Array.isArray(a)) {
            a = Number.POSITIVE_INFINITY
        }
        let value = parseFloat(fetchFn(o))
        if (!isNaN(value) && value<a) {
            a = value
        }
        return a
    }
}

/**
 * Not inverts the result from the matches function.
 * It returns a function expecting a data parameter and inverts the result
 * of matching that data with the pattern given to not()
 * 
 * @param  {mixed} pattern The pattern to match not
 * @return {function}      A function that inverts the match, with a single data parameter
 */
export function not(...pattern) 
{
    let matchFn = getMatchFn(pattern)
    return data => !matchFn(data)
}

/**
 * AnyOf returns a function that returns true if any of the patterns match the data parameter
 * 
 * @param  {...mixed} patterns The patterns to test
 * @return {Boolean}           True if at least one pattern matches
 */
export function anyOf(...patterns) 
{
    let matchFns = patterns.map(pattern => getMatchFn(pattern))
    return data => matchFns.some(fn => fn(data))
}

/**
 * AllOf returns a function that returns true if all of the patterns match the data parameter
 * 
 * @param  {...mixed} patterns The patterns to test
 * @return {Boolean}           True if all of the patterns match
 */
export function allOf(...patterns)
{
    let matchFns = patterns.map(pattern => getMatchFn(pattern))
    return data => matchFns
        .map(matchFn => matchFn(data))
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
                        let matchFn = getMatchFn(shape)
                        return new Proxy(target
                            .filter(element => matchFn(element))
                            , DataProxyHandler)
                    }
                break
                case 'select':
                    return function(filter) {
                        let selectFn = getSelectFn(filter)
                        return new Proxy(target
                            .map(selectFn)
                            , DataProxyHandler)
                    }
                break
                case 'reduce':
                    return function(pattern, initial=[]) {
                        let aggregateFn = getAggregateFn(pattern)
                        let temp = target.reduce(aggregateFn, initial)
                        if (Array.isArray(temp)) {
                            return new Proxy(temp, DataProxyHandler)
                        } else if (isPlainObject(temp)) {
                            return new Proxy(temp, GroupByProxyHandler)
                        } else {
                            return temp
                        }
                    }
                break
                case 'orderBy':
                    return function(pattern) {
                        let sortFn = getSortFn(pattern)
                        return new Proxy(target
                            .toSorted(sortFn)
                            , DataProxyHandler)
                    }
                break
                case 'groupBy':
                    return function(...groups) {
                        let temp = groupBy(target, groups)
                        return new Proxy(temp
                            , GroupByProxyHandler)
                    }
                break
            }
        }
        if (target && typeof target==='object') {
            if (property==='select') {
                return function(filter) {
                    let selector = getSelectFn(filter)
                    return new Proxy(selector(target), DataProxyHandler)
                }
            }
        }
        if (target && typeof target[property]==='function') {
            return new Proxy(target[property], FunctionProxyHandler)
        }
        return target[property]
    }
}

const GroupByProxyHandler = {
    get(target, property)
    {
        switch(property) {
            case 'select':
                return function(filter) {
                    let selectFn = getSelectFn(filter)
                    let result = {}
                    for (let group in target) {
                        if (Array.isArray(target[group])) {
                            result[group] = new Proxy(target[group].map(selectFn), DataProxyHandler)
                        } else {
                            result[group] = new Proxy(target[group], GroupByProxyHandler)
                        }
                    }
                    return result
                }
            break
            case 'reduce':
                return function(pattern, initial=[]) {
                    let aggregateFn = getAggregateFn(pattern)
                    let result = {}
                    for (let group in target) {
                        if (Array.isArray(target[group])) {
                            let temp = target[group].reduce(aggregateFn, initial)
                            if (Array.isArray(temp)) {
                                result[group] = new Proxy(temp, DataProxyHandler)
                            } else if (isPlainObject(temp)) {
                                result[group] = new Proxy(temp, GroupByProxyHandler)
                            } else {
                                result[group] = temp
                            }
                        } else {
                            result[group] = new Proxy(target[group], GroupByProxyHandler)
                        }
                    }
                    return result
                }
            break
            default:
                if (Array.isArray(target[property])) {
                    return from(target[property])
                }
                return target[property]
            break
        }        
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
        switch(property) {
            case 'where':
                return function() {
                    return new Proxy([], EmptyHandler)
                }
            break
            case 'reduce':
            case 'select':
                return function() {
                    return null
                }
            break
            case 'orderBy':
                return function() {
                    return new Proxy([], EmptyHandler)
                }
            break
            case 'groupBy':
                return function() {
                    return new Proxy([], EmptyHandler)
                }
            break
        }
        if (target && typeof target[property]==='function') {
            return new Proxy(target[property], FunctionProxyHandler)
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
 * This is the function factory that builds the _ function
 * It will return a function that walks over the root object to
 * return the correct data
 * 
 * @param {array} path The list of properties to access in order
 * @return {function} The accessor function that returns the data matching the path
 */
function getPointerFn(path) {
    /**
     * The json pointer function
     * @param  {mixed} data Any data
     * @param  {string} key Optional key for data objects in select context or group in groupBy context
     * @return {mixed} data or data[key]
     */
    return (data, key) => {
        if (path?.length>0) {
            let localPath = path.slice()
            let prop
            while(prop = localPath.shift()) {
                if (Array.isArray(data) && parseInt(prop)!=prop) {
                    localPath.unshift(prop) // put it back to call in .map
                    return data.map(getPointerFn(localPath))
                } else {
                    data = data?.[prop]
                }
            }
            return data
        } else if (key) {
            return data[key]
        } else {
            return data
        }
    }
}

/**
 * Handler for the getval proxy, used to implement _
 * The get trap handles things like _.key, it returns a function
 * so that select can apply it on result objects
 * 
 * @type {Object}
 */
const pointerHandler = (path) => {
    if (!path) {
        path = []
    }
    return {
        get(target, property)
        {
            if (property=='constructor' || typeof property == 'symbol') {
                return target[property]
            }
            // creates a new path, which is passed to pointerFn en pointerHandler
            // so it is kept in a new stack frame
            let newpath = path.concat([property])
            return new Proxy(getPointerFn(newpath), pointerHandler(newpath))
        },
        apply(target, thisArg, argumentsList)
        {
            return target(...argumentsList)
        }
    }
}

/**
 * Placeholder in select queries that gets replaced with the 
 * object or value being selected, or a specific key of that object
 * 
 * @type {Proxy}
 */
export const _ = new Proxy(getPointerFn(), pointerHandler())
