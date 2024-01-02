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
			{disp:"Math(nl)",id:"Math_nl"},
			{disp:"Latch",id:"Latch"},
			{disp:"Mesh",id:"Mesh"},
			{disp:"Material",id:"Material"},
			{disp:"CreateInstance",id:"Instance"},
			{disp:"InstanceMatrix",id:"InstMatrix"},
			{disp:"InstanceColor",id:"InstColor"},
			{disp:"MeshMatrix",id:"MeshMatrix"},
			{disp:"MeshGroup",id:"MeshGroup"},
			{disp:"MergeMesh",id:"MergeMesh"},
			{disp:"GeometryVertex",id:"GeometryVertex"},
			{disp:"Wireframe",id:"Wireframe"},
			{disp:"Hub",id:"Hub"},
			{disp:"Switch",id:"Switch"},
			{disp:"Output",id:"Output"},
			{disp:"Inspect",id:"Inspect"}	
		]	
	})
}
// load and create new nodethree 
loaddata(data,ntree) {
	this.joints = []
	this.position = {}
	this.nodeedit.clear()	
	if(data.pos ) this.position = data.pos  
	this.setntree(ntree)
}
getsavedata() {
	const nd = this.ntree.serialize()
	return {gnode:"0.1",pos:this.position,nodes:nd} 	
}
reload(ntree) {
	this.nodeedit.clear()
	this.setntree(ntree)
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
	if(!this.ntree) this.ntree = GNode.mknode(null)
	const newnode = {
		"Value":{
			nodetype:"Value",
			param:{value:0}
		},
		"Input":{
			nodetype:"Input",
			param:{
				input:[{id:"result",caption:"result",value:0,min:0,max:1}]
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
		"Math_nl":{
			nodetype:"Math",
			param:{
				noloop:true,
				input:[{id:"a",type:"scalar"},{id:"b",type:"scalar"},{id:"c",type:"scalar"},{id:"d",type:"scalar"}],
				output:[{id:"A",type:"vec3",value:["0","0","0"]},
							{id:"B",type:"vec3",value:["0","0","0"]},
						{id:"C",type:"vec3",value:["0","0","0"]},
					{id:"D",type:"vec3",value:["0","0","0"]}]
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
		"MergeMesh":{nodetype:"MergeMesh",param:{evalonce:true}},
		"GeometryVertex":{nodetype:"GeometryVertex"},
		"Wireframe":{nodetype:"Wireframe"},
		"Hub":{nodetype:"Hub"},
		"Switch":{nodetype:"Switch"},
		"Inspect":{nodetype:"Inspect"},
		"AFEntity":{nodetype:"AFEntity",param:{query:"",evalonce:true}}
	}
	this.nc++
	let id = "node"+this.nc
	while(this.ntree.getnode(id)) {
		this.nc++ 
		id = "node"+this.nc 
	}
	let nodeparam = newnode[type]
	if(!nodeparam) nodeparam = {"nodetype":type}
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
