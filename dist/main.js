(function() {
	//#region package.json
	var version = "1.4.0";
	//#endregion
	//#region src/modInfo.ts
	var name = "Choose Your Own Lump";
	//#endregion
	//#region src/discrepancyInfo.ts
	var discrepancyInfo = {
		available: false,
		previous: {
			lumpT: 1599999999998,
			lumpOverripeAge: 86400002
		},
		current: {
			lumpT: 1599999999999,
			lumpOverripeAge: 86400001
		},
		expectedDiscrepancy: 42
	};
	function clearDiscrepancyInfo() {
		discrepancyInfo.available = false;
	}
	function getDiscrepancyInfoForStorage() {
		return {
			lumpT: Math.floor(Game.lumpT),
			lumpOverripeAge: Game.lumpOverripeAge
		};
	}
	function loadDiscrepancyInfo(storedDiscrepancyInfo, newPrefs, isInitialLoad) {
		discrepancyInfo.available = false;
		discrepancyInfo.previous = storedDiscrepancyInfo;
		discrepancyInfo.expectedDiscrepancy = newPrefs.discrepancy;
		function retriever() {
			discrepancyInfo.current.lumpT = Game.lumpT;
			discrepancyInfo.current.lumpOverripeAge = Game.lumpOverripeAge;
			discrepancyInfo.available = true;
		}
		if (isInitialLoad) retriever();
		else setTimeout(retriever, 0);
	}
	function discrepancyInfoRetrievalFallback(newPrefs, isInitialLoad) {
		discrepancyInfo.expectedDiscrepancy = newPrefs.discrepancy;
		if (isInitialLoad) discrepancyInfo.available = false;
		else {
			discrepancyInfo.available = false;
			discrepancyInfo.previous.lumpT = Game.lumpT;
			setTimeout(() => {
				discrepancyInfo.current.lumpT = Game.lumpT;
				discrepancyInfo.current.lumpOverripeAge = Game.lumpOverripeAge;
				discrepancyInfo.previous.lumpOverripeAge = Game.lumpOverripeAge;
				discrepancyInfo.available = true;
			}, 0);
		}
	}
	//#endregion
	//#region src/preferences.ts
	function getDefaultPreferences() {
		return {
			discrepancy: 1,
			display: {
				compactGrandmapocalypseRepresentation: false,
				rows: 10,
				reportType: "fullList",
				showCheckmark: true,
				useMatureGoldenLumpSprite: false
			},
			filtering: {
				threeColumnDragonAuras: false,
				conditions: {
					preserveDragon: "observe",
					preservePantheon: "observe",
					preserveGrandmapocalypseStage: "observe",
					respectBudget: "observe"
				},
				includeType: {
					normal: false,
					bifurcated: false,
					golden: true,
					meaty: false,
					caramelized: true
				}
			}
		};
	}
	var preferences = getDefaultPreferences();
	function setPreferences(newPreferences) {
		Object.assign(preferences, newPreferences);
	}
	//#endregion
	//#region src/planner/util.ts
	function getCurrentFilteringPreferences() {
		return structuredClone(preferences.filtering);
	}
	function getCurrentGameState() {
		let currentRigidelSlot = "none";
		let slots = Game?.Objects["Temple"]?.minigame?.slot ?? null;
		if (slots) {
			let rigidelId = Game.Objects["Temple"].minigame.gods["order"].id;
			if (slots[0] == rigidelId) currentRigidelSlot = "diamond";
			if (slots[1] == rigidelId) currentRigidelSlot = "ruby";
			if (slots[2] == rigidelId) currentRigidelSlot = "jade";
		}
		if (Game.BuildingsOwned % 10 != 0) currentRigidelSlot = "none";
		return {
			discrepancy: preferences.discrepancy,
			hasSteviaCaelestis: Boolean(Game.Has("Stevia Caelestis")),
			hasSucralosiaInutilis: Boolean(Game.Has("Sucralosia Inutilis")),
			hasSugarAgingProcess: Boolean(Game.Has("Sugar aging process")),
			seed: Game.seed,
			currentLumpT: Math.floor(Game.lumpT),
			currentRigidelSlot,
			currentGrandmaCount: Game.Objects["Grandma"].amount,
			currentGrandmapocalypseStage: Game.elderWrath,
			currentHasDragonsCurve: Game.hasAura("Dragon's Curve"),
			currentHasRealityBending: Game.hasAura("Reality Bending"),
			currentHasSupremeIntellect: Game.hasAura("Supreme Intellect")
		};
	}
	var bankFactor = .01;
	function getCurrentBudget() {
		function maximumPurchases(building, cap) {
			let budget = Game.cookies * bankFactor;
			for (let count = building.amount; count <= cap; count++) if (building.getSumPrice(count - building.amount) > budget) return count - 1;
			return cap;
		}
		return {
			maxGrandmas: maximumPurchases(Game.Objects["Grandma"], 600),
			unlockedPantheon: Game.Objects["Temple"].level > 0,
			unlockedDragonsCurve: maximumPurchases(Game.Objects["Fractal engine"], 100) >= 100,
			unlockedRealityBending: maximumPurchases(Game.Objects["Javascript console"], 100) >= 100,
			unlockedSupremeIntellect: maximumPurchases(Game.Objects["Idleverse"], 100) >= 100,
			unlockedSecondAura: maximumPurchases(Game.Objects["You"], 200) >= 200
		};
	}
	function getCurrentFullGameState() {
		return {
			gameState: getCurrentGameState(),
			preferences: getCurrentFilteringPreferences(),
			budget: getCurrentBudget()
		};
	}
	//#endregion
	//#region src/planner/worker.ts?worker&inline
	var jsContent = "(function() {\n	//#region \\0rolldown/runtime.js\n	var __create = Object.create;\n	var __defProp = Object.defineProperty;\n	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;\n	var __getOwnPropNames = Object.getOwnPropertyNames;\n	var __getProtoOf = Object.getPrototypeOf;\n	var __hasOwnProp = Object.prototype.hasOwnProperty;\n	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);\n	var __copyProps = (to, from, except, desc) => {\n		if (from && typeof from === \"object\" || typeof from === \"function\") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {\n			key = keys[i];\n			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {\n				get: ((k) => from[k]).bind(null, key),\n				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable\n			});\n		}\n		return to;\n	};\n	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, \"default\", {\n		value: mod,\n		enumerable: true\n	}) : target, mod));\n	//#endregion\n	//#region node_modules/seedrandom/lib/alea.js\n	var require_alea = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		(function(global, module$6, define) {\n			function Alea(seed) {\n				var me = this, mash = Mash();\n				me.next = function() {\n					var t = 2091639 * me.s0 + me.c * 23283064365386963e-26;\n					me.s0 = me.s1;\n					me.s1 = me.s2;\n					return me.s2 = t - (me.c = t | 0);\n				};\n				me.c = 1;\n				me.s0 = mash(\" \");\n				me.s1 = mash(\" \");\n				me.s2 = mash(\" \");\n				me.s0 -= mash(seed);\n				if (me.s0 < 0) me.s0 += 1;\n				me.s1 -= mash(seed);\n				if (me.s1 < 0) me.s1 += 1;\n				me.s2 -= mash(seed);\n				if (me.s2 < 0) me.s2 += 1;\n				mash = null;\n			}\n			function copy(f, t) {\n				t.c = f.c;\n				t.s0 = f.s0;\n				t.s1 = f.s1;\n				t.s2 = f.s2;\n				return t;\n			}\n			function impl(seed, opts) {\n				var xg = new Alea(seed), state = opts && opts.state, prng = xg.next;\n				prng.int32 = function() {\n					return xg.next() * 4294967296 | 0;\n				};\n				prng.double = function() {\n					return prng() + (prng() * 2097152 | 0) * 11102230246251565e-32;\n				};\n				prng.quick = prng;\n				if (state) {\n					if (typeof state == \"object\") copy(state, xg);\n					prng.state = function() {\n						return copy(xg, {});\n					};\n				}\n				return prng;\n			}\n			function Mash() {\n				var n = 4022871197;\n				var mash = function(data) {\n					data = String(data);\n					for (var i = 0; i < data.length; i++) {\n						n += data.charCodeAt(i);\n						var h = .02519603282416938 * n;\n						n = h >>> 0;\n						h -= n;\n						h *= n;\n						n = h >>> 0;\n						h -= n;\n						n += h * 4294967296;\n					}\n					return (n >>> 0) * 23283064365386963e-26;\n				};\n				return mash;\n			}\n			if (module$6 && module$6.exports) module$6.exports = impl;\n			else if (define && define.amd) define(function() {\n				return impl;\n			});\n			else this.alea = impl;\n		})(exports, typeof module == \"object\" && module, typeof define == \"function\" && define);\n	}));\n	//#endregion\n	//#region node_modules/seedrandom/lib/xor128.js\n	var require_xor128 = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		(function(global, module$5, define) {\n			function XorGen(seed) {\n				var me = this, strseed = \"\";\n				me.x = 0;\n				me.y = 0;\n				me.z = 0;\n				me.w = 0;\n				me.next = function() {\n					var t = me.x ^ me.x << 11;\n					me.x = me.y;\n					me.y = me.z;\n					me.z = me.w;\n					return me.w ^= me.w >>> 19 ^ t ^ t >>> 8;\n				};\n				if (seed === (seed | 0)) me.x = seed;\n				else strseed += seed;\n				for (var k = 0; k < strseed.length + 64; k++) {\n					me.x ^= strseed.charCodeAt(k) | 0;\n					me.next();\n				}\n			}\n			function copy(f, t) {\n				t.x = f.x;\n				t.y = f.y;\n				t.z = f.z;\n				t.w = f.w;\n				return t;\n			}\n			function impl(seed, opts) {\n				var xg = new XorGen(seed), state = opts && opts.state, prng = function() {\n					return (xg.next() >>> 0) / 4294967296;\n				};\n				prng.double = function() {\n					do\n						var result = ((xg.next() >>> 11) + (xg.next() >>> 0) / 4294967296) / (1 << 21);\n					while (result === 0);\n					return result;\n				};\n				prng.int32 = xg.next;\n				prng.quick = prng;\n				if (state) {\n					if (typeof state == \"object\") copy(state, xg);\n					prng.state = function() {\n						return copy(xg, {});\n					};\n				}\n				return prng;\n			}\n			if (module$5 && module$5.exports) module$5.exports = impl;\n			else if (define && define.amd) define(function() {\n				return impl;\n			});\n			else this.xor128 = impl;\n		})(exports, typeof module == \"object\" && module, typeof define == \"function\" && define);\n	}));\n	//#endregion\n	//#region node_modules/seedrandom/lib/xorwow.js\n	var require_xorwow = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		(function(global, module$4, define) {\n			function XorGen(seed) {\n				var me = this, strseed = \"\";\n				me.next = function() {\n					var t = me.x ^ me.x >>> 2;\n					me.x = me.y;\n					me.y = me.z;\n					me.z = me.w;\n					me.w = me.v;\n					return (me.d = me.d + 362437 | 0) + (me.v = me.v ^ me.v << 4 ^ (t ^ t << 1)) | 0;\n				};\n				me.x = 0;\n				me.y = 0;\n				me.z = 0;\n				me.w = 0;\n				me.v = 0;\n				if (seed === (seed | 0)) me.x = seed;\n				else strseed += seed;\n				for (var k = 0; k < strseed.length + 64; k++) {\n					me.x ^= strseed.charCodeAt(k) | 0;\n					if (k == strseed.length) me.d = me.x << 10 ^ me.x >>> 4;\n					me.next();\n				}\n			}\n			function copy(f, t) {\n				t.x = f.x;\n				t.y = f.y;\n				t.z = f.z;\n				t.w = f.w;\n				t.v = f.v;\n				t.d = f.d;\n				return t;\n			}\n			function impl(seed, opts) {\n				var xg = new XorGen(seed), state = opts && opts.state, prng = function() {\n					return (xg.next() >>> 0) / 4294967296;\n				};\n				prng.double = function() {\n					do\n						var result = ((xg.next() >>> 11) + (xg.next() >>> 0) / 4294967296) / (1 << 21);\n					while (result === 0);\n					return result;\n				};\n				prng.int32 = xg.next;\n				prng.quick = prng;\n				if (state) {\n					if (typeof state == \"object\") copy(state, xg);\n					prng.state = function() {\n						return copy(xg, {});\n					};\n				}\n				return prng;\n			}\n			if (module$4 && module$4.exports) module$4.exports = impl;\n			else if (define && define.amd) define(function() {\n				return impl;\n			});\n			else this.xorwow = impl;\n		})(exports, typeof module == \"object\" && module, typeof define == \"function\" && define);\n	}));\n	//#endregion\n	//#region node_modules/seedrandom/lib/xorshift7.js\n	var require_xorshift7 = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		(function(global, module$3, define) {\n			function XorGen(seed) {\n				var me = this;\n				me.next = function() {\n					var X = me.x, i = me.i, t = X[i], v;\n					t ^= t >>> 7;\n					v = t ^ t << 24;\n					t = X[i + 1 & 7];\n					v ^= t ^ t >>> 10;\n					t = X[i + 3 & 7];\n					v ^= t ^ t >>> 3;\n					t = X[i + 4 & 7];\n					v ^= t ^ t << 7;\n					t = X[i + 7 & 7];\n					t = t ^ t << 13;\n					v ^= t ^ t << 9;\n					X[i] = v;\n					me.i = i + 1 & 7;\n					return v;\n				};\n				function init(me, seed) {\n					var j, X = [];\n					if (seed === (seed | 0)) X[0] = seed;\n					else {\n						seed = \"\" + seed;\n						for (j = 0; j < seed.length; ++j) X[j & 7] = X[j & 7] << 15 ^ seed.charCodeAt(j) + X[j + 1 & 7] << 13;\n					}\n					while (X.length < 8) X.push(0);\n					for (j = 0; j < 8 && X[j] === 0; ++j);\n					if (j == 8) X[7] = -1;\n					else X[j];\n					me.x = X;\n					me.i = 0;\n					for (j = 256; j > 0; --j) me.next();\n				}\n				init(me, seed);\n			}\n			function copy(f, t) {\n				t.x = f.x.slice();\n				t.i = f.i;\n				return t;\n			}\n			function impl(seed, opts) {\n				if (seed == null) seed = +/* @__PURE__ */ new Date();\n				var xg = new XorGen(seed), state = opts && opts.state, prng = function() {\n					return (xg.next() >>> 0) / 4294967296;\n				};\n				prng.double = function() {\n					do\n						var result = ((xg.next() >>> 11) + (xg.next() >>> 0) / 4294967296) / (1 << 21);\n					while (result === 0);\n					return result;\n				};\n				prng.int32 = xg.next;\n				prng.quick = prng;\n				if (state) {\n					if (state.x) copy(state, xg);\n					prng.state = function() {\n						return copy(xg, {});\n					};\n				}\n				return prng;\n			}\n			if (module$3 && module$3.exports) module$3.exports = impl;\n			else if (define && define.amd) define(function() {\n				return impl;\n			});\n			else this.xorshift7 = impl;\n		})(exports, typeof module == \"object\" && module, typeof define == \"function\" && define);\n	}));\n	//#endregion\n	//#region node_modules/seedrandom/lib/xor4096.js\n	var require_xor4096 = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		(function(global, module$2, define) {\n			function XorGen(seed) {\n				var me = this;\n				me.next = function() {\n					var w = me.w, X = me.X, i = me.i, t, v;\n					me.w = w = w + 1640531527 | 0;\n					v = X[i + 34 & 127];\n					t = X[i = i + 1 & 127];\n					v ^= v << 13;\n					t ^= t << 17;\n					v ^= v >>> 15;\n					t ^= t >>> 12;\n					v = X[i] = v ^ t;\n					me.i = i;\n					return v + (w ^ w >>> 16) | 0;\n				};\n				function init(me, seed) {\n					var t, v, i, j, w, X = [], limit = 128;\n					if (seed === (seed | 0)) {\n						v = seed;\n						seed = null;\n					} else {\n						seed = seed + \"\\0\";\n						v = 0;\n						limit = Math.max(limit, seed.length);\n					}\n					for (i = 0, j = -32; j < limit; ++j) {\n						if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);\n						if (j === 0) w = v;\n						v ^= v << 10;\n						v ^= v >>> 15;\n						v ^= v << 4;\n						v ^= v >>> 13;\n						if (j >= 0) {\n							w = w + 1640531527 | 0;\n							t = X[j & 127] ^= v + w;\n							i = 0 == t ? i + 1 : 0;\n						}\n					}\n					if (i >= 128) X[(seed && seed.length || 0) & 127] = -1;\n					i = 127;\n					for (j = 512; j > 0; --j) {\n						v = X[i + 34 & 127];\n						t = X[i = i + 1 & 127];\n						v ^= v << 13;\n						t ^= t << 17;\n						v ^= v >>> 15;\n						t ^= t >>> 12;\n						X[i] = v ^ t;\n					}\n					me.w = w;\n					me.X = X;\n					me.i = i;\n				}\n				init(me, seed);\n			}\n			function copy(f, t) {\n				t.i = f.i;\n				t.w = f.w;\n				t.X = f.X.slice();\n				return t;\n			}\n			function impl(seed, opts) {\n				if (seed == null) seed = +/* @__PURE__ */ new Date();\n				var xg = new XorGen(seed), state = opts && opts.state, prng = function() {\n					return (xg.next() >>> 0) / 4294967296;\n				};\n				prng.double = function() {\n					do\n						var result = ((xg.next() >>> 11) + (xg.next() >>> 0) / 4294967296) / (1 << 21);\n					while (result === 0);\n					return result;\n				};\n				prng.int32 = xg.next;\n				prng.quick = prng;\n				if (state) {\n					if (state.X) copy(state, xg);\n					prng.state = function() {\n						return copy(xg, {});\n					};\n				}\n				return prng;\n			}\n			if (module$2 && module$2.exports) module$2.exports = impl;\n			else if (define && define.amd) define(function() {\n				return impl;\n			});\n			else this.xor4096 = impl;\n		})(exports, typeof module == \"object\" && module, typeof define == \"function\" && define);\n	}));\n	//#endregion\n	//#region node_modules/seedrandom/lib/tychei.js\n	var require_tychei = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		(function(global, module$1, define) {\n			function XorGen(seed) {\n				var me = this, strseed = \"\";\n				me.next = function() {\n					var b = me.b, c = me.c, d = me.d, a = me.a;\n					b = b << 25 ^ b >>> 7 ^ c;\n					c = c - d | 0;\n					d = d << 24 ^ d >>> 8 ^ a;\n					a = a - b | 0;\n					me.b = b = b << 20 ^ b >>> 12 ^ c;\n					me.c = c = c - d | 0;\n					me.d = d << 16 ^ c >>> 16 ^ a;\n					return me.a = a - b | 0;\n				};\n				me.a = 0;\n				me.b = 0;\n				me.c = -1640531527;\n				me.d = 1367130551;\n				if (seed === Math.floor(seed)) {\n					me.a = seed / 4294967296 | 0;\n					me.b = seed | 0;\n				} else strseed += seed;\n				for (var k = 0; k < strseed.length + 20; k++) {\n					me.b ^= strseed.charCodeAt(k) | 0;\n					me.next();\n				}\n			}\n			function copy(f, t) {\n				t.a = f.a;\n				t.b = f.b;\n				t.c = f.c;\n				t.d = f.d;\n				return t;\n			}\n			function impl(seed, opts) {\n				var xg = new XorGen(seed), state = opts && opts.state, prng = function() {\n					return (xg.next() >>> 0) / 4294967296;\n				};\n				prng.double = function() {\n					do\n						var result = ((xg.next() >>> 11) + (xg.next() >>> 0) / 4294967296) / (1 << 21);\n					while (result === 0);\n					return result;\n				};\n				prng.int32 = xg.next;\n				prng.quick = prng;\n				if (state) {\n					if (typeof state == \"object\") copy(state, xg);\n					prng.state = function() {\n						return copy(xg, {});\n					};\n				}\n				return prng;\n			}\n			if (module$1 && module$1.exports) module$1.exports = impl;\n			else if (define && define.amd) define(function() {\n				return impl;\n			});\n			else this.tychei = impl;\n		})(exports, typeof module == \"object\" && module, typeof define == \"function\" && define);\n	}));\n	//#endregion\n	//#region __vite-browser-external\n	var require___vite_browser_external = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		module.exports = {};\n	}));\n	//#endregion\n	//#region node_modules/seedrandom/seedrandom.js\n	var require_seedrandom$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {\n		(function(global, pool, math) {\n			var width = 256, chunks = 6, digits = 52, rngname = \"random\", startdenom = math.pow(width, chunks), significance = math.pow(2, digits), overflow = significance * 2, mask = width - 1, nodecrypto;\n			function seedrandom(seed, options, callback) {\n				var key = [];\n				options = options == true ? { entropy: true } : options || {};\n				var shortseed = mixkey(flatten(options.entropy ? [seed, tostring(pool)] : seed == null ? autoseed() : seed, 3), key);\n				var arc4 = new ARC4(key);\n				var prng = function() {\n					var n = arc4.g(chunks), d = startdenom, x = 0;\n					while (n < significance) {\n						n = (n + x) * width;\n						d *= width;\n						x = arc4.g(1);\n					}\n					while (n >= overflow) {\n						n /= 2;\n						d /= 2;\n						x >>>= 1;\n					}\n					return (n + x) / d;\n				};\n				prng.int32 = function() {\n					return arc4.g(4) | 0;\n				};\n				prng.quick = function() {\n					return arc4.g(4) / 4294967296;\n				};\n				prng.double = prng;\n				mixkey(tostring(arc4.S), pool);\n				return (options.pass || callback || function(prng, seed, is_math_call, state) {\n					if (state) {\n						if (state.S) copy(state, arc4);\n						prng.state = function() {\n							return copy(arc4, {});\n						};\n					}\n					if (is_math_call) {\n						math[rngname] = prng;\n						return seed;\n					} else return prng;\n				})(prng, shortseed, \"global\" in options ? options.global : this == math, options.state);\n			}\n			function ARC4(key) {\n				var t, keylen = key.length, me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];\n				if (!keylen) key = [keylen++];\n				while (i < width) s[i] = i++;\n				for (i = 0; i < width; i++) {\n					s[i] = s[j = mask & j + key[i % keylen] + (t = s[i])];\n					s[j] = t;\n				}\n				(me.g = function(count) {\n					var t, r = 0, i = me.i, j = me.j, s = me.S;\n					while (count--) {\n						t = s[i = mask & i + 1];\n						r = r * width + s[mask & (s[i] = s[j = mask & j + t]) + (s[j] = t)];\n					}\n					me.i = i;\n					me.j = j;\n					return r;\n				})(width);\n			}\n			function copy(f, t) {\n				t.i = f.i;\n				t.j = f.j;\n				t.S = f.S.slice();\n				return t;\n			}\n			function flatten(obj, depth) {\n				var result = [], typ = typeof obj, prop;\n				if (depth && typ == \"object\") for (prop in obj) try {\n					result.push(flatten(obj[prop], depth - 1));\n				} catch (e) {}\n				return result.length ? result : typ == \"string\" ? obj : obj + \"\\0\";\n			}\n			function mixkey(seed, key) {\n				var stringseed = seed + \"\", smear, j = 0;\n				while (j < stringseed.length) key[mask & j] = mask & (smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++);\n				return tostring(key);\n			}\n			function autoseed() {\n				try {\n					var out;\n					if (nodecrypto && (out = nodecrypto.randomBytes)) out = out(width);\n					else {\n						out = new Uint8Array(width);\n						(global.crypto || global.msCrypto).getRandomValues(out);\n					}\n					return tostring(out);\n				} catch (e) {\n					var browser = global.navigator, plugins = browser && browser.plugins;\n					return [\n						+/* @__PURE__ */ new Date(),\n						global,\n						plugins,\n						global.screen,\n						tostring(pool)\n					];\n				}\n			}\n			function tostring(a) {\n				return String.fromCharCode.apply(0, a);\n			}\n			mixkey(math.random(), pool);\n			if (typeof module == \"object\" && module.exports) {\n				module.exports = seedrandom;\n				try {\n					nodecrypto = require___vite_browser_external();\n				} catch (ex) {}\n			} else if (typeof define == \"function\" && define.amd) define(function() {\n				return seedrandom;\n			});\n			else math[\"seed\" + rngname] = seedrandom;\n		})(typeof self !== \"undefined\" ? self : exports, [], Math);\n	}));\n	//#endregion\n	//#region src/planner/core.ts\n	var import_seedrandom = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {\n		var alea = require_alea();\n		var xor128 = require_xor128();\n		var xorwow = require_xorwow();\n		var xorshift7 = require_xorshift7();\n		var xor4096 = require_xor4096();\n		var tychei = require_tychei();\n		var sr = require_seedrandom$1();\n		sr.alea = alea;\n		sr.xor128 = xor128;\n		sr.xorwow = xorwow;\n		sr.xorshift7 = xorshift7;\n		sr.xor4096 = xor4096;\n		sr.tychei = tychei;\n		module.exports = sr;\n	})))());\n	function rigidelPower(rigidelSlot, hasSupremeIntellect) {\n		switch (rigidelSlot) {\n			case \"diamond\": return 600;\n			case \"ruby\": if (hasSupremeIntellect) return 600;\n			else return 400;\n			case \"jade\": if (hasSupremeIntellect) return 400;\n			else return 200;\n			default: return 0;\n		}\n	}\n	var PlannerCore = class {\n		discrepancy = 0;\n		hasSteviaCaelestis = false;\n		hasSucralosiaInutilis = false;\n		hasSugarAgingProcess = false;\n		seed = \"aaaaa\";\n		currentLumpT = 16e11;\n		currentRigidelSlot = \"none\";\n		currentGrandmaCount = 0;\n		currentGrandmapocalypseStage = 0;\n		currentHasDragonsCurve = false;\n		currentHasRealityBending = false;\n		currentHasSupremeIntellect = false;\n		constructor(data) {\n			Object.assign(this, data);\n		}\n		overripeAge(configuration) {\n			let dragonBoost = (configuration.hasDragonsCurve ? 1 : 0) + (configuration.hasRealityBending ? .1 : 0);\n			let ripeAge = 1380 * 60 * 1e3;\n			if (this.hasSteviaCaelestis) ripeAge -= 3600 * 1e3;\n			ripeAge -= 6 * 1e3 * configuration.effectiveGrandmaCount;\n			ripeAge /= 1 + .05 * dragonBoost;\n			return ripeAge + 3600 * 1e3;\n		}\n		autoharvestTimestamp(configuration) {\n			return this.currentLumpT + this.overripeAge(configuration) + this.discrepancy;\n		}\n		lumpTypePredictionSet(configuration) {\n			let autoharvestTime = this.autoharvestTimestamp(configuration);\n			let prng = (0, import_seedrandom.default)(this.seed + \"/\" + autoharvestTime);\n			let lumpPools = [\n				[\"normal\"],\n				[\"normal\"],\n				[\"normal\"],\n				[\"normal\"]\n			];\n			let randomFloorPrngCall = prng();\n			let loops = 1;\n			if (configuration.hasDragonsCurve) loops += 1;\n			if (configuration.hasRealityBending && randomFloorPrngCall < .1) loops += 1;\n			for (let i = 0; i < loops; i++) {\n				if (prng() < (this.hasSucralosiaInutilis ? .15 : .1)) for (let pool of lumpPools) pool.push(\"bifurcated\");\n				if (prng() < 3 / 1e3) for (let pool of lumpPools) pool.push(\"golden\");\n				let grandmapocalypsePrngCall = prng();\n				if (grandmapocalypsePrngCall < .1) lumpPools[1].push(\"meaty\");\n				if (grandmapocalypsePrngCall < .2) lumpPools[2].push(\"meaty\");\n				if (grandmapocalypsePrngCall < .3) lumpPools[3].push(\"meaty\");\n				if (prng() < 1 / 50) for (let pool of lumpPools) pool.push(\"caramelized\");\n			}\n			let poolChoicePrngCall = prng();\n			let predictionSet = [];\n			for (let i in lumpPools) predictionSet[i] = lumpPools[i][Math.floor(poolChoicePrngCall * lumpPools[i].length)];\n			return predictionSet;\n		}\n		currentDistilledConfiguration() {\n			return {\n				effectiveGrandmaCount: rigidelPower(this.currentRigidelSlot, this.currentHasSupremeIntellect) + (this.hasSugarAgingProcess ? Math.min(600, this.currentGrandmaCount) : 0),\n				hasDragonsCurve: this.currentHasDragonsCurve,\n				hasRealityBending: this.currentHasRealityBending\n			};\n		}\n		currentPrediction() {\n			return this.lumpTypePredictionSet(this.currentDistilledConfiguration())[this.currentGrandmapocalypseStage];\n		}\n	};\n	//#endregion\n	//#region src/planner/processing.ts\n	function* mergeIterators(iterators, compare) {\n		let values = [];\n		let validIterators = [];\n		for (let i = 0; i < iterators.length; i++) {\n			let { value, done } = iterators[i].next();\n			if (!done) {\n				values.push(value);\n				validIterators.push(iterators[i]);\n			}\n		}\n		while (validIterators.length != 0) {\n			let earliest = 0;\n			for (let i = 1; i < validIterators.length; i++) if (compare(values[i], values[earliest]) < 0) earliest = i;\n			yield values[earliest];\n			let { value, done } = validIterators[earliest].next();\n			if (done) {\n				values.splice(earliest, 1);\n				validIterators.splice(earliest, 1);\n			} else values[earliest] = value;\n		}\n	}\n	function makeConfigurationsIterator(core) {\n		let startGrandmaCount = core.hasSugarAgingProcess ? 1200 : 600;\n		let step = core.hasSugarAgingProcess ? 1 : 200;\n		function* makeIterator(hasDragonsCurve, hasRealityBending) {\n			for (let i = startGrandmaCount; i >= 0; i -= step) yield {\n				effectiveGrandmaCount: i,\n				hasDragonsCurve,\n				hasRealityBending\n			};\n		}\n		let compare = (x, y) => {\n			return core.overripeAge(x) - core.overripeAge(y);\n		};\n		return mergeIterators([\n			makeIterator(false, false),\n			makeIterator(false, true),\n			makeIterator(true, false),\n			makeIterator(true, true)\n		], compare);\n	}\n	const canonicalIndicesCount = 4 * 1201;\n	function canonicalIndex(configuration) {\n		return 1201 * ((configuration.hasDragonsCurve ? 2 : 0) + (configuration.hasRealityBending ? 1 : 0)) + configuration.effectiveGrandmaCount;\n	}\n	const precomputedPartialConfigurations = (() => {\n		function distill(configuration) {\n			return {\n				effectiveGrandmaCount: rigidelPower(configuration.rigidelSlot, configuration.hasSupremeIntellect) + Math.min(600, configuration.grandmaCount ?? 0),\n				hasDragonsCurve: configuration.hasDragonsCurve,\n				hasRealityBending: configuration.hasRealityBending\n			};\n		}\n		let partialConfigurations = Array(canonicalIndicesCount).fill([]).map(() => []);\n		let validGrandmaCounts = [null].concat(Array(601).fill(0).map((_, i) => i));\n		for (let grandmaCount of validGrandmaCounts) for (let rigidelSlot of [\n			\"none\",\n			\"jade\",\n			\"ruby\",\n			\"diamond\"\n		]) for (let hasDragonsCurve of [false, true]) for (let hasRealityBending of [false, true]) for (let hasSupremeIntellect of [false, true]) {\n			if (hasDragonsCurve && hasRealityBending && hasSupremeIntellect) continue;\n			let configuration = {\n				grandmaCount,\n				rigidelSlot,\n				hasDragonsCurve,\n				hasRealityBending,\n				hasSupremeIntellect\n			};\n			partialConfigurations[canonicalIndex(distill(configuration))].push(configuration);\n		}\n		return partialConfigurations;\n	})();\n	function makeReportEntry(options) {\n		let { configuration, plannerCore, threeColumnDragonAuras } = options;\n		function check(condition) {\n			return condition ? \"checkmark\" : \"\";\n		}\n		let plannerCoreEquivalentGrandmaCount = plannerCore.hasSugarAgingProcess ? plannerCore.currentGrandmaCount : null;\n		let selectedEntry = configuration.grandmaCount == plannerCoreEquivalentGrandmaCount && configuration.hasDragonsCurve == plannerCore.currentHasDragonsCurve && configuration.hasRealityBending == plannerCore.currentHasRealityBending && configuration.hasSupremeIntellect == plannerCore.currentHasSupremeIntellect && configuration.rigidelSlot == plannerCore.currentRigidelSlot && configuration.grandmapocalypseStages[plannerCore.currentGrandmapocalypseStage];\n		let lumpType = configuration.lumpType;\n		let autoharvestTimestamp = configuration.autoharvestTimestamp;\n		let grandmapocalypseStages = configuration.grandmapocalypseStages;\n		let grandmapocalypseNote = check(configuration.grandmapocalypseStages[plannerCore.currentGrandmapocalypseStage]);\n		let rigidelSlot = configuration.rigidelSlot;\n		let rigidelNote = check(configuration.rigidelSlot == plannerCore.currentRigidelSlot);\n		let grandmaCount = configuration.grandmaCount;\n		let grandmaCountNote;\n		if (grandmaCount == null && plannerCore.hasSugarAgingProcess) grandmaCountNote = \"warn\";\n		else if (grandmaCount != null && !plannerCore.hasSugarAgingProcess) grandmaCountNote = \"warn\";\n		else if (grandmaCount == null && !plannerCore.hasSugarAgingProcess) grandmaCountNote = \"checkmark\";\n		else grandmaCountNote = grandmaCount == plannerCore.currentGrandmaCount ? \"checkmark\" : \"\";\n		let dragonAuras = [];\n		if (threeColumnDragonAuras) {\n			dragonAuras.push({\n				aura: \"Dragon's Curve\",\n				style: configuration.hasDragonsCurve ? \"normal\" : \"faded\",\n				note: check(configuration.hasDragonsCurve == plannerCore.currentHasDragonsCurve)\n			});\n			dragonAuras.push({\n				aura: \"Reality Bending\",\n				style: configuration.hasRealityBending ? \"normal\" : \"faded\",\n				note: check(configuration.hasRealityBending == plannerCore.currentHasRealityBending)\n			});\n			dragonAuras.push({\n				aura: \"Supreme Intellect\",\n				style: configuration.hasSupremeIntellect ? \"normal\" : \"faded\",\n				note: check(configuration.hasSupremeIntellect == plannerCore.currentHasSupremeIntellect)\n			});\n		} else {\n			if (configuration.hasDragonsCurve) dragonAuras.push({\n				aura: \"Dragon's Curve\",\n				style: \"normal\",\n				note: check(configuration.hasDragonsCurve == plannerCore.currentHasDragonsCurve)\n			});\n			if (configuration.hasRealityBending) dragonAuras.push({\n				aura: \"Reality Bending\",\n				style: \"normal\",\n				note: check(configuration.hasRealityBending == plannerCore.currentHasRealityBending)\n			});\n			if (configuration.hasSupremeIntellect) dragonAuras.push({\n				aura: \"Supreme Intellect\",\n				style: \"normal\",\n				note: check(configuration.hasSupremeIntellect == plannerCore.currentHasSupremeIntellect)\n			});\n			if (dragonAuras.length <= 1) {\n				if (!configuration.hasDragonsCurve && plannerCore.currentHasDragonsCurve) dragonAuras.push({\n					aura: \"Dragon's Curve\",\n					style: \"faded\",\n					note: \"warn\"\n				});\n				if (!configuration.hasRealityBending && plannerCore.currentHasRealityBending) dragonAuras.push({\n					aura: \"Reality Bending\",\n					style: \"faded\",\n					note: \"warn\"\n				});\n				if (!configuration.hasSupremeIntellect && plannerCore.currentHasSupremeIntellect && configuration.rigidelSlot != \"none\" && configuration.rigidelSlot != \"diamond\") dragonAuras.push({\n					aura: \"Supreme Intellect\",\n					style: \"faded\",\n					note: \"warn\"\n				});\n				dragonAuras = dragonAuras.slice(0, 2);\n			}\n			if (dragonAuras.length <= 1) {\n				if (dragonAuras.length == 0 || dragonAuras[0].aura != \"Dragon's Curve\") dragonAuras.push({\n					aura: \"Dragon's Curve\",\n					style: \"faded\",\n					note: \"checkmark\"\n				});\n				if (dragonAuras[0].aura == \"Dragon's Curve\") dragonAuras.push({\n					aura: \"Reality Bending\",\n					style: \"faded\",\n					note: \"checkmark\"\n				});\n			}\n		}\n		return {\n			selectedEntry,\n			lumpType,\n			autoharvestTimestamp,\n			grandmaCount,\n			grandmaCountNote,\n			grandmapocalypseStages,\n			grandmapocalypseNote,\n			dragonAuras,\n			rigidelSlot,\n			rigidelNote\n		};\n	}\n	function makeTrivialConfigurationFilter() {\n		return (_) => true;\n	}\n	function makeDragonPreservingConfigurationFilter(gameState) {\n		return (configuration) => {\n			return configuration.hasDragonsCurve == gameState.currentHasDragonsCurve && configuration.hasRealityBending == gameState.currentHasRealityBending && configuration.hasSupremeIntellect == gameState.currentHasSupremeIntellect;\n		};\n	}\n	function makePantheonPreservingConfigurationFilter(gameState) {\n		return (configuration) => {\n			if (configuration.rigidelSlot == gameState.currentRigidelSlot) return true;\n			if (configuration.rigidelSlot == \"none\") return true;\n			return false;\n		};\n	}\n	function makeGrandmapocalypseStagePreservingFilter(gameState) {\n		return (configuration) => {\n			return configuration.grandmapocalypseStages[gameState.currentGrandmapocalypseStage];\n		};\n	}\n	function makeBudgetConsciousFilter(budget) {\n		return (configuration) => {\n			if (configuration.grandmaCount != null && configuration.grandmaCount > budget.maxGrandmas) return false;\n			if (!budget.unlockedPantheon && configuration.rigidelSlot != \"none\") return false;\n			if (!budget.unlockedDragonsCurve && configuration.hasDragonsCurve) return false;\n			if (!budget.unlockedRealityBending && configuration.hasRealityBending) return false;\n			if (!budget.unlockedSupremeIntellect && configuration.hasSupremeIntellect) return false;\n			let auraCount = Number(configuration.hasDragonsCurve) + Number(configuration.hasRealityBending) + Number(configuration.hasSupremeIntellect);\n			if (!budget.unlockedSecondAura && auraCount > 1) return false;\n			return true;\n		};\n	}\n	function makeIntersectionFilter(...filters) {\n		return (configuration) => {\n			for (let filter of filters) if (!filter(configuration)) return false;\n			return true;\n		};\n	}\n	function makeFilterCollection(fullState) {\n		let requirements = [];\n		let goals = [];\n		goals.push(makeTrivialConfigurationFilter());\n		let conditions = fullState.preferences.conditions;\n		let dragonPreserver = makeDragonPreservingConfigurationFilter(fullState.gameState);\n		let pantheonPreserver = makePantheonPreservingConfigurationFilter(fullState.gameState);\n		let grandmapocalypsePreserver = makeGrandmapocalypseStagePreservingFilter(fullState.gameState);\n		let budgetRespecter = makeBudgetConsciousFilter(fullState.budget);\n		if (conditions.preserveDragon == \"require\") requirements.push(dragonPreserver);\n		if (conditions.preservePantheon == \"require\") requirements.push(pantheonPreserver);\n		if (conditions.preserveGrandmapocalypseStage == \"require\") requirements.push(grandmapocalypsePreserver);\n		if (conditions.respectBudget == \"require\") requirements.push(budgetRespecter);\n		if (conditions.preserveDragon == \"observe\") goals.push(dragonPreserver);\n		if (conditions.preservePantheon == \"observe\") goals.push(pantheonPreserver);\n		if (conditions.preserveGrandmapocalypseStage == \"observe\") goals.push(grandmapocalypsePreserver);\n		if (conditions.respectBudget == \"observe\") goals.push(budgetRespecter);\n		if (conditions.preserveDragon == \"observe\" && conditions.preservePantheon == \"observe\") goals.push(makeIntersectionFilter(dragonPreserver, pantheonPreserver));\n		return {\n			requirements,\n			goals\n		};\n	}\n	function matchConfigurationsToGoals(configurations, goals) {\n		let satisfyingConfigurations = [];\n		let needsFurtherProcessing = true;\n		while (needsFurtherProcessing) {\n			let countOfGoalsAccepting = configurations.map((configuration) => {\n				return goals.map((goal) => Number(goal(configuration))).reduce((x, y) => x + y, 0);\n			});\n			if (Math.max(...countOfGoalsAccepting) == 0) needsFurtherProcessing = false;\n			else {\n				let index = countOfGoalsAccepting.indexOf(Math.max(...countOfGoalsAccepting));\n				satisfyingConfigurations.push(configurations[index]);\n				goals = goals.filter((goal) => !goal(configurations[index]));\n			}\n		}\n		return {\n			satisfyingConfigurations,\n			unsatisfiedGoals: goals\n		};\n	}\n	var CachedConfigurationsProcessor = class {\n		constructor(plannerCore) {\n			this.plannerCore = plannerCore;\n			this.iterator = makeConfigurationsIterator(plannerCore);\n		}\n		isCacheCompatible(gameState) {\n			return gameState.discrepancy == this.plannerCore.discrepancy && gameState.hasSteviaCaelestis == this.plannerCore.hasSteviaCaelestis && gameState.hasSucralosiaInutilis == this.plannerCore.hasSucralosiaInutilis && gameState.hasSugarAgingProcess == this.plannerCore.hasSugarAgingProcess && gameState.currentLumpT == this.plannerCore.currentLumpT && gameState.seed == this.plannerCore.seed;\n		}\n		updateCoreIfCompatible(newPlannerCore) {\n			if (this.isCacheCompatible(newPlannerCore)) {\n				this.plannerCore = newPlannerCore;\n				return true;\n			} else return false;\n		}\n		plannerCore;\n		iterator;\n		cache = {\n			\"normal\": [],\n			\"bifurcated\": [],\n			\"golden\": [],\n			\"meaty\": [],\n			\"caramelized\": []\n		};\n		cacheNextPredictionSet() {\n			if (!this.iterator) return false;\n			let next = this.iterator.next();\n			if (next.done) {\n				this.iterator = null;\n				return false;\n			}\n			let autoharvestTimestamp = this.plannerCore.autoharvestTimestamp(next.value);\n			let predictionSet = this.plannerCore.lumpTypePredictionSet(next.value);\n			let hasSugarAgingProcess = this.plannerCore.hasSugarAgingProcess;\n			for (let lumpType of new Set(predictionSet)) {\n				let matchingGrandmapocalypseStages = predictionSet.map((type) => type == lumpType);\n				let configurations = precomputedPartialConfigurations[canonicalIndex(next.value)].map((partialConfiguration) => {\n					if (!hasSugarAgingProcess && partialConfiguration.grandmaCount != null) return null;\n					if (hasSugarAgingProcess && partialConfiguration.grandmaCount == null) return null;\n					let grandmapocalypseStages = matchingGrandmapocalypseStages;\n					if (hasSugarAgingProcess && partialConfiguration.grandmaCount == 0) if (!grandmapocalypseStages[0]) return null;\n					else grandmapocalypseStages = [\n						grandmapocalypseStages[0],\n						false,\n						false,\n						false\n					];\n					return {\n						...partialConfiguration,\n						lumpType,\n						autoharvestTimestamp,\n						grandmapocalypseStages\n					};\n				}).filter((c) => c != null);\n				this.cache[lumpType].push(configurations);\n			}\n			return true;\n		}\n		*makePlannerConfigurationIterator(lumpType) {\n			let i = 0;\n			let cacheMightHaveBeenLengthened = true;\n			while (cacheMightHaveBeenLengthened) {\n				while (i < this.cache[lumpType].length) {\n					yield this.cache[lumpType][i];\n					i++;\n				}\n				cacheMightHaveBeenLengthened = this.cacheNextPredictionSet();\n			}\n		}\n		getConfigurations(options) {\n			let acceptable = makeIntersectionFilter(...options.requirements);\n			let successes = [];\n			let goals = [...options.goals];\n			for (let configurationSet of this.makePlannerConfigurationIterator(options.targetLump)) {\n				let acceptableConfigurations = configurationSet.filter(acceptable);\n				if (acceptableConfigurations.length == 0) continue;\n				let { satisfyingConfigurations, unsatisfiedGoals } = matchConfigurationsToGoals(acceptableConfigurations, goals);\n				goals = unsatisfiedGoals;\n				successes = successes.concat(satisfyingConfigurations);\n				if (goals.length == 0) break;\n			}\n			return {\n				successes,\n				failures: goals\n			};\n		}\n		getSummaryPlannerReport(fullGameState) {\n			if (!this.isCacheCompatible(fullGameState.gameState)) throw new Error(\"fullGameState.gameState is not compatible with this.plannerCore\");\n			let report = {};\n			let { requirements, goals } = makeFilterCollection(fullGameState);\n			let lumpType;\n			for (lumpType in fullGameState.preferences.includeType) if (fullGameState.preferences.includeType[lumpType]) report[lumpType] = this.getConfigurations({\n				targetLump: lumpType,\n				requirements,\n				goals\n			}).successes.map((configuration) => makeReportEntry({\n				configuration,\n				plannerCore: this.plannerCore,\n				threeColumnDragonAuras: fullGameState.preferences.threeColumnDragonAuras\n			}));\n			return report;\n		}\n		getFullListPlannerReport(fullGameState) {\n			if (!this.isCacheCompatible(fullGameState.gameState)) throw new Error(\"fullGameState.gameState is not compatible with this.plannerCore\");\n			while (this.cacheNextPredictionSet());\n			let self = this;\n			let { requirements, goals } = makeFilterCollection(fullGameState);\n			let acceptable = makeIntersectionFilter(...requirements);\n			function* makeIterator(lumpType) {\n				for (let configurationSet of self.makePlannerConfigurationIterator(lumpType)) {\n					let configurations = configurationSet.filter(acceptable);\n					if (configurations.length == 0) continue;\n					let { satisfyingConfigurations } = matchConfigurationsToGoals(configurations, goals);\n					if (satisfyingConfigurations.length == 0) satisfyingConfigurations.push(configurations[0]);\n					yield satisfyingConfigurations;\n				}\n			}\n			let iterators = [];\n			let lumpType;\n			for (lumpType in fullGameState.preferences.includeType) if (fullGameState.preferences.includeType[lumpType]) iterators.push(makeIterator(lumpType));\n			let report = [];\n			for (let configurationSet of mergeIterators(iterators, (x, y) => x[0].autoharvestTimestamp - y[0].autoharvestTimestamp)) report.push(configurationSet.map((configuration) => makeReportEntry({\n				configuration,\n				plannerCore: this.plannerCore,\n				threeColumnDragonAuras: fullGameState.preferences.threeColumnDragonAuras\n			})));\n			return report;\n		}\n	};\n	//#endregion\n	//#region src/planner/worker.ts\n	let cache = [];\n	self.onmessage = (ev) => {\n		let { request, computationId, fullGameState } = ev.data;\n		let plannerCore = new PlannerCore(fullGameState.gameState);\n		let processor = (() => {\n			for (let processor of cache) if (processor.updateCoreIfCompatible(plannerCore)) return processor;\n			let processor = new CachedConfigurationsProcessor(plannerCore);\n			cache.unshift(processor);\n			return processor;\n		})();\n		let lumpType = plannerCore.currentPrediction();\n		let response;\n		switch (request) {\n			case \"lumpType\":\n				response = {\n					request,\n					computationId,\n					lumpType\n				};\n				break;\n			case \"summaryReport\":\n				response = {\n					request,\n					computationId,\n					lumpType,\n					report: processor.getSummaryPlannerReport(fullGameState)\n				};\n				break;\n			case \"fullListReport\": response = {\n				request,\n				computationId,\n				lumpType,\n				report: processor.getFullListPlannerReport(fullGameState)\n			};\n		}\n		self.postMessage(response);\n	};\n	//#endregion\n})();\n";
	var blob = typeof self !== "undefined" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", jsContent], { type: "text/javascript;charset=utf-8" });
	function WorkerWrapper(options) {
		let objURL;
		try {
			objURL = blob && (self.URL || self.webkitURL).createObjectURL(blob);
			if (!objURL) throw "";
			const worker = new Worker(objURL, { name: options?.name });
			worker.addEventListener("error", () => {
				(self.URL || self.webkitURL).revokeObjectURL(objURL);
			});
			return worker;
		} catch (e) {
			return new Worker("data:text/javascript;charset=utf-8," + encodeURIComponent(jsContent), { name: options?.name });
		}
	}
	//#endregion
	//#region src/planner/planner.ts
	var CoalescingLumpsPlanner = class {
		worker;
		currentComputationId = 0;
		lumpTypePrediction = {
			value: "normal",
			computationId: 0,
			gameState: null,
			ongoingComputation: false
		};
		summaryReport = {
			value: {},
			computationId: 0,
			gameState: null,
			ongoingComputation: false
		};
		fullListReport = {
			value: [],
			computationId: 0,
			gameState: null,
			ongoingComputation: false
		};
		constructor() {
			this.worker = new WorkerWrapper();
			this.worker.onmessage = (ev) => {
				this.processWorkerResponse(ev.data);
			};
		}
		processWorkerResponse(response) {
			let lumpTypePrediction = this.lumpTypePrediction;
			let updateLumpType = () => {
				if (response.computationId == lumpTypePrediction.computationId) lumpTypePrediction.ongoingComputation = false;
				lumpTypePrediction.value = response.lumpType;
			};
			switch (response.request) {
				case "lumpType":
					updateLumpType();
					break;
				case "summaryReport":
					if (this.summaryReport.computationId == response.computationId) this.summaryReport.ongoingComputation = false;
					this.summaryReport.value = response.report;
					updateLumpType();
					break;
				case "fullListReport":
					if (this.fullListReport.computationId == response.computationId) this.fullListReport.ongoingComputation = false;
					this.fullListReport.value = response.report;
					updateLumpType();
					break;
			}
		}
		getAndUpdateLumpTypePrediction() {
			let isCurrent = this.getStatusAndUpdateCache("lumpType", [this.lumpTypePrediction]);
			return {
				prediction: this.lumpTypePrediction.value,
				isCurrent
			};
		}
		getAndUpdateSummaryReport() {
			let isCurrent = this.getStatusAndUpdateCache("summaryReport", [this.lumpTypePrediction, this.summaryReport]);
			return {
				report: this.summaryReport.value,
				isCurrent
			};
		}
		getAndUpdateFullListReport() {
			let isCurrent = this.getStatusAndUpdateCache("fullListReport", [this.lumpTypePrediction, this.fullListReport]);
			return {
				report: this.fullListReport.value,
				isCurrent
			};
		}
		getStatusAndUpdateCache(request, cachedItems) {
			let currentGameState = getCurrentFullGameState();
			this.currentComputationId++;
			let isCurrent = true;
			let needsUpdate = false;
			for (let item of cachedItems) if (JSON.stringify(currentGameState) != JSON.stringify(item.gameState)) {
				needsUpdate = true;
				isCurrent = false;
				item.gameState = currentGameState;
				item.computationId = this.currentComputationId;
				item.ongoingComputation = true;
			} else if (item.ongoingComputation) isCurrent = false;
			if (needsUpdate) {
				let message = {
					request,
					computationId: this.currentComputationId,
					fullGameState: currentGameState
				};
				this.worker.postMessage(message);
			}
			return isCurrent;
		}
	};
	var planner = new CoalescingLumpsPlanner();
	//#endregion
	//#region src/saveDataManagement.ts
	function loadSettingsFromLegacySave(legacyString) {
		let newPrefs = getDefaultPreferences();
		let legacySave = JSON.parse(legacyString);
		if (!legacySave || typeof legacySave != "object") {
			console.log("CYOL: Error retrieving legacy save format, using default settings...");
			setPreferences(newPrefs);
			return;
		}
		if (!("settings" in legacySave) || !legacySave.settings || typeof legacySave.settings != "object") {
			console.log("CYOL: legacy save format is corrupted, using default settings...");
			setPreferences(newPrefs);
			return;
		}
		let settings = legacySave.settings;
		if ("discrepancy" in settings) newPrefs.discrepancy = Number(settings.discrepancy);
		if ("includeNormal" in settings) newPrefs.filtering.includeType.normal = Boolean(settings.includeNormal);
		if ("includeBifurcated" in settings) newPrefs.filtering.includeType.bifurcated = Boolean(settings.includeBifurcated);
		if ("includeGolden" in settings) newPrefs.filtering.includeType.golden = Boolean(settings.includeGolden);
		if ("includeMeaty" in settings) newPrefs.filtering.includeType.meaty = Boolean(settings.includeMeaty);
		if ("includeCaramelized" in settings) newPrefs.filtering.includeType.caramelized = Boolean(settings.includeCaramelized);
		if ("preserveGrandmapocalypseStage" in settings) newPrefs.filtering.conditions.preserveGrandmapocalypseStage = settings.preserveGrandmapocalypseStage ? "require" : "observe";
		if ("preserveDragon" in settings) newPrefs.filtering.conditions.preserveDragon = settings.preserveDragon ? "require" : "observe";
		if ("preservePantheon" in settings) newPrefs.filtering.conditions.preservePantheon = settings.preservePantheon ? "require" : "observe";
		if ("rowsToDisplay" in settings) newPrefs.display.rows = Number(settings.rowsToDisplay);
		setPreferences(newPrefs);
	}
	function retrieveDataFromLegacySave() {
		let legacyId = "Choose your own lump";
		if (legacyId in Game.modSaveData) {
			loadSettingsFromLegacySave(Game.modSaveData[legacyId]);
			Game.deleteModData(legacyId);
		}
	}
	function getPreferencesFromObject(source, version) {
		function onError(msg) {
			if (version === void 0) throw new Error(msg);
			else console.warn(msg);
		}
		function assign(target, source, prefix) {
			for (let key of Object.keys(source)) if (key in target) if (source[key] == null) onError(`CYOL.load: ${prefix}${key} is null`);
			else if (typeof target[key] != typeof source[key]) onError(`CYOL.load: Mistyped property: ${prefix}${key}`);
			else if (typeof target[key] == "object") target[key] = assign(target[key], source[key], prefix + key + ".");
			else target[key] = source[key];
			else onError(`CYOL.load: ${prefix}${key} does not exist`);
			return target;
		}
		return assign(getDefaultPreferences(), source, "CYOLPreferences.");
	}
	function clearModState() {
		clearDiscrepancyInfo();
	}
	function clearModData() {
		setPreferences(getDefaultPreferences());
		clearDiscrepancyInfo();
	}
	function loadSaveData(saveData, isInitialLoad) {
		clearModState();
		let saveDataAsObject = JSON.parse(saveData);
		if (!saveDataAsObject || typeof saveDataAsObject != "object") {
			console.warn("CYOL: Unknown save format, using defaults...");
			setPreferences(getDefaultPreferences());
			return;
		}
		let version = void 0;
		if ("version" in saveDataAsObject) if (typeof saveDataAsObject.version != "string") console.warn("CYOL: Unknown save format version, assuming most recent");
		else version = saveDataAsObject.version;
		if (!("preferences" in saveDataAsObject)) {
			console.warn("CYOL: missing preferences, using defaults...");
			setPreferences(getDefaultPreferences());
		} else if (!saveDataAsObject.preferences || typeof saveDataAsObject.preferences != "object") {
			console.warn("CYOL: corrupted preferences, using defaults...");
			setPreferences(getDefaultPreferences());
		} else setPreferences(getPreferencesFromObject(saveDataAsObject.preferences, version));
		if (!("storedDiscrepancyInfo" in saveDataAsObject)) {
			console.log("CYOL: no stored discrepancy information, attempting to reconstruct from save data");
			discrepancyInfoRetrievalFallback(preferences, isInitialLoad);
		} else if (!saveDataAsObject.storedDiscrepancyInfo || typeof saveDataAsObject.storedDiscrepancyInfo != "object") {
			console.warn("CYOL: corrupted stored discrepancy information");
			discrepancyInfoRetrievalFallback(preferences, isInitialLoad);
		} else loadDiscrepancyInfo(saveDataAsObject.storedDiscrepancyInfo, preferences, isInitialLoad);
	}
	function serializeSaveData() {
		let saveData = {
			version,
			preferences,
			storedDiscrepancyInfo: getDiscrepancyInfoForStorage()
		};
		return JSON.stringify(saveData);
	}
	//#endregion
	//#region src/UI/lumpIconScrolling.ts
	var scrolledRows = 0;
	function capScrolledRows(cap) {
		if (scrolledRows > cap) scrolledRows = cap;
		if (scrolledRows < 0) scrolledRows = 0;
	}
	var percentageOfCurrentRowScrolled = 0;
	function registerLumpIconWheelEventListener() {
		document.getElementById("lumps").addEventListener("wheel", (ev) => {
			const pixelsPerRow = 120;
			const linesPerRow = 6;
			const rowsPerPage = preferences.display.rows;
			let newScroll = 0;
			switch (ev.deltaMode) {
				case WheelEvent.DOM_DELTA_PIXEL:
					newScroll = ev.deltaY / pixelsPerRow;
					break;
				case WheelEvent.DOM_DELTA_LINE:
					newScroll = ev.deltaY / linesPerRow;
					break;
				case WheelEvent.DOM_DELTA_PAGE:
					newScroll = ev.deltaY * rowsPerPage;
					break;
			}
			let totalScroll = scrolledRows + percentageOfCurrentRowScrolled + newScroll;
			percentageOfCurrentRowScrolled = totalScroll % 1;
			scrolledRows = totalScroll - percentageOfCurrentRowScrolled;
			scrolledRows = Math.round(scrolledRows);
		});
	}
	//#endregion
	//#region src/UI/lumpTooltip.ts
	function currentLumpType() {
		switch (Game.lumpCurrentType) {
			case 0: return "normal";
			case 1: return "bifurcated";
			case 2: return "golden";
			case 3: return "meaty";
			case 4: return "caramelized";
			default: return "unknown";
		}
	}
	function makeLumpIcon(lumpType, scale) {
		let background = "";
		let scaling = scale !== void 0 ? `scale:${scale}; transform-origin:top left;` : "";
		switch (lumpType) {
			case "normal":
				background = "background-position: -1392px -672px;";
				break;
			case "bifurcated":
				background = "background-position: -1392px -720px;";
				break;
			case "golden":
				if (preferences.display.useMatureGoldenLumpSprite) background = "background-position: -1392px -768px;";
				else background = "background-position: -1344px -768px;";
				break;
			case "meaty":
				background = "background-position: -1392px -816px;";
				break;
			case "caramelized":
				background = "background-position: -1392px -1296px;";
				break;
		}
		let str = `<div class="icon" style="vertical-align: middle; margin:0; ${background} ${scaling}"></div>`;
		if (scale === void 0) return str;
		else return `<div style="width:${Math.round(48 * scale)}px; height:${Math.round(48 * scale)}px">
            ${str}
        </div>`;
	}
	function discrepancyTooltip() {
		let str = "";
		let lumpType = currentLumpType();
		if (lumpType == "unknown") str += `<div>The mod Choose Your Own Lump does not know about this lump type.
            You might be in a future version of Cookie Clicker that adds lump types,
            or using a mod which adds lump types,
            or something is wrong with your save file.
        </div>`;
		else str += `<div style="display:flex; justify-content:center; align-items:center;">
            <div>The sugar lump that is growing now is</div>
            ${makeLumpIcon(lumpType, .5)}
            <div>${lumpType}.</div>
        </div>`;
		let genericInstructions = `
        Adjust your game state according to one of the predictions below,
        export your save file,
        <mark style="all:unset; color:white">wait for the lump to fall offline</mark>
        (i.e. be harvested automatically while the game is closed),
        and then load the save file.
    `;
		if (!discrepancyInfo.available) {
			str += `<div style="color:gray">
            No discrepancy information to show. ${genericInstructions}
        </div>`;
			return str;
		}
		if (discrepancyInfo.current.lumpT == discrepancyInfo.previous.lumpT) {
			str += `<div style="color:gray">
            No lump was harvested offline since this save file was created. ${genericInstructions}
        </div>`;
			return str;
		}
		let theoreticalLumpT = discrepancyInfo.previous.lumpT + discrepancyInfo.previous.lumpOverripeAge;
		let discrepancy = discrepancyInfo.current.lumpT - theoreticalLumpT;
		if (discrepancy == discrepancyInfo.expectedDiscrepancy) {
			str += `<div style="display:flex; justify-content:center">
            <div>
                The discrepancy was <mark style="all:unset; color:green">${discrepancy}ms</mark>,
                exactly what we expected!
            </div>
        </div>`;
			return str;
		}
		let errorMessage = `
        The actual discrepancy was <mark style="all:unset; color:red">${discrepancy}ms</mark>,
        which differs from the expected discrepancy of ${discrepancyInfo.expectedDiscrepancy}ms.
    `;
		if (discrepancy >= 0 && discrepancy <= 1e3) {
			str += `<div>${errorMessage}
            Try loading the save again if the lump does not have the desired type.
        </div>
        <div style="font-size:smaller">
            (If the actual discrepancy is frequently ${discrepancy}ms,
            you can try changing the "expected discrepancy" setting in the options menu to ${discrepancy}ms.
            In future predictions,
            Choose Your Own Lump will assume that this is the discrepancy that will take place.)
        </div>`;
			return str;
		}
		let discrepancyMinutes = discrepancy / (60 * 1e3);
		if (discrepancyMinutes > 10 && discrepancyMinutes < 70) {
			str += `<div>${errorMessage}</div>
            <div>This most likely happened because the pantheon
                (the Temples minigame)
                has had not finished loading when the lump times were computed,
                so Rigidel did not have an effect on lump maturation times. `;
			if (Game.hasGod) str += `Try importing your save file again, now that the pantheon has loaded.`;
			else str += `
                Unlock the pantheon by spending a sugar lump in the temples,
                and import your save file again.
            `;
			str += "</div>";
			return str;
		}
		if (discrepancy > .99 * discrepancyInfo.previous.lumpOverripeAge) {
			str += `<div>${errorMessage}</div>
            <div>
                More than one lump was autoharvested since this save file was created.
                Other than the first,
                all lumps autoharvested offline are normal,
                so there is nothing we can do.
            </div>
            <div>${genericInstructions}</div>
        `;
			return str;
		}
		str += `<div>${errorMessage}
        <mark style="all:unset; color:red">Something went wrong.</mark>
        Try loading your save again and without other mods.
        If the problem persists,
        please contact the developers of Choose Your Own Lump.
    </div>`;
		return str;
	}
	function makeNote(note) {
		let noteCharacter = "", noteColor = "";
		if (preferences.display.showCheckmark) {
			if (note == "checkmark") {
				noteCharacter = "✔";
				noteColor = "color:darkgreen;";
			}
			if (note == "warn") noteCharacter = "⚠️";
		}
		return `<div style="position:absolute; top:0px; right:0px; ${noteColor}">${noteCharacter}</div>`;
	}
	function makeDragonAuraIcon(dragonAura) {
		let transparency = "";
		if (dragonAura.style == "faded") transparency += "opacity: 0.2;";
		let background = "";
		switch (dragonAura.aura) {
			case "Dragon's Curve":
				background = "background-position: -960px -1200px;";
				break;
			case "Reality Bending":
				background = "background-position: -1536px -1200px;";
				break;
			case "Supreme Intellect":
				background = "background-position: -1632px -1200px;";
				break;
			case "none":
				background = "background-position:48px 48px;";
				break;
		}
		return "<div style=\"height: 48px; position:relative; display:inline-block; vertical-align:middle;\">" + ("<div class=\"icon\" style=\"vertical-align: middle; margin:0 -2px;" + background + transparency + "\"></div>") + makeNote(dragonAura.note) + "</div>";
	}
	function makeGrandmaIcon(stage, transparent) {
		let transparency = transparent ? "opacity: 0.2;" : "";
		let position = "position:absolute;";
		let background = `background-image:url(${Game.resPath}img/buildings.png); `;
		if (stage == 0) {
			background += "background-position: 0px -64px;";
			position += "top: 0px; left: 0px;";
		}
		if (stage == 1) {
			background += "background-position: 0px -128px;";
			position += "top: 0px; right: 0px;";
		}
		if (stage == 2) {
			background += "background-position: -64px -128px;";
			position += "bottom: 0px; left: 0px;";
		}
		if (stage == 3) {
			background += "background-position: -128px -128px;";
			position += "bottom: 0px; right: 0px;";
		}
		return `<div style="width:58px; height:64px; display:inline-block; ${background} ${transparency} ${position}"></div>`;
	}
	function makeGrandmapocalypseIcons(grandmapocalypseStages, note) {
		function noteForStage(stage) {
			return makeNote(Game.elderWrath == stage && grandmapocalypseStages[stage] ? "checkmark" : "").replace("darkgreen", "green");
		}
		if (preferences.display.compactGrandmapocalypseRepresentation) return `<div style="position:relative; width:66px; height:64px">
            <div style="width: 116px; height: 128px; transform:scale(0.5); transform-origin:top left;">
                ${makeGrandmaIcon(0, !grandmapocalypseStages[0])}
                ${makeGrandmaIcon(1, !grandmapocalypseStages[1])}
                ${makeGrandmaIcon(2, !grandmapocalypseStages[2])}
                ${makeGrandmaIcon(3, !grandmapocalypseStages[3])}
            </div>
            ${makeNote(note)}
        </div>`;
		else return `<div style="display:flex; width:232px; height:64px">
            <div style = "width:58px; height:64px; position:relative;">${makeGrandmaIcon(0, !grandmapocalypseStages[0])} ${noteForStage(0)}</div>
            <div style = "width:58px; height:64px; position:relative;">${makeGrandmaIcon(1, !grandmapocalypseStages[1])} ${noteForStage(1)}</div>
            <div style = "width:58px; height:64px; position:relative;">${makeGrandmaIcon(2, !grandmapocalypseStages[2])} ${noteForStage(2)}</div>
            <div style = "width:58px; height:64px; position:relative;">${makeGrandmaIcon(3, !grandmapocalypseStages[3])} ${noteForStage(3)}</div>
        </div>`;
	}
	function makeRigidelIcon(slot, note) {
		let rigidel = "<div class=\"icon\" style=\"background-position:-1056px -912px; margin:0\"></div>";
		let gem_background = "";
		switch (slot) {
			case "diamond":
				gem_background = "background-position: -1104px -720px;";
				break;
			case "ruby":
				gem_background = "background-position: -1128px -720px;";
				break;
			case "jade":
				gem_background = "background-position: -1104px -744px;";
				break;
		}
		let gem = "<div class=\"icon\" style=\"width:24px; height:24px; position:absolute; top:36px; left:12px; margin:0;" + gem_background + "\"></div>";
		if (slot == "none") gem = "";
		return `<div style="${slot == "none" ? "height:48px;" : "height:60px"} width:48px; position:relative">
        <div style="${slot == "none" ? "opacity:0.2" : ""}">${rigidel}${gem}</div>
        ${makeNote(note)}
    </div>`;
	}
	function makeConfigurationDiv(entry) {
		let str = "<div style=\"display:flex; align-items:center\">";
		if (entry.grandmaCount !== null) str += `<div style="display:flex; flex-direction:column; align-items:center; width:40px; height:64px; position:relative">
            <div style="background-image:url(${Game.resPath}img/grandma.png); background-position:bottom; width:40px; height:52px;"></div>
            ${entry.grandmaCount == 600 ? "600+" : entry.grandmaCount}
            ${makeNote(entry.grandmaCountNote)}
        </div>`;
		str += makeGrandmapocalypseIcons(entry.grandmapocalypseStages, entry.grandmapocalypseNote);
		for (let dragonAura of entry.dragonAuras) str += makeDragonAuraIcon(dragonAura);
		str += makeRigidelIcon(entry.rigidelSlot, entry.rigidelNote);
		return str + "</div>";
	}
	function makeSummaryReport(report) {
		let str = "";
		let hasShownLumpType = false;
		for (let lumpType of [
			"normal",
			"bifurcated",
			"golden",
			"meaty",
			"caramelized"
		]) {
			if (report[lumpType] === void 0) continue;
			hasShownLumpType = true;
			let anySelected = report[lumpType].some((x) => x.selectedEntry);
			str += `<div style="display:flex; align-items:center; margin:2px; padding:2px; border: solid 2px; border-color:${anySelected ? "darkblue" : "dimgray"}; border-radius: 5px;">`;
			str += `<div style="display:flex; align-items:center; margin:1ex">
            ${makeLumpIcon(lumpType, .5)}
            <div style="width:12ex; margin:0.5ex;">${lumpType[0].toUpperCase() + lumpType.substring(1)}</div>
        </div>`;
			str += `<div style="display:flex; flex-direction:column;">`;
			for (let configuration of report[lumpType]) str += `<div style="padding:2px; ${configuration.selectedEntry ? "background-color:midnightblue" : ""}">
                ${makeConfigurationDiv(configuration)}
            </div>`;
			if (report[lumpType].length == 0) if (Game.Has("Sugar aging process")) str += `<div>
                    This seems to be an unlucky seed.
                    Try making your requirements less strict in the options menu!
                </div>`;
			else str += `<div>
                    No matching predictions found.
                    This report type is better suited
                    for after you have purchased the heavenly upgrade "Sugar aging process".
                </div>`;
			str += "</div>";
			str += "</div>";
		}
		if (!hasShownLumpType) str += "No lump types were chosen, please select at least one lump type in the options menu.";
		return str;
	}
	function makeFullListReport(report) {
		let configurationCount = report.flat().length;
		capScrolledRows(configurationCount - preferences.display.rows + 1);
		let displayedRows = 0;
		let iteratedRows = 0;
		let str = "";
		str += "<div style=\"display:flex; flex-direction:column;\">";
		outerLoop: for (let i = 0; i < report.length; i++) for (let j = 0; j < report[i].length; j++) {
			iteratedRows++;
			if (iteratedRows <= scrolledRows) continue;
			let background = i % 2 ? "" : "background-color: black;";
			if (report[i][j].selectedEntry) background = "background-color: midnightblue;";
			str += `<div style="display:flex; align-items:center; justify-content:center; padding:2px; ${background}">`;
			str += makeLumpIcon(report[i][j].lumpType);
			str += "<div style=\"margin-right:1.5ex\">:</div>";
			str += makeConfigurationDiv(report[i][j]);
			str += "</div>";
			displayedRows++;
			if (displayedRows >= preferences.display.rows) break outerLoop;
		}
		if (displayedRows < preferences.display.rows) {
			str += "<div padding=2px; margin=5px; align-text: right;\">No other matching predictions found.";
			if (displayedRows == 0) if (Game.Has("Sugar aging process")) str += `<br />
                    This seems to be an unlucky seed.
                    Try making your requirements less strict in the options menu!
                `;
			else str += `<br />
                    Try showing more lump types and making your requirements less strict in the options menu.
                    Also, get the heavenly upgrade "Sugar aging process".
                `;
			str += "</div>";
		}
		str += "</div>";
		return str;
	}
	function customLumpTooltip(str, _phase) {
		let calculatedWidth = 0;
		calculatedWidth += 40;
		if (preferences.display.compactGrandmapocalypseRepresentation) calculatedWidth += 58;
		else calculatedWidth += 232;
		if (preferences.filtering.threeColumnDragonAuras) calculatedWidth += 132;
		else calculatedWidth += 88;
		calculatedWidth += 48;
		if (preferences.display.reportType == "summary") calculatedWidth += 120;
		else calculatedWidth += 54;
		calculatedWidth += 20;
		if (calculatedWidth > 400) str = str.replace("width:400px", `width:${calculatedWidth}px`);
		str += "<div class=\"line\"></div>";
		str += discrepancyTooltip();
		str += "<div class=\"line\"></div>";
		let prediction, isCurrent;
		({prediction, isCurrent} = planner.getAndUpdateLumpTypePrediction());
		str += `<div style="display:flex; justify-content:center; align-items:center;">
        <div>The next lump type is predicted to be</div>
        ${makeLumpIcon(prediction, .5)}
        <div style="padding-right:0.5ex">${prediction}.</div>
        ${isCurrent ? "" : "<div style=\"width: 0px;\">(recalculating...)</div>"}
    </div>`;
		let reportStr = "";
		if (preferences.display.reportType == "summary") {
			let report;
			({report, isCurrent} = planner.getAndUpdateSummaryReport());
			reportStr = makeSummaryReport(report);
		} else {
			let report;
			({report, isCurrent} = planner.getAndUpdateFullListReport());
			reportStr = makeFullListReport(report);
		}
		str += `<div style="display:flex; justify-content:center; margin-bottom:4px;">
        <div style="padding-right:0.5ex">Other configurations:</div>
        ${isCurrent ? "" : "<div style=\"width: 0px;\">(recalculating...)</div>"}
    </div>`;
		str += reportStr;
		return str;
	}
	//#endregion
	//#region src/UI/optionsMenu.ts
	var sliderUpdaters = {};
	function onSliderUpdate(id) {
		let sliderElement = document.getElementById(`CYOL-slider-${id}`);
		let rightTextElement = document.getElementById(`CYOL-sliderText-${id}`);
		let value = Number(sliderElement.value);
		sliderUpdaters[id].updateValue(value);
		rightTextElement.innerText = sliderUpdaters[id].getDisplayText(value);
	}
	function makeSlider(options) {
		sliderUpdaters[options.id] = {
			updateValue: options.updateValue,
			getDisplayText: options.getDisplayText
		};
		return `
    <div class="sliderBox">
        <div style="float:left;" class="smallFancyButton">${options.sliderTitle}</div>
        <div style="float:right;" class="smallFancyButton" id="CYOL-sliderText-${options.id}">
            ${options.getDisplayText(options.currentValue)}
        </div>
        <input class="slider" id="CYOL-slider-${options.id}"
               style="clear:both;"
               type="range" min="${options.minValue}" max="${options.maxValue}" step="1"
               value="${options.currentValue}"
               onchange="CYOL.UI.onSliderUpdate('${options.id}')"
               oninput="CYOL.UI.onSliderUpdate('${options.id}')"
               onmouseup="PlaySound('snd/tick.mp3');">
    </div>`;
	}
	function makeConditionsSlider(options) {
		function updateValue(newValue) {
			if (newValue == 0) options.updateValue("require");
			if (newValue == 1) options.updateValue("observe");
			if (newValue == 2) options.updateValue("ignore");
		}
		function getDisplayText(newValue) {
			if (newValue == 0) return "Require";
			if (newValue == 1) return "Observe";
			return "Ignore";
		}
		let currentValue = 0;
		if (options.currentValue == "observe") currentValue = 1;
		if (options.currentValue == "ignore") currentValue = 2;
		return makeSlider({
			id: options.id,
			updateValue,
			getDisplayText,
			currentValue,
			sliderTitle: options.sliderTitle,
			minValue: 0,
			maxValue: 2
		});
	}
	var buttonUpdaters = {};
	function onButtonClick(id) {
		let button = document.getElementById(`CYOL-button-${id}`);
		let newValue = !buttonUpdaters[id].getCurrentValue();
		buttonUpdaters[id].updateValue(newValue);
		if (newValue) button.classList.remove("off");
		else button.classList.add("off");
		button.innerText = buttonUpdaters[id].getDisplayText(newValue);
		PlaySound("snd/tick.mp3");
	}
	function makeButton(options) {
		function getDisplayText(newValue) {
			return options.buttonText + (newValue ? " ON" : " OFF");
		}
		buttonUpdaters[options.id] = {
			getCurrentValue: options.getCurrentValue,
			updateValue: options.updateValue,
			getDisplayText
		};
		return `
        <a id="CYOL-button-${options.id}"
           class="smallFancyButton prefButton option${options.getCurrentValue() ? "" : " off"}"
           onclick="CYOL.UI.onButtonClick('${options.id}')"
        >
            ${getDisplayText(options.getCurrentValue())}
        </a>`;
	}
	function makeIncludeLumpButton(lumpType) {
		let capitalizedName = lumpType[0].toUpperCase() + lumpType.slice(1);
		return makeButton({
			id: "include" + capitalizedName,
			getCurrentValue: () => preferences.filtering.includeType[lumpType],
			updateValue: (newValue) => {
				preferences.filtering.includeType[lumpType] = newValue;
			},
			buttonText: capitalizedName
		});
	}
	function customOptionsMenu() {
		let menuStr = "";
		menuStr += "<div class=\"listing\">" + makeSlider({
			id: "discrepancy",
			updateValue: (newValue) => {
				preferences.discrepancy = newValue;
			},
			getDisplayText: (newValue) => String(newValue) + "ms",
			currentValue: preferences.discrepancy,
			sliderTitle: "Expected discrepancy",
			minValue: 0,
			maxValue: 20
		}) + "</div>";
		menuStr += "<div class=\"listing\">" + makeButton({
			id: "threeColumnDragonAuras",
			getCurrentValue: () => {
				return preferences.filtering.threeColumnDragonAuras;
			},
			updateValue: (newValue) => {
				preferences.filtering.threeColumnDragonAuras = newValue;
			},
			buttonText: "Display dragon auras in three columns"
		}) + `<label>Whether to show the dragon auras in three columns,
                or to compress the display in only two columns.
        </label>
    </div>`;
		menuStr += "<div class=\"listing\">" + makeButton({
			id: "summaryReport",
			getCurrentValue: () => {
				return preferences.display.reportType == "summary";
			},
			updateValue: (newValue) => {
				if (newValue) preferences.display.reportType = "summary";
				else preferences.display.reportType = "fullList";
			},
			buttonText: "Summary display"
		}) + `<label>If on, shows only the "best configuration",
                otherwise show the full list of predictions.
        </label>
    </div>`;
		menuStr += "<div class=\"listing\">" + makeButton({
			id: "compactGrandmapocalypseRepresentation",
			getCurrentValue: () => {
				return preferences.display.compactGrandmapocalypseRepresentation;
			},
			updateValue: (newValue) => {
				preferences.display.compactGrandmapocalypseRepresentation = newValue;
			},
			buttonText: "Compact grandmapocalypse stages"
		}) + `<label>Whether to display the valid grandmapocalypse stages
                as a large 1x4 row or as a compact 2x2 grid
        </label>
    </div>`;
		menuStr += "<div class=\"listing\">" + makeSlider({
			id: "rowsToDisplay",
			updateValue: (newValue) => {
				preferences.display.rows = newValue;
			},
			getDisplayText: (newValue) => String(newValue),
			currentValue: preferences.display.rows,
			sliderTitle: "Rows of predictions to display",
			minValue: 1,
			maxValue: 30
		}) + "<label>Number of rows to be displayed, if showing the full list of predictions</label></div>";
		menuStr += "<div class=\"listing\">" + makeButton({
			id: "showCheckmark",
			getCurrentValue: () => {
				return preferences.display.showCheckmark;
			},
			updateValue: (newValue) => {
				preferences.display.showCheckmark = newValue;
			},
			buttonText: "Show checkmark"
		}) + `<label>Whether to show a checkmark (or sometimes a warning sign)
                in the top right corner of the icons in the tooltip
        </label>
    </div>`;
		menuStr += "<div class=\"listing\">" + makeButton({
			id: "useMatureGoldenLumpSprite",
			getCurrentValue: () => {
				return preferences.display.useMatureGoldenLumpSprite;
			},
			updateValue: (newValue) => {
				preferences.display.useMatureGoldenLumpSprite = newValue;
			},
			buttonText: "Use mature golden lump sprite"
		}) + `<label>Whether to use the fully mature golden lump sprite,
                or the almost-mature one.
        </label>
    </div>`;
		menuStr += "<div class=\"update small\"><div class=\"title\">Lump Types</div></div>";
		for (let lumpType of [
			"normal",
			"bifurcated",
			"golden",
			"meaty",
			"caramelized"
		]) menuStr += "<div class=\"listing\">" + makeIncludeLumpButton(lumpType) + `<label>Whether to list predictions that yield ${lumpType} lumps</label></div>`;
		menuStr += "<div class=\"update small\"><div class=\"title\">Filtering conditions</div></div>";
		menuStr += "<div class=\"listing\">" + makeConditionsSlider({
			id: "preserveGrandmapocalypseStage",
			sliderTitle: "Match current grandmapocalypse stage",
			currentValue: preferences.filtering.conditions.preserveGrandmapocalypseStage,
			updateValue: (newValue) => {
				preferences.filtering.conditions.preserveGrandmapocalypseStage = newValue;
			}
		}) + "<label>Whether to list only predictions that match the current grandmapocalypse stage (\"require\"),\n                to include those predictions in the summary report but not require this condition (\"observe\"),\n                or to not worry about this requirement at all (\"ignore\").\n        </label></div>";
		menuStr += "<div class=\"listing\">" + makeConditionsSlider({
			id: "preservePantheon",
			sliderTitle: "Match current pantheon configuration",
			currentValue: preferences.filtering.conditions.preservePantheon,
			updateValue: (newValue) => {
				preferences.filtering.conditions.preservePantheon = newValue;
			}
		}) + "<label>Similar, but for pantheon configuration.\n                Note that Rigidel can be disabled without changing the pantheon\n                by manipulating the number of buildings.\n        </label></div>";
		menuStr += "<div class=\"listing\">" + makeConditionsSlider({
			id: "preserveDragon",
			sliderTitle: "Match current dragon auras",
			currentValue: preferences.filtering.conditions.preserveDragon,
			updateValue: (newValue) => {
				preferences.filtering.conditions.preserveDragon = newValue;
			}
		}) + "<label>Similar, but for the dragon auras.\n                Additionally, if both \"preserve pantheon\" and \"preserve dragon\" are set to \"observe\",\n                the summary report also includes a row observing both conditions at the same time.\n        </label></div>";
		menuStr += "<div class=\"listing\">" + makeConditionsSlider({
			id: "respectBudget",
			sliderTitle: "Budget conscious",
			currentValue: preferences.filtering.conditions.respectBudget,
			updateValue: (newValue) => {
				preferences.filtering.conditions.respectBudget = newValue;
			}
		}) + "<label>Similar, but for configurations whose individual components\n                (grandmas and each dragon aura)\n                can be purchased using at most 1% of the current bank.\n        </label></div>";
		CCSE.AppendCollapsibleOptionsMenu("Choose Your Own Lump", menuStr);
	}
	//#endregion
	//#region src/rewriteCode.ts
	function rewriteCode(functionName, pattern, replacement) {
		let newCode = Game[functionName].toString().replace(pattern, replacement);
		let indirectEval = eval;
		Game[functionName] = indirectEval(`(${newCode})`);
	}
	//#endregion
	//#region src/main.ts
	var CYOL = {
		name,
		version,
		isLoaded: false,
		isInitialLoad: true,
		preferences,
		planner,
		discrepancyInfo,
		UI: {
			onSliderUpdate,
			onButtonClick
		},
		preload: function() {
			delete Game.modSaveData[name];
		},
		id: name,
		init: function() {
			Game.modHooks["reset"].push((hard) => {
				if (hard) clearModState();
			});
			Game.customLumpTooltip.push(customLumpTooltip);
			Game.customOptionsMenu.push(customOptionsMenu);
			Game.customStatsMenu.push(function() {
				CCSE.AppendStatsVersionNumber(name, version);
			});
			registerLumpIconWheelEventListener();
			rewriteCode("LoadSave", "{", "{\nCYOL.preload(); // Injected by Choose Your Own Lump\n");
			rewriteCode("loadModData", "{", `{\nif(!("${name}" in Game.modSaveData)) CYOL.load(); // Injected by Choose Your Own Lump\n`);
			clearModData();
			retrieveDataFromLegacySave();
			CYOL.isInitialLoad = name in Game.modSaveData;
			CYOL.isLoaded = true;
			Game.Notify("Choose Your Own Lump loaded!", "", void 0, 1, true);
		},
		save: function() {
			return serializeSaveData();
		},
		load: function(str) {
			if (str === void 0) {
				clearModData();
				retrieveDataFromLegacySave();
				discrepancyInfoRetrievalFallback(CYOL.preferences, CYOL.isInitialLoad);
			} else loadSaveData(str, CYOL.isInitialLoad);
			CYOL.isInitialLoad = false;
		}
	};
	window.CYOL = CYOL;
	if (typeof CCSE == "undefined") Game.LoadMod("https://klattmose.github.io/CookieClicker/CCSE.js");
	if (!CYOL.isLoaded) if (window.CCSE && window.CCSE.isLoaded) Game.registerMod(CYOL.id, CYOL);
	else {
		if (!window.CCSE) window.CCSE = {};
		if (!window.CCSE.postLoadHooks) window.CCSE.postLoadHooks = [];
		window.CCSE.postLoadHooks.push(function() {
			if (window.CCSE.ConfirmGameVersion("Choose Your Own Lump", "1.4.0", "2.058")) Game.registerMod(CYOL.id, CYOL);
		});
	}
	//#endregion
})();
