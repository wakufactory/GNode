// Geometry node 
// Copyright 2022 wakufactory 
// License:MIT

//export {GNode}
const GNode ={}
GNode.init = function() {
	GNode.Nodes = {}		//all defined nodes
	GNode.nodelist = [] //node instances
}

//create node instance
GNode.createNode = function(type,param,id) {
	let n 
	try {
		n = new GNode.Nodes[type](param)
	} catch(err) {
		GNode.emsg = (`node init error at ${id}: ${err}`)
		return null 
	}
	n.id = id 
	if(param && param.default) {
		for(let v in param.default) {
			n.insock[v].setval(param.default[v])
		}
	}
//	GNode.nodelist.push(n)
	return n 
}
//make node tree from data
GNode.mknode = function(data) {
	const nt = new GNode.Nodetree()
	if(nt.addnodes(data)==null) {
		console.log(GNode.emsg )
	}
	return nt 
}
// clear eval flag
GNode.clearEval = function() {
	for(let i in GNode.nodelist) GNode.nodelist[i].evaled = false 
}
//register new node 
GNode.registerNode = function(type,prot,methods) {
	//constructor function
	let node = function(param) {
		GNode.Node.call(this,param)	//call base constructor
		prot.call(this,param)		//call constructor
		for(let m in methods) {	//add methods
			node.prototype[m] = methods[m] 
		}
	}
	// prototype inherit 
	node.prototype = Object.create(GNode.Node.prototype)
	node.prototype.constructor = GNode.Node
	GNode.Nodes[type] = node 
}


// ******* class Node 
// node base class 
GNode.Node =
	function(param) {
		this.insock = {} // ::socket
		this.outsock = {} // ::socket
		this.joints = {}
		this.evaled = null
		this.doeval = true 
		this.evalonce = false 
		this.evaltrig = false
		if(param) {
			this.param = param 
			if(param.evalonce!==undefined) this.evalonce = param.evalonce 
		}
		this.insock._eval = new GNode.Socket("_eval",this,"in","bool")
	}

// add joint name to socket 
GNode.Node.prototype.addjoint = function(name,socket) {
	if(name) this.joints[name] = socket 
}
// remove joint 
GNode.Node.prototype.removejoint = function(name) {
	if(this.joints[name]) delete this.joints[name]
}
// eval prototype
GNode.Node.prototype.eval = function(time) {
	return true 
}
// eval node
GNode.Node.prototype._eval = function(time) {
		//_eval input 
		if(this.joints && this.joints._eval) {
			const es =  this.joints._eval 
			es.parent._eval()
			if(es.value==true && this.evaltrig==false) {
//				console.log("trig "+this.id)
				this.doeval = true 
			}
			this.evaltrig = es.value 
		}
		// already evaluated 
		if(!this.doeval || this.evaled) {
//			console.log("eval skip "+this.name+" "+this.id)
			return false
		}
//		console.log("eval "+this.name+" "+this.id)
		this.evaled = true 
		if(this.evalonce) this.doeval = false 

		this.getinnode(time)		// get input node data 
		// eval self 
		try {
			if(this.eval) this.eval(time)
		} catch(err) {
			throw(`node eval error at ${this.name}: ${err}`)
			return null 
		}
		return true
	}
// get input values
GNode.Node.prototype.getinnode = function(time) {
	//　scan input node 
	for(let n in this.insock) {
//		console.log("get sock ",n)
		const ins = this.insock[n]
		if(ins===undefined) continue 
		if(ins.delayed) {
//			console.log("deleyed")
			continue
		} 
		const tj = this.joints[n]
		if(tj) {
			if(tj.parent._eval) tj.parent._eval(time) //eval target socket node 
			ins.value = tj.value 			//copy input value to insock
			ins.lastvalue = tj.lastvalue 
		}
	}
}

//******** class Socket
//joint socket class
GNode.Socket =function(name,parent,dir="out",type= "scalar",delayed=false) {
		this.name = name 
		this.dir = dir 
		this.type = type 
		this.value = null 
		this.lastvalue = null 
		this.parent = parent 
		this.delayed = delayed 
		this.joints = [] 
	}
	
GNode.Socket.prototype.setval = function(val) {
		this.lastvalue = this.value 
		this.value = val 
	}
GNode.Socket.prototype.getval = function() {
		return this.value 
	}
GNode.Socket.prototype.setjoint = function(joint) {
		this.joints.push(joint)
	}


