
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function null_to_empty(value) {
        return value == null ? '' : value;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function children(element) {
        return Array.from(element.childNodes);
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
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
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
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    /* src/components/Header.svelte generated by Svelte v3.24.1 */

    const file = "src/components/Header.svelte";

    function create_fragment(ctx) {
    	let header;
    	let h1;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Name that Fish!";
    			attr_dev(h1, "class", "svelte-gxd0yx");
    			add_location(h1, file, 1, 4, 13);
    			attr_dev(header, "class", "svelte-gxd0yx");
    			add_location(header, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
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

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    // Utility function for retreiving a random array member

    // Returns a random index from and array
    function getRandomIndex(array){
        return Math.floor(Math.random() * (array.length))
    }

    //Shuffles an array
    function shuffleArray(array) {
        let currentIndex = array.length -1;

        // while there are elements left to shuffle:
        while(currentIndex !== 0){

            // Pick and element to shuffle
            let randomIndex = Math.floor(Math.random()*currentIndex);

            // And swap it with this one
            
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];

            currentIndex --;
        }
        return array; 
    }

    //Returns a random sample of size n from array
    function sample(arr, n){
        let shuffled = shuffleArray(arr);
        return shuffled.slice(0,n);
    }

    // console.log(shuffle([1,2,3,4,5]));

    var Clownfish = "./assets/fishPics/clownfish.jpg";
    var Grouper = "./assets/fishPics/grouper.jpeg";
    var Pirhana = "./assets/fishPics/piranha.jpeg";
    var Salmon = "./assets/fishPics/Salmon.jpg";
    var Sardine = "./assets/fishPics/sardine.jpg";
    var Sunfish = "./assets/fishPics/sunfish.jpg";
    var Swordfish = "./assets/fishPics/swordfish.jpg";
    var Tuna = "./assets/fishPics/tuna.jpg";
    var fishURLs = {
    	"Small Mouth Bass": "./assets/fishPics/smallmouthbass.jpg",
    	"Large Mouth Bass": "./assets/fishPics/largemouthbass.jpg",
    	Clownfish: Clownfish,
    	"Blue Tang": "./assets/fishPics/bluetang.jpg",
    	"Angel Fish": "./assets/fishPics/angelfish.jpeg",
    	"Angler Fish": "./assets/fishPics/anglerfish.jpg",
    	"Butterfly Fish": "./assets/fishPics/butterflyfish.jpeg",
    	"Great White Shark": "./assets/fishPics/greatwhite.jpg",
    	Grouper: Grouper,
    	"Hammerhead Shark": "./assets/fishPics/hammerhead.jpg",
    	"Leopard Shark": "./assets/fishPics/leopardshark.jpg",
    	"Mandarin Fish": "./assets/fishPics/mandarinfish.jpeg",
    	Pirhana: Pirhana,
    	"Rainbow Trout": "./assets/fishPics/rainbowtrout.jpg",
    	Salmon: Salmon,
    	Sardine: Sardine,
    	Sunfish: Sunfish,
    	Swordfish: Swordfish,
    	Tuna: Tuna,
    	"Whale Shark": "./assets/fishPics/whaleshark.jpg"
    };

    /* src/components/GameButton.svelte generated by Svelte v3.24.1 */
    const file$1 = "src/components/GameButton.svelte";

    // (18:8) {:else}
    function create_else_block(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-times incorrect svelte-mhumqh");
    			add_location(i, file$1, 18, 12, 482);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(18:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:8) {#if correctAns}
    function create_if_block_1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-check-circle correct svelte-mhumqh");
    			add_location(i, file$1, 16, 12, 410);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(16:8) {#if correctAns}",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#if !disableButtons}
    function create_if_block(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-dharmachakra svelte-mhumqh");
    			attr_dev(i, "data-value", /*label*/ ctx[0]);
    			add_location(i, file$1, 13, 8, 305);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 1) {
    				attr_dev(i, "data-value", /*label*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(13:4) {#if !disableButtons}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*disableButtons*/ ctx[2]) return create_if_block;
    		if (/*correctAns*/ ctx[3]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(/*label*/ ctx[0]);
    			attr_dev(span, "data-value", /*label*/ ctx[0]);
    			attr_dev(span, "class", "svelte-mhumqh");
    			add_location(span, file$1, 22, 5, 559);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*disableButtons*/ ctx[2] ? "" : "hover") + " svelte-mhumqh"));
    			attr_dev(div, "data-value", /*label*/ ctx[0]);
    			add_location(div, file$1, 11, 0, 165);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);

    			if (!mounted) {
    				dispose = listen_dev(
    					div,
    					"click",
    					function () {
    						if (is_function(/*disableButtons*/ ctx[2] ? "" : /*onPress*/ ctx[1])) (/*disableButtons*/ ctx[2] ? "" : /*onPress*/ ctx[1]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			}

    			if (dirty & /*label*/ 1) set_data_dev(t1, /*label*/ ctx[0]);

    			if (dirty & /*label*/ 1) {
    				attr_dev(span, "data-value", /*label*/ ctx[0]);
    			}

    			if (dirty & /*disableButtons*/ 4 && div_class_value !== (div_class_value = "" + (null_to_empty(/*disableButtons*/ ctx[2] ? "" : "hover") + " svelte-mhumqh"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*label*/ 1) {
    				attr_dev(div, "data-value", /*label*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
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
    	let { label } = $$props;
    	let { onPress } = $$props;
    	let { disableButtons } = $$props;
    	let { correctAns } = $$props;
    	const writable_props = ["label", "onPress", "disableButtons", "correctAns"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameButton> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GameButton", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("onPress" in $$props) $$invalidate(1, onPress = $$props.onPress);
    		if ("disableButtons" in $$props) $$invalidate(2, disableButtons = $$props.disableButtons);
    		if ("correctAns" in $$props) $$invalidate(3, correctAns = $$props.correctAns);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		label,
    		onPress,
    		disableButtons,
    		correctAns
    	});

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("onPress" in $$props) $$invalidate(1, onPress = $$props.onPress);
    		if ("disableButtons" in $$props) $$invalidate(2, disableButtons = $$props.disableButtons);
    		if ("correctAns" in $$props) $$invalidate(3, correctAns = $$props.correctAns);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, onPress, disableButtons, correctAns];
    }

    class GameButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			label: 0,
    			onPress: 1,
    			disableButtons: 2,
    			correctAns: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameButton",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[0] === undefined && !("label" in props)) {
    			console.warn("<GameButton> was created without expected prop 'label'");
    		}

    		if (/*onPress*/ ctx[1] === undefined && !("onPress" in props)) {
    			console.warn("<GameButton> was created without expected prop 'onPress'");
    		}

    		if (/*disableButtons*/ ctx[2] === undefined && !("disableButtons" in props)) {
    			console.warn("<GameButton> was created without expected prop 'disableButtons'");
    		}

    		if (/*correctAns*/ ctx[3] === undefined && !("correctAns" in props)) {
    			console.warn("<GameButton> was created without expected prop 'correctAns'");
    		}
    	}

    	get label() {
    		throw new Error("<GameButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<GameButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onPress() {
    		throw new Error("<GameButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onPress(value) {
    		throw new Error("<GameButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disableButtons() {
    		throw new Error("<GameButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disableButtons(value) {
    		throw new Error("<GameButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get correctAns() {
    		throw new Error("<GameButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set correctAns(value) {
    		throw new Error("<GameButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/CorrectMsg.svelte generated by Svelte v3.24.1 */

    const file$2 = "src/components/CorrectMsg.svelte";

    // (7:33) 
    function create_if_block_1$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "WALK THE PLANK!";
    			attr_dev(h1, "class", "wrong svelte-1xytm16");
    			add_location(h1, file$2, 7, 4, 153);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(7:33) ",
    		ctx
    	});

    	return block;
    }

    // (5:0) {#if status === 'correct'}
    function create_if_block$1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "GREAT JOB, MATEY!";
    			attr_dev(h1, "class", "right svelte-1xytm16");
    			add_location(h1, file$2, 5, 4, 74);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(5:0) {#if status === 'correct'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*status*/ ctx[0] === "correct") return create_if_block$1;
    		if (/*status*/ ctx[0] === "incorrect") return create_if_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

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
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
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
    	let { status } = $$props;
    	const writable_props = ["status"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CorrectMsg> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CorrectMsg", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("status" in $$props) $$invalidate(0, status = $$props.status);
    	};

    	$$self.$capture_state = () => ({ status });

    	$$self.$inject_state = $$props => {
    		if ("status" in $$props) $$invalidate(0, status = $$props.status);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [status];
    }

    class CorrectMsg extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { status: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CorrectMsg",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*status*/ ctx[0] === undefined && !("status" in props)) {
    			console.warn("<CorrectMsg> was created without expected prop 'status'");
    		}
    	}

    	get status() {
    		throw new Error("<CorrectMsg>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set status(value) {
    		throw new Error("<CorrectMsg>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/GameOver.svelte generated by Svelte v3.24.1 */

    const file$3 = "src/components/GameOver.svelte";

    // (14:4) {:else}
    function create_else_block$1(ctx) {
    	let h1;
    	let t1;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Thunderin' Typhoons, yer fish knowledge needs some hoistin'!";
    			t1 = space();
    			img = element("img");
    			attr_dev(h1, "class", "lose svelte-cv6mj0");
    			add_location(h1, file$3, 14, 8, 304);
    			if (img.src !== (img_src_value = "./assets/lose.gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-cv6mj0");
    			add_location(img, file$3, 16, 8, 404);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(14:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (10:4) {#if didWin}
    function create_if_block$2(ctx) {
    	let h1;
    	let t1;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Hats off to ye Matey, you win!";
    			t1 = space();
    			img = element("img");
    			attr_dev(h1, "class", "win svelte-cv6mj0");
    			add_location(h1, file$3, 10, 8, 179);
    			if (img.src !== (img_src_value = "./assets/win.gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-cv6mj0");
    			add_location(img, file$3, 12, 8, 248);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(10:4) {#if didWin}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let button0;
    	let t8;
    	let button1;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*didWin*/ ctx[0]) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text("You got ");
    			t2 = text(/*correctFish*/ ctx[3]);
    			t3 = text(" / ");
    			t4 = text(/*totalFish*/ ctx[4]);
    			t5 = text(" right");
    			t6 = space();
    			button0 = element("button");
    			button0.textContent = "Play Again!";
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Back to the Bridge!";
    			attr_dev(span, "class", "svelte-cv6mj0");
    			add_location(span, file$3, 18, 4, 455);
    			attr_dev(button0, "class", "svelte-cv6mj0");
    			add_location(button0, file$3, 19, 4, 514);
    			attr_dev(button1, "class", "svelte-cv6mj0");
    			add_location(button1, file$3, 20, 4, 564);
    			attr_dev(div, "class", "svelte-cv6mj0");
    			add_location(div, file$3, 8, 0, 148);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			append_dev(span, t5);
    			append_dev(div, t6);
    			append_dev(div, button0);
    			append_dev(div, t8);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*reset*/ ctx[1])) /*reset*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*returnToMenu*/ ctx[2])) /*returnToMenu*/ ctx[2].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			}

    			if (dirty & /*correctFish*/ 8) set_data_dev(t2, /*correctFish*/ ctx[3]);
    			if (dirty & /*totalFish*/ 16) set_data_dev(t4, /*totalFish*/ ctx[4]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
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
    	let { didWin } = $$props;
    	let { reset } = $$props;
    	let { returnToMenu } = $$props;
    	let { correctFish } = $$props;
    	let { totalFish } = $$props;
    	const writable_props = ["didWin", "reset", "returnToMenu", "correctFish", "totalFish"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameOver> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GameOver", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("didWin" in $$props) $$invalidate(0, didWin = $$props.didWin);
    		if ("reset" in $$props) $$invalidate(1, reset = $$props.reset);
    		if ("returnToMenu" in $$props) $$invalidate(2, returnToMenu = $$props.returnToMenu);
    		if ("correctFish" in $$props) $$invalidate(3, correctFish = $$props.correctFish);
    		if ("totalFish" in $$props) $$invalidate(4, totalFish = $$props.totalFish);
    	};

    	$$self.$capture_state = () => ({
    		didWin,
    		reset,
    		returnToMenu,
    		correctFish,
    		totalFish
    	});

    	$$self.$inject_state = $$props => {
    		if ("didWin" in $$props) $$invalidate(0, didWin = $$props.didWin);
    		if ("reset" in $$props) $$invalidate(1, reset = $$props.reset);
    		if ("returnToMenu" in $$props) $$invalidate(2, returnToMenu = $$props.returnToMenu);
    		if ("correctFish" in $$props) $$invalidate(3, correctFish = $$props.correctFish);
    		if ("totalFish" in $$props) $$invalidate(4, totalFish = $$props.totalFish);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [didWin, reset, returnToMenu, correctFish, totalFish];
    }

    class GameOver extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			didWin: 0,
    			reset: 1,
    			returnToMenu: 2,
    			correctFish: 3,
    			totalFish: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameOver",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*didWin*/ ctx[0] === undefined && !("didWin" in props)) {
    			console.warn("<GameOver> was created without expected prop 'didWin'");
    		}

    		if (/*reset*/ ctx[1] === undefined && !("reset" in props)) {
    			console.warn("<GameOver> was created without expected prop 'reset'");
    		}

    		if (/*returnToMenu*/ ctx[2] === undefined && !("returnToMenu" in props)) {
    			console.warn("<GameOver> was created without expected prop 'returnToMenu'");
    		}

    		if (/*correctFish*/ ctx[3] === undefined && !("correctFish" in props)) {
    			console.warn("<GameOver> was created without expected prop 'correctFish'");
    		}

    		if (/*totalFish*/ ctx[4] === undefined && !("totalFish" in props)) {
    			console.warn("<GameOver> was created without expected prop 'totalFish'");
    		}
    	}

    	get didWin() {
    		throw new Error("<GameOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set didWin(value) {
    		throw new Error("<GameOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reset() {
    		throw new Error("<GameOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reset(value) {
    		throw new Error("<GameOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get returnToMenu() {
    		throw new Error("<GameOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set returnToMenu(value) {
    		throw new Error("<GameOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get correctFish() {
    		throw new Error("<GameOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set correctFish(value) {
    		throw new Error("<GameOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get totalFish() {
    		throw new Error("<GameOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set totalFish(value) {
    		throw new Error("<GameOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Counter.svelte generated by Svelte v3.24.1 */

    const file$4 = "src/components/Counter.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let span1;
    	let t0;
    	let span0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let span3;
    	let t5;
    	let span2;
    	let t6;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span1 = element("span");
    			t0 = text("Question: ");
    			span0 = element("span");
    			t1 = text(/*questionNumber*/ ctx[1]);
    			t2 = text(" of ");
    			t3 = text(/*questionsLeft*/ ctx[2]);
    			t4 = space();
    			span3 = element("span");
    			t5 = text("Wrong answers left: ");
    			span2 = element("span");
    			t6 = text(/*numAttempts*/ ctx[0]);
    			attr_dev(span0, "class", "questions svelte-kzt66j");
    			add_location(span0, file$4, 7, 34, 149);
    			attr_dev(span1, "class", "field");
    			add_location(span1, file$4, 7, 4, 119);
    			attr_dev(span2, "class", "attempts svelte-kzt66j");
    			add_location(span2, file$4, 8, 44, 268);
    			attr_dev(span3, "class", "field");
    			add_location(span3, file$4, 8, 4, 228);
    			attr_dev(div, "class", "svelte-kzt66j");
    			add_location(div, file$4, 6, 0, 109);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span1);
    			append_dev(span1, t0);
    			append_dev(span1, span0);
    			append_dev(span0, t1);
    			append_dev(span1, t2);
    			append_dev(span1, t3);
    			append_dev(div, t4);
    			append_dev(div, span3);
    			append_dev(span3, t5);
    			append_dev(span3, span2);
    			append_dev(span2, t6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*questionNumber*/ 2) set_data_dev(t1, /*questionNumber*/ ctx[1]);
    			if (dirty & /*questionsLeft*/ 4) set_data_dev(t3, /*questionsLeft*/ ctx[2]);
    			if (dirty & /*numAttempts*/ 1) set_data_dev(t6, /*numAttempts*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { numAttempts } = $$props;
    	let { questionNumber } = $$props;
    	let { questionsLeft } = $$props;
    	const writable_props = ["numAttempts", "questionNumber", "questionsLeft"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Counter> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Counter", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("numAttempts" in $$props) $$invalidate(0, numAttempts = $$props.numAttempts);
    		if ("questionNumber" in $$props) $$invalidate(1, questionNumber = $$props.questionNumber);
    		if ("questionsLeft" in $$props) $$invalidate(2, questionsLeft = $$props.questionsLeft);
    	};

    	$$self.$capture_state = () => ({
    		numAttempts,
    		questionNumber,
    		questionsLeft
    	});

    	$$self.$inject_state = $$props => {
    		if ("numAttempts" in $$props) $$invalidate(0, numAttempts = $$props.numAttempts);
    		if ("questionNumber" in $$props) $$invalidate(1, questionNumber = $$props.questionNumber);
    		if ("questionsLeft" in $$props) $$invalidate(2, questionsLeft = $$props.questionsLeft);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [numAttempts, questionNumber, questionsLeft];
    }

    class Counter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			numAttempts: 0,
    			questionNumber: 1,
    			questionsLeft: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Counter",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*numAttempts*/ ctx[0] === undefined && !("numAttempts" in props)) {
    			console.warn("<Counter> was created without expected prop 'numAttempts'");
    		}

    		if (/*questionNumber*/ ctx[1] === undefined && !("questionNumber" in props)) {
    			console.warn("<Counter> was created without expected prop 'questionNumber'");
    		}

    		if (/*questionsLeft*/ ctx[2] === undefined && !("questionsLeft" in props)) {
    			console.warn("<Counter> was created without expected prop 'questionsLeft'");
    		}
    	}

    	get numAttempts() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set numAttempts(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get questionNumber() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set questionNumber(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get questionsLeft() {
    		throw new Error("<Counter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set questionsLeft(value) {
    		throw new Error("<Counter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    /* src/components/Game.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1 } = globals;
    const file$5 = "src/components/Game.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    // (157:0) {:else}
    function create_else_block$2(ctx) {
    	let section;
    	let gameover;
    	let section_intro;
    	let section_outro;
    	let current;

    	gameover = new GameOver({
    			props: {
    				reset: /*resetGame*/ ctx[15],
    				didWin: /*didWin*/ ctx[11],
    				returnToMenu: /*returnToMenu*/ ctx[0],
    				correctFish: /*score*/ ctx[9],
    				totalFish: /*gameLength*/ ctx[12]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(gameover.$$.fragment);
    			attr_dev(section, "class", "svelte-1uczmef");
    			add_location(section, file$5, 157, 8, 4307);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(gameover, section, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gameover_changes = {};
    			if (dirty & /*didWin*/ 2048) gameover_changes.didWin = /*didWin*/ ctx[11];
    			if (dirty & /*returnToMenu*/ 1) gameover_changes.returnToMenu = /*returnToMenu*/ ctx[0];
    			if (dirty & /*score*/ 512) gameover_changes.correctFish = /*score*/ ctx[9];
    			gameover.$set(gameover_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gameover.$$.fragment, local);

    			add_render_callback(() => {
    				if (section_outro) section_outro.end(1);
    				if (!section_intro) section_intro = create_in_transition(section, fly, { y: 200, duration: 2000 });
    				section_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gameover.$$.fragment, local);
    			if (section_intro) section_intro.invalidate();
    			section_outro = create_out_transition(section, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(gameover);
    			if (detaching && section_outro) section_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(157:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (129:0) {#if !gameOver}
    function create_if_block$3(ctx) {
    	let section;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let counter;
    	let t1;
    	let t2;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let div0;
    	let section_transition;
    	let current;

    	counter = new Counter({
    			props: {
    				numAttempts: /*numAttempts*/ ctx[10],
    				questionNumber: /*questionNumber*/ ctx[2],
    				questionsLeft: /*questionsLeft*/ ctx[1]
    			},
    			$$inline: true
    		});

    	let if_block = /*correct*/ ctx[7] && create_if_block_1$2(ctx);
    	let each_value = /*answers*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			section = element("section");
    			img0 = element("img");
    			t0 = space();
    			create_component(counter.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div1 = element("div");
    			img1 = element("img");
    			t3 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(img0, "class", "fish svelte-1uczmef");
    			if (img0.src !== (img0_src_value = /*fishURL*/ ctx[4])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "A fish!");
    			add_location(img0, file$5, 131, 8, 3503);
    			if (img1.src !== (img1_src_value = "./assets/answerBox.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Answer box");
    			attr_dev(img1, "class", "svelte-1uczmef");
    			add_location(img1, file$5, 145, 12, 3936);
    			attr_dev(div0, "class", "answers svelte-1uczmef");
    			add_location(div0, file$5, 146, 12, 4000);
    			attr_dev(div1, "class", "answer-box svelte-1uczmef");
    			add_location(div1, file$5, 144, 8, 3899);
    			attr_dev(section, "class", "svelte-1uczmef");
    			add_location(section, file$5, 130, 4, 3469);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, img0);
    			append_dev(section, t0);
    			mount_component(counter, section, null);
    			append_dev(section, t1);
    			if (if_block) if_block.m(section, null);
    			append_dev(section, t2);
    			append_dev(section, div1);
    			append_dev(div1, img1);
    			append_dev(div1, t3);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*fishURL*/ 16 && img0.src !== (img0_src_value = /*fishURL*/ ctx[4])) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			const counter_changes = {};
    			if (dirty & /*numAttempts*/ 1024) counter_changes.numAttempts = /*numAttempts*/ ctx[10];
    			if (dirty & /*questionNumber*/ 4) counter_changes.questionNumber = /*questionNumber*/ ctx[2];
    			if (dirty & /*questionsLeft*/ 2) counter_changes.questionsLeft = /*questionsLeft*/ ctx[1];
    			counter.$set(counter_changes);

    			if (/*correct*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*correct*/ 128) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(section, t2);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*answers, handleAnswer, currFish, disableButtons*/ 8488) {
    				each_value = /*answers*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(counter.$$.fragment, local);
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!section_transition) section_transition = create_bidirectional_transition(section, fade, {}, true);
    				section_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(counter.$$.fragment, local);
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (!section_transition) section_transition = create_bidirectional_transition(section, fade, {}, false);
    			section_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(counter);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			if (detaching && section_transition) section_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(129:0) {#if !gameOver}",
    		ctx
    	});

    	return block;
    }

    // (136:8) {#if correct}
    function create_if_block_1$2(ctx) {
    	let div;
    	let correctmsg;
    	let t0;
    	let button;
    	let div_intro;
    	let current;
    	let mounted;
    	let dispose;

    	correctmsg = new CorrectMsg({
    			props: { status: /*correct*/ ctx[7] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(correctmsg.$$.fragment);
    			t0 = space();
    			button = element("button");
    			button.textContent = "Next Fish!";
    			attr_dev(button, "class", "svelte-1uczmef");
    			add_location(button, file$5, 138, 16, 3795);
    			attr_dev(div, "class", "result svelte-1uczmef");
    			add_location(div, file$5, 136, 12, 3703);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(correctmsg, div, null);
    			append_dev(div, t0);
    			append_dev(div, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*nextQuestion*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const correctmsg_changes = {};
    			if (dirty & /*correct*/ 128) correctmsg_changes.status = /*correct*/ ctx[7];
    			correctmsg.$set(correctmsg_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(correctmsg.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, {});
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(correctmsg.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(correctmsg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(136:8) {#if correct}",
    		ctx
    	});

    	return block;
    }

    // (148:16) {#each answers as answer}
    function create_each_block(ctx) {
    	let gamebutton;
    	let current;

    	gamebutton = new GameButton({
    			props: {
    				label: /*answer*/ ctx[23],
    				onPress: /*handleAnswer*/ ctx[13],
    				correctAns: /*currFish*/ ctx[3] === /*answer*/ ctx[23],
    				disableButtons: /*disableButtons*/ ctx[8]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gamebutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gamebutton, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gamebutton_changes = {};
    			if (dirty & /*answers*/ 32) gamebutton_changes.label = /*answer*/ ctx[23];
    			if (dirty & /*currFish, answers*/ 40) gamebutton_changes.correctAns = /*currFish*/ ctx[3] === /*answer*/ ctx[23];
    			if (dirty & /*disableButtons*/ 256) gamebutton_changes.disableButtons = /*disableButtons*/ ctx[8];
    			gamebutton.$set(gamebutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gamebutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gamebutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gamebutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(148:16) {#each answers as answer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*gameOver*/ ctx[6]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { returnToMenu } = $$props;

    	//Initialize game state
    	let allFishNames = Object.keys(fishURLs);

    	let gameLength = 10;
    	let newFishNames = getFishSet(gameLength);
    	var questionsLeft = newFishNames.length;
    	var questionNumber = 0;
    	var currFish = getNewFishName();
    	var fishURL = fishURLs[currFish];
    	var answers = getAnswers(currFish);
    	var gameOver = false;
    	var correct = null;
    	var disableButtons = false;
    	var score = 0;
    	var numAttempts = 3;
    	var didWin = false;

    	//Returns a sample of <size> fish as an array
    	function getFishSet(size) {
    		return sample(allFishNames, size);
    	}

    	// Returns a new fish that we have not seen before
    	// Used to select the next fish for guessing
    	function getNewFishName() {
    		let newFishIdx = getRandomIndex(newFishNames);
    		let newFish = newFishNames[newFishIdx];
    		newFishNames.splice(newFishIdx, 1);
    		$$invalidate(2, questionNumber++, questionNumber);
    		return newFish;
    	}

    	//return an array of 4 unique fish names, one of which is passed in
    	// used to populate the answer choices
    	function getAnswers(correctFish) {
    		let answers = [correctFish];
    		let tempFishNames = allFishNames.filter(fishName => fishName !== correctFish);

    		while (answers.length < 4) {
    			let idx = getRandomIndex(tempFishNames);
    			let fish = tempFishNames[idx];
    			answers.push(fish);
    			tempFishNames.splice(idx, 1);
    		}

    		return shuffleArray(answers);
    	}

    	//Process the answer and update game state
    	function handleAnswer(e) {
    		e.preventDefault();

    		if (e.target.dataset.value === currFish) {
    			$$invalidate(7, correct = "correct");
    			$$invalidate(9, score += 1);
    		} else {
    			$$invalidate(7, correct = "incorrect");
    			$$invalidate(10, numAttempts -= 1);

    			if (numAttempts === 0) {
    				youLose();
    			}
    		}

    		$$invalidate(8, disableButtons = true);
    	}

    	// Load the next question
    	function nextQuestion() {
    		$$invalidate(7, correct = null);
    		$$invalidate(8, disableButtons = false);

    		if (newFishNames.length > 0) {
    			$$invalidate(3, currFish = getNewFishName());
    			$$invalidate(4, fishURL = fishURLs[currFish]);
    			$$invalidate(5, answers = getAnswers(currFish));
    		} else {
    			youWin();
    		}
    	}

    	function youWin() {
    		$$invalidate(6, gameOver = true);
    		$$invalidate(11, didWin = true);
    	}

    	function youLose() {
    		$$invalidate(6, gameOver = true);
    		$$invalidate(11, didWin = false);
    	}

    	//Reset Game State
    	function resetGame() {
    		allFishNames = Object.keys(fishURLs);
    		newFishNames = getFishSet(10);
    		$$invalidate(1, questionsLeft = newFishNames.length);
    		$$invalidate(2, questionNumber = 0);
    		$$invalidate(3, currFish = getNewFishName());
    		$$invalidate(4, fishURL = fishURLs[currFish]);
    		$$invalidate(5, answers = getAnswers(currFish));
    		$$invalidate(6, gameOver = false);
    		$$invalidate(7, correct = null);
    		$$invalidate(8, disableButtons = false);
    		$$invalidate(9, score = 0);
    		$$invalidate(10, numAttempts = 3);
    		$$invalidate(11, didWin = false);
    	}

    	const writable_props = ["returnToMenu"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Game", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("returnToMenu" in $$props) $$invalidate(0, returnToMenu = $$props.returnToMenu);
    	};

    	$$self.$capture_state = () => ({
    		returnToMenu,
    		getRandomIndex,
    		shuffleArray,
    		sample,
    		fishURLs,
    		GameButton,
    		CorrectMSG: CorrectMsg,
    		GameOver,
    		CorrectMsg,
    		Counter,
    		fade,
    		fly,
    		allFishNames,
    		gameLength,
    		newFishNames,
    		questionsLeft,
    		questionNumber,
    		currFish,
    		fishURL,
    		answers,
    		gameOver,
    		correct,
    		disableButtons,
    		score,
    		numAttempts,
    		didWin,
    		getFishSet,
    		getNewFishName,
    		getAnswers,
    		handleAnswer,
    		nextQuestion,
    		youWin,
    		youLose,
    		resetGame
    	});

    	$$self.$inject_state = $$props => {
    		if ("returnToMenu" in $$props) $$invalidate(0, returnToMenu = $$props.returnToMenu);
    		if ("allFishNames" in $$props) allFishNames = $$props.allFishNames;
    		if ("gameLength" in $$props) $$invalidate(12, gameLength = $$props.gameLength);
    		if ("newFishNames" in $$props) newFishNames = $$props.newFishNames;
    		if ("questionsLeft" in $$props) $$invalidate(1, questionsLeft = $$props.questionsLeft);
    		if ("questionNumber" in $$props) $$invalidate(2, questionNumber = $$props.questionNumber);
    		if ("currFish" in $$props) $$invalidate(3, currFish = $$props.currFish);
    		if ("fishURL" in $$props) $$invalidate(4, fishURL = $$props.fishURL);
    		if ("answers" in $$props) $$invalidate(5, answers = $$props.answers);
    		if ("gameOver" in $$props) $$invalidate(6, gameOver = $$props.gameOver);
    		if ("correct" in $$props) $$invalidate(7, correct = $$props.correct);
    		if ("disableButtons" in $$props) $$invalidate(8, disableButtons = $$props.disableButtons);
    		if ("score" in $$props) $$invalidate(9, score = $$props.score);
    		if ("numAttempts" in $$props) $$invalidate(10, numAttempts = $$props.numAttempts);
    		if ("didWin" in $$props) $$invalidate(11, didWin = $$props.didWin);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		returnToMenu,
    		questionsLeft,
    		questionNumber,
    		currFish,
    		fishURL,
    		answers,
    		gameOver,
    		correct,
    		disableButtons,
    		score,
    		numAttempts,
    		didWin,
    		gameLength,
    		handleAnswer,
    		nextQuestion,
    		resetGame
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { returnToMenu: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*returnToMenu*/ ctx[0] === undefined && !("returnToMenu" in props)) {
    			console.warn("<Game> was created without expected prop 'returnToMenu'");
    		}
    	}

    	get returnToMenu() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set returnToMenu(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.24.1 */

    const file$6 = "src/components/Footer.svelte";

    function create_fragment$6(ctx) {
    	let footer;
    	let div;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let ul;
    	let li0;
    	let a0;
    	let t5;
    	let li1;
    	let a1;
    	let t7;
    	let span;
    	let i;
    	let t8;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "About";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Created by Ajay Rajamani for the Mintbean Svelte.js hackathon";
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Code";
    			t5 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "About Me";
    			t7 = space();
    			span = element("span");
    			i = element("i");
    			t8 = text(" 2020 Ajay Rajamani");
    			attr_dev(h1, "class", "svelte-gpalg7");
    			add_location(h1, file$6, 6, 8, 48);
    			attr_dev(p, "class", "svelte-gpalg7");
    			add_location(p, file$6, 8, 8, 72);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://github.com/stickmanbob/svelteQuizGame");
    			add_location(a0, file$6, 11, 16, 171);
    			attr_dev(li0, "class", "svelte-gpalg7");
    			add_location(li0, file$6, 11, 12, 167);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", "https://ajay-rajamani.me");
    			add_location(a1, file$6, 12, 16, 273);
    			attr_dev(li1, "class", "svelte-gpalg7");
    			add_location(li1, file$6, 12, 12, 269);
    			attr_dev(ul, "class", "svelte-gpalg7");
    			add_location(ul, file$6, 10, 8, 150);
    			attr_dev(i, "class", "fas fa-copyright");
    			add_location(i, file$6, 16, 12, 403);
    			attr_dev(span, "class", "copyright svelte-gpalg7");
    			add_location(span, file$6, 15, 8, 366);
    			attr_dev(div, "class", "svelte-gpalg7");
    			add_location(div, file$6, 5, 4, 34);
    			attr_dev(footer, "class", "svelte-gpalg7");
    			add_location(footer, file$6, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(div, t3);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(div, t7);
    			append_dev(div, span);
    			append_dev(span, i);
    			append_dev(span, t8);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
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

    function instance$6($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Menu.svelte generated by Svelte v3.24.1 */
    const file$7 = "src/components/Menu.svelte";

    function create_fragment$7(ctx) {
    	let section;
    	let h1;
    	let t1;
    	let br;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let a0;
    	let t8;
    	let a1;
    	let section_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h1 = element("h1");
    			h1.textContent = "Welcome to Name That Fish!";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "Start Game!";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "View Instructions";
    			t6 = space();
    			a0 = element("a");
    			a0.textContent = "View my Portfolio";
    			t8 = space();
    			a1 = element("a");
    			a1.textContent = "View Readme on Github";
    			attr_dev(h1, "class", "svelte-kfvws2");
    			add_location(h1, file$7, 9, 4, 153);
    			add_location(br, file$7, 13, 4, 208);
    			attr_dev(button0, "class", "menu-button svelte-kfvws2");
    			add_location(button0, file$7, 15, 4, 218);
    			attr_dev(button1, "class", "menu-button svelte-kfvws2");
    			add_location(button1, file$7, 19, 4, 307);
    			attr_dev(a0, "class", "menu-button svelte-kfvws2");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://ajay-rajamani.me");
    			add_location(a0, file$7, 23, 4, 409);
    			attr_dev(a1, "class", "menu-button svelte-kfvws2");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", "https://github.com/stickmanbob/svelteQuizGame#readme");
    			add_location(a1, file$7, 27, 4, 521);
    			attr_dev(section, "class", "svelte-kfvws2");
    			add_location(section, file$7, 7, 0, 130);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h1);
    			append_dev(section, t1);
    			append_dev(section, br);
    			append_dev(section, t2);
    			append_dev(section, button0);
    			append_dev(section, t4);
    			append_dev(section, button1);
    			append_dev(section, t6);
    			append_dev(section, a0);
    			append_dev(section, t8);
    			append_dev(section, a1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*startGame*/ ctx[0])) /*startGame*/ ctx[0].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*viewInstructions*/ ctx[1])) /*viewInstructions*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (!section_intro) {
    				add_render_callback(() => {
    					section_intro = create_in_transition(section, fade, {});
    					section_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
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
    	let { startGame } = $$props;
    	let { viewInstructions } = $$props;
    	const writable_props = ["startGame", "viewInstructions"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Menu", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("startGame" in $$props) $$invalidate(0, startGame = $$props.startGame);
    		if ("viewInstructions" in $$props) $$invalidate(1, viewInstructions = $$props.viewInstructions);
    	};

    	$$self.$capture_state = () => ({ startGame, viewInstructions, fade });

    	$$self.$inject_state = $$props => {
    		if ("startGame" in $$props) $$invalidate(0, startGame = $$props.startGame);
    		if ("viewInstructions" in $$props) $$invalidate(1, viewInstructions = $$props.viewInstructions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [startGame, viewInstructions];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { startGame: 0, viewInstructions: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*startGame*/ ctx[0] === undefined && !("startGame" in props)) {
    			console.warn("<Menu> was created without expected prop 'startGame'");
    		}

    		if (/*viewInstructions*/ ctx[1] === undefined && !("viewInstructions" in props)) {
    			console.warn("<Menu> was created without expected prop 'viewInstructions'");
    		}
    	}

    	get startGame() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startGame(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get viewInstructions() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set viewInstructions(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Instructions.svelte generated by Svelte v3.24.1 */
    const file$8 = "src/components/Instructions.svelte";

    function create_fragment$8(ctx) {
    	let section;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let ul;
    	let li0;
    	let t5;
    	let li1;
    	let t7;
    	let li2;
    	let t9;
    	let button;
    	let section_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h1 = element("h1");
    			h1.textContent = "Instructions";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Ahoy Matey! Welcome to Name That Fish, the official time wasting quiz game of Boy Scout Troop 476! Here's how to play:";
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Ye'll be presented with a picture of a fish and a set of four names to choose from. Use yer seafarin' knowledge to click the correct one!";
    			t5 = space();
    			li1 = element("li");
    			li1.textContent = "Each time you answer, we'll let ye know if ye called it right (\"Good Job Matey!\") or if ye bungled it (\"Walk the Plank!\")";
    			t7 = space();
    			li2 = element("li");
    			li2.textContent = "Ye get three tries to bungle it up before ye fall off the plank! Make it to the end of the quiz without failin' and ye win!";
    			t9 = space();
    			button = element("button");
    			button.textContent = "Back to the Bridge!";
    			attr_dev(h1, "class", "svelte-7sae5j");
    			add_location(h1, file$8, 6, 4, 116);
    			attr_dev(p, "class", "svelte-7sae5j");
    			add_location(p, file$8, 8, 4, 143);
    			attr_dev(li0, "class", "svelte-7sae5j");
    			add_location(li0, file$8, 10, 8, 287);
    			attr_dev(li1, "class", "svelte-7sae5j");
    			add_location(li1, file$8, 11, 8, 442);
    			attr_dev(li2, "class", "svelte-7sae5j");
    			add_location(li2, file$8, 12, 8, 581);
    			attr_dev(ul, "class", "svelte-7sae5j");
    			add_location(ul, file$8, 9, 4, 274);
    			add_location(button, file$8, 15, 4, 729);
    			attr_dev(section, "class", "svelte-7sae5j");
    			add_location(section, file$8, 5, 0, 94);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h1);
    			append_dev(section, t1);
    			append_dev(section, p);
    			append_dev(section, t3);
    			append_dev(section, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(section, t9);
    			append_dev(section, button);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*returnToMenu*/ ctx[0])) /*returnToMenu*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (!section_intro) {
    				add_render_callback(() => {
    					section_intro = create_in_transition(section, fade, {});
    					section_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			dispose();
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
    	let { returnToMenu } = $$props;
    	const writable_props = ["returnToMenu"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Instructions> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Instructions", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("returnToMenu" in $$props) $$invalidate(0, returnToMenu = $$props.returnToMenu);
    	};

    	$$self.$capture_state = () => ({ returnToMenu, fade });

    	$$self.$inject_state = $$props => {
    		if ("returnToMenu" in $$props) $$invalidate(0, returnToMenu = $$props.returnToMenu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [returnToMenu];
    }

    class Instructions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { returnToMenu: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Instructions",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*returnToMenu*/ ctx[0] === undefined && !("returnToMenu" in props)) {
    			console.warn("<Instructions> was created without expected prop 'returnToMenu'");
    		}
    	}

    	get returnToMenu() {
    		throw new Error("<Instructions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set returnToMenu(value) {
    		throw new Error("<Instructions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */
    const file$9 = "src/App.svelte";

    // (32:44) 
    function create_if_block_2(ctx) {
    	let instructions;
    	let current;

    	instructions = new Instructions({
    			props: {
    				returnToMenu: /*navigate*/ ctx[1]("menu")
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(instructions.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(instructions, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(instructions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(instructions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(instructions, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(32:44) ",
    		ctx
    	});

    	return block;
    }

    // (30:36) 
    function create_if_block_1$3(ctx) {
    	let game;
    	let current;

    	game = new Game({
    			props: {
    				returnToMenu: /*navigate*/ ctx[1]("menu")
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(30:36) ",
    		ctx
    	});

    	return block;
    }

    // (26:1) {#if mainComponent === "menu"}
    function create_if_block$4(ctx) {
    	let menu;
    	let current;

    	menu = new Menu({
    			props: {
    				startGame: /*navigate*/ ctx[1]("game"),
    				viewInstructions: /*navigate*/ ctx[1]("instructions")
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(26:1) {#if mainComponent === \\\"menu\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let main;
    	let header;
    	let t0;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });
    	const if_block_creators = [create_if_block$4, create_if_block_1$3, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*mainComponent*/ ctx[0] === "menu") return 0;
    		if (/*mainComponent*/ ctx[0] === "game") return 1;
    		if (/*mainComponent*/ ctx[0] === "instructions") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(main, "class", "svelte-frvpbq");
    			add_location(main, file$9, 22, 0, 569);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			append_dev(main, t1);
    			mount_component(footer, main, null);
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
    					if_block.m(main, t1);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			destroy_component(footer);
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
    	var mainComponent = "menu";

    	//Returns a callback function that changes the value of mainComponent
    	//Used to allow frontend routing via Svelte's conditional rendering
    	function navigate(component) {
    		return e => {
    			e.preventDefault();
    			$$invalidate(0, mainComponent = component);
    		};
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Header,
    		Game,
    		Footer,
    		Menu,
    		Instructions,
    		mainComponent,
    		navigate
    	});

    	$$self.$inject_state = $$props => {
    		if ("mainComponent" in $$props) $$invalidate(0, mainComponent = $$props.mainComponent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [mainComponent, navigate];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
