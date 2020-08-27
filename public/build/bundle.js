
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    			attr_dev(h1, "class", "svelte-p8czvr");
    			add_location(h1, file, 1, 4, 13);
    			attr_dev(header, "class", "svelte-p8czvr");
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
    			attr_dev(i, "class", "fas fa-times incorrect svelte-x6rn8g");
    			add_location(i, file$1, 18, 12, 400);
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
    			attr_dev(i, "class", "fas fa-check-circle correct svelte-x6rn8g");
    			add_location(i, file$1, 16, 12, 328);
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
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-dharmachakra svelte-x6rn8g");
    			attr_dev(i, "data-value", /*label*/ ctx[0]);
    			add_location(i, file$1, 13, 8, 205);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);

    			if (!mounted) {
    				dispose = listen_dev(
    					i,
    					"click",
    					function () {
    						if (is_function(/*onPress*/ ctx[1])) /*onPress*/ ctx[1].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*label*/ 1) {
    				attr_dev(i, "data-value", /*label*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			mounted = false;
    			dispose();
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
    			attr_dev(span, "class", "svelte-x6rn8g");
    			add_location(span, file$1, 22, 5, 477);
    			attr_dev(div, "class", "svelte-x6rn8g");
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
    		},
    		p: function update(ctx, [dirty]) {
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
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
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
    			h1.textContent = "SWAB THE DECK!";
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

    // (11:4) {:else}
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
    			attr_dev(h1, "class", "lose svelte-adtwxy");
    			add_location(h1, file$3, 11, 8, 218);
    			if (img.src !== (img_src_value = "./assets/lose.gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-adtwxy");
    			add_location(img, file$3, 12, 8, 309);
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
    		source: "(11:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:4) {#if didWin}
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
    			attr_dev(h1, "class", "win svelte-adtwxy");
    			add_location(h1, file$3, 8, 8, 102);
    			if (img.src !== (img_src_value = "./assets/win.gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-adtwxy");
    			add_location(img, file$3, 9, 8, 162);
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
    		source: "(8:4) {#if didWin}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let button;
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
    			button = element("button");
    			button.textContent = "Play Again!";
    			attr_dev(button, "class", "svelte-adtwxy");
    			add_location(button, file$3, 14, 4, 360);
    			attr_dev(div, "class", "svelte-adtwxy");
    			add_location(div, file$3, 6, 0, 71);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*reset*/ ctx[1])) /*reset*/ ctx[1].apply(this, arguments);
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

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t0);
    				}
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
    	const writable_props = ["didWin", "reset"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameOver> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GameOver", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("didWin" in $$props) $$invalidate(0, didWin = $$props.didWin);
    		if ("reset" in $$props) $$invalidate(1, reset = $$props.reset);
    	};

    	$$self.$capture_state = () => ({ didWin, reset });

    	$$self.$inject_state = $$props => {
    		if ("didWin" in $$props) $$invalidate(0, didWin = $$props.didWin);
    		if ("reset" in $$props) $$invalidate(1, reset = $$props.reset);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [didWin, reset];
    }

    class GameOver extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { didWin: 0, reset: 1 });

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

    /* src/components/Game.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$5 = "src/components/Game.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    // (149:0) {:else}
    function create_else_block$2(ctx) {
    	let section;
    	let gameover;
    	let current;

    	gameover = new GameOver({
    			props: {
    				reset: /*resetGame*/ ctx[12],
    				didWin: /*didWin*/ ctx[9]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(gameover.$$.fragment);
    			attr_dev(section, "class", "svelte-a8e8xc");
    			add_location(section, file$5, 149, 8, 4090);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(gameover, section, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gameover_changes = {};
    			if (dirty & /*didWin*/ 512) gameover_changes.didWin = /*didWin*/ ctx[9];
    			gameover.$set(gameover_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gameover.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gameover.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(gameover);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(149:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (121:0) {#if !gameOver}
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
    	let current;

    	counter = new Counter({
    			props: {
    				numAttempts: /*numAttempts*/ ctx[8],
    				questionNumber: /*questionNumber*/ ctx[1],
    				questionsLeft: /*questionsLeft*/ ctx[0]
    			},
    			$$inline: true
    		});

    	let if_block = /*correct*/ ctx[6] && create_if_block_1$2(ctx);
    	let each_value = /*answers*/ ctx[4];
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

    			attr_dev(img0, "class", "fish svelte-a8e8xc");
    			if (img0.src !== (img0_src_value = /*fishURL*/ ctx[3])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "A fish!");
    			add_location(img0, file$5, 123, 8, 3295);
    			if (img1.src !== (img1_src_value = "./assets/answerBox.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Answer box");
    			attr_dev(img1, "class", "svelte-a8e8xc");
    			add_location(img1, file$5, 137, 12, 3719);
    			attr_dev(div0, "class", "answers svelte-a8e8xc");
    			add_location(div0, file$5, 138, 12, 3783);
    			attr_dev(div1, "class", "answer-box svelte-a8e8xc");
    			add_location(div1, file$5, 136, 8, 3682);
    			attr_dev(section, "class", "svelte-a8e8xc");
    			add_location(section, file$5, 122, 4, 3277);
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
    			if (!current || dirty & /*fishURL*/ 8 && img0.src !== (img0_src_value = /*fishURL*/ ctx[3])) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			const counter_changes = {};
    			if (dirty & /*numAttempts*/ 256) counter_changes.numAttempts = /*numAttempts*/ ctx[8];
    			if (dirty & /*questionNumber*/ 2) counter_changes.questionNumber = /*questionNumber*/ ctx[1];
    			if (dirty & /*questionsLeft*/ 1) counter_changes.questionsLeft = /*questionsLeft*/ ctx[0];
    			counter.$set(counter_changes);

    			if (/*correct*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*correct*/ 64) {
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

    			if (dirty & /*answers, handleAnswer, currFish, disableButtons*/ 1172) {
    				each_value = /*answers*/ ctx[4];
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

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(counter.$$.fragment, local);
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(counter);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(121:0) {#if !gameOver}",
    		ctx
    	});

    	return block;
    }

    // (128:8) {#if correct}
    function create_if_block_1$2(ctx) {
    	let div;
    	let correctmsg;
    	let t0;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	correctmsg = new CorrectMsg({
    			props: { status: /*correct*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(correctmsg.$$.fragment);
    			t0 = space();
    			button = element("button");
    			button.textContent = "Next Fish!";
    			attr_dev(button, "class", "svelte-a8e8xc");
    			add_location(button, file$5, 130, 16, 3578);
    			attr_dev(div, "class", "result svelte-a8e8xc");
    			add_location(div, file$5, 128, 12, 3494);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(correctmsg, div, null);
    			append_dev(div, t0);
    			append_dev(div, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*nextQuestion*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const correctmsg_changes = {};
    			if (dirty & /*correct*/ 64) correctmsg_changes.status = /*correct*/ ctx[6];
    			correctmsg.$set(correctmsg_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(correctmsg.$$.fragment, local);
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
    		source: "(128:8) {#if correct}",
    		ctx
    	});

    	return block;
    }

    // (140:16) {#each answers as answer}
    function create_each_block(ctx) {
    	let gamebutton;
    	let current;

    	gamebutton = new GameButton({
    			props: {
    				label: /*answer*/ ctx[20],
    				onPress: /*handleAnswer*/ ctx[10],
    				correctAns: /*currFish*/ ctx[2] === /*answer*/ ctx[20],
    				disableButtons: /*disableButtons*/ ctx[7]
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
    			if (dirty & /*answers*/ 16) gamebutton_changes.label = /*answer*/ ctx[20];
    			if (dirty & /*currFish, answers*/ 20) gamebutton_changes.correctAns = /*currFish*/ ctx[2] === /*answer*/ ctx[20];
    			if (dirty & /*disableButtons*/ 128) gamebutton_changes.disableButtons = /*disableButtons*/ ctx[7];
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
    		source: "(140:16) {#each answers as answer}",
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
    		if (!/*gameOver*/ ctx[5]) return 0;
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
    	let allFishNames = Object.keys(fishURLs);
    	console.log(fishURLs, allFishNames);
    	let newFishNames = Array.from(allFishNames);
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

    	// Returns a new fish that we have not seen before
    	// Used to select the next fish for guessing
    	function getNewFishName() {
    		let newFishIdx = getRandomIndex(newFishNames);
    		let newFish = newFishNames[newFishIdx];
    		newFishNames.splice(newFishIdx, 1);
    		$$invalidate(1, questionNumber++, questionNumber);
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
    			$$invalidate(6, correct = "correct");
    			score += 1;
    		} else {
    			$$invalidate(6, correct = "incorrect");
    			$$invalidate(8, numAttempts -= 1);

    			if (numAttempts === 0) {
    				youLose();
    			}
    		}

    		$$invalidate(7, disableButtons = true);
    	}

    	// Load the next question
    	function nextQuestion() {
    		$$invalidate(6, correct = null);
    		$$invalidate(7, disableButtons = false);

    		if (newFishNames.length > 0) {
    			$$invalidate(2, currFish = getNewFishName());
    			$$invalidate(3, fishURL = fishURLs[currFish]);
    			$$invalidate(4, answers = getAnswers(currFish));
    		} else {
    			youWin();
    		}
    	}

    	function youWin() {
    		$$invalidate(5, gameOver = true);
    		$$invalidate(9, didWin = true);
    	}

    	function youLose() {
    		$$invalidate(5, gameOver = true);
    		$$invalidate(9, didWin = false);
    	}

    	//Reset Game State
    	function resetGame() {
    		allFishNames = Object.keys(fishURLs);
    		newFishNames = Array.from(allFishNames);
    		$$invalidate(0, questionsLeft = newFishNames.length);
    		$$invalidate(1, questionNumber = 0);
    		$$invalidate(2, currFish = getNewFishName());
    		$$invalidate(3, fishURL = fishURLs[currFish]);
    		$$invalidate(4, answers = getAnswers(currFish));
    		$$invalidate(5, gameOver = false);
    		$$invalidate(6, correct = null);
    		$$invalidate(7, disableButtons = false);
    		score = 0;
    		$$invalidate(8, numAttempts = 3);
    		$$invalidate(9, didWin = false);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Game", $$slots, []);

    	$$self.$capture_state = () => ({
    		getRandomIndex,
    		shuffleArray,
    		fishURLs,
    		GameButton,
    		CorrectMSG: CorrectMsg,
    		GameOver,
    		CorrectMsg,
    		Counter,
    		allFishNames,
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
    		getNewFishName,
    		getAnswers,
    		handleAnswer,
    		nextQuestion,
    		youWin,
    		youLose,
    		resetGame
    	});

    	$$self.$inject_state = $$props => {
    		if ("allFishNames" in $$props) allFishNames = $$props.allFishNames;
    		if ("newFishNames" in $$props) newFishNames = $$props.newFishNames;
    		if ("questionsLeft" in $$props) $$invalidate(0, questionsLeft = $$props.questionsLeft);
    		if ("questionNumber" in $$props) $$invalidate(1, questionNumber = $$props.questionNumber);
    		if ("currFish" in $$props) $$invalidate(2, currFish = $$props.currFish);
    		if ("fishURL" in $$props) $$invalidate(3, fishURL = $$props.fishURL);
    		if ("answers" in $$props) $$invalidate(4, answers = $$props.answers);
    		if ("gameOver" in $$props) $$invalidate(5, gameOver = $$props.gameOver);
    		if ("correct" in $$props) $$invalidate(6, correct = $$props.correct);
    		if ("disableButtons" in $$props) $$invalidate(7, disableButtons = $$props.disableButtons);
    		if ("score" in $$props) score = $$props.score;
    		if ("numAttempts" in $$props) $$invalidate(8, numAttempts = $$props.numAttempts);
    		if ("didWin" in $$props) $$invalidate(9, didWin = $$props.didWin);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		questionsLeft,
    		questionNumber,
    		currFish,
    		fishURL,
    		answers,
    		gameOver,
    		correct,
    		disableButtons,
    		numAttempts,
    		didWin,
    		handleAnswer,
    		nextQuestion,
    		resetGame
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */
    const file$6 = "src/App.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let header;
    	let t;
    	let game;
    	let current;
    	header = new Header({ $$inline: true });
    	game = new Game({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t = space();
    			create_component(game.$$.fragment);
    			attr_dev(main, "class", "svelte-mdsmvq");
    			add_location(main, file$6, 7, 0, 131);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t);
    			mount_component(game, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(game);
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

    function instance$6($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Header, Game });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
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
