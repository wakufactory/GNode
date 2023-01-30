
//***************
// node library definition
GNode.regist = function(THREE) {
	GNode.registerNode("Mesh",
		function(param={}){
			this.nodetype = "Mesh"
			this.param = param 
			this.shape = param.shape 
			if(!this.shape) this.shape ="cube"
			this.insock.set('material', new GNode.Socket('material',"material",this,"in","material"))
			this.outsock.set('mesh', new GNode.Socket('mesh',"mesh",this,"out","mesh"))
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
					const radius = (param.radius===undefined)?1:param.radius 
					const segment = (param.segment===undefined)?32:param.segment 
					let height = (param.height===undefined)?radius*2:param.height
					switch(this.shape) {
						case "plane":
							geometry = new THREE.PlaneGeometry( radius, radius );
							break ;
						case "sphere":
							geometry = new THREE.SphereGeometry( radius,segment,segment/2 );
							break ;
						case "cube":
							geometry = new THREE.BoxGeometry( radius,radius,radius );
							break 
						case "cone":
							let cheight = radius*2
							if(param.height!==undefined) rtop = param.height
							geometry = new THREE.ConeGeometry(radius,cheight,segment)
							break;
						case "cylinder":
							let rtop = radius
							let rbot = radius
							if(param.radiustop!==undefined) rtop = param.radiustop
							if(param.radiusbottom!==undefined) rbot = param.radiusbottom
							geometry = new THREE.CylinderGeometry(rtop,rbot,height,segment)
							break
						case "capsule":
							geometry = new THREE.CapsuleGeometry(radius,height,4,segment)					
							break ;
						case "torus":
							let tube = 0.2 
							let tubeseg = 64
							if(param.tuberatio!==undefined) tube = param.tuberatio
							if(param.tubeseg!==undefined) tubeseg = param.tubeseg
							geometry = new THREE.TorusGeometry(radius,radius*tube,segment,tubeseg)
							break
						case "icosa":
							geometry = new THREE.IcosahedronGeometry(radius)
							break 
						case "octa":
							geometry = new THREE.OctahedronGeometry(radius)
							break
						case "dodeca":
							geometry = new THREE.DodecahedronGeometry(radius)
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
					}

				}
				const p = [
					{name:"type",caption:"shape",type:"select",select:[
						{name:"plane",value:"plane"},
						{name:"cube",value:"cube"},
						{name:"sphere",value:"sphere"},
						{name:"cone",value:"cone"},
						{name:"cylinder",value:"cylinder"},
//						{name:"capsule",value:"capsule"},
						{name:"torus",value:"torus"},
						{name:"icosa",value:"icosa"},
						{name:"octa",value:"octa"},
						{name:"dodeca",value:"dodeca"}
						],value:this.param.shape,callback:cb},
					{name:"radius",caption:"size",type:"number",size:5,value:this.param.radius,callback:cb}
				]
				return p 
			}
		}
	)
	GNode.registerNode("Material",
		function(param={}) {
			this.nodetype = "Material"
			this.param = param 
			if(!this.param.roughness)this.param.roughness=0.5
			if(!this.param.metalness)this.param.metalness=0.5
			if(!this.param.color)this.param.color="#fff"
			if(!this.param.opacity)this.param.opacity=1
			if(!this.param.side)this.param.side=THREE.FrontSide
			this.outsock.set('material', new GNode.Socket('material',"material",this,"out","material"))
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
					],value:this.param.side}
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
					this.setval(e.key,e.value/100)
				}
				const p = []
				for(let k of this.input) {
					const max = (k.max===undefined)?1:k.max
					p.push({name:k.id,type:"range",caption:k.caption, min:0,max:100,value:k.value/max*100,callback:cb})
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
					this.eval()
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
		},
		{
			"eval":function() {
				const mtx = new THREE.Matrix4() 
				const mtx1 = new THREE.Matrix4()
				const mtx2 = new THREE.Matrix4()
				const mtx3 = new THREE.Matrix4()
				
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
					mtx.copy(get(bmtx,i))
					if(ins) {
						let  sc = get(ins,i)
						sc = Array.isArray(sc)?sc:[sc,sc,sc]
						mtx.premultiply(mtx3.makeScale(...sc))
					}
					if(ine) {
						mtx.premultiply(mtx1.makeRotationFromEuler(new THREE.Euler(...get(ine,i))))
					}
					if(inq) {
						mtx.premultiply(mtx1.makeRotationFromQuaternion (new THREE.Quaternion(...get(inq,i))))
					}
					if(intr) {
						mtx.premultiply(mtx2.makeTranslation(...get(intr,i)))
					}
					ini.setMatrixAt( i, mtx )
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
					if(rgb) col.setRGB(...(rgb[i]))
					else if(hsl) col.setHSL(...(hsl[i]))
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
			this.lastdata = [] 
			for(let n of param.input) {
				this.insock.set(n.id, new GNode.Socket(n.id,n.id,this,"in",n.type)	)
			}

			const output = []
			const result = [] 
			for(let n of param.output) {
				let code = n.value
				if(Array.isArray(code)) {
					code = "["+code.join(",")+"]"
				}
				output.push( `__c = ${code} ; if(__c!==null) __result['${n.id}'].push( __c );`) 
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
				const [PI,PI2,RAD,DEG,Time,sin,cos,tan,atan2,random,floor,ceil,fract,pow,sqrt,hypot,abs,sign,min,max,mix,clamp,step,smoothstep,noise]=
					[Math.PI,Math.PI*2,Math.PI/180,180/Math.PI,allinput.__time,Math.sin,Math.cos,Math.tan,Math.atan2,Math.random,Math.floor,Math.ceil,(a)=>a-Math.floor(x),Math.pow,Math.sqrt,Math.hypot,Math.abs,Math.sign,Math.min,Math.max,(x,y,a)=>x(1-a)+y*a,(x,a,b)=>Math.min(Math.max(x, a), b),(a,x)=>(x<a)?0:1,(e0,e1,x)=>{let xx=(x-e0)/(e1-e0);xx=Math.max(0,Math.min(1,xx));return xx*xx*(3-2*xx)},GNode.noise]
				function getidx(n,i) {
					let v = allinput[n]
					if(Array.isArray(v)) v = (v.length<__ic)?v[i%v.length]:v[i]
					let ret = v 
					if(Array.isArray(v)) {
						ret = {x:v[0],y:v[1]}
						if(v.length>2) ret.z = v[2]
						if(v.length>3) ret.w = v[3]
					}
					return ret
				}
				let __result = {${result.join(",")}}
				let __c ;
				${initcode}
				for(let index=0;index<__ic;index++) {
					{
							${args.join("\n")}
							${precode};
							${output.join("\n")}
					}
				}
				return __result 
			`
			try{
				this.func = new Function("__ic","allinput","lastdata",fc)
			} catch(err){ 
				this.err = err 
				this.func = null
//				throw("math function "+err)
			}
		},{
			eval:function(time) {
				if(this.func===null) {
					throw("math init "+this.err)
					return 
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
					const ret = (this.func)(ic==0?1:ic,this.allinput,this.lastdata)
					for(let o in ret) {	
						let out 
						if(ic==0) out = ret[o][0]
						else {out = ret[o] }
						this.outsock.get(o).setval(out)
					}
				}catch(err){throw("math runtime "+err)}
			},
			setui:function() {
				const ret = [] 
				const o = this.param.output.find(o=>o.id=="result") 
				if(o.type=="scalar")
					ret.push(
						{caption:"",type:"input",size:20,value:o.value,
							callback:(e)=>o.value =e.value })
				else {
					ret.push(
							{caption:"x",type:"input",size:20,value:o.value[0],
								callback:(e)=>o.value[0]=e.value})
					ret.push(
							{caption:"y",type:"input",size:20,value:o.value[1],
								callback:(e)=>o.value[1]=e.value})
					if(o.type=="vec3"||o.type=="vec4")
						ret.push(
							{caption:"z",type:"input",size:20,value:o.value[2],
								callback:(e)=>o.value[2]=e.value})
					if(o.type=="vec4")
						ret.push(
							{caption:"w",type:"input",size:20,value:o.value[3],
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
			this.insock.set('input', new GNode.Socket('input',"input",this,"in","any",true))
			this.insock.set('initial', new GNode.Socket('initial',"initial",this,"in","any"))
			this.outsock.set('result', new GNode.Socket('result',"result",this,"out","any"))
			this.result = this.outsock.get('result')
			this.vstack = null
		},
		{
			"eval":function(v) {
				let out 
				if(this.vstack!==null) out = this.vstack.map(a=>{return Array.isArray(a)?Array(...a):a})
				else {
					if(this.insock.get('initial').value) {
						out =this.insock.get('initial').value	
					}	
					else out = this.type=="vec3"?[[0,0,0]]:[0] 			
				}
				this.outsock.get('result').value = out
			},
			"posteval":function() {
				if(!this.joints.input) return 
				const v = this.joints.input?.value
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
			this.insock.set('mesh', new GNode.Socket('mesh',"mesh",this,"in","instance"))
			this.insock.set('scale', new GNode.Socket('scale',"scale",this,"in","vec3"))
			this.insock.set('euler', new GNode.Socket('euler',"euler",this,"in","vec3"))
			this.insock.set('matrix', new GNode.Socket('matrix',"matrix",this,"in","mat4"))
			this.insock.set('translate', new GNode.Socket('translate',"translate",this,"in","vec3"))
			this.outsock.set('mesh', new GNode.Socket('mesh',"mesh",this,"out","instance"))
			this.result = this.outsock.get('mesh') 
		},
		{
			"eval":function() {
				const mtx = new THREE.Matrix4() 
				const mtx1 = new THREE.Matrix4()
				const mtx2 = new THREE.Matrix4()
				const mtx3 = new THREE.Matrix4()
				
				let ini = this.insock.get('mesh').getval(true)
				let bmtx = this.insock.get('matrix').getval(true)
				if(bmtx===null) bmtx = new THREE.Matrix4() 
				const ins = this.insock.get('scale').getval(true)
				const ine = this.insock.get('euler').getval(true)
				const intr = this.insock.get('translate').getval(true)
		
					if(ins) {
						const sc = Array.isArray(ins)?ins:[ins,ins,ins]
						ini.scale.copy(new THREE.Vector3(...sc))
					}
					if(ine) {
						ini.setRotationFromEuler(new THREE.Euler(...ine))
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
			this.outsock.set('mesh', new GNode.Socket('mesh1',"mesh",this,"out","mesh"))
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
	GNode.registerNode("Hub",
		function(param) {
			this.nodetype = "Hub"
			this.insock.set('in', new GNode.Socket('in',"I",this,"in","mesh"))
			this.outsock.set('out', new GNode.Socket('out',"O",this,"out","mesh"))
			this.result = this.outsock.get('out')
		},
		{
			"eval":function() {
				this.result.setval(this.insock.get('in').getval())
			}
		}
	)
	GNode.registerNode("Inspect",
		function(param) {
			this.nodetype = "Inspect"
			this.insock.set('in', new GNode.Socket('in',"I",this,"in","mesh"))
			this.outsock.set('out', new GNode.Socket('out',"O",this,"out","mesh"))
			this.result = this.outsock.get('out')
		},
		{
			"eval":function() {
				const ins = this.insock.get('in').getval()
				this.result.setval(ins)
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
					else ret = a.toString().substr(0,5)
					return ret 
					}
			},
			setui:function() {
				this.dom = document.createElement('textarea')
				this.dom.rows = 10 
				this.dom.cols = 25 
				return [{name:"val",caption:"",type:"dom",dom:this.dom}]
				
			}
		}
	)
}