//******* class Nodetree
GNode.Nodetree = function() {
	this.timestart = new Date().getTime() 
	this.nodes = {} 
}
GNode.Nodetree.prototype.setnode = function(id,node) {
	this.nodes[id] = {obj:node,id:id}
}
GNode.Nodetree.prototype.setposition = function(id,pos) {
	this.nodes[id].pos = pos
}
GNode.Nodetree.prototype.getnode = function(id) {
	return this.nodes[id]?.obj 
}
GNode.Nodetree.prototype.evalnode = function(id) {
	this.nodes[id].obj.doeval = true
}
GNode.Nodetree.prototype.removenode = function(id) {
	const node = this.getnode(id)
	if(!node) return 
	const sid = node.id 
	for(let s in node.insock) {
		this.removejoint([sid,s])
	}
	delete this.nodes[id]
}
GNode.Nodetree.prototype.jointnode = function(in_id,out_id) {
//	console.log(in_id,out_id)
	const node = this.getnode(in_id[0])
	const insock = node.insock[in_id[1]]
	if(node==null || insock==undefined || insock.dir!="in") return false 
	const sock = this.getjointsock(out_id)
	if(sock==null|| sock.dir!="out") return false 
	node.addjoint(in_id[1],sock)
	return true 
}
GNode.Nodetree.prototype.removejoint = function(in_id) {
	console.log("remove joint "+in_id)
	this.getnode(in_id[0])?.removejoint(in_id[1])
}
// addnodes from data
GNode.Nodetree.prototype.addnodes = function(data) {
	// create nodes
	const nodes = []
	for(let i=0;i<data.length;i++) {
		const n = data[i]
		const ni = GNode.createNode(n.nodetype,n.param,n.id)
		if(!ni) {
			console.log("node init err "+GNode.emsg)
//			continue
		}
		ni.name = n.name 
		nodes.push(ni)
		this.setnode(ni.id,ni) 
	}
	// add joints
	for(let i=0;i<data.length;i++) {
		if(!data[i].joint) continue 
		const jo = data[i].joint 
		const node = this.getnode(data[i].id) 
		for(let j in jo) {
			if(!this.jointnode([data[i].id,j],jo[j].split("."))) {
				console.log("joint error "+jo[i])
			}
		}
	}
	return nodes 
}
// serialize nodes
GNode.Nodetree.prototype.serialize = function() {
	let r = [] 
	for(let id in this.nodes) {
		const node = this.nodes[id].obj
		const rr = {id:id,nodetype:node.nodetype,name:node.name,param:node.param}
		if(!rr.param) rr.param = {}
		if(node.evalonce) rr.param.evalonce = true 
		rr.joint = {}
		for(let j in node.joints) {
			const js = node.joints[j]
			rr.joint[j] = js.parent.id+"."+js.name	
		}
		r.push(rr)
	}
	return r 
} 

//get target socket jn:[id,name]
GNode.Nodetree.prototype.getjointsock = function(jn) {
	let jo
	if(this.nodes[jn[0]]==undefined) {
		GNode.emsg = "joint error at "+jn
		return null 
	}
	else jo = (jn[1]=="result" && this.nodes[jn[0]].obj.result)?
		this.nodes[jn[0]].obj.result:
		this.nodes[jn[0]].obj.outsock[jn[1]] 
	if(jo===undefined) {
		GNode.emsg = "joint error at "+this.nodes[jn[0]].id+": "+jn[0]+"."+jn[1]
		return null
	} 				
	return jo
}
// eval node tree
GNode.Nodetree.prototype.eval = function() {
	const result = [] 
	const time = new Date().getTime() - this.timestart 
	for(let n in this.nodes) {
		const node = this.nodes[n].obj
		if(node.nodetype=="Output") {
			try{
				node._eval(time)
			}catch(err) {		//catch runtime error
				GNode.emsg = err 
				return null 
			} 
			if(node.result.value!=null) result.push(node.result.value)
		}
	}
	for(let n in this.nodes) {
		const node = this.nodes[n].obj	
		if(node.posteval) {
			node.posteval() 
		}
		node.evaled = false 
	}
	for(let i=0;i<result.length;i++) {
		if(result[i].instanceMatrix) result[i].instanceMatrix.needsUpdate = true;
		if(result[i].instanceColor) result[i].instanceColor.needsUpdate = true;
	}
	return result 
}

