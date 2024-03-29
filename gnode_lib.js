
//***************
// node library definition
GNode.regist = function(THREE) {
	GNode.registerNode("Mesh",
		function(param={}){
			this.nodetype = "Mesh"
			this.param = param 
			this.shape = param.shape 
			if(!this.shape) this.shape ="cube"
			this.insock.set('material', new GNode.Socket('material',"mat",this,"in","material"))
			this.outsock.set('mesh', new GNode.Socket('mesh',"mesh",this,"out","mesh"))
			this.outsock.set('vcount', new GNode.Socket('vcount',"vcount",this,"out","scalar"))
			this.outsock.set('vindex', new GNode.Socket('vindex',"vindex",this,"out","scalar"))
			this.outsock.set('vertex', new GNode.Socket('vertex',"vertex",this,"out","vec3"))
			this.outsock.set('vnormal', new GNode.Socket('vnormal',"normal",this,"out","vec3"))
			this.outsock.set('vuv', new GNode.Socket('vuv',"uv",this,"out","vec2"))

			this.result = this.outsock.get('mesh')
		},
		{
			"eval":function() {
				let mesh 
				const param = this.param 
				if(param.mesh ) {
					mesh = param.mesh 
				} else {
					let geometry 
		
					let size =  param.radius?param.radius.split(","):null 
					if(size==null) size = []
					if(!size[0]) size[0] = 1 
					size[0] = parseFloat(size[0])

					let segment = param.segment?param.segment.split(","):null
					if(segment==null) segment = []
					switch(this.shape) {
						case "triangle":
							if(!size[1]) size[1] = size[0]/2*Math.sqrt(3)
							const vertices =new Float32Array( [-size[0]/2,0,0, size[0]/2,0,0, 0,size[1],0])
							const normals = new Float32Array([0,0,1, 0,0,1, 0,0,1])
							const uvs = new Float32Array([0,0, 1,0, 0.5,1])
							geometry = new THREE.BufferGeometry()
							geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );											geometry.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
							geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2) );
							break
						case "plane":
							if(!size[1]) size[1] = size[0] 
							if(!segment[0]) segment[0] = 1 
							if(!segment[1]) segment[1] = segment[0] 
							geometry = new THREE.PlaneGeometry( size[0], size[1],segment[0],segment[1] );
							break ;
						case "sphere":
							if(!segment[0]) segment[0] = 32 
							if(!segment[1]) segment[1] = segment[0]/2
							geometry = new THREE.SphereGeometry( size[0],segment[0],segment[1] );
							break ;
						case "cube":
							if(!size[1]) size[1] = size[0] 
							if(!size[2]) size[2] = size[0] 
							if(!segment[0]) segment[0] = 1
							if(!segment[1]) segment[1] = segment[0]
							if(!segment[2]) segment[2] = segment[0]
							geometry = new THREE.BoxGeometry( size[0],size[1],size[2],segment[0],segment[1],segment[2] );
							break 
						case "cone":
							if(!size[1]) size[1] = size[0]*2
							if(!segment[0]) segment[0] = 32 
							geometry = new THREE.ConeGeometry(size[0],size[1],segment[0])
							break;
						case "cylinder":
							if(!size[1]) size[1] = size[0]
							if(!size[2]) size[2] = size[0]
							if(!segment[0]) segment[0] = 32 
							if(!segment[1]) segment[1] = 1
							geometry = new THREE.CylinderGeometry(size[0],size[1],size[2],segment[0],segment[1])
							break
						case "capsule":
							if(!size[1]) size[1] = size[0]
							if(!segment[0]) segment[0] = 32 
							geometry = new THREE.CapsuleGeometry(size[0],size[1],4,segment[0])					
							break ;
						case "torus":
							if(!size[1]) size[1] = 0.4
							if(!segment[0]) segment[0] = 32 
							if(!segment[1]) segment[1] = 64
							geometry = new THREE.TorusGeometry(size[0],size[1],segment[0],segment[1])
							break
						case "icosa":
							geometry = new THREE.IcosahedronGeometry(size[0])
							break 
						case "octa":
							geometry = new THREE.OctahedronGeometry(size[0])
							break
						case "dodeca":
							geometry = new THREE.DodecahedronGeometry(size[0])
							break 
					}
					let material = this.insock.get('material').getval(true)
					if(material==null) {
						material = new THREE.MeshStandardMaterial( { color: 0xffffff } );
						if(this.shape=="plane") material.side = THREE.DoubleSide
					}
					mesh = new THREE.Mesh( geometry, material );
				}
				this.result.setval(mesh)
				const vertex = mesh.geometry.getAttribute('position')
				const vcount = vertex.count  
				this.outsock.get('vcount').setval(vcount)	
				const vtx = vertex.array 
				const norm = mesh.geometry.getAttribute('normal').array
				const uv = mesh.geometry.getAttribute('uv').array 
				const vi = []
				const vt = []
				const ni = [] 
				const vuv = []
				for(let i=0;i<vcount;i++) {
					vi.push(i)
					vt.push([vtx[i*3],vtx[i*3+1],vtx[i*3+2]])
					ni.push([norm[i*3],norm[i*3+1],norm[i*3+2]])
					vuv.push([uv[i*2],uv[i*2+1]])
				}
				this.outsock.get('vindex').setval(vi)	
				this.outsock.get('vertex').setval(vt)	
				this.outsock.get('vnormal').setval(ni)	
				this.outsock.get('vuv').setval(vuv)	
			},
			"setui":function() {
				const cb = (e) => {
					switch(e.key) {
						case "type":
							this.param.shape = e.value	
							this.shape = this.param.shape
							break 
						case "radius":
							this.param.radius = e.value 
							break ; 
						case "segment":
							this.param.segment = e.value 
							break ; 
					}
				}
				const p = [
					{name:"type",caption:"shape",type:"select",select:[
						{name:"triangle",value:"triangle"},
						{name:"plane",value:"plane"},
						{name:"cube",value:"cube"},
						{name:"sphere",value:"sphere"},
						{name:"cone",value:"cone"},
						{name:"cylinder",value:"cylinder"},
						{name:"capsule",value:"capsule"},
						{name:"torus",value:"torus"},
						{name:"icosa",value:"icosa"},
						{name:"octa",value:"octa"},
						{name:"dodeca",value:"dodeca"}
						],value:this.param.shape,callback:cb},
					{name:"radius",caption:"size",type:"text",size:5,value:this.param.radius,callback:cb},
					{name:"segment",caption:"segment",type:"text",size:5,value:this.param.segment,callback:cb}

				]
				return p 
			}
		}
	)
	GNode.registerNode("Material",
		function(param={}) {
			this.nodetype = "Material"
			this.param = param 
			if(this.param.roughness==undefined)this.param.roughness=0.5
			if(this.param.metalness==undefined)this.param.metalness=0.5
			if(this.param.color==undefined)this.param.color="#fff"
			if(this.param.opacity==undefined)this.param.opacity=1
			if(this.param.side==undefined)this.param.side=THREE.FrontSide
			if(this.param.flat==undefined) this.param.flat = false 
			this.outsock.set('material', new GNode.Socket('material',"mat",this,"out","material"))
//			this.insock['color'] = new GNode.Socket("color",this,"in","vec3")
		},
		{
			"eval":function() {
				this.material =  new THREE.MeshStandardMaterial( { color: 0xffffff,roughness:this.param.roughness,metalness:this.param.metalness } );
				this.outsock.get('material').setval(this.material)
				this.material.color = new THREE.Color(this.param.color)
				this.material.opacity = this.param.opacity
				this.material.transparent = (this.param.opacity!=1) 
				this.material.side = parseInt(this.param.side )
				this.material.flatShading = this.param.flat
			},
			"setui":function() {
				const cb = (e) => {
					if(e.key=="roughness") {
						this.material.roughness = e.value 
						this.param.roughness = e.value 
					}
					if(e.key=="metalness") {
						this.material.metalness = e.value 
						this.param.metalness = e.value
					}
					if(e.key=="color") {
						this.param.color = e.value
						this.material.color = new THREE.Color(this.param.color) 
					}
					if(e.key=="opacity") {
						this.param.opacity = e.value
						this.material.opacity = e.value 
						this.material.transparent = (this.param.opacity!=1) 
					}
					if(e.key=="side") {
						this.param.side = e.value 
						this.material.side = e.value 
					}
					if(e.key=="flat") {
						this.param.flat = e.value.checked 
						this.material.flatShading = this.param.flat
					}
				}
				const p = [
					{name:"roughness",callback:cb,caption:"R",type:"range",min:0,max:1,value:this.param.roughness},
					{name:"metalness",callback:cb,caption:"M",type:"range",min:0,max:1,value:this.param.metalness},
					{name:"color",callback:cb,caption:"Color",type:"text",size:10,value:this.param.color},
					{name:"opacity",callback:cb,caption:"Opacity",type:"range",min:0,max:1,value:this.param.opacity},
					{name:"side",callback:cb,caption:"Side ",type:"select",select:[
						{name:"front",value:THREE.FrontSide},
						{name:"back",value:THREE.BackSide},
						{name:"both",value:THREE.DoubleSide}
					],value:this.param.side},
					{name:"flat",callback:cb,caption:"Flat ",type:"checkbox",checked:this.param.flat}
				]
				return p
			}
		}
	)

	GNode.registerNode("Value",
		function(param){
			this.nodetype = "Value"
			this.value = param.value 
			this.outsock.set('result', new GNode.Socket('result',"result",this,"out","scalar"))
			this.outsock.get('result').setval(this.value) 
			this.result = this.outsock.get('result')
		},
		{
			"setval":function(v) {
				this.value = v
				this.param.value = v 
				this.outsock.get('result').setval(this.value)  
			},
			"eval":function(v) {
				this.outsock.get('result').setval(this.value)  
			},
			"setui":function() {
				const cb =  e=>{
					this.setval(parseFloat(e.value))
					this.eval()
				}
				return [{name:"value",caption:"value",type:"number",value:this.value,size:5,callback:cb}]
			}
		}
		)

	GNode.registerNode("Timer",
		function(param){
			this.nodetype = "Timer"
			this.value = null
			this.stime =  new Date().getTime()
			this.dtime = 0
			this.outsock.set('result', new GNode.Socket('result',"result",this,"out","scalar"))
			this.outsock.set('delta', new GNode.Socket('delta',"delta",this,"out","scalar"))
			this.result = this.outsock.get('result')
		},
		{
			"eval":function() {
				const v = (new Date().getTime() - this.stime )
				this.outsock.get('result').setval(v)
				this.outsock.get('delta').setval(v-this.dtime)
				this.dtime = v 
			}
		}
		)
	GNode.registerNode("Input",
		function(param){
			this.nodetype = "Input"
			this.value = {} 
			this.param = param
			this.input = param.input 
			for(let k of this.input) {
				this.outsock.set(k.id, new GNode.Socket(k.id,k.id,this,"out","scalar"))
				this.value[k.id] = k.value
				this.outsock.get(k.id).setval(this.value[k.id])
			}
			this.output = {} 
		},{
			eval:function() {
			},
			"setval":function(key,v) {
				this.value[key] = v 
				this.input.forEach(o=>{
					if(o.id==key) o.value = v
				}) 
				this.outsock.get(key).setval(v)
			},
			"setui":function() {
				const cb = e=>{
					this.setval(e.key,e.value)
				}
				const p = []
				for(let k of this.input) {
					const max = (k.max===undefined)?1:k.max
					p.push({name:k.id,type:"range",caption:k.caption, min:0,max:1,step:100,value:k.value/max,callback:cb})
				}
				return p 
			}
		}
	)
	
	GNode.registerNode("AFEntity",
		function(param) {
			this.nodetype = "AFEntity"
			if(!param) param = {query:""}
			this.param = param 
			this.outsock.set('mesh', new GNode.Socket('mesh',"mesh",this,"out","mesh"))
			this.outsock.set('material', new GNode.Socket('material',"material",this,"out","material"))
			this.outsock.set('matrix', new GNode.Socket('matrix',"matrix",this,"out","matrix"))
			this.result = this.outsock.get('mesh')
		},
		{
			"eval":function() {
				let dom = null 
				try {
					dom = document.querySelector(this.param.query)
				} catch(err) {
					console.log(err) 
					return
				}
				if(dom===null) return 
				if(!dom.getObject3D) return 
				const mesh = dom.getObject3D("mesh")
				if(!mesh) return 
//				console.log(mesh)
				this.result.setval(mesh)
				this.outsock.get('material').setval(mesh.material)
				this.outsock.get('matrix').setval(mesh.matrix)
			},
			"setui":function() {
				const cb =  e=>{
					this.param.query = e.value 
				}
				return [{name:"query",caption:"query",type:"input",value:this.param.query,size:5,callback:cb}]
			}
		}
	)

	GNode.registerNode("CreateInstance",
		function(param){
			this.param = param 
			this.nodetype = "CreateInstance"
			this.insock.set('mesh',new GNode.Socket('mesh',"mesh",this,"in","mesh"))
			this.insock.set('material',new GNode.Socket('material',"material",this,"in","material"))
			this.insock.set('count', new GNode.Socket('count',"count",this,"in","scalar"))
			this.outsock.set('instance',new GNode.Socket('instance',"instance",this,"out","instance"))
			this.outsock.set('index', new GNode.Socket('index',"index",this,"out","scalar"))
			this.outsock.set('findex',new GNode.Socket('findex',"findex",this,"out","scalar"))
			this.outsock.set('count', new GNode.Socket('count',"count",this,"out","scalar"))
			if(param.count) this.insock.get('count').setval(param.count)
		},{
			"eval":function() {
				const count = this.insock.get('count').getval(true)
				const mesh = this.insock.get('mesh').getval(true)
				mesh.updateMatrix()
				mesh.geometry.applyMatrix4(mesh.matrix)
				if(count==0||mesh==null) return 
				let material = this.insock.get('material').getval()
				if(material==null) material =  mesh.material
				else material = material[0]
				let inst = new THREE.InstancedMesh( mesh.geometry,material,count )
				inst.userData.maxcount = count 
				let idx = []
				let iidx = []
				const mtx = new THREE.Matrix4()
				for(let i=0;i<count;i++) {
					inst.setMatrixAt(i,mtx)
					idx.push(i) 
					iidx.push(i/count)
				}
				this.outsock.get('count').setval(count)
				this.outsock.get('instance').setval(inst)
				this.outsock.get('index').setval(idx)
				this.outsock.get('findex').setval(iidx)
			},
			"setui":function() {
				const cb =  e=>{
					this.param.count = e.value 
					this.insock.get('count').setval(e.value)
				}
				return [{name:"count",caption:"count",type:"input",value:this.insock.get('count').getval(true),size:5,callback:cb}]
			}

		}
		)
	GNode.registerNode("InstanceMatrix",
		function(param) {
			this.nodetype = "InstanceMatrix"
			this.insock.set('instance',new GNode.Socket('instance',"instance",this,"in","instance"))
			this.insock.set('scale', new GNode.Socket('scale',"scale",this,"in","vec3"))
			this.insock.set('euler', new GNode.Socket('euler',"euler",this,"in","vec3"))
			this.insock.set('quaternion', new GNode.Socket('quaternion',"quaternion",this,"in","vec4"))
			this.insock.set('translate', new GNode.Socket('translate',"translate",this,"in","vec3"))
			this.insock.set('matrix', new GNode.Socket('matrix',"matrix",this,"in","mat4"))
			this.outsock.set('instance', new GNode.Socket('instance',"instance",this,"out","instance"))
			this.result = this.outsock.get('instance') 
			this.mtx = new THREE.Matrix4() 
			this.mtx1 = new THREE.Matrix4()
			this.mtx2 = new THREE.Matrix4()
			this.mtx3 = new THREE.Matrix4()
		},
		{
			"eval":function() {
				const ini = this.insock.get('instance').getval(true)
				if(ini==null) return 
				let bmtx = this.insock.get('matrix').getval()
				if(bmtx===null) bmtx = [new THREE.Matrix4()]
				const ins = this.insock.get('scale').getval()
				const ine = this.insock.get('euler').getval()
				const inq = this.insock.get('quaternion').getval()
				const intr = this.insock.get('translate').getval()
				let count = ini.userData.maxcount
				if(ins && ins.length>count) count = ins.length
				if(ine && ine.length>count) count = ine.length
				if(inq && inq.length>count) count = inq.length
				if(intr && intr.length>count) count = intr.length
				if(bmtx && bmtx.length>count) count = bmtx.length
				function get(a,i) { return a[i%a.length] }
				for(let i=0;i<count;i++) {
					this.mtx.copy(get(bmtx,i))
					if(ins) {
						let  sc = get(ins,i)
						sc = Array.isArray(sc)?sc:[sc,sc,sc]
						this.mtx.premultiply(this.mtx3.makeScale(...sc))
					}
					if(ine) {
						this.mtx.premultiply(this.mtx1.makeRotationFromEuler(new THREE.Euler(...get(ine,i))))
					}
					if(inq) {
						this.mtx.premultiply(this.mtx1.makeRotationFromQuaternion (new THREE.Quaternion(...get(inq,i)).normalize()))
					}
					if(intr) {
						this.mtx.premultiply(this.mtx2.makeTranslation(...get(intr,i)))
					}
					ini.setMatrixAt( i, this.mtx )
				}
				ini.instanceMatrix.needsUpdate  = true
				ini.count = count 
				this.result.setval(ini)
			}	
		}
		)
	GNode.registerNode("InstanceColor",
		function(param) {
			this.nodetype = "InstanceColor"
			this.insock.set('instance', new GNode.Socket('instance',"instance",this,"in","instance"))
			this.insock.set('rgb', new GNode.Socket('rgb',"RGB",this,"in","vec3"))
			this.insock.set('hsl', new GNode.Socket('hsl',"HSL",this,"in","vec3"))
			this.outsock.set('instance', new GNode.Socket('instance',"instance",this,"out","instance"))
			this.result = this.outsock.get('instance')
		},
		{
			"eval":function() {
				const oi = []
				const ini = this.insock.get('instance').getval(true)
				if(ini==null) return 
				const rgb = this.insock.get('rgb').getval()
				const hsl = this.insock.get('hsl').getval()
				const col = new THREE.Color()
				for(let i=0;i<ini.count;i++) {
					if(rgb) col.setRGB(...(rgb[i%rgb.length]))
					else if(hsl) col.setHSL(...(hsl[i%hsl.length]))
					ini.setColorAt(i,col)
				}
				this.result.setval(ini)	
			}	
		}
		)

	GNode.registerNode("Math",
		function(param){
			this.nodetype = "Math"
			this.param = param 
			let precode = ( param.precode)?param.precode:""
			let initcode = (param.initcode)?param.initcode:""
			if(Array.isArray(precode)) precode = precode.join("\n")
			if(Array.isArray(initcode)) initcode = initcode.join("\n")
			let noloop = param.noloop==true 
			this.lastdata = 0
			for(let n of param.input) {
				this.insock.set(n.id, new GNode.Socket(n.id,n.id,this,"in",n.type)	)
			}
			this.insock.set('sample', new GNode.Socket('sample',"T",this,"in","scalar"))

			const output = []
			const result = [] 
			for(let n of param.output) {
				let code = n.value
				if(Array.isArray(code)) {
					code = "["+code.join(",")+"]"
				}
				output.push( `__c = ${code} ; \n`)
//				output.push(`if(nan(__c)) throw("NaN")\n`)
				output.push(`if(__c!==null) __result['${n.id}'].push( __c );`) 
				result.push( `${n.id}:[]`)
				this.outsock.set(n.id, new GNode.Socket(n.id,(n.id=="result")?"R":n.id,this,"out",n.type)	)
			}
			this.result = this.outsock.get('result')

			const  args = [] 
			for(let [n,s] of this.insock) {
				args.push(`let ${n} = getidx("${n}",index);`)
			}

			const fc = `
				"use strict" 
				const [PI,PI2,RAD,DEG,Time,sin,cos,tan,atan2,floor,ceil,fract,pow,sqrt,hypot,abs,sign,min,max,noise]=
					[Math.PI,Math.PI*2,Math.PI/180,180/Math.PI,allinput.__time,Math.sin,Math.cos,Math.tan,Math.atan2,Math.floor,Math.ceil,(a)=>a-Math.floor(a),Math.pow,Math.sqrt,Math.hypot,Math.abs,Math.sign,Math.min,Math.max,GNode.noise]
				const mix = (x,y,a)=>x(1-a)+y*a
				const clamp = (x,a,b)=>Math.min(Math.max(x, a), b)
				const step = (a,x)=>(x<a)?0:1
				const smoothstep = (e0,e1,x)=>{let xx=(x-e0)/(e1-e0);xx=Math.max(0,Math.min(1,xx));return xx*xx*(3-2*xx)}
				const random = (s=0,e=1)=>Math.random()*(e-s)+s

				function getidx(n,i) {
					let v = allinput[n]
//					if(v===undefined||v===null||v===NaN) throw("no input") 
					if(Array.isArray(v)) v = (v.length<__ic)?v[i%v.length]:v[i]
					let ret = v 
					if(Array.isArray(v)) {
						ret = {x:v[0],y:v[1]}
						if(v.length>2) ret.z = v[2]
						if(v.length>3) ret.w = v[3]
					}
					return ret
				}
				function nan(v) {
					let ret = false 
					if(Array.isArray(v)) v.forEach(o=>{if(isNaN(o)) ret=true})
					else if(isNaN(v)) ret = true
					return ret 
				}
				let __result = {${result.join(",")}}
				let __c ;
				const A = allinput 
			`+(noloop?
			`	let result = __result 
				${initcode}
				return result 
			`
			:
			`	${initcode}
				for(let index=0;index<__ic;index++) {
					const I=index 
					{
							${args.join("\n")}
							${precode};
							${output.join("\n")}
					}
				}
				return __result 
			`)
			this.src = fc 
			try{
				this.func = new Function("__ic","allinput","lastdata","F",fc)
			} catch(err){ 
				this.err = err 
				this.func = null
//				throw("math function "+err)
			}
			this.lasts = NaN
			this.hold = false 
		},{
			eval:function(time) {
				if(this.func===null) {
					throw("math init "+this.err)
					return 
				}
				if(this.joints.sample) {
					const sh = this.insock.get('sample').value[0]
					this.hold = (sh==this.lasts)
					if(this.hold) return 
					this.lasts = sh 
				}
				let ic = 0 
				this.allinput = {"__time":time}

				for(let [n,s] of this.insock) {
					const   v = s.getval() 
					if(v===null) continue 
					let af = false 
					if(s.type=="scalar") {
						if( !Array.isArray(v)) af=true 
					} else {
						if(Array.isArray(v) && !Array.isArray(v[0])) af=true 
					}
					if(v.length>ic) ic=v.length 
					this.allinput[n] = af?[v]:v
				}
				try{
					const ret = (this.func)(ic==0?1:ic,this.allinput,this.lastdata,this.nodetree.funcs)
					for(let o in ret) {	
						let out 
						if(0&&ic==0) out = ret[o][0]
						else {out = ret[o] }
						this.outsock.get(o).setval(out)
					}
				}catch(err){throw("math runtime "+err)}
			},
			setui:function() {
				const ret = [] 
				if(this.param.noloop) {
					const el = document.createElement("textarea") 
					el.setAttribute("rows",5)
					el.setAttribute("cols",40)
					el.value = this.param.initcode 
					el.addEventListener("input",ev=>{
						this.param.initcode = ev.target.value 
					})
					ret.push({caption:"",elem:el})	
					return ret 	
				}
				const o = this.param.output.find(o=>o.id=="result") 
				if(o.type=="scalar")
					ret.push(
						{name:"r",caption:"",type:"input",size:20,value:o.value,
							callback:(e)=>o.value =e.value })
				else {
					ret.push(
							{name:"x",caption:"x",type:"input",size:20,value:o.value[0],
								callback:(e)=>o.value[0]=e.value})
					ret.push(
							{name:"y",caption:"y",type:"input",size:20,value:o.value[1],
								callback:(e)=>o.value[1]=e.value})
					if(o.type=="vec3"||o.type=="vec4")
						ret.push(
							{name:"z",caption:"z",type:"input",size:20,value:o.value[2],
								callback:(e)=>o.value[2]=e.value})
					if(o.type=="vec4")
						ret.push(
							{name:"w",caption:"w",type:"input",size:20,value:o.value[3],
								callback:(e)=>o.value[3]=e.value})
				}
				return ret 
			}
		}
	)

	GNode.registerNode("ScaleMatrix",
		function(param) {
			this.nodetype = "ScaleMatrix"
			this.insock.set('scale', new GNode.Socket('scale',"scale",this,"out","vec3"))
			this.insock.set('matrix', new GNode.Socket('matrix',"matrix",this,"out","mat4"))
			this.outsock.set('matrix', new GNode.Socket('matrix',"matrix",this,"out","mat4"))
			this.result = this.outsock.get('matrix')
		},
		{
			eval:function() {
				
			}
		}
	)
	GNode.registerNode("Output",
		function(param){
			this.nodetype="Output"
			this.param = param
			this.insock.set('mesh', new GNode.Socket('mesh',"mesh",this,"in","mesh"))
			this.insock.set('scale', new GNode.Socket('scale',"scale",this,"in","vec3"))
			this.insock.set('euler', new GNode.Socket('euler',"euler",this,"in","vec3"))
			this.insock.set('translate', new GNode.Socket('translate',"translate",this,"in","vec3"))
			this.outsock.set('mesh', new GNode.Socket('mesh',"mesh",this,"out","mesh"))
			this.result = this.outsock.get('mesh')
		},
		{
			eval:function() {
				const mesh = this.insock.get('mesh').getval(true)
				this.outsock.get('mesh').value = mesh
				let sc = this.insock.get('scale').getval(true)
				if(sc) {
					if(!Array.isArray(sc)) sc = [sc,sc,sc]
					mesh.scale.copy( new THREE.Vector3(...sc ))
				}
				let tr = this.insock.get('translate').getval(true)
				if(tr) {
					mesh.position.x = (tr[0])
					mesh.position.y = (tr[1]) 
					mesh.position.z = (tr[2])  
				}
				let eu = this.insock.get('euler').getval(true)
				if(eu) {
					mesh.setRotationFromEuler(new THREE.Euler(...eu))
				}
			}
		}
	)

	GNode.registerNode("Latch",
		function(param){
			this.nodetype = "Latch"
			this.param = param
			this.type = param?.type 
			if(!this.type) this.type="vec3" 
			this.insock.set('input', new GNode.Socket('input',"input",this,"in","any",false))
			this.insock.set('initial', new GNode.Socket('initial',"initial",this,"in","any"))
			this.insock.set('sample', new GNode.Socket('sample',"S&H",this,"in","scalar"))
			this.outsock.set('result', new GNode.Socket('result',"result",this,"out","any"))
			this.result = this.outsock.get('result')
			this.vstack = null
			this.lasts = NaN
			this.hold = false 
		},
		{
			"reload":function() {
				this.vstack = null 
			},
			"eval":function(v) {
				if(this.vstack==null) {
					let out 
					if(this.insock.get('initial').value) {
						out =this.insock.get('initial').value	
					}	
					else out = this.type=="vec3"?[[0,0,0]]:[0] 
					this.outsock.get('result').value = out
					return 
				}
				if(this.joints.sample) {
					const sh = this.insock.get('sample').getval(true)
					this.hold = (sh==this.lasts)
					if(this.hold) return 
					this.lasts = sh 
				}
				let out 
				out = this.vstack.map(a=>{return Array.isArray(a)?Array(...a):a})
				this.outsock.get('result').value = out
			},
			"posteval":function() {
				if(this.hold) return 
				if(!this.joints.input) return 
				const v = this.joints.input?.value
				if(!v) return 
				this.insock.get('input').value = v 
//				this.vstack = structuredClone(v)	
				this.vstack = v.map(a=>{return Array.isArray(a)?new Array(...a):a})
	//			console.log(this.vstack)			
			}
		}
		)	
	GNode.registerNode("MeshMatrix",
		function(param) {
			this.nodetype = "MeshMatrix"
			this.insock.set('mesh', new GNode.Socket('mesh',"mesh",this,"in","mesh"))
			this.insock.set('scale', new GNode.Socket('scale',"scale",this,"in","vec3"))
			this.insock.set('euler', new GNode.Socket('euler',"euler",this,"in","vec3"))
			this.insock.set('quaternion', new GNode.Socket('quaternion',"quaternion",this,"in","vec4"))
			this.insock.set('matrix', new GNode.Socket('matrix',"matrix",this,"in","mat4"))
			this.insock.set('translate', new GNode.Socket('translate',"translate",this,"in","vec3"))
			this.outsock.set('mesh', new GNode.Socket('mesh',"mesh",this,"out","mesh"))
			this.result = this.outsock.get('mesh') 
		},
		{
			"eval":function() {
				let ini = this.insock.get('mesh').getval(true)
				const ins = this.insock.get('scale').getval(true)
				const ine = this.insock.get('euler').getval(true)
				const inq = this.insock.get('quaternion').getval()
				const intr = this.insock.get('translate').getval(true)
		
					if(ins) {
						const sc = Array.isArray(ins)?ins:[ins,ins,ins]
						ini.scale.copy(new THREE.Vector3(...sc))
					}
					if(ine) {
						ini.setRotationFromEuler(new THREE.Euler(...ine))
					}
					if(inq) {
						ini.setRotationFromQuaternion(new THREE.Quaternion(...inq).normalize())
					}
					if(intr) {
						const tr = Array.isArray(intr)?intr:[intr,intr,intr]
						ini.position.copy(new THREE.Vector3(...tr))
					}

				this.result.setval(ini)
			}	
		}
	)
	GNode.registerNode("MeshGroup",
		function(param) {
			this.nodetype = "MeshGroup"
			this.insock.set('mesh1', new GNode.Socket('mesh1',"mesh1",this,"in","mesh"))
			this.insock.set('mesh2', new GNode.Socket('mesh2',"mesh2",this,"in","mesh"))
			this.insock.set('mesh3', new GNode.Socket('mesh3',"mesh3",this,"in","mesh"))
			this.insock.set('mesh4', new GNode.Socket('mesh4',"mesh4",this,"in","mesh"))
			this.outsock.set('mesh', new GNode.Socket('mesh',"mesh",this,"out","mesh"))
			this.result = this.outsock.get('mesh')
			this.group =  new THREE.Group()
		},
		{
			"eval":function() {
				this.group.clear()
				let m = this.insock.get('mesh1').getval(true) 
				if(m) this.group.add(m) 
				m = this.insock.get('mesh2').getval(true) 
				if(m) this.group.add(m) 
				m = this.insock.get('mesh3').getval(true) 
				if(m) this.group.add(m) 
				m = this.insock.get('mesh4').getval(true) 
				if(m) this.group.add(m) 
				this.result.setval(this.group)
			}
		}
	)
	GNode.registerNode("MergeMesh",
		function(param) {
			this.nodetype = "MergeMesh"
			this.insock.set('mesh1', new GNode.Socket('mesh1',"mesh1",this,"in","mesh"))
			this.insock.set('mesh2', new GNode.Socket('mesh2',"mesh2",this,"in","mesh"))
			this.insock.set('mesh3', new GNode.Socket('mesh3',"mesh3",this,"in","mesh"))
			this.insock.set('mesh4', new GNode.Socket('mesh4',"mesh4",this,"in","mesh"))
			this.outsock.set('mesh', new GNode.Socket('mesh',"mesh",this,"out","mesh"))
			this.outsock.set('vcount', new GNode.Socket('vcount',"vcount",this,"out","scalar"))
			this.outsock.set('vindex', new GNode.Socket('vindex',"vindex",this,"out","scalar"))
			this.outsock.set('vertex', new GNode.Socket('vertex',"vertex",this,"out","vec3"))
			this.outsock.set('vnormal', new GNode.Socket('vnormal',"normal",this,"out","vec3"))
			this.outsock.set('vuv', new GNode.Socket('vuv',"uv",this,"out","vec2"))
			this.result = this.outsock.get('mesh')
		},
		{
			"eval":function() {
				const a = [] 
				let m1 = this.insock.get('mesh1').getval(true) 
				if(m1) {
					m1.updateMatrix()
					a.push(m1.geometry.applyMatrix4(m1.matrix)) 
				}
				let m = this.insock.get('mesh2').getval(true) 
				if(m) {
					m.updateMatrix()
					a.push(m.geometry.applyMatrix4(m.matrix)) 
				} 
				m = this.insock.get('mesh3').getval(true) 
				if(m) {
					m.updateMatrix()
					a.push(m.geometry.applyMatrix4(m.matrix)) 
				} 
				m = this.insock.get('mesh4').getval(true) 
				if(m) {
					m.updateMatrix()
					a.push(m.geometry.applyMatrix4(m.matrix)) 
				} 
				if(a.length==0) return 
				const geom = THREE.BufferGeometryUtils.mergeBufferGeometries(a,false) 
				m1.geometry.dispose()
				m1.geometry = geom 
				m1.scale.x=1,m1.scale.y=1,m1.scale.z=1
				m1.position.x=0,m1.position.y=0,m1.position.z=0
				m1.rotation.x=0,m1.rotation.y=0,m1.rotation.z=0
				this.result.setval(m1)
				const vertex = m1.geometry.getAttribute('position')
				const vcount = vertex.count  
				this.outsock.get('vcount').setval(vcount)	
				const vtx = vertex.array 
				const norm = m1.geometry.getAttribute('normal').array
				const uv = m1.geometry.getAttribute('uv').array 
				const vi = []
				const vt = []
				const ni = [] 
				const vuv = []
				for(let i=0;i<vcount;i++) {
					vi.push(i)
					vt.push([vtx[i*3],vtx[i*3+1],vtx[i*3+2]])
					ni.push([norm[i*3],norm[i*3+1],norm[i*3+2]])
					vuv.push([uv[i*2],uv[i*2+1]])
				}
				this.outsock.get('vindex').setval(vi)	
				this.outsock.get('vertex').setval(vt)	
				this.outsock.get('vnormal').setval(ni)	
				this.outsock.get('vuv').setval(vuv)	
			}
		}
	)
	GNode.registerNode("GeometryVertex",
		function(param) {
			this.nodetype = "GeometryVertex"
			this.insock.set('mesh', new GNode.Socket('mesh',"mesh",this,"in","instance"))
			this.insock.set('vertex', new GNode.Socket('vertex',"vertex",this,"in","vec3"))
			this.insock.set('normal', new GNode.Socket('normal',"normal",this,"in","vec3"))
			this.insock.set('uv', new GNode.Socket('uv',"uv",this,"in","vec2"))
			this.insock.set('color', new GNode.Socket('color',"color",this,"in","vec3"))
			this.outsock.set('mesh', new GNode.Socket('mesh',"mesh",this,"out","mesh"))
			this.result = this.outsock.get('mesh') 
		},
		{
			"eval":function() {			
				let mesh = this.insock.get('mesh').getval(true)
//				mesh.updateMatrix()
//				mesh.geometry.applyMatrix4(mesh.matrix)
//				mesh.matrix = new THREE.Matrix4() 
				const geom = mesh.geometry
				const pos = geom.getAttribute("position")
				const norm = geom.getAttribute("normal")
				const uv = geom.getAttribute("uv")	
				let  col = geom.getAttribute("color")		
				const inv = this.insock.get('vertex').getval()
				const inn = this.insock.get('normal').getval()
				const inu = this.insock.get('uv').getval()
				const icol = this.insock.get('color').getval()
				if(icol && !col) {
					const isize = icol[0].length 
					col = new THREE.Float32BufferAttribute(new Float32Array(pos.count*isize),isize)
					col.setUsage(THREE.DynamicDrawUsage)
					geom.setAttribute("color",col)
					mesh.material.vertexColors = true 
					if(isize==4) mesh.material.transparent = true 
				}
				
				let aidx = 0 
				let uidx = 0
				let cidx = 0
				const parray = pos.array 
				const narray = norm!==undefined?norm.array:null
				const uarray = uv!==undefined?uv.array:null
				const carray = col!==undefined?col.array:null

				for(let i=0;i<pos.count;i++) {
					if(inv && parray) {
						const v = inv[i]
//						console.log(v)
						parray[aidx] = v[0]
						parray[aidx+1] = v[1]
						parray[aidx+2] = v[2]					
					}
					if(inn && narray) {
						const n = inn[i]
//						console.log(n)
						narray[aidx] = n[0]
						narray[aidx+1] = n[1]
						narray[aidx+2] = n[2]
					}
					if(inu && uarray) {
						const u = inu[i]
//						console.log(u)
						uarray[uidx] = u[0]
						uarray[uidx+1] = u[1]	
						uidx += uv.itemSize 			
					}
					if(icol && carray) {
						const n = icol[i]
//						console.log(n)
						carray[cidx] = n[0]
						carray[cidx+1] = n[1]
						carray[cidx+2] = n[2]		
						if(n[3]!==undefined) carray[cidx+3] = n[3]	
						cidx += col.itemSize				
					}
					aidx += pos.itemSize 
				}
				if(inv) {
					pos.needsUpdate = true
					pos.setUsage(THREE.DynamicDrawUsage)
				}
				if(inn && norm) {
					norm.needsUpdate = true
					norm.setUsage(THREE.DynamicDrawUsage)
				}
				if(inu && uv) {
					uv.needsUpdate = true
					uv.setUsage(THREE.DynamicDrawUsage)
				}
				if(icol && col) {
					col.needsUpdate = true
				}
				if(!inn && inv) geom.computeVertexNormals()
				this.result.setval(mesh)
			}	
		}
	)


	GNode.registerNode("Hub",
		function(param) {
			this.nodetype = "Hub"
			this.insock.set('in', new GNode.Socket('in',"I",this,"in","any"))
			this.outsock.set('out', new GNode.Socket('out',"O",this,"out","any"))
			this.result = this.outsock.get('out')
		},
		{
			"eval":function() {
				this.result.setval(this.insock.get('in').getval())
			}
		}
	)
	
		GNode.registerNode("Wireframe",
		function(param={}) {
			this.nodetype = "Wireframe"
			this.param = param 
			if(this.param.line==undefined) this.param.line = 1 
			if(this.param.color==undefined) this.param.color = "#fff"
			this.insock.set('mesh', new GNode.Socket('mesh',"mesh",this,"in","mesh"))
			this.outsock.set('mesh', new GNode.Socket('mesh',"mesh",this,"out","mesh"))
			this.result = this.outsock.get('mesh') 
				this.material = new THREE.LineBasicMaterial( {
					color: new THREE.Color( this.param.color) ,
					linewidth: parseInt(this.param.line),
					linecap: 'round', //ignored by WebGLRenderer
					linejoin:  'round' //ignored by WebGLRenderer
				})
		},
		{
			"eval":function() {	
				if(this.wireframe) this.wireframe.dispose()
				this.wireframe = new THREE.WireframeGeometry( this.insock.get('mesh').getval(true).geometry );
				const line = new THREE.LineSegments( this.wireframe,this.material )
				this.outsock.get('mesh').setval(line)
			},
			"setui":function() {
				const cb = (ev)=>{
					if(ev.key=="color") this.param.color = ev.value 
					if(ev.key=="line") this.param.line = ev.value 
				}
				return[
					{name:"line",caption:"lsize",type:"number",size:3,value:this.param.line,callback:cb},
					{name:"color",caption:"color",type:"input",size:5,value:this.param.color,callback:cb},
					]
			}
		}
	)
		
	GNode.registerNode("Switch",
		function(param={}) {
			this.nodetype = "Switch"
			if(!param.select) param.select = 1
			this.param = param
			this.insock.set('in1', new GNode.Socket('in1',"I1",this,"in","any"))
			this.insock.set('in2', new GNode.Socket('in2',"I2",this,"in","any"))
			this.insock.set('in3', new GNode.Socket('in3',"I3",this,"in","any"))
			this.insock.set('in4', new GNode.Socket('in4',"I4",this,"in","any"))
//			this.insock.set('sw', new GNode.Socket('sw',"SW",this,"in","scalar"))
			this.outsock.set('out', new GNode.Socket('out',"O",this,"out","any"))
			this.result = this.outsock.get('out')
			this.num = this.param.select 
		},
		{
			"eval":function() {
//			const in = floor(this.insock.get('sw').getval())
				this.result.setval(this.insock.get('in'+this.num).getval())
			},
			setui:function() {
				const cb = (e)=> {
					this.num = e.value 
					if(this.param) this.param.select = e.value 
				}
				return [{name:"select",type:"range",caption:"select", min:1,max:4,step:4,value:this.param.select,callback:cb}]
			}
		}
	)
	GNode.registerNode("Inspect",
		function(param) {
			this.nodetype = "Inspect"
			this.insock.set('in', new GNode.Socket('in',"I",this,"in","any"))
			this.outsock.set('out', new GNode.Socket('out',"O",this,"out","any"))
			this.result = this.outsock.get('out')
			this.active = false
		},
		{
			"eval":function() {
				const ins = this.insock.get('in').getval()
				this.result.setval(ins)
				if(!this.active) return ;
				if(!this.dom) return ;
				let l = []
				l.push("count:"+ins.length)
//				console.log(ins)
				ins.forEach((o,i)=>
					{
						let r 
						if(Array.isArray(o)) r = `${i}:[`+o.map(v=>trunc(v)).join(",")+"]"
						else r = `${i}:`+trunc(o)
						l.push(r)
					}
				)
				this.dom.value = l.join("\n")
				function trunc(a){
					let ret 
					if(typeof a == 'object') ret = '{'+((a.type)?a.type:"object")+"}"
					else {
						if(Math.abs(a)<0.00001) a= 0
						ret = a.toString().substr(0,6)
					}
					return ret 
					}
			},
			setui:function() {
				this.dom = document.createElement('textarea')
				this.dom.rows = 10 
				this.dom.cols = 26
				const cb = (e)=>{
					this.active = e.value.checked
				}
				return [
					{name:"active",caption:"active",type:"checkbox",checked:this.active,callback:cb},
				{name:"val",caption:"",type:"dom",dom:this.dom}]
				
			}
		}
	)
}

