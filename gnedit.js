// node mesh component
AFRAME.registerSystem('nodemesh',{
	init:function() {
		this.entry = new Map() 
	},
	regist:function(compo,p) {
		this.entry.set(compo,{'param':p})
//		console.log(this.entry)
	},
	unregist:function(compo) {
		this.entry.delete(compo) 
	},
	setdata:function(data) {
//		console.log(data)
		this.data = data 
		let ret = null 
		for(let [e,p] of this.entry) {
			let ntree = GNode.mknode(data) 
			if(ntree) ret = ntree 
			else return ret
			e.setnode(ret)
		}
		return ret 
	}
})
AFRAME.registerComponent('nodemesh',{
	schema:{
		nodeid:{default:""}
	},
	init:function() {
		this.mesh = null
		this.system.regist(this)
	},
	setnode:function(ntree) {
		this.remove(false)
		this.ntree = ntree 
		if(this.ntree ===null) {
			console.log("Error "+GNode.emsg)
			return false
		}
		this.mesh = this.ntree.eval(this.data.nodeid)	//eval node
		console.log(this.mesh)
		if(this.mesh===null) {
			if(typeof POXA !== 'undefined')POXA.log(GNode.emsg)
			if(typeof error !== 'undefined') error(GNode.emsg)
			return false 
		}
		for(let i=0;i<this.mesh.length;i++) {
			this.el.object3D.add(this.mesh[i])			//add mesh to scene
		}
		return true 
	},
	update:function(old) {
	},
	remove:function(f=true) {
		if(this.mesh==null) return 
		for(let i=0;i<this.mesh.length;i++)
			this.el.object3D.remove(this.mesh[i])			//remove from scene	
		this.mesh = null 
		this.ntree = null 
		if(f) this.system.unregist(this)
	},
	tick:function(time,dur) {
		if(this.mesh===null || this.ntree===null) return 
		if(this.ntree.eval(this.data.nodeid)===null) {		//eval node per frame
			if(typeof POXA !== 'undefined')POXA.log(GNode.emsg)
			if(typeof error !== 'undefined') error(GNode.emsg)
		}
	}
})

