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
		GNode.emsg = (`node init error at ${id}(${type}): ${err}`)
		return null 
	}
	n.id = id 
/*
	if(param && param.default) {
		for(let v in param.default) {
			n.insock.get(v).setval(param.default[v])
		}
	}
*/
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
		this.insock = new Map() // ::socket
		this.outsock = new Map() // ::socket
		this.joints = {}
		this.evaled = null
		this.doeval = true 
		this.evalonce = false 
		this.evaltrig = false
		if(param) {
			this.param = param 
			if(param.evalonce!==undefined) this.evalonce = param.evalonce 
		}
		this.insock.set("_eval",new GNode.Socket("_eval","_eval",this,"in","bool"))
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
		//_eval input for trig
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
	for(let [n,ins] of this.insock) {
//		console.log("get sock ",n)
//		const ins = this.insock[n]
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
GNode.Socket =function(id,name,parent,dir="out",type= "scalar",delayed=false) {
		this.id = id 
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
		if( val!==null) {
			if(this.type.match(/^vec/)) {if(!Array.isArray(val[0])) val = [val]}
			else if(!Array.isArray(val)) val = [val]
		}
		this.value = val
	}
GNode.Socket.prototype.getval = function(sf=false) {
	
		return sf?(this.value===null?null:this.value[0]):this.value 
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
	for(let [s,v] of node.insock) {
		this.removejoint([sid,s])
	}
	delete this.nodes[id]
}
GNode.Nodetree.prototype.jointnode = function(in_id,out_id) {
//	console.log(in_id,out_id)
	const node = this.getnode(in_id[0])
	const insock = node.insock.get(in_id[1])
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
			rr.joint[j] = js.parent.id+"."+j	
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
		this.nodes[jn[0]].obj.outsock.get(jn[1]) 
	if(jo===undefined) {
		GNode.emsg = "joint error at "+this.nodes[jn[0]].id+": "+jn[0]+"."+jn[1]
		return null
	} 				
	return jo
}
// eval node tree
GNode.Nodetree.prototype.eval = function(nodeid) {
	const result = [] 
	const time = new Date().getTime() - this.timestart 
	for(let n in this.nodes) {
		const node = this.nodes[n].obj
		if(node.nodetype=="Output") {
			if(nodeid!="" && node.id!=nodeid) continue 
			try{
				node._eval(time)
			}catch(err) {		//catch runtime error
				GNode.emsg = err 
				return null 
			} 
			if(node.result.value!=null) {
				result.push(node.result.value)
			}
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

