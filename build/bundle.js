var app=function(){"use strict";function t(){}function e(t){return t()}function n(){return Object.create(null)}function s(t){t.forEach(e)}function r(t){return"function"==typeof t}function o(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function i(t,e){t.appendChild(e)}function c(t,e,n){t.insertBefore(e,n||null)}function l(t){t.parentNode.removeChild(t)}function a(t){return document.createElement(t)}function u(t){return document.createTextNode(t)}function f(){return u(" ")}function h(){return u("")}function d(t,e,n,s){return t.addEventListener(e,n,s),()=>t.removeEventListener(e,n,s)}function p(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function m(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}let g;function $(t){g=t}const b=[],v=[],x=[],y=[],w=Promise.resolve();let j=!1;function P(t){x.push(t)}let A=!1;const k=new Set;function _(){if(!A){A=!0;do{for(let t=0;t<b.length;t+=1){const e=b[t];$(e),B(e.$$)}for(b.length=0;v.length;)v.pop()();for(let t=0;t<x.length;t+=1){const e=x[t];k.has(e)||(k.add(e),e())}x.length=0}while(b.length);for(;y.length;)y.pop()();j=!1,A=!1,k.clear()}}function B(t){if(null!==t.fragment){t.update(),s(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(P)}}const q=new Set;let N;function S(){N={r:0,c:[],p:N}}function E(){N.r||s(N.c),N=N.p}function L(t,e){t&&t.i&&(q.delete(t),t.i(e))}function M(t,e,n,s){if(t&&t.o){if(q.has(t))return;q.add(t),N.c.push(()=>{q.delete(t),s&&(n&&t.d(1),s())}),t.o(e)}}function T(t){t&&t.c()}function C(t,n,o){const{fragment:i,on_mount:c,on_destroy:l,after_update:a}=t.$$;i&&i.m(n,o),P(()=>{const n=c.map(e).filter(r);l?l.push(...n):s(n),t.$$.on_mount=[]}),a.forEach(P)}function W(t,e){const n=t.$$;null!==n.fragment&&(s(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function F(t,e){-1===t.$$.dirty[0]&&(b.push(t),j||(j=!0,w.then(_)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function O(e,r,o,i,c,a,u=[-1]){const f=g;$(e);const h=r.props||{},d=e.$$={fragment:null,ctx:null,props:a,update:t,not_equal:c,bound:n(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(f?f.$$.context:[]),callbacks:n(),dirty:u,skip_bound:!1};let p=!1;if(d.ctx=o?o(e,h,(t,n,...s)=>{const r=s.length?s[0]:n;return d.ctx&&c(d.ctx[t],d.ctx[t]=r)&&(!d.skip_bound&&d.bound[t]&&d.bound[t](r),p&&F(e,t)),n}):[],d.update(),p=!0,s(d.before_update),d.fragment=!!i&&i(d.ctx),r.target){if(r.hydrate){const t=function(t){return Array.from(t.childNodes)}(r.target);d.fragment&&d.fragment.l(t),t.forEach(l)}else d.fragment&&d.fragment.c();r.intro&&L(e.$$.fragment),C(e,r.target,r.anchor),_()}$(f)}class z{$destroy(){W(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function H(e){let n;return{c(){n=a("header"),n.innerHTML='<h1 class="svelte-p8czvr">Name that Fish!</h1>',p(n,"class","svelte-p8czvr")},m(t,e){c(t,n,e)},p:t,i:t,o:t,d(t){t&&l(n)}}}class G extends z{constructor(t){super(),O(this,t,null,H,o,{})}}function D(t){return Math.floor(Math.random()*t.length)}var R={"Small Mouth Bass":"./assets/fishPics/smallmouthbass.jpg","Large Mouth Bass":"./assets/fishPics/largemouthbass.jpg",Clownfish:"./assets/fishPics/clownfish.jpg","Blue Tang":"./assets/fishPics/bluetang.jpg","Angel Fish":"./assets/fishPics/angelfish.jpeg","Angler Fish":"./assets/fishPics/anglerfish.jpg","Butterfly Fish":"./assets/fishPics/butterflyfish.jpeg","Great White Shark":"./assets/fishPics/greatwhite.jpg",Grouper:"./assets/fishPics/grouper.jpeg","Hammerhead Shark":"./assets/fishPics/hammerhead.jpg","Leopard Shark":"./assets/fishPics/leopardshark.jpg","Mandarin Fish":"./assets/fishPics/mandarinfish.jpeg",Pirhana:"./assets/fishPics/piranha.jpeg","Rainbow Trout":"./assets/fishPics/rainbowtrout.jpg",Salmon:"./assets/fishPics/Salmon.jpg",Sardine:"./assets/fishPics/sardine.jpg",Sunfish:"./assets/fishPics/sunfish.jpg",Swordfish:"./assets/fishPics/swordfish.jpg",Tuna:"./assets/fishPics/tuna.jpg","Whale Shark":"./assets/fishPics/whaleshark.jpg"};function J(e){let n;return{c(){n=a("i"),p(n,"class","fas fa-times incorrect svelte-x6rn8g")},m(t,e){c(t,n,e)},p:t,d(t){t&&l(n)}}}function K(e){let n;return{c(){n=a("i"),p(n,"class","fas fa-check-circle correct svelte-x6rn8g")},m(t,e){c(t,n,e)},p:t,d(t){t&&l(n)}}}function Q(t){let e,n,s;return{c(){e=a("i"),p(e,"class","fas fa-dharmachakra svelte-x6rn8g"),p(e,"data-value",t[0])},m(o,i){c(o,e,i),n||(s=d(e,"click",(function(){r(t[1])&&t[1].apply(this,arguments)})),n=!0)},p(n,s){t=n,1&s&&p(e,"data-value",t[0])},d(t){t&&l(e),n=!1,s()}}}function Y(e){let n,s,r,o;function h(t,e){return t[2]?t[3]?K:J:Q}let d=h(e),g=d(e);return{c(){n=a("div"),g.c(),s=f(),r=a("span"),o=u(e[0]),p(r,"class","svelte-x6rn8g"),p(n,"class","svelte-x6rn8g")},m(t,e){c(t,n,e),g.m(n,null),i(n,s),i(n,r),i(r,o)},p(t,[e]){d===(d=h(t))&&g?g.p(t,e):(g.d(1),g=d(t),g&&(g.c(),g.m(n,s))),1&e&&m(o,t[0])},i:t,o:t,d(t){t&&l(n),g.d()}}}function I(t,e,n){let{label:s}=e,{onPress:r}=e,{disableButtons:o}=e,{correctAns:i}=e;return t.$$set=t=>{"label"in t&&n(0,s=t.label),"onPress"in t&&n(1,r=t.onPress),"disableButtons"in t&&n(2,o=t.disableButtons),"correctAns"in t&&n(3,i=t.correctAns)},[s,r,o,i]}class U extends z{constructor(t){super(),O(this,t,I,Y,o,{label:0,onPress:1,disableButtons:2,correctAns:3})}}function V(t){let e;return{c(){e=a("h1"),e.textContent="SWAB THE DECK!",p(e,"class","wrong svelte-1xytm16")},m(t,n){c(t,e,n)},d(t){t&&l(e)}}}function X(t){let e;return{c(){e=a("h1"),e.textContent="GREAT JOB, MATEY!",p(e,"class","right svelte-1xytm16")},m(t,n){c(t,e,n)},d(t){t&&l(e)}}}function Z(e){let n;function s(t,e){return"correct"===t[0]?X:"incorrect"===t[0]?V:void 0}let r=s(e),o=r&&r(e);return{c(){o&&o.c(),n=h()},m(t,e){o&&o.m(t,e),c(t,n,e)},p(t,[e]){r!==(r=s(t))&&(o&&o.d(1),o=r&&r(t),o&&(o.c(),o.m(n.parentNode,n)))},i:t,o:t,d(t){o&&o.d(t),t&&l(n)}}}function tt(t,e,n){let{status:s}=e;return t.$$set=t=>{"status"in t&&n(0,s=t.status)},[s]}class et extends z{constructor(t){super(),O(this,t,tt,Z,o,{status:0})}}function nt(t){let e,n,s,r;return{c(){e=a("h1"),e.textContent="Thunderin' Typhoons, yer fish knowledge needs some hoistin'!",n=f(),s=a("img"),p(e,"class","lose svelte-adtwxy"),s.src!==(r="./assets/lose.gif")&&p(s,"src","./assets/lose.gif"),p(s,"alt",""),p(s,"class","svelte-adtwxy")},m(t,r){c(t,e,r),c(t,n,r),c(t,s,r)},d(t){t&&l(e),t&&l(n),t&&l(s)}}}function st(t){let e,n,s,r;return{c(){e=a("h1"),e.textContent="Hats off to ye Matey, you win!",n=f(),s=a("img"),p(e,"class","win svelte-adtwxy"),s.src!==(r="./assets/win.gif")&&p(s,"src","./assets/win.gif"),p(s,"alt",""),p(s,"class","svelte-adtwxy")},m(t,r){c(t,e,r),c(t,n,r),c(t,s,r)},d(t){t&&l(e),t&&l(n),t&&l(s)}}}function rt(e){let n,s,o,u,h;function m(t,e){return t[0]?st:nt}let g=m(e),$=g(e);return{c(){n=a("div"),$.c(),s=f(),o=a("button"),o.textContent="Play Again!",p(o,"class","svelte-adtwxy"),p(n,"class","svelte-adtwxy")},m(t,l){c(t,n,l),$.m(n,null),i(n,s),i(n,o),u||(h=d(o,"click",(function(){r(e[1])&&e[1].apply(this,arguments)})),u=!0)},p(t,[r]){g!==(g=m(e=t))&&($.d(1),$=g(e),$&&($.c(),$.m(n,s)))},i:t,o:t,d(t){t&&l(n),$.d(),u=!1,h()}}}function ot(t,e,n){let{didWin:s}=e,{reset:r}=e;return t.$$set=t=>{"didWin"in t&&n(0,s=t.didWin),"reset"in t&&n(1,r=t.reset)},[s,r]}class it extends z{constructor(t){super(),O(this,t,ot,rt,o,{didWin:0,reset:1})}}function ct(e){let n,s,r,o,h,d,g,$,b,v,x,y;return{c(){n=a("div"),s=a("span"),r=u("Question: "),o=a("span"),h=u(e[1]),d=u(" of "),g=u(e[2]),$=f(),b=a("span"),v=u("Wrong answers left: "),x=a("span"),y=u(e[0]),p(o,"class","questions svelte-kzt66j"),p(s,"class","field"),p(x,"class","attempts svelte-kzt66j"),p(b,"class","field"),p(n,"class","svelte-kzt66j")},m(t,e){c(t,n,e),i(n,s),i(s,r),i(s,o),i(o,h),i(s,d),i(s,g),i(n,$),i(n,b),i(b,v),i(b,x),i(x,y)},p(t,[e]){2&e&&m(h,t[1]),4&e&&m(g,t[2]),1&e&&m(y,t[0])},i:t,o:t,d(t){t&&l(n)}}}function lt(t,e,n){let{numAttempts:s}=e,{questionNumber:r}=e,{questionsLeft:o}=e;return t.$$set=t=>{"numAttempts"in t&&n(0,s=t.numAttempts),"questionNumber"in t&&n(1,r=t.questionNumber),"questionsLeft"in t&&n(2,o=t.questionsLeft)},[s,r,o]}class at extends z{constructor(t){super(),O(this,t,lt,ct,o,{numAttempts:0,questionNumber:1,questionsLeft:2})}}function ut(t,e,n){const s=t.slice();return s[20]=e[n],s}function ft(t){let e,n,s;return n=new it({props:{reset:t[12],didWin:t[9]}}),{c(){e=a("section"),T(n.$$.fragment),p(e,"class","svelte-rbhhpr")},m(t,r){c(t,e,r),C(n,e,null),s=!0},p(t,e){const s={};512&e&&(s.didWin=t[9]),n.$set(s)},i(t){s||(L(n.$$.fragment,t),s=!0)},o(t){M(n.$$.fragment,t),s=!1},d(t){t&&l(e),W(n)}}}function ht(t){let e,n,s,r,o,u,h,d,m,g,$,b,v;o=new at({props:{numAttempts:t[8],questionNumber:t[1],questionsLeft:t[0]}});let x=t[6]&&dt(t),y=t[4],w=[];for(let e=0;e<y.length;e+=1)w[e]=pt(ut(t,y,e));const j=t=>M(w[t],1,1,()=>{w[t]=null});return{c(){e=a("section"),n=a("img"),r=f(),T(o.$$.fragment),u=f(),x&&x.c(),h=f(),d=a("div"),m=a("img"),$=f(),b=a("div");for(let t=0;t<w.length;t+=1)w[t].c();p(n,"class","fish svelte-rbhhpr"),n.src!==(s=t[3])&&p(n,"src",s),p(n,"alt","A fish!"),m.src!==(g="./assets/answerBox.png")&&p(m,"src","./assets/answerBox.png"),p(m,"alt","Answer box"),p(m,"class","svelte-rbhhpr"),p(b,"class","answers svelte-rbhhpr"),p(d,"class","answer-box svelte-rbhhpr"),p(e,"class","svelte-rbhhpr")},m(t,s){c(t,e,s),i(e,n),i(e,r),C(o,e,null),i(e,u),x&&x.m(e,null),i(e,h),i(e,d),i(d,m),i(d,$),i(d,b);for(let t=0;t<w.length;t+=1)w[t].m(b,null);v=!0},p(t,r){(!v||8&r&&n.src!==(s=t[3]))&&p(n,"src",s);const i={};if(256&r&&(i.numAttempts=t[8]),2&r&&(i.questionNumber=t[1]),1&r&&(i.questionsLeft=t[0]),o.$set(i),t[6]?x?(x.p(t,r),64&r&&L(x,1)):(x=dt(t),x.c(),L(x,1),x.m(e,h)):x&&(S(),M(x,1,1,()=>{x=null}),E()),1172&r){let e;for(y=t[4],e=0;e<y.length;e+=1){const n=ut(t,y,e);w[e]?(w[e].p(n,r),L(w[e],1)):(w[e]=pt(n),w[e].c(),L(w[e],1),w[e].m(b,null))}for(S(),e=y.length;e<w.length;e+=1)j(e);E()}},i(t){if(!v){L(o.$$.fragment,t),L(x);for(let t=0;t<y.length;t+=1)L(w[t]);v=!0}},o(t){M(o.$$.fragment,t),M(x),w=w.filter(Boolean);for(let t=0;t<w.length;t+=1)M(w[t]);v=!1},d(t){t&&l(e),W(o),x&&x.d(),function(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}(w,t)}}}function dt(t){let e,n,s,r,o,u,h;return n=new et({props:{status:t[6]}}),{c(){e=a("div"),T(n.$$.fragment),s=f(),r=a("button"),r.textContent="Next Fish!",p(r,"class","svelte-rbhhpr"),p(e,"class","result svelte-rbhhpr")},m(l,a){c(l,e,a),C(n,e,null),i(e,s),i(e,r),o=!0,u||(h=d(r,"click",t[11]),u=!0)},p(t,e){const s={};64&e&&(s.status=t[6]),n.$set(s)},i(t){o||(L(n.$$.fragment,t),o=!0)},o(t){M(n.$$.fragment,t),o=!1},d(t){t&&l(e),W(n),u=!1,h()}}}function pt(t){let e,n;return e=new U({props:{label:t[20],onPress:t[10],correctAns:t[2]===t[20],disableButtons:t[7]}}),{c(){T(e.$$.fragment)},m(t,s){C(e,t,s),n=!0},p(t,n){const s={};16&n&&(s.label=t[20]),20&n&&(s.correctAns=t[2]===t[20]),128&n&&(s.disableButtons=t[7]),e.$set(s)},i(t){n||(L(e.$$.fragment,t),n=!0)},o(t){M(e.$$.fragment,t),n=!1},d(t){W(e,t)}}}function mt(t){let e,n,s,r;const o=[ht,ft],i=[];function a(t,e){return t[5]?1:0}return e=a(t),n=i[e]=o[e](t),{c(){n.c(),s=h()},m(t,n){i[e].m(t,n),c(t,s,n),r=!0},p(t,[r]){let c=e;e=a(t),e===c?i[e].p(t,r):(S(),M(i[c],1,1,()=>{i[c]=null}),E(),n=i[e],n||(n=i[e]=o[e](t),n.c()),L(n,1),n.m(s.parentNode,s))},i(t){r||(L(n),r=!0)},o(t){M(n),r=!1},d(t){i[e].d(t),t&&l(s)}}}function gt(t,e,n){let s=Object.keys(R);console.log(R,s);let r=Array.from(s);var o=r.length,i=0,c=m(),l=R[c],a=g(c),u=!1,f=null,h=!1,d=3,p=!1;function m(){let t=D(r),e=r[t];return r.splice(t,1),n(1,i++,i),e}function g(t){let e=[t],n=s.filter(e=>e!==t);for(;e.length<4;){let t=D(n),s=n[t];e.push(s),n.splice(t,1)}return function(t){let e=t.length-1;for(;0!==e;){let n=Math.floor(Math.random()*e);[t[e],t[n]]=[t[n],t[e]],e--}return t}(e)}return[o,i,c,l,a,u,f,h,d,p,function(t){t.preventDefault(),t.target.dataset.value===c?n(6,f="correct"):(n(6,f="incorrect"),n(8,d-=1),0===d&&(n(5,u=!0),n(9,p=!1))),n(7,h=!0)},function(){n(6,f=null),n(7,h=!1),r.length>0?(n(2,c=m()),n(3,l=R[c]),n(4,a=g(c))):(n(5,u=!0),n(9,p=!0))},function(){s=Object.keys(R),r=Array.from(s),n(0,o=r.length),n(1,i=0),n(2,c=m()),n(3,l=R[c]),n(4,a=g(c)),n(5,u=!1),n(6,f=null),n(7,h=!1),n(8,d=3),n(9,p=!1)}]}class $t extends z{constructor(t){super(),O(this,t,gt,mt,o,{})}}function bt(e){let n,s,r,o,u;return s=new G({}),o=new $t({}),{c(){n=a("main"),T(s.$$.fragment),r=f(),T(o.$$.fragment),p(n,"class","svelte-mdsmvq")},m(t,e){c(t,n,e),C(s,n,null),i(n,r),C(o,n,null),u=!0},p:t,i(t){u||(L(s.$$.fragment,t),L(o.$$.fragment,t),u=!0)},o(t){M(s.$$.fragment,t),M(o.$$.fragment,t),u=!1},d(t){t&&l(n),W(s),W(o)}}}return new class extends z{constructor(t){super(),O(this,t,null,bt,o,{})}}({target:document.body,props:{}})}();
//# sourceMappingURL=bundle.js.map
