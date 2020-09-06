
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Components\Hero.svelte generated by Svelte v3.24.1 */

    const file = "src\\Components\\Hero.svelte";

    function create_fragment(ctx) {
    	let section;
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let h2;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = `${/*message*/ ctx[0].title}`;
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = `${/*message*/ ctx[0].subtitle}`;
    			attr_dev(h1, "class", "title");
    			add_location(h1, file, 10, 6, 201);
    			attr_dev(h2, "class", "subtitle");
    			add_location(h2, file, 11, 6, 247);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file, 9, 4, 170);
    			attr_dev(div1, "class", "hero-body");
    			add_location(div1, file, 8, 2, 141);
    			attr_dev(section, "class", "hero is-primary");
    			add_location(section, file, 7, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, h2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const message = {
    		title: "愛情武打線上研究教材",
    		subtitle: "By Maowman"
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Hero", $$slots, []);
    	$$self.$capture_state = () => ({ message });
    	return [message];
    }

    class Hero extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* node_modules\svelma\src\components\Icon.svelte generated by Svelte v3.24.1 */

    const file$1 = "node_modules\\svelma\\src\\components\\Icon.svelte";

    function create_fragment$1(ctx) {
    	let span;
    	let i;
    	let i_class_value;
    	let span_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", i_class_value = "" + (/*newPack*/ ctx[8] + " fa-" + /*icon*/ ctx[0] + " " + /*customClass*/ ctx[2] + " " + /*newCustomSize*/ ctx[6]));
    			add_location(i, file$1, 53, 2, 1189);
    			attr_dev(span, "class", span_class_value = "icon " + /*size*/ ctx[1] + " " + /*newType*/ ctx[7] + " " + (/*isLeft*/ ctx[4] && "is-left" || "") + " " + (/*isRight*/ ctx[5] && "is-right" || ""));
    			toggle_class(span, "is-clickable", /*isClickable*/ ctx[3]);
    			add_location(span, file$1, 52, 0, 1046);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newPack, icon, customClass, newCustomSize*/ 325 && i_class_value !== (i_class_value = "" + (/*newPack*/ ctx[8] + " fa-" + /*icon*/ ctx[0] + " " + /*customClass*/ ctx[2] + " " + /*newCustomSize*/ ctx[6]))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*size, newType, isLeft, isRight*/ 178 && span_class_value !== (span_class_value = "icon " + /*size*/ ctx[1] + " " + /*newType*/ ctx[7] + " " + (/*isLeft*/ ctx[4] && "is-left" || "") + " " + (/*isRight*/ ctx[5] && "is-right" || ""))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*size, newType, isLeft, isRight, isClickable*/ 186) {
    				toggle_class(span, "is-clickable", /*isClickable*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { type = "" } = $$props;
    	let { pack = "fas" } = $$props;
    	let { icon } = $$props;
    	let { size = "" } = $$props;
    	let { customClass = "" } = $$props;
    	let { customSize = "" } = $$props;
    	let { isClickable = false } = $$props;
    	let { isLeft = false } = $$props;
    	let { isRight = false } = $$props;
    	let newCustomSize = "";
    	let newType = "";

    	const writable_props = [
    		"type",
    		"pack",
    		"icon",
    		"size",
    		"customClass",
    		"customSize",
    		"isClickable",
    		"isLeft",
    		"isRight"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Icon", $$slots, []);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(9, type = $$props.type);
    		if ("pack" in $$props) $$invalidate(10, pack = $$props.pack);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(2, customClass = $$props.customClass);
    		if ("customSize" in $$props) $$invalidate(11, customSize = $$props.customSize);
    		if ("isClickable" in $$props) $$invalidate(3, isClickable = $$props.isClickable);
    		if ("isLeft" in $$props) $$invalidate(4, isLeft = $$props.isLeft);
    		if ("isRight" in $$props) $$invalidate(5, isRight = $$props.isRight);
    	};

    	$$self.$capture_state = () => ({
    		type,
    		pack,
    		icon,
    		size,
    		customClass,
    		customSize,
    		isClickable,
    		isLeft,
    		isRight,
    		newCustomSize,
    		newType,
    		newPack
    	});

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(9, type = $$props.type);
    		if ("pack" in $$props) $$invalidate(10, pack = $$props.pack);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(2, customClass = $$props.customClass);
    		if ("customSize" in $$props) $$invalidate(11, customSize = $$props.customSize);
    		if ("isClickable" in $$props) $$invalidate(3, isClickable = $$props.isClickable);
    		if ("isLeft" in $$props) $$invalidate(4, isLeft = $$props.isLeft);
    		if ("isRight" in $$props) $$invalidate(5, isRight = $$props.isRight);
    		if ("newCustomSize" in $$props) $$invalidate(6, newCustomSize = $$props.newCustomSize);
    		if ("newType" in $$props) $$invalidate(7, newType = $$props.newType);
    		if ("newPack" in $$props) $$invalidate(8, newPack = $$props.newPack);
    	};

    	let newPack;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pack*/ 1024) {
    			 $$invalidate(8, newPack = pack || "fas");
    		}

    		if ($$self.$$.dirty & /*customSize, size*/ 2050) {
    			 {
    				if (customSize) $$invalidate(6, newCustomSize = customSize); else {
    					switch (size) {
    						case "is-small":
    							break;
    						case "is-medium":
    							$$invalidate(6, newCustomSize = "fa-lg");
    							break;
    						case "is-large":
    							$$invalidate(6, newCustomSize = "fa-3x");
    							break;
    						default:
    							$$invalidate(6, newCustomSize = "");
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*type*/ 512) {
    			 {
    				if (!type) $$invalidate(7, newType = "");
    				let splitType = [];

    				if (typeof type === "string") {
    					splitType = type.split("-");
    				} else {
    					for (let key in type) {
    						if (type[key]) {
    							splitType = key.split("-");
    							break;
    						}
    					}
    				}

    				if (splitType.length <= 1) $$invalidate(7, newType = ""); else $$invalidate(7, newType = `has-text-${splitType[1]}`);
    			}
    		}
    	};

    	return [
    		icon,
    		size,
    		customClass,
    		isClickable,
    		isLeft,
    		isRight,
    		newCustomSize,
    		newType,
    		newPack,
    		type,
    		pack,
    		customSize,
    		click_handler
    	];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			type: 9,
    			pack: 10,
    			icon: 0,
    			size: 1,
    			customClass: 2,
    			customSize: 11,
    			isClickable: 3,
    			isLeft: 4,
    			isRight: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[0] === undefined && !("icon" in props)) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	}

    	get type() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pack() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pack(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customClass() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customClass(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customSize() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customSize(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isClickable() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isClickable(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isLeft() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isLeft(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isRight() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isRight(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    function omit(obj, ...keysToOmit) {
      return Object.keys(obj).reduce((acc, key) => {
        if (keysToOmit.indexOf(key) === -1) acc[key] = obj[key];
        return acc
      }, {})
    }

    function getEventsAction(component) {
      return node => {
        const events = Object.keys(component.$$.callbacks);
        const listeners = [];
        events.forEach(event =>
          listeners.push(listen(node, event, e => bubble(component, e)))
        );
        return {
          destroy: () => {
            listeners.forEach(listener => listener());
          }
        };
      };
    }

    /* node_modules\svelma\src\components\Button.svelte generated by Svelte v3.24.1 */

    const { Error: Error_1 } = globals;
    const file$2 = "node_modules\\svelma\\src\\components\\Button.svelte";

    // (85:22) 
    function create_if_block_3(ctx) {
    	let a;
    	let t0;
    	let span;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*iconLeft*/ ctx[7] && create_if_block_5(ctx);
    	const default_slot_template = /*$$slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);
    	let if_block1 = /*iconRight*/ ctx[8] && create_if_block_4(ctx);
    	let a_levels = [{ href: /*href*/ ctx[1] }, /*props*/ ctx[11]];
    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			add_location(span, file$2, 96, 4, 2314);
    			set_attributes(a, a_data);
    			toggle_class(a, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(a, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(a, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(a, "is-rounded", /*rounded*/ ctx[6]);
    			add_location(a, file$2, 85, 2, 2047);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if (if_block0) if_block0.m(a, null);
    			append_dev(a, t0);
    			append_dev(a, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append_dev(a, t1);
    			if (if_block1) if_block1.m(a, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_1*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*iconLeft*/ ctx[7]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*iconLeft*/ 128) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(a, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16384) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], dirty, null, null);
    				}
    			}

    			if (/*iconRight*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*iconRight*/ 256) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(a, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				(!current || dirty & /*href*/ 2) && { href: /*href*/ ctx[1] },
    				dirty & /*props*/ 2048 && /*props*/ ctx[11]
    			]));

    			toggle_class(a, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(a, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(a, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(a, "is-rounded", /*rounded*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (if_block0) if_block0.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(85:22) ",
    		ctx
    	});

    	return block;
    }

    // (66:0) {#if tag === 'button'}
    function create_if_block(ctx) {
    	let button;
    	let t0;
    	let span;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*iconLeft*/ ctx[7] && create_if_block_2(ctx);
    	const default_slot_template = /*$$slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);
    	let if_block1 = /*iconRight*/ ctx[8] && create_if_block_1(ctx);
    	let button_levels = [/*props*/ ctx[11], { type: /*nativeType*/ ctx[2] }];
    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			add_location(span, file$2, 77, 4, 1882);
    			set_attributes(button, button_data);
    			toggle_class(button, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(button, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(button, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(button, "is-rounded", /*rounded*/ ctx[6]);
    			add_location(button, file$2, 66, 2, 1599);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block0) if_block0.m(button, null);
    			append_dev(button, t0);
    			append_dev(button, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append_dev(button, t1);
    			if (if_block1) if_block1.m(button, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*iconLeft*/ ctx[7]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*iconLeft*/ 128) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(button, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16384) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], dirty, null, null);
    				}
    			}

    			if (/*iconRight*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*iconRight*/ 256) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(button, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(button, button_data = get_spread_update(button_levels, [
    				dirty & /*props*/ 2048 && /*props*/ ctx[11],
    				(!current || dirty & /*nativeType*/ 4) && { type: /*nativeType*/ ctx[2] }
    			]));

    			toggle_class(button, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(button, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(button, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(button, "is-rounded", /*rounded*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block0) if_block0.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(66:0) {#if tag === 'button'}",
    		ctx
    	});

    	return block;
    }

    // (94:4) {#if iconLeft}
    function create_if_block_5(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconLeft*/ ctx[7],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconLeft*/ 128) icon_changes.icon = /*iconLeft*/ ctx[7];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(94:4) {#if iconLeft}",
    		ctx
    	});

    	return block;
    }

    // (100:4) {#if iconRight}
    function create_if_block_4(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconRight*/ ctx[8],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconRight*/ 256) icon_changes.icon = /*iconRight*/ ctx[8];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(100:4) {#if iconRight}",
    		ctx
    	});

    	return block;
    }

    // (75:4) {#if iconLeft}
    function create_if_block_2(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconLeft*/ ctx[7],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconLeft*/ 128) icon_changes.icon = /*iconLeft*/ ctx[7];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(75:4) {#if iconLeft}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#if iconRight}
    function create_if_block_1(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconRight*/ ctx[8],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconRight*/ 256) icon_changes.icon = /*iconRight*/ ctx[8];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(81:4) {#if iconRight}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tag*/ ctx[0] === "button") return 0;
    		if (/*tag*/ ctx[0] === "a") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { tag = "button" } = $$props;
    	let { type = "" } = $$props;
    	let { size = "" } = $$props;
    	let { href = "" } = $$props;
    	let { nativeType = "button" } = $$props;
    	let { loading = false } = $$props;
    	let { inverted = false } = $$props;
    	let { outlined = false } = $$props;
    	let { rounded = false } = $$props;
    	let { iconLeft = null } = $$props;
    	let { iconRight = null } = $$props;
    	let { iconPack = null } = $$props;
    	let iconSize = "";

    	onMount(() => {
    		if (!["button", "a"].includes(tag)) throw new Error(`'${tag}' cannot be used as a tag for a Bulma button`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, ['default']);

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("tag" in $$new_props) $$invalidate(0, tag = $$new_props.tag);
    		if ("type" in $$new_props) $$invalidate(12, type = $$new_props.type);
    		if ("size" in $$new_props) $$invalidate(13, size = $$new_props.size);
    		if ("href" in $$new_props) $$invalidate(1, href = $$new_props.href);
    		if ("nativeType" in $$new_props) $$invalidate(2, nativeType = $$new_props.nativeType);
    		if ("loading" in $$new_props) $$invalidate(3, loading = $$new_props.loading);
    		if ("inverted" in $$new_props) $$invalidate(4, inverted = $$new_props.inverted);
    		if ("outlined" in $$new_props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("rounded" in $$new_props) $$invalidate(6, rounded = $$new_props.rounded);
    		if ("iconLeft" in $$new_props) $$invalidate(7, iconLeft = $$new_props.iconLeft);
    		if ("iconRight" in $$new_props) $$invalidate(8, iconRight = $$new_props.iconRight);
    		if ("iconPack" in $$new_props) $$invalidate(9, iconPack = $$new_props.iconPack);
    		if ("$$scope" in $$new_props) $$invalidate(14, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Icon,
    		omit,
    		tag,
    		type,
    		size,
    		href,
    		nativeType,
    		loading,
    		inverted,
    		outlined,
    		rounded,
    		iconLeft,
    		iconRight,
    		iconPack,
    		iconSize,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), $$new_props));
    		if ("tag" in $$props) $$invalidate(0, tag = $$new_props.tag);
    		if ("type" in $$props) $$invalidate(12, type = $$new_props.type);
    		if ("size" in $$props) $$invalidate(13, size = $$new_props.size);
    		if ("href" in $$props) $$invalidate(1, href = $$new_props.href);
    		if ("nativeType" in $$props) $$invalidate(2, nativeType = $$new_props.nativeType);
    		if ("loading" in $$props) $$invalidate(3, loading = $$new_props.loading);
    		if ("inverted" in $$props) $$invalidate(4, inverted = $$new_props.inverted);
    		if ("outlined" in $$props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("rounded" in $$props) $$invalidate(6, rounded = $$new_props.rounded);
    		if ("iconLeft" in $$props) $$invalidate(7, iconLeft = $$new_props.iconLeft);
    		if ("iconRight" in $$props) $$invalidate(8, iconRight = $$new_props.iconRight);
    		if ("iconPack" in $$props) $$invalidate(9, iconPack = $$new_props.iconPack);
    		if ("iconSize" in $$props) $$invalidate(10, iconSize = $$new_props.iconSize);
    		if ("props" in $$props) $$invalidate(11, props = $$new_props.props);
    	};

    	let props;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(11, props = {
    			...omit($$props, "loading", "inverted", "nativeType", "outlined", "rounded", "type"),
    			class: `button ${type} ${size} ${$$props.class || ""}`
    		});

    		if ($$self.$$.dirty & /*size*/ 8192) {
    			 {
    				if (!size || size === "is-medium") {
    					$$invalidate(10, iconSize = "is-small");
    				} else if (size === "is-large") {
    					$$invalidate(10, iconSize = "is-medium");
    				} else {
    					$$invalidate(10, iconSize = size);
    				}
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		tag,
    		href,
    		nativeType,
    		loading,
    		inverted,
    		outlined,
    		rounded,
    		iconLeft,
    		iconRight,
    		iconPack,
    		iconSize,
    		props,
    		type,
    		size,
    		$$scope,
    		$$slots,
    		click_handler,
    		click_handler_1
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			tag: 0,
    			type: 12,
    			size: 13,
    			href: 1,
    			nativeType: 2,
    			loading: 3,
    			inverted: 4,
    			outlined: 5,
    			rounded: 6,
    			iconLeft: 7,
    			iconRight: 8,
    			iconPack: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get tag() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tag(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nativeType() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nativeType(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inverted() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inverted(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rounded() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rounded(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconLeft() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconLeft(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconRight() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconRight(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconPack() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconPack(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelma\src\components\Field.svelte generated by Svelte v3.24.1 */
    const file$3 = "node_modules\\svelma\\src\\components\\Field.svelte";
    const get_default_slot_changes = dirty => ({ statusType: dirty & /*type*/ 1 });
    const get_default_slot_context = ctx => ({ statusType: /*type*/ ctx[0] });

    // (107:2) {#if label}
    function create_if_block_1$1(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[1]);
    			attr_dev(label_1, "for", /*labelFor*/ ctx[2]);
    			attr_dev(label_1, "class", "label");
    			add_location(label_1, file$3, 107, 4, 2643);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    			/*label_1_binding*/ ctx[18](label_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 2) set_data_dev(t, /*label*/ ctx[1]);

    			if (dirty & /*labelFor*/ 4) {
    				attr_dev(label_1, "for", /*labelFor*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    			/*label_1_binding*/ ctx[18](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(107:2) {#if label}",
    		ctx
    	});

    	return block;
    }

    // (111:2) {#if message}
    function create_if_block$1(ctx) {
    	let p;
    	let t;
    	let p_class_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*message*/ ctx[3]);
    			attr_dev(p, "class", p_class_value = "help " + /*type*/ ctx[0] + " svelte-zc3i6x");
    			add_location(p, file$3, 111, 4, 2772);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    			/*p_binding*/ ctx[19](p);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 8) set_data_dev(t, /*message*/ ctx[3]);

    			if (dirty & /*type*/ 1 && p_class_value !== (p_class_value = "help " + /*type*/ ctx[0] + " svelte-zc3i6x")) {
    				attr_dev(p, "class", p_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			/*p_binding*/ ctx[19](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(111:2) {#if message}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let div_class_value;
    	let current;
    	let if_block0 = /*label*/ ctx[1] && create_if_block_1$1(ctx);
    	const default_slot_template = /*$$slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], get_default_slot_context);
    	let if_block1 = /*message*/ ctx[3] && create_if_block$1(ctx);

    	let div_levels = [
    		/*props*/ ctx[11],
    		{
    			class: div_class_value = "field " + /*type*/ ctx[0] + " " + /*fieldType*/ ctx[9] + " " + /*newPosition*/ ctx[10] + " " + (/*$$props*/ ctx[12].class || "")
    		}
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "is-expanded", /*expanded*/ ctx[5]);
    			toggle_class(div, "is-grouped-multiline", /*groupMultiline*/ ctx[4]);
    			toggle_class(div, "svelte-zc3i6x", true);
    			add_location(div, file$3, 105, 0, 2451);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			/*div_binding*/ ctx[20](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, type*/ 65537) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[16], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}

    			if (/*message*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*props*/ 2048 && /*props*/ ctx[11],
    				(!current || dirty & /*type, fieldType, newPosition, $$props*/ 5633 && div_class_value !== (div_class_value = "field " + /*type*/ ctx[0] + " " + /*fieldType*/ ctx[9] + " " + /*newPosition*/ ctx[10] + " " + (/*$$props*/ ctx[12].class || ""))) && { class: div_class_value }
    			]));

    			toggle_class(div, "is-expanded", /*expanded*/ ctx[5]);
    			toggle_class(div, "is-grouped-multiline", /*groupMultiline*/ ctx[4]);
    			toggle_class(div, "svelte-zc3i6x", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			/*div_binding*/ ctx[20](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { type = "" } = $$props;
    	let { label = null } = $$props;
    	let { labelFor = "" } = $$props;
    	let { message = "" } = $$props;
    	let { grouped = false } = $$props;
    	let { groupMultiline = false } = $$props;
    	let { position = "" } = $$props;
    	let { addons = true } = $$props;
    	let { expanded = false } = $$props;
    	setContext("type", () => type);
    	let el;
    	let labelEl;
    	let messageEl;
    	let fieldType = "";
    	let hasIcons = false;
    	let iconType = "";
    	let mounted = false;
    	let newPosition = "";

    	onMount(() => {
    		$$invalidate(22, mounted = true);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Field", $$slots, ['default']);

    	function label_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			labelEl = $$value;
    			$$invalidate(7, labelEl);
    		});
    	}

    	function p_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			messageEl = $$value;
    			$$invalidate(8, messageEl);
    		});
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			el = $$value;
    			$$invalidate(6, el);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(12, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("type" in $$new_props) $$invalidate(0, type = $$new_props.type);
    		if ("label" in $$new_props) $$invalidate(1, label = $$new_props.label);
    		if ("labelFor" in $$new_props) $$invalidate(2, labelFor = $$new_props.labelFor);
    		if ("message" in $$new_props) $$invalidate(3, message = $$new_props.message);
    		if ("grouped" in $$new_props) $$invalidate(13, grouped = $$new_props.grouped);
    		if ("groupMultiline" in $$new_props) $$invalidate(4, groupMultiline = $$new_props.groupMultiline);
    		if ("position" in $$new_props) $$invalidate(14, position = $$new_props.position);
    		if ("addons" in $$new_props) $$invalidate(15, addons = $$new_props.addons);
    		if ("expanded" in $$new_props) $$invalidate(5, expanded = $$new_props.expanded);
    		if ("$$scope" in $$new_props) $$invalidate(16, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		setContext,
    		omit,
    		type,
    		label,
    		labelFor,
    		message,
    		grouped,
    		groupMultiline,
    		position,
    		addons,
    		expanded,
    		el,
    		labelEl,
    		messageEl,
    		fieldType,
    		hasIcons,
    		iconType,
    		mounted,
    		newPosition,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(12, $$props = assign(assign({}, $$props), $$new_props));
    		if ("type" in $$props) $$invalidate(0, type = $$new_props.type);
    		if ("label" in $$props) $$invalidate(1, label = $$new_props.label);
    		if ("labelFor" in $$props) $$invalidate(2, labelFor = $$new_props.labelFor);
    		if ("message" in $$props) $$invalidate(3, message = $$new_props.message);
    		if ("grouped" in $$props) $$invalidate(13, grouped = $$new_props.grouped);
    		if ("groupMultiline" in $$props) $$invalidate(4, groupMultiline = $$new_props.groupMultiline);
    		if ("position" in $$props) $$invalidate(14, position = $$new_props.position);
    		if ("addons" in $$props) $$invalidate(15, addons = $$new_props.addons);
    		if ("expanded" in $$props) $$invalidate(5, expanded = $$new_props.expanded);
    		if ("el" in $$props) $$invalidate(6, el = $$new_props.el);
    		if ("labelEl" in $$props) $$invalidate(7, labelEl = $$new_props.labelEl);
    		if ("messageEl" in $$props) $$invalidate(8, messageEl = $$new_props.messageEl);
    		if ("fieldType" in $$props) $$invalidate(9, fieldType = $$new_props.fieldType);
    		if ("hasIcons" in $$props) hasIcons = $$new_props.hasIcons;
    		if ("iconType" in $$props) iconType = $$new_props.iconType;
    		if ("mounted" in $$props) $$invalidate(22, mounted = $$new_props.mounted);
    		if ("newPosition" in $$props) $$invalidate(10, newPosition = $$new_props.newPosition);
    		if ("props" in $$props) $$invalidate(11, props = $$new_props.props);
    	};

    	let props;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*type*/ 1) {
    			// Determine the icon type
    			 {
    				if (["is-danger", "is-success"].includes(type)) {
    					iconType = type;
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*grouped, mounted, el, labelEl, messageEl, addons*/ 4235712) {
    			 {
    				if (grouped) $$invalidate(9, fieldType = "is-grouped"); else if (mounted) {
    					const childNodes = Array.prototype.filter.call(el.children, c => ![labelEl, messageEl].includes(c));

    					if (childNodes.length > 1 && addons) {
    						$$invalidate(9, fieldType = "has-addons");
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*position, grouped*/ 24576) {
    			// Update has-addons-* or is-grouped-* classes based on position prop
    			 {
    				if (position) {
    					const pos = position.split("-");

    					if (pos.length >= 1) {
    						const prefix = grouped ? "is-grouped-" : "has-addons-";
    						$$invalidate(10, newPosition = prefix + pos[1]);
    					}
    				}
    			}
    		}

    		 $$invalidate(11, props = {
    			...omit($$props, "addons", "class", "expanded", "grouped", "label", "labelFor", "position", "type")
    		});
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		type,
    		label,
    		labelFor,
    		message,
    		groupMultiline,
    		expanded,
    		el,
    		labelEl,
    		messageEl,
    		fieldType,
    		newPosition,
    		props,
    		$$props,
    		grouped,
    		position,
    		addons,
    		$$scope,
    		$$slots,
    		label_1_binding,
    		p_binding,
    		div_binding
    	];
    }

    class Field extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			type: 0,
    			label: 1,
    			labelFor: 2,
    			message: 3,
    			grouped: 13,
    			groupMultiline: 4,
    			position: 14,
    			addons: 15,
    			expanded: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Field",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get type() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelFor() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelFor(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get message() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get grouped() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grouped(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get groupMultiline() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groupMultiline(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addons() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addons(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expanded() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expanded(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelma\src\components\Input.svelte generated by Svelte v3.24.1 */
    const file$4 = "node_modules\\svelma\\src\\components\\Input.svelte";

    // (156:2) {:else}
    function create_else_block(ctx) {
    	let textarea;
    	let textarea_class_value;
    	let events_action;
    	let mounted;
    	let dispose;

    	let textarea_levels = [
    		/*props*/ ctx[17],
    		{ value: /*value*/ ctx[0] },
    		{
    			class: textarea_class_value = "textarea " + /*statusType*/ ctx[14] + "\n      " + /*size*/ ctx[2]
    		},
    		{ disabled: /*disabled*/ ctx[10] }
    	];

    	let textarea_data = {};

    	for (let i = 0; i < textarea_levels.length; i += 1) {
    		textarea_data = assign(textarea_data, textarea_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			set_attributes(textarea, textarea_data);
    			toggle_class(textarea, "svelte-1v5s752", true);
    			add_location(textarea, file$4, 156, 4, 3907);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			/*textarea_binding*/ ctx[30](textarea);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(events_action = /*events*/ ctx[25].call(null, textarea)),
    					listen_dev(textarea, "input", /*onInput*/ ctx[22], false, false, false),
    					listen_dev(textarea, "focus", /*onFocus*/ ctx[23], false, false, false),
    					listen_dev(textarea, "blur", /*onBlur*/ ctx[24], false, false, false),
    					listen_dev(textarea, "change", /*change_handler_1*/ ctx[28], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(textarea, textarea_data = get_spread_update(textarea_levels, [
    				dirty[0] & /*props*/ 131072 && /*props*/ ctx[17],
    				dirty[0] & /*value*/ 1 && { value: /*value*/ ctx[0] },
    				dirty[0] & /*statusType, size*/ 16388 && textarea_class_value !== (textarea_class_value = "textarea " + /*statusType*/ ctx[14] + "\n      " + /*size*/ ctx[2]) && { class: textarea_class_value },
    				dirty[0] & /*disabled*/ 1024 && { disabled: /*disabled*/ ctx[10] }
    			]));

    			toggle_class(textarea, "svelte-1v5s752", true);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			/*textarea_binding*/ ctx[30](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(156:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (143:2) {#if type !== 'textarea'}
    function create_if_block_3$1(ctx) {
    	let input_1;
    	let input_1_class_value;
    	let events_action;
    	let mounted;
    	let dispose;

    	let input_1_levels = [
    		/*props*/ ctx[17],
    		{ type: /*newType*/ ctx[13] },
    		{ value: /*value*/ ctx[0] },
    		{
    			class: input_1_class_value = "input " + /*statusType*/ ctx[14] + " " + /*size*/ ctx[2] + " " + (/*$$props*/ ctx[26].class || "")
    		},
    		{ disabled: /*disabled*/ ctx[10] }
    	];

    	let input_1_data = {};

    	for (let i = 0; i < input_1_levels.length; i += 1) {
    		input_1_data = assign(input_1_data, input_1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input_1 = element("input");
    			set_attributes(input_1, input_1_data);
    			toggle_class(input_1, "svelte-1v5s752", true);
    			add_location(input_1, file$4, 143, 4, 3622);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input_1, anchor);
    			/*input_1_binding*/ ctx[29](input_1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(events_action = /*events*/ ctx[25].call(null, input_1)),
    					listen_dev(input_1, "input", /*onInput*/ ctx[22], false, false, false),
    					listen_dev(input_1, "focus", /*onFocus*/ ctx[23], false, false, false),
    					listen_dev(input_1, "blur", /*onBlur*/ ctx[24], false, false, false),
    					listen_dev(input_1, "change", /*change_handler*/ ctx[27], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input_1, input_1_data = get_spread_update(input_1_levels, [
    				dirty[0] & /*props*/ 131072 && /*props*/ ctx[17],
    				dirty[0] & /*newType*/ 8192 && { type: /*newType*/ ctx[13] },
    				dirty[0] & /*value*/ 1 && input_1.value !== /*value*/ ctx[0] && { value: /*value*/ ctx[0] },
    				dirty[0] & /*statusType, size, $$props*/ 67125252 && input_1_class_value !== (input_1_class_value = "input " + /*statusType*/ ctx[14] + " " + /*size*/ ctx[2] + " " + (/*$$props*/ ctx[26].class || "")) && { class: input_1_class_value },
    				dirty[0] & /*disabled*/ 1024 && { disabled: /*disabled*/ ctx[10] }
    			]));

    			toggle_class(input_1, "svelte-1v5s752", true);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input_1);
    			/*input_1_binding*/ ctx[29](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(143:2) {#if type !== 'textarea'}",
    		ctx
    	});

    	return block;
    }

    // (171:2) {#if icon}
    function create_if_block_2$1(ctx) {
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				isLeft: true,
    				icon: /*icon*/ ctx[8]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty[0] & /*iconPack*/ 512) icon_1_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty[0] & /*icon*/ 256) icon_1_changes.icon = /*icon*/ ctx[8];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(171:2) {#if icon}",
    		ctx
    	});

    	return block;
    }

    // (178:2) {#if !loading && (passwordReveal || statusType)}
    function create_if_block_1$2(ctx) {
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				pack: "fas",
    				isRight: true,
    				isClickable: /*passwordReveal*/ ctx[4],
    				icon: /*passwordReveal*/ ctx[4]
    				? /*passwordVisibleIcon*/ ctx[20]
    				: /*statusTypeIcon*/ ctx[15],
    				type: !/*passwordReveal*/ ctx[4]
    				? /*statusType*/ ctx[14]
    				: "is-primary"
    			},
    			$$inline: true
    		});

    	icon_1.$on("click", /*togglePasswordVisibility*/ ctx[21]);

    	const block = {
    		c: function create() {
    			create_component(icon_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty[0] & /*passwordReveal*/ 16) icon_1_changes.isClickable = /*passwordReveal*/ ctx[4];

    			if (dirty[0] & /*passwordReveal, passwordVisibleIcon, statusTypeIcon*/ 1081360) icon_1_changes.icon = /*passwordReveal*/ ctx[4]
    			? /*passwordVisibleIcon*/ ctx[20]
    			: /*statusTypeIcon*/ ctx[15];

    			if (dirty[0] & /*passwordReveal, statusType*/ 16400) icon_1_changes.type = !/*passwordReveal*/ ctx[4]
    			? /*statusType*/ ctx[14]
    			: "is-primary";

    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(178:2) {#if !loading && (passwordReveal || statusType)}",
    		ctx
    	});

    	return block;
    }

    // (190:2) {#if maxlength && hasCounter && type !== 'number'}
    function create_if_block$2(ctx) {
    	let small;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			small = element("small");
    			t0 = text(/*valueLength*/ ctx[16]);
    			t1 = text(" / ");
    			t2 = text(/*maxlength*/ ctx[5]);
    			attr_dev(small, "class", "help counter svelte-1v5s752");
    			toggle_class(small, "is-invisible", !/*isFocused*/ ctx[12]);
    			add_location(small, file$4, 190, 4, 4664);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    			append_dev(small, t0);
    			append_dev(small, t1);
    			append_dev(small, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*valueLength*/ 65536) set_data_dev(t0, /*valueLength*/ ctx[16]);
    			if (dirty[0] & /*maxlength*/ 32) set_data_dev(t2, /*maxlength*/ ctx[5]);

    			if (dirty[0] & /*isFocused*/ 4096) {
    				toggle_class(small, "is-invisible", !/*isFocused*/ ctx[12]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(190:2) {#if maxlength && hasCounter && type !== 'number'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[1] !== "textarea") return create_if_block_3$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*icon*/ ctx[8] && create_if_block_2$1(ctx);
    	let if_block2 = !/*loading*/ ctx[7] && (/*passwordReveal*/ ctx[4] || /*statusType*/ ctx[14]) && create_if_block_1$2(ctx);
    	let if_block3 = /*maxlength*/ ctx[5] && /*hasCounter*/ ctx[6] && /*type*/ ctx[1] !== "number" && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(div, "class", "control svelte-1v5s752");
    			toggle_class(div, "has-icons-left", /*hasIconLeft*/ ctx[18]);
    			toggle_class(div, "has-icons-right", /*hasIconRight*/ ctx[19]);
    			toggle_class(div, "is-loading", /*loading*/ ctx[7]);
    			toggle_class(div, "is-expanded", /*expanded*/ ctx[3]);
    			add_location(div, file$4, 140, 0, 3439);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t2);
    			if (if_block3) if_block3.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			}

    			if (/*icon*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*icon*/ 256) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!/*loading*/ ctx[7] && (/*passwordReveal*/ ctx[4] || /*statusType*/ ctx[14])) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*loading, passwordReveal, statusType*/ 16528) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*maxlength*/ ctx[5] && /*hasCounter*/ ctx[6] && /*type*/ ctx[1] !== "number") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$2(ctx);
    					if_block3.c();
    					if_block3.m(div, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty[0] & /*hasIconLeft*/ 262144) {
    				toggle_class(div, "has-icons-left", /*hasIconLeft*/ ctx[18]);
    			}

    			if (dirty[0] & /*hasIconRight*/ 524288) {
    				toggle_class(div, "has-icons-right", /*hasIconRight*/ ctx[19]);
    			}

    			if (dirty[0] & /*loading*/ 128) {
    				toggle_class(div, "is-loading", /*loading*/ ctx[7]);
    			}

    			if (dirty[0] & /*expanded*/ 8) {
    				toggle_class(div, "is-expanded", /*expanded*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { value = "" } = $$props;
    	let { type = "text" } = $$props;
    	let { size = "" } = $$props;
    	let { expanded = false } = $$props;
    	let { passwordReveal = false } = $$props;
    	let { maxlength = null } = $$props;
    	let { hasCounter = true } = $$props;
    	let { loading = false } = $$props;
    	let { icon = "" } = $$props;
    	let { iconPack = "" } = $$props;
    	let { disabled = false } = $$props;
    	let input;
    	let isFocused;
    	let isPasswordVisible = false;
    	let newType = "text";
    	let statusType = "";
    	let statusTypeIcon = "";
    	let valueLength = null;
    	const dispatch = createEventDispatcher();
    	const getType = getContext("type");
    	if (getType) statusType = getType() || "";

    	onMount(() => {
    		$$invalidate(13, newType = type);
    	});

    	async function togglePasswordVisibility() {
    		$$invalidate(31, isPasswordVisible = !isPasswordVisible);
    		$$invalidate(13, newType = isPasswordVisible ? "text" : "password");
    		await tick();
    		input.focus();
    	}

    	const onInput = e => {
    		$$invalidate(0, value = e.target.value);
    		$$invalidate(26, $$props.value = value, $$props);
    		dispatch("input", e);
    	};

    	const onFocus = () => $$invalidate(12, isFocused = true);
    	const onBlur = () => $$invalidate(12, isFocused = false);
    	const events = getEventsAction(current_component);
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Input", $$slots, []);

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(11, input);
    		});
    	}

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(11, input);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(26, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("type" in $$new_props) $$invalidate(1, type = $$new_props.type);
    		if ("size" in $$new_props) $$invalidate(2, size = $$new_props.size);
    		if ("expanded" in $$new_props) $$invalidate(3, expanded = $$new_props.expanded);
    		if ("passwordReveal" in $$new_props) $$invalidate(4, passwordReveal = $$new_props.passwordReveal);
    		if ("maxlength" in $$new_props) $$invalidate(5, maxlength = $$new_props.maxlength);
    		if ("hasCounter" in $$new_props) $$invalidate(6, hasCounter = $$new_props.hasCounter);
    		if ("loading" in $$new_props) $$invalidate(7, loading = $$new_props.loading);
    		if ("icon" in $$new_props) $$invalidate(8, icon = $$new_props.icon);
    		if ("iconPack" in $$new_props) $$invalidate(9, iconPack = $$new_props.iconPack);
    		if ("disabled" in $$new_props) $$invalidate(10, disabled = $$new_props.disabled);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		getContext,
    		tick,
    		omit,
    		getEventsAction,
    		current_component,
    		Icon,
    		value,
    		type,
    		size,
    		expanded,
    		passwordReveal,
    		maxlength,
    		hasCounter,
    		loading,
    		icon,
    		iconPack,
    		disabled,
    		input,
    		isFocused,
    		isPasswordVisible,
    		newType,
    		statusType,
    		statusTypeIcon,
    		valueLength,
    		dispatch,
    		getType,
    		togglePasswordVisibility,
    		onInput,
    		onFocus,
    		onBlur,
    		events,
    		props,
    		hasIconLeft,
    		hasIconRight,
    		passwordVisibleIcon
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(26, $$props = assign(assign({}, $$props), $$new_props));
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("type" in $$props) $$invalidate(1, type = $$new_props.type);
    		if ("size" in $$props) $$invalidate(2, size = $$new_props.size);
    		if ("expanded" in $$props) $$invalidate(3, expanded = $$new_props.expanded);
    		if ("passwordReveal" in $$props) $$invalidate(4, passwordReveal = $$new_props.passwordReveal);
    		if ("maxlength" in $$props) $$invalidate(5, maxlength = $$new_props.maxlength);
    		if ("hasCounter" in $$props) $$invalidate(6, hasCounter = $$new_props.hasCounter);
    		if ("loading" in $$props) $$invalidate(7, loading = $$new_props.loading);
    		if ("icon" in $$props) $$invalidate(8, icon = $$new_props.icon);
    		if ("iconPack" in $$props) $$invalidate(9, iconPack = $$new_props.iconPack);
    		if ("disabled" in $$props) $$invalidate(10, disabled = $$new_props.disabled);
    		if ("input" in $$props) $$invalidate(11, input = $$new_props.input);
    		if ("isFocused" in $$props) $$invalidate(12, isFocused = $$new_props.isFocused);
    		if ("isPasswordVisible" in $$props) $$invalidate(31, isPasswordVisible = $$new_props.isPasswordVisible);
    		if ("newType" in $$props) $$invalidate(13, newType = $$new_props.newType);
    		if ("statusType" in $$props) $$invalidate(14, statusType = $$new_props.statusType);
    		if ("statusTypeIcon" in $$props) $$invalidate(15, statusTypeIcon = $$new_props.statusTypeIcon);
    		if ("valueLength" in $$props) $$invalidate(16, valueLength = $$new_props.valueLength);
    		if ("props" in $$props) $$invalidate(17, props = $$new_props.props);
    		if ("hasIconLeft" in $$props) $$invalidate(18, hasIconLeft = $$new_props.hasIconLeft);
    		if ("hasIconRight" in $$props) $$invalidate(19, hasIconRight = $$new_props.hasIconRight);
    		if ("passwordVisibleIcon" in $$props) $$invalidate(20, passwordVisibleIcon = $$new_props.passwordVisibleIcon);
    	};

    	let props;
    	let hasIconLeft;
    	let hasIconRight;
    	let passwordVisibleIcon;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(17, props = {
    			...omit($$props, "class", "value", "type", "size", "passwordReveal", "hasCounter", "loading", "disabled")
    		});

    		if ($$self.$$.dirty[0] & /*icon*/ 256) {
    			 $$invalidate(18, hasIconLeft = !!icon);
    		}

    		if ($$self.$$.dirty[0] & /*passwordReveal, loading, statusType*/ 16528) {
    			 $$invalidate(19, hasIconRight = passwordReveal || loading || statusType);
    		}

    		if ($$self.$$.dirty[1] & /*isPasswordVisible*/ 1) {
    			 $$invalidate(20, passwordVisibleIcon = isPasswordVisible ? "eye-slash" : "eye");
    		}

    		if ($$self.$$.dirty[0] & /*statusType*/ 16384) {
    			 {
    				switch (statusType) {
    					case "is-success":
    						$$invalidate(15, statusTypeIcon = "check");
    						break;
    					case "is-danger":
    						$$invalidate(15, statusTypeIcon = "exclamation-circle");
    						break;
    					case "is-info":
    						$$invalidate(15, statusTypeIcon = "info-circle");
    						break;
    					case "is-warning":
    						$$invalidate(15, statusTypeIcon = "exclamation-triangle");
    						break;
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*value*/ 1) {
    			 {
    				if (typeof value === "string") {
    					$$invalidate(16, valueLength = value.length);
    				} else if (typeof value === "number") {
    					$$invalidate(16, valueLength = value.toString().length);
    				} else {
    					$$invalidate(16, valueLength = 0);
    				}
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		type,
    		size,
    		expanded,
    		passwordReveal,
    		maxlength,
    		hasCounter,
    		loading,
    		icon,
    		iconPack,
    		disabled,
    		input,
    		isFocused,
    		newType,
    		statusType,
    		statusTypeIcon,
    		valueLength,
    		props,
    		hasIconLeft,
    		hasIconRight,
    		passwordVisibleIcon,
    		togglePasswordVisibility,
    		onInput,
    		onFocus,
    		onBlur,
    		events,
    		$$props,
    		change_handler,
    		change_handler_1,
    		input_1_binding,
    		textarea_binding
    	];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{
    				value: 0,
    				type: 1,
    				size: 2,
    				expanded: 3,
    				passwordReveal: 4,
    				maxlength: 5,
    				hasCounter: 6,
    				loading: 7,
    				icon: 8,
    				iconPack: 9,
    				disabled: 10
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expanded() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expanded(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get passwordReveal() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set passwordReveal(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxlength() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxlength(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasCounter() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasCounter(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconPack() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconPack(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelma\src\components\Notices.svelte generated by Svelte v3.24.1 */

    const file$5 = "node_modules\\svelma\\src\\components\\Notices.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "notices " + /*positionClass*/ ctx[1] + " svelte-1mcog5q");
    			add_location(div, file$5, 42, 0, 863);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[4](div);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*positionClass*/ 2 && div_class_value !== (div_class_value = "notices " + /*positionClass*/ ctx[1] + " svelte-1mcog5q")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const notices = {};

    function instance$5($$self, $$props, $$invalidate) {
    	let { position = "top" } = $$props;
    	let container;
    	let positionClass;

    	function insert(el) {
    		container.insertAdjacentElement("afterbegin", el);
    	}

    	const writable_props = ["position"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notices> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Notices", $$slots, []);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("position" in $$props) $$invalidate(2, position = $$props.position);
    	};

    	$$self.$capture_state = () => ({
    		notices,
    		position,
    		container,
    		positionClass,
    		insert
    	});

    	$$self.$inject_state = $$props => {
    		if ("position" in $$props) $$invalidate(2, position = $$props.position);
    		if ("container" in $$props) $$invalidate(0, container = $$props.container);
    		if ("positionClass" in $$props) $$invalidate(1, positionClass = $$props.positionClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*position*/ 4) {
    			 $$invalidate(1, positionClass = position === "top" ? "is-top" : "is-bottom");
    		}
    	};

    	return [container, positionClass, position, insert, div_binding];
    }

    class Notices extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { position: 2, insert: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notices",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get position() {
    		throw new Error("<Notices>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Notices>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get insert() {
    		return this.$$.ctx[3];
    	}

    	set insert(value) {
    		throw new Error("<Notices>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelma\src\components\Notice.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1 } = globals;
    const file$6 = "node_modules\\svelma\\src\\components\\Notice.svelte";

    // (99:0) {#if active}
    function create_if_block$3(ctx) {
    	let div;
    	let div_class_value;
    	let div_aria_hidden_value;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "notice " + /*position*/ ctx[1] + " svelte-1ik1n9x");
    			attr_dev(div, "aria-hidden", div_aria_hidden_value = !/*active*/ ctx[0]);
    			add_location(div, file$6, 99, 2, 1933);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[10](div);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*remove*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*position*/ 2 && div_class_value !== (div_class_value = "notice " + /*position*/ ctx[1] + " svelte-1ik1n9x")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*active*/ 1 && div_aria_hidden_value !== (div_aria_hidden_value = !/*active*/ ctx[0])) {
    				attr_dev(div, "aria-hidden", div_aria_hidden_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { y: /*transitionY*/ ctx[4] });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, fade, {
    				duration: /*transitionOut*/ ctx[2] ? 400 : 0
    			});

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[10](null);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(99:0) {#if active}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*active*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*active*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*active*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const allowedProps = ["active", "position", "duration"];

    function filterProps(props) {
    	const newProps = {};

    	Object.keys(props).forEach(key => {
    		if (allowedProps.includes(key)) newProps[key] = props[key];
    	});

    	return newProps;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { active = true } = $$props;
    	let { position = "is-top" } = $$props;
    	let { duration = 2000 } = $$props;
    	let { transitionOut = true } = $$props;
    	let el;
    	let parent;
    	let timer;

    	function close() {
    		$$invalidate(0, active = false);
    	}

    	function remove() {
    		clearTimeout(timer);

    		// Just making sure
    		$$invalidate(0, active = false);

    		dispatch("destroyed");
    	}

    	async function setupContainers() {
    		await tick;

    		if (!notices.top) {
    			notices.top = new Notices({
    					target: document.body,
    					props: { position: "top" }
    				});
    		}

    		if (!notices.bottom) {
    			notices.bottom = new Notices({
    					target: document.body,
    					props: { position: "bottom" }
    				});
    		}
    	}

    	function chooseParent() {
    		parent = notices.top;
    		if (position && position.indexOf("is-bottom") === 0) parent = notices.bottom;
    		parent.insert(el);
    	}

    	onMount(async () => {
    		await setupContainers();
    		chooseParent();

    		timer = setTimeout(
    			() => {
    				close();
    			},
    			duration
    		);
    	});

    	const writable_props = ["active", "position", "duration", "transitionOut"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notice> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Notice", $$slots, ['default']);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			el = $$value;
    			$$invalidate(3, el);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("duration" in $$props) $$invalidate(6, duration = $$props.duration);
    		if ("transitionOut" in $$props) $$invalidate(2, transitionOut = $$props.transitionOut);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		allowedProps,
    		filterProps,
    		createEventDispatcher,
    		onDestroy,
    		onMount,
    		tick,
    		fly,
    		fade,
    		Notices,
    		notices,
    		dispatch,
    		active,
    		position,
    		duration,
    		transitionOut,
    		el,
    		parent,
    		timer,
    		close,
    		remove,
    		setupContainers,
    		chooseParent,
    		transitionY
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("duration" in $$props) $$invalidate(6, duration = $$props.duration);
    		if ("transitionOut" in $$props) $$invalidate(2, transitionOut = $$props.transitionOut);
    		if ("el" in $$props) $$invalidate(3, el = $$props.el);
    		if ("parent" in $$props) parent = $$props.parent;
    		if ("timer" in $$props) timer = $$props.timer;
    		if ("transitionY" in $$props) $$invalidate(4, transitionY = $$props.transitionY);
    	};

    	let transitionY;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*position*/ 2) {
    			 $$invalidate(4, transitionY = ~position.indexOf("is-top") ? -200 : 200);
    		}
    	};

    	return [
    		active,
    		position,
    		transitionOut,
    		el,
    		transitionY,
    		remove,
    		duration,
    		close,
    		$$scope,
    		$$slots,
    		div_binding
    	];
    }

    class Notice extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			active: 0,
    			position: 1,
    			duration: 6,
    			transitionOut: 2,
    			close: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notice",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get active() {
    		throw new Error("<Notice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Notice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Notice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Notice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Notice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Notice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionOut() {
    		throw new Error("<Notice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionOut(value) {
    		throw new Error("<Notice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx[7];
    	}

    	set close(value) {
    		throw new Error("<Notice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* node_modules\svelma\src\components\Progress.svelte generated by Svelte v3.24.1 */
    const file$7 = "node_modules\\svelma\\src\\components\\Progress.svelte";

    function create_fragment$7(ctx) {
    	let progress;
    	let t0;
    	let t1;
    	let progress_class_value;

    	const block = {
    		c: function create() {
    			progress = element("progress");
    			t0 = text(/*value*/ ctx[0]);
    			t1 = text("%");
    			attr_dev(progress, "class", progress_class_value = "progress " + /*type*/ ctx[1]);
    			attr_dev(progress, "max", /*max*/ ctx[2]);
    			add_location(progress, file$7, 45, 0, 955);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, progress, anchor);
    			append_dev(progress, t0);
    			append_dev(progress, t1);
    			/*progress_binding*/ ctx[6](progress);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) set_data_dev(t0, /*value*/ ctx[0]);

    			if (dirty & /*type*/ 2 && progress_class_value !== (progress_class_value = "progress " + /*type*/ ctx[1])) {
    				attr_dev(progress, "class", progress_class_value);
    			}

    			if (dirty & /*max*/ 4) {
    				attr_dev(progress, "max", /*max*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(progress);
    			/*progress_binding*/ ctx[6](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { value = null } = $$props;
    	let { type = "" } = $$props;
    	let { max = 100 } = $$props;
    	let { duration = 400 } = $$props;
    	let { easing = cubicOut } = $$props;
    	let el;
    	let newValue = tweened(value, { duration, easing });

    	newValue.subscribe(val => {
    		if (el && typeof (value !== undefined)) {
    			el.setAttribute("value", get_store_value(newValue));
    		}
    	});

    	const writable_props = ["value", "type", "max", "duration", "easing"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Progress> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Progress", $$slots, []);

    	function progress_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			el = $$value;
    			$$invalidate(3, el);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("max" in $$props) $$invalidate(2, max = $$props.max);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    		if ("easing" in $$props) $$invalidate(5, easing = $$props.easing);
    	};

    	$$self.$capture_state = () => ({
    		get: get_store_value,
    		tweened,
    		cubicOut,
    		value,
    		type,
    		max,
    		duration,
    		easing,
    		el,
    		newValue
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("max" in $$props) $$invalidate(2, max = $$props.max);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    		if ("easing" in $$props) $$invalidate(5, easing = $$props.easing);
    		if ("el" in $$props) $$invalidate(3, el = $$props.el);
    		if ("newValue" in $$props) $$invalidate(7, newValue = $$props.newValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 1) {
    			 newValue.set(value);
    		}
    	};

    	return [value, type, max, el, duration, easing, progress_binding];
    }

    class Progress extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			value: 0,
    			type: 1,
    			max: 2,
    			duration: 4,
    			easing: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Progress",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get value() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get easing() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set easing(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelma\src\components\Snackbar\Snackbar.svelte generated by Svelte v3.24.1 */

    const { Error: Error_1$1 } = globals;
    const file$8 = "node_modules\\svelma\\src\\components\\Snackbar\\Snackbar.svelte";

    // (96:4) {#if actionText}
    function create_if_block$4(ctx) {
    	let div;
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text(/*actionText*/ ctx[2]);
    			attr_dev(button, "class", button_class_value = "button " + /*newType*/ ctx[4] + " svelte-b4y6vb");
    			add_location(button, file$8, 97, 8, 2637);
    			attr_dev(div, "class", "action svelte-b4y6vb");
    			add_location(div, file$8, 96, 6, 2590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*action*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*actionText*/ 4) set_data_dev(t, /*actionText*/ ctx[2]);

    			if (dirty & /*newType*/ 16 && button_class_value !== (button_class_value = "button " + /*newType*/ ctx[4] + " svelte-b4y6vb")) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(96:4) {#if actionText}",
    		ctx
    	});

    	return block;
    }

    // (90:0) <Notice {...props} bind:this={notice} transitionOut={true}>
    function create_default_slot(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let div1_class_value;
    	let if_block = /*actionText*/ ctx[2] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "text svelte-b4y6vb");
    			add_location(div0, file$8, 91, 4, 2431);
    			attr_dev(div1, "class", div1_class_value = "snackbar " + /*background*/ ctx[1] + " svelte-b4y6vb");
    			attr_dev(div1, "role", "alert");
    			toggle_class(div1, "has-background-dark", !/*background*/ ctx[1]);
    			add_location(div1, file$8, 90, 2, 2338);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			div0.innerHTML = /*message*/ ctx[0];
    			append_dev(div1, t);
    			if (if_block) if_block.m(div1, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 1) div0.innerHTML = /*message*/ ctx[0];
    			if (/*actionText*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*background*/ 2 && div1_class_value !== (div1_class_value = "snackbar " + /*background*/ ctx[1] + " svelte-b4y6vb")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*background, background*/ 2) {
    				toggle_class(div1, "has-background-dark", !/*background*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(90:0) <Notice {...props} bind:this={notice} transitionOut={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let notice_1;
    	let current;
    	const notice_1_spread_levels = [/*props*/ ctx[5], { transitionOut: true }];

    	let notice_1_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < notice_1_spread_levels.length; i += 1) {
    		notice_1_props = assign(notice_1_props, notice_1_spread_levels[i]);
    	}

    	notice_1 = new Notice({ props: notice_1_props, $$inline: true });
    	/*notice_1_binding*/ ctx[11](notice_1);

    	const block = {
    		c: function create() {
    			create_component(notice_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(notice_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const notice_1_changes = (dirty & /*props*/ 32)
    			? get_spread_update(notice_1_spread_levels, [get_spread_object(/*props*/ ctx[5]), notice_1_spread_levels[1]])
    			: {};

    			if (dirty & /*$$scope, background, newType, actionText, message*/ 8215) {
    				notice_1_changes.$$scope = { dirty, ctx };
    			}

    			notice_1.$set(notice_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notice_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notice_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*notice_1_binding*/ ctx[11](null);
    			destroy_component(notice_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { message } = $$props;
    	let { duration = 3500 } = $$props;
    	let { position = "is-bottom-right" } = $$props;
    	let { type = "is-primary" } = $$props;
    	let { background = "" } = $$props;
    	let { actionText = "OK" } = $$props;

    	let { onAction = () => {
    		
    	} } = $$props;

    	let notice;

    	function action() {
    		Promise.resolve(onAction()).then(() => notice.close());
    	}

    	onMount(() => {
    		if (typeof onAction !== "function") throw new Error(`onAction ${onAction} is not a function`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Snackbar", $$slots, []);

    	function notice_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			notice = $$value;
    			$$invalidate(3, notice);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(12, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("message" in $$new_props) $$invalidate(0, message = $$new_props.message);
    		if ("duration" in $$new_props) $$invalidate(7, duration = $$new_props.duration);
    		if ("position" in $$new_props) $$invalidate(8, position = $$new_props.position);
    		if ("type" in $$new_props) $$invalidate(9, type = $$new_props.type);
    		if ("background" in $$new_props) $$invalidate(1, background = $$new_props.background);
    		if ("actionText" in $$new_props) $$invalidate(2, actionText = $$new_props.actionText);
    		if ("onAction" in $$new_props) $$invalidate(10, onAction = $$new_props.onAction);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onDestroy,
    		onMount,
    		fly,
    		fade,
    		Notice,
    		filterProps,
    		message,
    		duration,
    		position,
    		type,
    		background,
    		actionText,
    		onAction,
    		notice,
    		action,
    		newType,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(12, $$props = assign(assign({}, $$props), $$new_props));
    		if ("message" in $$props) $$invalidate(0, message = $$new_props.message);
    		if ("duration" in $$props) $$invalidate(7, duration = $$new_props.duration);
    		if ("position" in $$props) $$invalidate(8, position = $$new_props.position);
    		if ("type" in $$props) $$invalidate(9, type = $$new_props.type);
    		if ("background" in $$props) $$invalidate(1, background = $$new_props.background);
    		if ("actionText" in $$props) $$invalidate(2, actionText = $$new_props.actionText);
    		if ("onAction" in $$props) $$invalidate(10, onAction = $$new_props.onAction);
    		if ("notice" in $$props) $$invalidate(3, notice = $$new_props.notice);
    		if ("newType" in $$props) $$invalidate(4, newType = $$new_props.newType);
    		if ("props" in $$props) $$invalidate(5, props = $$new_props.props);
    	};

    	let newType;
    	let props;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*type*/ 512) {
    			// $: newBackground = background
    			 $$invalidate(4, newType = type && type.replace(/^is-(.*)/, "has-text-$1"));
    		}

    		 $$invalidate(5, props = {
    			...filterProps($$props),
    			position,
    			duration
    		});
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		message,
    		background,
    		actionText,
    		notice,
    		newType,
    		props,
    		action,
    		duration,
    		position,
    		type,
    		onAction,
    		notice_1_binding
    	];
    }

    class Snackbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			message: 0,
    			duration: 7,
    			position: 8,
    			type: 9,
    			background: 1,
    			actionText: 2,
    			onAction: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Snackbar",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !("message" in props)) {
    			console.warn("<Snackbar> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get background() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get actionText() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set actionText(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onAction() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onAction(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    Snackbar.create = create;

    function create(props) {
      if (typeof props === 'string') props = { message: props };

      const snackbar = new Snackbar({
        target: document.body,
        props,
        intro: true,
      });

      snackbar.$on('destroyed', snackbar.$destroy);

      return snackbar;
    }

    /* node_modules\svelma\src\components\Switch.svelte generated by Svelte v3.24.1 */

    const file$9 = "node_modules\\svelma\\src\\components\\Switch.svelte";

    function create_fragment$9(ctx) {
    	let label_1;
    	let input_1;
    	let t0;
    	let div;
    	let div_class_value;
    	let t1;
    	let span;
    	let label_1_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			input_1 = element("input");
    			t0 = space();
    			div = element("div");
    			t1 = space();
    			span = element("span");
    			if (default_slot) default_slot.c();
    			attr_dev(input_1, "type", "checkbox");
    			attr_dev(input_1, "class", "svelte-otqcll");
    			add_location(input_1, file$9, 111, 2, 2340);
    			attr_dev(div, "class", div_class_value = "check " + /*newBackground*/ ctx[4] + " svelte-otqcll");
    			add_location(div, file$9, 113, 2, 2418);
    			attr_dev(span, "class", "control-label svelte-otqcll");
    			add_location(span, file$9, 115, 2, 2463);
    			attr_dev(label_1, "ref", "label");
    			attr_dev(label_1, "class", label_1_class_value = "switch " + /*size*/ ctx[1] + " svelte-otqcll");
    			add_location(label_1, file$9, 110, 0, 2278);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, input_1);
    			input_1.checked = /*checked*/ ctx[0];
    			/*input_1_binding*/ ctx[12](input_1);
    			append_dev(label_1, t0);
    			append_dev(label_1, div);
    			append_dev(label_1, t1);
    			append_dev(label_1, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			/*label_1_binding*/ ctx[13](label_1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input_1, "change", /*input_1_change_handler*/ ctx[11]),
    					listen_dev(input_1, "input", /*input_handler*/ ctx[9], false, false, false),
    					listen_dev(input_1, "click", /*click_handler*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*checked*/ 1) {
    				input_1.checked = /*checked*/ ctx[0];
    			}

    			if (!current || dirty & /*newBackground*/ 16 && div_class_value !== (div_class_value = "check " + /*newBackground*/ ctx[4] + " svelte-otqcll")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*size*/ 2 && label_1_class_value !== (label_1_class_value = "switch " + /*size*/ ctx[1] + " svelte-otqcll")) {
    				attr_dev(label_1, "class", label_1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    			/*input_1_binding*/ ctx[12](null);
    			if (default_slot) default_slot.d(detaching);
    			/*label_1_binding*/ ctx[13](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { checked = false } = $$props;
    	let { type = "is-primary" } = $$props;
    	let { size = "" } = $$props;
    	let { disabled = false } = $$props;
    	let label;
    	let input;
    	const writable_props = ["checked", "type", "size", "disabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Switch> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Switch", $$slots, ['default']);

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function input_1_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(3, input);
    		});
    	}

    	function label_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			label = $$value;
    			$$invalidate(2, label);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("type" in $$props) $$invalidate(5, type = $$props.type);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$props.disabled);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		checked,
    		type,
    		size,
    		disabled,
    		label,
    		input,
    		newBackground
    	});

    	$$self.$inject_state = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("type" in $$props) $$invalidate(5, type = $$props.type);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$props.disabled);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("input" in $$props) $$invalidate(3, input = $$props.input);
    		if ("newBackground" in $$props) $$invalidate(4, newBackground = $$props.newBackground);
    	};

    	let newBackground;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*type*/ 32) {
    			 $$invalidate(4, newBackground = type && type.replace(/^is-(.*)/, "has-background-$1") || "");
    		}

    		if ($$self.$$.dirty & /*input, disabled, label*/ 76) {
    			 {
    				if (input) {
    					if (disabled) {
    						label.setAttribute("disabled", "disabled");
    						input.setAttribute("disabled", "disabled");
    					} else {
    						label.removeAttribute("disabled");
    						input.removeAttribute("disabled");
    					}
    				}
    			}
    		}
    	};

    	return [
    		checked,
    		size,
    		label,
    		input,
    		newBackground,
    		type,
    		disabled,
    		$$scope,
    		$$slots,
    		input_handler,
    		click_handler,
    		input_1_change_handler,
    		input_1_binding,
    		label_1_binding
    	];
    }

    class Switch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			checked: 0,
    			type: 5,
    			size: 1,
    			disabled: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Switch",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get checked() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelma\src\components\Tooltip.svelte generated by Svelte v3.24.1 */

    const file$a = "node_modules\\svelma\\src\\components\\Tooltip.svelte";

    function create_fragment$a(ctx) {
    	let span;
    	let span_class_value;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			attr_dev(span, "data-label", /*label*/ ctx[2]);
    			attr_dev(span, "class", span_class_value = "" + (/*type*/ ctx[0] + " " + /*position*/ ctx[3] + " " + /*size*/ ctx[9] + " svelte-1txncmv"));
    			toggle_class(span, "tooltip", /*active*/ ctx[1]);
    			toggle_class(span, "is-square", /*square*/ ctx[6]);
    			toggle_class(span, "is-animated", /*animated*/ ctx[5]);
    			toggle_class(span, "is-always", /*always*/ ctx[4]);
    			toggle_class(span, "is-multiline", /*multilined*/ ctx[8]);
    			toggle_class(span, "is-dashed", /*dashed*/ ctx[7]);
    			add_location(span, file$a, 457, 0, 12213);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1024) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*label*/ 4) {
    				attr_dev(span, "data-label", /*label*/ ctx[2]);
    			}

    			if (!current || dirty & /*type, position, size*/ 521 && span_class_value !== (span_class_value = "" + (/*type*/ ctx[0] + " " + /*position*/ ctx[3] + " " + /*size*/ ctx[9] + " svelte-1txncmv"))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*type, position, size, active*/ 523) {
    				toggle_class(span, "tooltip", /*active*/ ctx[1]);
    			}

    			if (dirty & /*type, position, size, square*/ 585) {
    				toggle_class(span, "is-square", /*square*/ ctx[6]);
    			}

    			if (dirty & /*type, position, size, animated*/ 553) {
    				toggle_class(span, "is-animated", /*animated*/ ctx[5]);
    			}

    			if (dirty & /*type, position, size, always*/ 537) {
    				toggle_class(span, "is-always", /*always*/ ctx[4]);
    			}

    			if (dirty & /*type, position, size, multilined*/ 777) {
    				toggle_class(span, "is-multiline", /*multilined*/ ctx[8]);
    			}

    			if (dirty & /*type, position, size, dashed*/ 649) {
    				toggle_class(span, "is-dashed", /*dashed*/ ctx[7]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { type = "is-primary" } = $$props;
    	let { active = true } = $$props;
    	let { label = "" } = $$props;
    	let { position = "is-top" } = $$props;
    	let { always = false } = $$props;
    	let { animated = false } = $$props;
    	let { square = false } = $$props;
    	let { dashed = false } = $$props;
    	let { multilined = false } = $$props;
    	let { size = "is-medium" } = $$props;

    	const writable_props = [
    		"type",
    		"active",
    		"label",
    		"position",
    		"always",
    		"animated",
    		"square",
    		"dashed",
    		"multilined",
    		"size"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tooltip> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tooltip", $$slots, ['default']);

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("position" in $$props) $$invalidate(3, position = $$props.position);
    		if ("always" in $$props) $$invalidate(4, always = $$props.always);
    		if ("animated" in $$props) $$invalidate(5, animated = $$props.animated);
    		if ("square" in $$props) $$invalidate(6, square = $$props.square);
    		if ("dashed" in $$props) $$invalidate(7, dashed = $$props.dashed);
    		if ("multilined" in $$props) $$invalidate(8, multilined = $$props.multilined);
    		if ("size" in $$props) $$invalidate(9, size = $$props.size);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		type,
    		active,
    		label,
    		position,
    		always,
    		animated,
    		square,
    		dashed,
    		multilined,
    		size
    	});

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("position" in $$props) $$invalidate(3, position = $$props.position);
    		if ("always" in $$props) $$invalidate(4, always = $$props.always);
    		if ("animated" in $$props) $$invalidate(5, animated = $$props.animated);
    		if ("square" in $$props) $$invalidate(6, square = $$props.square);
    		if ("dashed" in $$props) $$invalidate(7, dashed = $$props.dashed);
    		if ("multilined" in $$props) $$invalidate(8, multilined = $$props.multilined);
    		if ("size" in $$props) $$invalidate(9, size = $$props.size);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		type,
    		active,
    		label,
    		position,
    		always,
    		animated,
    		square,
    		dashed,
    		multilined,
    		size,
    		$$scope,
    		$$slots
    	];
    }

    class Tooltip extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			type: 0,
    			active: 1,
    			label: 2,
    			position: 3,
    			always: 4,
    			animated: 5,
    			square: 6,
    			dashed: 7,
    			multilined: 8,
    			size: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tooltip",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get type() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get always() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set always(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animated() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animated(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get square() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set square(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dashed() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dashed(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multilined() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multilined(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Downloader.svelte generated by Svelte v3.24.1 */
    const file$b = "src\\Components\\Downloader.svelte";

    // (14:0) {#if is_downloading}
    function create_if_block$5(ctx) {
    	let progress;
    	let t;
    	let if_block_anchor;
    	let current;

    	progress = new Progress({
    			props: { type: "is-link" },
    			$$inline: true
    		});

    	let if_block = /*message*/ ctx[1] != null && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			create_component(progress.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(progress, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*message*/ ctx[1] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(progress.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(progress.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(progress, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(14:0) {#if is_downloading}",
    		ctx
    	});

    	return block;
    }

    // (16:2) {#if message != null}
    function create_if_block_1$3(ctx) {
    	let h6;
    	let t;

    	const block = {
    		c: function create() {
    			h6 = element("h6");
    			t = text(/*message*/ ctx[1]);
    			attr_dev(h6, "class", "subtitle is-6");
    			add_location(h6, file$b, 16, 4, 371);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h6, anchor);
    			append_dev(h6, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 2) set_data_dev(t, /*message*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(16:2) {#if message != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*is_downloading*/ ctx[0] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*is_downloading*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*is_downloading*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { is_downloading } = $$props;
    	let message = null;

    	window.ipcRenderer.on("update-downloader", async (event, ipc_message) => {
    		try {
    			$$invalidate(1, message = ipc_message);
    		} catch(e) {
    			$$invalidate(1, message = null);
    		}
    	});

    	const writable_props = ["is_downloading"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Downloader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Downloader", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("is_downloading" in $$props) $$invalidate(0, is_downloading = $$props.is_downloading);
    	};

    	$$self.$capture_state = () => ({ is_downloading, Progress, message });

    	$$self.$inject_state = $$props => {
    		if ("is_downloading" in $$props) $$invalidate(0, is_downloading = $$props.is_downloading);
    		if ("message" in $$props) $$invalidate(1, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [is_downloading, message];
    }

    class Downloader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { is_downloading: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Downloader",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*is_downloading*/ ctx[0] === undefined && !("is_downloading" in props)) {
    			console.warn("<Downloader> was created without expected prop 'is_downloading'");
    		}
    	}

    	get is_downloading() {
    		throw new Error("<Downloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_downloading(value) {
    		throw new Error("<Downloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Control.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;
    const file$c = "src\\Components\\Control.svelte";

    // (98:6) <Field label="輸入影片網址(支援av01.tv、pornhub)：">
    function create_default_slot_2(ctx) {
    	let input;
    	let updating_value;
    	let current;

    	function input_value_binding(value) {
    		/*input_value_binding*/ ctx[3].call(null, value);
    	}

    	let input_props = { type: "text", icon: "video" };

    	if (/*target*/ ctx[0] !== void 0) {
    		input_props.value = /*target*/ ctx[0];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding));

    	const block = {
    		c: function create() {
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input_changes = {};

    			if (!updating_value && dirty & /*target*/ 1) {
    				updating_value = true;
    				input_changes.value = /*target*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(98:6) <Field label=\\\"輸入影片網址(支援av01.tv、pornhub)：\\\">",
    		ctx
    	});

    	return block;
    }

    // (106:6) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				type: "is-primary",
    				iconPack: "fas",
    				iconLeft: "heart",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*click_handler*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(106:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (102:6) {#if downloading}
    function create_if_block$6(ctx) {
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				disabled: true,
    				type: "is-primary",
    				iconPack: "fas",
    				iconLeft: "heart",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(102:6) {#if downloading}",
    		ctx
    	});

    	return block;
    }

    // (107:8) <Button            type="is-primary"            iconPack="fas"            iconLeft="heart"            on:click={() => main(target)}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("開始下載");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(107:8) <Button            type=\\\"is-primary\\\"            iconPack=\\\"fas\\\"            iconLeft=\\\"heart\\\"            on:click={() => main(target)}>",
    		ctx
    	});

    	return block;
    }

    // (103:8) <Button disabled type="is-primary" iconPack="fas" iconLeft="heart">
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("開始下載");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(103:8) <Button disabled type=\\\"is-primary\\\" iconPack=\\\"fas\\\" iconLeft=\\\"heart\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let section;
    	let div1;
    	let div0;
    	let field;
    	let t0;
    	let downloader;
    	let updating_is_downloading;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	field = new Field({
    			props: {
    				label: "輸入影片網址(支援av01.tv、pornhub)：",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function downloader_is_downloading_binding(value) {
    		/*downloader_is_downloading_binding*/ ctx[4].call(null, value);
    	}

    	let downloader_props = {};

    	if (/*downloading*/ ctx[1] !== void 0) {
    		downloader_props.is_downloading = /*downloading*/ ctx[1];
    	}

    	downloader = new Downloader({ props: downloader_props, $$inline: true });
    	binding_callbacks.push(() => bind(downloader, "is_downloading", downloader_is_downloading_binding));
    	const if_block_creators = [create_if_block$6, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*downloading*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			create_component(field.$$.fragment);
    			t0 = space();
    			create_component(downloader.$$.fragment);
    			t1 = space();
    			if_block.c();
    			attr_dev(div0, "class", "column is-half");
    			add_location(div0, file$c, 96, 4, 3009);
    			attr_dev(div1, "class", "columns is-centered");
    			add_location(div1, file$c, 95, 2, 2970);
    			attr_dev(section, "class", "section");
    			add_location(section, file$c, 94, 0, 2941);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, div0);
    			mount_component(field, div0, null);
    			append_dev(div0, t0);
    			mount_component(downloader, div0, null);
    			append_dev(div0, t1);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const field_changes = {};

    			if (dirty & /*$$scope, target*/ 65) {
    				field_changes.$$scope = { dirty, ctx };
    			}

    			field.$set(field_changes);
    			const downloader_changes = {};

    			if (!updating_is_downloading && dirty & /*downloading*/ 2) {
    				updating_is_downloading = true;
    				downloader_changes.is_downloading = /*downloading*/ ctx[1];
    				add_flush_callback(() => updating_is_downloading = false);
    			}

    			downloader.$set(downloader_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field.$$.fragment, local);
    			transition_in(downloader.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field.$$.fragment, local);
    			transition_out(downloader.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(field);
    			destroy_component(downloader);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const worker_limit = 5;

    async function get_cache_path() {
    	const path = await window.ipcRenderer.invoke("get-local");
    	return path;
    }

    async function get_token(url) {
    	const token = await window.ipcRenderer.invoke("get-token", `${url}`);
    	return token;
    }

    async function get_video(url, seq, cache) {
    	const template = url.split("-");

    	for (let ptr = 0; ptr < template.length; ptr++) {
    		if ((/^[0-9]*$/).test(template[ptr])) {
    			template[ptr] = `${seq}`;
    		}
    	}

    	const result = template.join("-");
    	console.log(result);
    	const video = await window.ipcRenderer.invoke("get-video", `${result}`, seq);
    	console.log(`${seq} completed`);
    	cache.push({ seq, video });
    	return 0;
    }

    async function merge_video(videos) {
    	const video = await window.ipcRenderer.invoke("merge-video", videos);
    	return video;
    }

    async function get_save_path() {
    	const path = await window.ipcRenderer.invoke("get-save-path");
    	return path;
    }

    async function save_video(path, data) {
    	await window.ipcRenderer.invoke("save-video", path, data);
    	return 0;
    }

    async function compress_video(cache_path, wanted_path) {
    	await window.ipcRenderer.invoke("compress-video", cache_path, wanted_path);
    	return 0;
    }

    async function delete_cache(cache_path) {
    	await window.ipcRenderer.invoke("delete-cache", cache_path);
    	return 0;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let target = "";
    	let downloading = false;

    	async function main(url) {
    		try {
    			$$invalidate(1, downloading = true);
    			const token = await get_token(url);
    			console.log(token);

    			//await get_video(token);
    			let counter = 1;

    			const cache_path = await get_cache_path();
    			await delete_cache(cache_path);

    			//let minute = 0;
    			while (true) {
    				const workers = [];
    				const cache = [];

    				for (const worker of [...Array(worker_limit).keys()]) {
    					workers.push(get_video(token, counter, cache));
    					counter += 1;
    				}

    				await Promise.all(workers);

    				//console.log(cache);
    				if (cache[0].video === null) {
    					break;
    				}

    				const merged = await merge_video(cache);
    				await save_video(cache_path, merged);
    			}

    			//console.log(videos);
    			if (counter > worker_limit * 2) {
    				const wanted_path = await get_save_path();
    				await compress_video(cache_path, wanted_path);
    			}

    			console.log("done!");
    			await delete_cache(cache_path);
    		} catch(e) {
    			Snackbar.create({ message: `錯誤訊息：${e}` });
    		} finally {
    			Snackbar.create({ message: "下載完成" });
    			$$invalidate(1, downloading = false);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Control> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Control", $$slots, []);

    	function input_value_binding(value) {
    		target = value;
    		$$invalidate(0, target);
    	}

    	function downloader_is_downloading_binding(value) {
    		downloading = value;
    		$$invalidate(1, downloading);
    	}

    	const click_handler = () => main(target);

    	$$self.$capture_state = () => ({
    		Input,
    		Field,
    		Switch,
    		Tooltip,
    		Button,
    		Snackbar,
    		element,
    		Downloader,
    		worker_limit,
    		target,
    		downloading,
    		main,
    		get_cache_path,
    		get_token,
    		get_video,
    		merge_video,
    		get_save_path,
    		save_video,
    		compress_video,
    		delete_cache
    	});

    	$$self.$inject_state = $$props => {
    		if ("target" in $$props) $$invalidate(0, target = $$props.target);
    		if ("downloading" in $$props) $$invalidate(1, downloading = $$props.downloading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		target,
    		downloading,
    		main,
    		input_value_binding,
    		downloader_is_downloading_binding,
    		click_handler
    	];
    }

    class Control extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Control",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.24.1 */
    const file$d = "src\\App.svelte";

    function create_fragment$d(ctx) {
    	let script;
    	let script_src_value;
    	let t0;
    	let main;
    	let hero;
    	let t1;
    	let control;
    	let current;
    	hero = new Hero({ $$inline: true });
    	control = new Control({ $$inline: true });

    	const block = {
    		c: function create() {
    			script = element("script");
    			t0 = space();
    			main = element("main");
    			create_component(hero.$$.fragment);
    			t1 = space();
    			create_component(control.$$.fragment);
    			script.defer = true;
    			if (script.src !== (script_src_value = "https://kit.fontawesome.com/230002ca0f.js")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "crossorigin", "anonymous");
    			add_location(script, file$d, 8, 4, 198);
    			add_location(main, file$d, 11, 0, 313);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(hero, main, null);
    			append_dev(main, t1);
    			mount_component(control, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hero.$$.fragment, local);
    			transition_in(control.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hero.$$.fragment, local);
    			transition_out(control.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(hero);
    			destroy_component(control);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Hero, Control });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