// bridget GNode to NEdit 
class GNEdit {
constructor(base) {	
	this.ntree = null 
	this.joints = [] 
	this.nc = 0
	this.position = {}
	this.nodeedit = new NEdit(this,base)
	
	this.nodeedit.setcmenu({
		title:"AddNode",item:[
			{disp:"Value",id:"Value"},
			{disp:"Input",id:"Input"},
			{disp:"AFEntity",id:"AFEntity"},
			{disp:"Math(s)",id:"Math_s"},
			{disp:"Math(v3)",id:"Math_v3"},
			{disp:"Math(v4)",id:"Math_v4"},
			{disp:"Latch",id:"Latch"},
			{disp:"Mesh",id:"Mesh"},
			{disp:"Material",id:"Material"},
			{disp:"CreateInstance",id:"Instance"},
			{disp:"InstanceMatrix",id:"InstMatrix"},
			{disp:"InstanceColor",id:"InstColor"},
			{disp:"MeshMatrix",id:"MeshMatrix"},
			{disp:"MeshGroup",id:"MeshGroup"},
			{disp:"Hub",id:"Hub"},
			{disp:"Output",id:"Output"},
			{disp:"Inspect",id:"Inspect"}	
		]	
	})
}
// load and create new nodethree 
loaddata(data) {
	this.joints = []
	this.position = {}
	this.nodeedit.clear()	
	const pos = data.pos 
	
	// for back compati
	data.nodes.forEach(n=>{
		if(n.param && n.param.input && !Array.isArray(n.param.input)) {
			const a = []
			for(let k in n.param.input) {
				const p = n.param.input[k]
				p.id = k 
				a.push(p)
			} 
			n.param.input = a 
		}
		if(n.param && n.param.output && !Array.isArray(n.param.output)) {
			const a = []
			for(let k in n.param.output) {
				const p = n.param.output[k]
				p.id = k 
				a.push(p)
			} 
			n.param.output = a 
		}
	})
	let ret = document.querySelector('a-scene').systems.nodemesh.setdata(data.nodes)
	if(ret) this.ntree = ret 
	else {
		POXA.log(GNode.emsg)
		return 
	}
	if(pos) this.position = pos 
	this.setntree(this.ntree)
	console.log(this)	
	
}
getsavedata() {
		const nd = this.ntree.serialize()
		return {gnode:"0.1",pos:this.position,nodes:nd} 	
}
reload() {
	const nd = this.ntree.serialize()
	console.log(nd)
	this.nodeedit.clear()
	this.ntree = document.querySelector('a-scene').systems.nodemesh.setdata(nd)
	if(this.ntree==null) {
			console.log(GNode.emsg)
			return false 
	}
	console.log(this.ntree.nodes)
		
	this.setntree(this.ntree)
	return true 
}
//
addnode(node) {
		const n = node
		const nd = {nodetype:n.nodetype,name:n.name,id:n.id,body:[n.name],param:n.param}
		if(n.insock) {
			nd.input = [] 
			for(let [inode,sock] of n.insock) {
				if(inode=="_eval") continue 
				nd.input.push({id:inode,name:sock.name})
			}
		}
		if(n.outsock) {
			nd.output = [] 
			for(let [inode,sock] of n.outsock) {
				nd.output.push({id:inode,name:sock.name})
			}
		}
		if(n.setui) {
			nd.ui = n.setui() 
		}

		const jn = [] 
		for(let j in n.joints) {
			const ins = `${n.id}-i-${j}`
			const tj = n.joints[j] 
			const out = `${tj.parent.id}-o-${tj.id}`
//			console.log(out+":"+ins)
			jn.push([out,ins])
		}
//		console.log(nd)
		return {node:nd,joints:jn}
}
// make node  data for NEdit 
setntree(ntree) {
	this.ntree = ntree 
	const nodedata = ntree.nodes
	const ret = []
	this.joints = []
	for(let id in nodedata) {
		ret.push(this.addnode(nodedata[id].obj))
	}
	let x = 10 ;
	let y = 10 ;
	ret.forEach(n=>{
		let p = [x,y]
		if(this.position && this.position[n.node.id]) p = this.position[n.node.id].pos
		this.nodeedit.addnode(n.node,p)
		n.joints.forEach(j=>{
			this.setjoint(...j)
		})
		x+=50
		y+=50  
	})
	this.drawjoint()
	return ret 
}

//****** call from NEdit 

// add new node 
newnode(type,pos) {
	this.nc++
	const newnode = {
		"Value":{
			nodetype:"Value",
			param:{value:0}
		},
		"Input":{
			nodetype:"Input",
			param:{
				input:[{id:"result",caption:"input",value:0,min:0,max:1}]
			}
		},
		"Math_s":{
			nodetype:"Math",
			param:{
				input:[{id:"a",type:"scalar"},{id:"b",type:"scalar"},{id:"c",type:"scalar"},{id:"d",type:"scalar"}],
				output:[{id:"result",type:"scalar",value:"0"}]
			}
		},
		"Math_v3":{
			nodetype:"Math",
			param:{
				input:[{id:"a",type:"scalar"},{id:"b",type:"scalar"},{id:"c",type:"scalar"},{id:"d",type:"scalar"}],
				output:[{id:"result",type:"vec3",value:["0","0","0"]}]
			}
		},
		"Math_v4":{
			nodetype:"Math",
			param:{
				input:[{id:"a",type:"scalar"},{id:"b",type:"scalar"},{id:"c",type:"scalar"},{id:"d",type:"scalar"}],
				output:[{id:"result",type:"vec4",value:["0","0","0","0"]}]
			}
		},
		"Latch":{nodetype:"Latch",param:{evalonce:false}},
		"Mesh":{nodetype:"Mesh",param:{evalonce:true}},
		"Material":{nodetype:"Material",param:{evalonce:true}},
		"Instance":{nodetype:"CreateInstance",param:{evalonce:true,count:10}},
		"InstMatrix":{nodetype:"InstanceMatrix"},
		"InstColor":{nodetype:"InstanceColor"},
		"Output":{nodetype:"Output"},
		"MeshMatrix":{nodetype:"MeshMatrix"},
		"MeshGroup":{nodetype:"MeshGroup"},
		"Hub":{nodetype:"Hub"},
		"Inspect":{nodetype:"Inspect"},
		"AFEntity":{nodetype:"AFEntity",param:{evalonce:true}}
	}
	let id = "node"+this.nc
	while(this.ntree.getnode(id)) {
		this.nc++ 
		id = "node"+this.nc 
	}
	const nodeparam = newnode[type]
	if(!nodeparam) return 
	nodeparam.id = id 
	nodeparam.name = id 
	console.log(nodeparam)
	const nodes = this.ntree.addnodes([nodeparam])
	if(nodes==null) {
		console.log("node init error "+GNode.emsg)
	}
	console.log(nodes)

	this.nodeedit.addnode(this.addnode(nodes[0]).node,pos)
	this.position[id] = {pos:pos} 
	return id 
}
// duplicate node
duplicatenode(id) {
	
}
setparam(id,param) {
	console.log(id,param)
	for(let k in param) {
		switch( k ){
			case "name":
				this.ntree.nodes[id].obj.name = param[k] 
				break 
			case "evalonce":
				this.ntree.nodes[id].obj.evalonce = param[k]
				this.ntree.nodes[id].obj.param.evalonce = param[k]
				break
		}
	}
	this.reload()
}
// node moved
nodemove(id,pos) {
	this.position[id] = {pos:pos}
}
// joint changed 
setjoint(id1,id2) {
	const j1 = id1.split("-")
	const j2 = id2.split("-")
	if(id1==id2) {
		this.removejoint(id1)
		return 
	}
	if(j1[1]=="i" && j2[1]=="i" || j1[1]=="o" && j2[1]=="o") return

	let j = [id1,id2]
	let jn = [[j2[0],j2[2]],[j1[0],j1[2]]]
	if(j1[1]=="i") {
		j = [id2,id1]
		jn = [[j1[0],j1[2]],[j2[0],j2[2]]]
	}
	this.joints.push(j)
	if(this.ntree.jointnode(...jn)==false)
		console.log("joint error")
}
removejoint(id) {
	this.joints = this.joints.filter(j=>{
		let ret = true 
		if(j[0]==id||j[1]==id)  {
			const sid = j[1].split("-")
			this.ntree.removejoint([sid[0],sid[2]])
			ret = false 
		}
		return ret  
	})
}
// redraw joints
drawjoint() {
	this.nodeedit.drawalljoints(this.joints)
}
deletenode(id) {
	console.log("delet "+id)
	this.ntree.removenode(id)
	this.nodeedit.removenode(id)
	delete this.position[id]
	this.joints = this.joints.filter(j=>{
		let ret = true 
		if(j[0].split("-")[0]==id||j[1].split("-")[0]==id)  {
			ret = false 
		}
		return ret  
	})
	this.drawjoint()
}
}//Node