//***************
// utils
GNode.noise = function(u,v) {
	function random(u,v){
		const s = Math.sin(u*12.9898+v*78.233) * 43758.5453
		return s-Math.floor(s)
	}
	function interpolation(f){
		return f * f * (3.0 - 2.0 * f)
//	return f * f * f * (f * (6.0 * f - 15.0) + 10.0);
	}
	function mix(a,b,r) {return a*(1-r)+b*r }

    const pv = [Math.floor(u),Math.floor(v)] ;
    const pd = [u-pv[0],v-pv[1]]

    const px  = pv[0] ;
    const px1 = pv[0]+1. ;
    const r1 = random(px, pv[1]) ;
    const r2 = random(px1,pv[1]) ;
    const r3 = random(px ,pv[1]+1) ;
    const r4 = random(px1,pv[1]+1) ;
    const r = mix(mix(r1,r2,interpolation(pd[0])),mix(r3,r4,interpolation(pd[0])),interpolation(pd[1])) ;
    return r; 
}


//***************
// node library definition
GNode.regist = function(THREE) {
	GNode.registerNode("Mesh",
		function(param={}){
			this.nodetype = "Mesh"
			this.param = param 
			this.shape = param.shape 
			if(!this.shape) this.shape ="cube"
			this.insock['material'] = new GNode.Socket("material",this,"in","material")
			this.outsock['mesh'] = new GNode.Socket("mesh",this,"out","mesh")
			this.result = this.outsock.mesh
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
				let material = this.insock.material.getval()
				if(material==null) material = new THREE.MeshStandardMaterial( { color: 0xffffff } );
				mesh = new THREE.Mesh( geometry, material );
				}
				this.result.setval(mesh)				
			},
			"setui":function() {
				const cb = (e) => {
					this.param.shape = e.value	
					this.shape = this.param.shape 
				}
				const p = [
					{name:"type",caption:"shape",type:"select",select:[
						{name:"cube",value:"cube"},
						{name:"sphere",value:"sphere"},
						{name:"cone",value:"cone"},
						{name:"cylinder",value:"cylinder"},
//						{name:"capsule",value:"capsule"},
						{name:"torus",value:"torus"},
						{name:"icosa",value:"icosa"},
						{name:"octa",value:"octa"},
						{name:"dodeca",value:"dodeca"}
						],value:this.param.shape,callback:cb}
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
			
			this.outsock['material'] = new GNode.Socket("material",this,"out","material")
		},
		{
			"eval":function() {
				this.material =  new THREE.MeshStandardMaterial( { color: 0xffffff,roughness:this.param.roughness,metalness:this.param.metalness } );
				this.outsock.material.setval(this.material)
			},
			"setui":function() {
				const cb = (e) => {
					console.log(e)
					if(e.key=="roughness") {
						this.material.roughness = e.value 
						this.param.roughness = e.value 
					}
					if(e.key=="metalness") {
						this.material.metalness = e.value 
						this.param.metalness = e.value
					}
				}
				const p = [
					{name:"roughness",callback:cb,caption:"R",type:"range",min:0,max:1,value:this.param.roughness},
					{name:"metalness",callback:cb,caption:"M",type:"range",min:0,max:1,value:this.param.metalness}
				]
				return p
			}
		}
	)

	GNode.registerNode("Value",
		function(param){
			this.nodetype = "Value"
			this.value = param.value 
			this.outsock['result'] = new GNode.Socket("result",this,"out","scalar")
			this.outsock.result.setval(this.value) 
			this.result = this.outsock.result
		},
		{
			"setval":function(v) {
				this.value = v
				this.param.value = v 
				this.outsock.result.setval(this.value)  
			},
			"eval":function(v) {
				this.outsock.result.setval(this.value)  
			},
			"setui":function() {
				const cb =  e=>{
					this.setval(e.value)
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
			this.outsock['result'] = new GNode.Socket("result",this,"out","scalar")
			this.outsock['delta'] = new GNode.Socket("delta",this,"out","scalar")
			this.result = this.outsock.result
		},
		{
			"eval":function() {
				const v = (new Date().getTime() - this.stime )
				this.outsock.result.setval(v)
				this.outsock.delta.setval(v-this.dtime)
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
			for(let k in this.input) {
				this.outsock[k] = new GNode.Socket(k,this,"out","scalar")
				this.value[k] = this.input[k].value
				this.outsock[k].setval(this.value[k])
			}
			this.output = {} 
		},{
			eval:function() {
			},
			"setval":function(key,v) {
				this.value[key] = v 
				this.input[key].value = v 
				this.outsock[key].setval(v)
			},
			"setui":function() {
				const cb = e=>{
					this.setval(e.key,e.value/100)
				}
				const p = []
				for(let k in this.input) {
					const max = (this.input[k].max===undefined)?1:this.input[k].max
					p.push({name:k,type:"range",caption:this.input[k].caption, min:0,max:100,value:this.input[k].value/max*100,callback:cb})
				}
				return p 
			}
		}
	)

	GNode.registerNode("CreateInstance",
		function(param){
			this.nodetype = "CreateInstance"
			this.insock['mesh'] = new GNode.Socket("mesh",this,"in","mesh")
			this.insock['material'] = new GNode.Socket("material",this,"in","material")
			this.insock['count'] = new GNode.Socket("count",this,"in","scalar")
			this.outsock['instance'] = new GNode.Socket("instance",this,"out","instance")
			this.outsock['index'] = new GNode.Socket("index",this,"out","scalar")
			this.outsock['findex'] = new GNode.Socket("findex",this,"out","scalar")
			this.outsock['count'] = new GNode.Socket("count",this,"out","scalar")
		},{
			"eval":function() {
				const count = this.insock.count.getval()
				const mesh = this.insock.mesh.getval() 
				if(count==0||mesh==null) return 
				let material = this.insock.material.getval()
				if(material==null) material =  mesh.material
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
				this.outsock.count.setval(count)
				this.outsock.instance.setval(inst)
				this.outsock.index.setval(idx)
				this.outsock.findex.setval(iidx)
			}
		}
		)
	GNode.registerNode("InstanceMatrix",
		function(param) {
			this.nodetype = "InstanceMatrix"
			this.insock['instance'] = new GNode.Socket("instance",this,"in","instance")
			this.insock['scale'] = new GNode.Socket("scale",this,"in","vec3")
			this.insock['euler'] = new GNode.Socket("euler",this,"in","vec3")
			this.insock['quaternion'] = new GNode.Socket("quaternion",this,"in","vec4")
			this.insock['translate'] = new GNode.Socket("translate",this,"in","vec3")
			this.insock['matrix'] = new GNode.Socket("matrix",this,"in","mat4")
			this.outsock['instance'] = new GNode.Socket("instance",this,"out","instance")
			this.result = this.outsock['instance'] 
		},
		{
			"eval":function() {
				const mtx = new THREE.Matrix4() 
				const mtx1 = new THREE.Matrix4()
				const mtx2 = new THREE.Matrix4()
				const mtx3 = new THREE.Matrix4()
				
				const ini = this.insock.instance.getval()
				if(ini==null) return 
				let bmtx = this.insock.matrix.getval()
				if(bmtx===null) bmtx = new THREE.Matrix4() 
				const ins = this.insock.scale.getval()
				const ine = this.insock.euler.getval()
				const inq = this.insock.quaternion.getval()
				const intr = this.insock.translate.getval()
				let count = ini.userData.maxcount
				if(ins && ins.length<count) count = ins.length
				if(ine && ine.length<count) count = ine.length
				if(inq && inq.length<count) count = inq.length
				if(intr && intr.length<count) count = intr.length
				if(bmtx && bmtx.length<count) count = bmtx.length
				for(let i=0;i<count;i++) {
					mtx.copy(Array.isArray(bmtx)?bmtx[i]:bmtx)
					if(ins) {
						const sc = Array.isArray(ins)?(Array.isArray(ins[i])?ins[i]:[ins[i],ins[i],ins[i]]):[ins,ins,ins]
						mtx.premultiply(mtx3.makeScale(...sc))
					}
					if(ine) {
						mtx.premultiply(mtx1.makeRotationFromEuler(new THREE.Euler(...ine[i])))
					}
					if(inq) {
						mtx.premultiply(mtx1.makeRotationFromQuaternion (new THREE.Quaternion(...inq[i])))
					}
					if(intr) {
						const tr = (Array.isArray(intr[i])?intr[i]:[intr[i],intr[i],intr[i]])
						mtx.premultiply(mtx2.makeTranslation(...tr))
					}
					ini.setMatrixAt( i, mtx )
				}
				ini.count = count 
				this.result.setval(ini)
			}	
		}
		)
	GNode.registerNode("InstanceColor",
		function(param) {
			this.nodetype = "InstanceColor"
			this.insock['instance'] = new GNode.Socket("instance",this,"in","instance")
			this.insock['rgb'] = new GNode.Socket("rgb",this,"in","vec3")
			this.insock['hsl'] = new GNode.Socket("hsl",this,"in","vec3")
			this.outsock['instance'] = new GNode.Socket("instance",this,"out","instance")
			this.result = this.outsock['instance'] 
		},
		{
			"eval":function() {
				const oi = []
				const ini = this.insock.instance.getval()
				if(ini==null) return 
				const rgb = this.insock.rgb.getval()
				const hsl = this.insock.hsl.getval()
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
			for(let n in param.input) {
				this.insock[n] = new GNode.Socket(n,this,"in",param.input[n].type)	
			}

			const output = []
			const result = [] 
			for(let n in param.output) {
				let code = param.output[n].value
				if(Array.isArray(code)) {
					code = "["+code.join(",")+"]"
				}
				output.push( `__c = ${code} ; if(__c!==null) __result['${n}'].push( __c );`) 
				result.push( `${n}:[]`)
				this.outsock[n] = new GNode.Socket(n,this,"out",param.output[n].type)	
			}
			this.result = this.outsock.result

			const  args = [] 
			for(let n in this.insock) {
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
//				throw("math function "+err
			}
		},{
			eval:function(time) {
				if(this.func===null) {
					throw("math init "+this.err)
					return 
				}
				let ic = 0 
				this.allinput = {"__time":time}
				for(let n in this.insock) {
					const   v = this.insock[n].getval() 
					if(v===null) continue 
					let af = false 
					if(this.insock[n].type=="scalar") {
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
						this.outsock[o].setval(ic==0?ret[o][0]:ret[o])
					}
				}catch(err){throw("math runtime "+err)}
			},
			setui:function() {
				const ret = [] 
				const o = this.param.output.result 
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
			this.insock['scale'] = new GNode.Socket("scale",this,"out","vec3")
			this.insock['matrix'] = new GNode.Socket("matrix",this,"out","mat4")
			this.outsock['matrix'] = new GNode.Socket("matrix",this,"out","mat4")
			this.result = this.outsock['matrix'] 
		},
		{
			eval:function() {
				
			}
		}
	)
	GNode.registerNode("Output",
		function(param){
			this.nodetype="Output"
			this.insock['mesh'] = new GNode.Socket("mesh",this,"in","mesh")
			this.outsock['mesh'] = new GNode.Socket("mesh",this,"out","mesh")
			this.result = this.outsock.mesh
		},
		{
			eval:function() {
				this.outsock.mesh.setval(this.insock.mesh.getval())
			}
		}
	)

	GNode.registerNode("Latch",
		function(param){
			this.nodetype = "Latch"
			this.insock['input'] = new GNode.Socket("input",this,"in","any",true)
			this.outsock['result'] = new GNode.Socket("result",this,"out","any")
			this.result = this.outsock.result
			this.vstack = null
		},
		{
			"eval":function(v) {
				let out = [[0,0,0]] 
				if(this.vstack!==null) out = structuredClone(this.vstack) 
				this.outsock.result.setval(out)
			},
			"posteval":function() {
				this.vstack = structuredClone(this.joints.input.getval())				
			}
		}
		)	
	GNode.registerNode("MeshMatrix",
		function(param) {
			this.nodetype = "MeshMatrix"
			this.insock['mesh'] = new GNode.Socket("mesh",this,"in","instance")
			this.insock['scale'] = new GNode.Socket("scale",this,"in","vec3")
			this.insock['euler'] = new GNode.Socket("euler",this,"in","vec3")
			this.insock['matrix'] = new GNode.Socket("matrix",this,"in","mat4")
			this.insock['translate'] = new GNode.Socket("translate",this,"in","vec3")
			this.outsock['mesh'] = new GNode.Socket("mesh",this,"out","instance")
			this.result = this.outsock['mesh'] 
		},
		{
			"eval":function() {
				const mtx = new THREE.Matrix4() 
				const mtx1 = new THREE.Matrix4()
				const mtx2 = new THREE.Matrix4()
				const mtx3 = new THREE.Matrix4()
				
				let ini = this.insock.mesh.getval()
				let bmtx = this.insock.matrix.getval()
				if(bmtx===null) bmtx = new THREE.Matrix4() 
				const ins = this.insock.scale.getval()
				const ine = this.insock.euler.getval()
				const intr = this.insock.translate.getval()
		
					if(ins) {
						const sc = Array.isArray(ins)?ins:[ins,ins,ins]
						ini.scale.copy(new THREE.Vector3(...ins))
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

}

