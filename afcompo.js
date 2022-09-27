(function() {
// node mesh component
AFRAME.registerComponent('nodemesh',{
	init:function() {
		this.mesh = null
	},
	setnode:function(ntree) {
		this.ntree = ntree 
		if(this.ntree ===null) {
			console.log("Error "+GNode.emsg)
			return false
		}
		
		this.mesh = this.ntree.eval()	//eval node
		if(this.mesh===null) {
			error(GNode.emsg)
			return false 
		}
		console.log(this.mesh)
		for(let i=0;i<this.mesh.length;i++)
			this.el.object3D.add(this.mesh[i])			//add mesh to scene
		return true 
	},
	update:function(old) {
	},
	remove:function() {
		if(this.mesh==null) return 
		for(let i=0;i<this.mesh.length;i++)
			this.el.object3D.remove(this.mesh[i])			//remove from scene	
		this.mesh = null 
		this.ntree = null 	
	},
	tick:function(time,dur) {
		if(this.mesh===null || this.ntree===null) return 
		if(this.ntree.eval()===null) {		//eval node per frame
			error(GNode.emsg)
		}
	},
})
// exit vr by B/Y button 
AFRAME.registerComponent('exitvr', {
	init:function() {
		this.el.addEventListener('bbuttonup',this.exitvr)
		this.el.addEventListener('ybuttonup',this.exitvr)			
	},
	exitvr:function() {
		AFRAME.scenes[0].exitVR()
	}
})
// set VR mode height
AFRAME.registerComponent('vrheight', {
	schema:{
		height:{type:"number",default:1.5}
	},
	init:function() {
		const scene = this.el.sceneEl
		const camrig = this.el 
		if(!camrig) return 
		scene.addEventListener("enter-vr", ev=>{
			const p = camrig.getAttribute("position")
			camrig.setAttribute("position", {x:p.x,y:0,z:p.z})
		})
		scene.addEventListener("exit-vr", ev=>{
			const p = camrig.getAttribute("position")
			camrig.setAttribute("position", {x:p.x,y:this.data.height,z:p.z})	
		})
	}
})
// oclusTouch mover
AFRAME.registerComponent('padmove', {
	schema:{
		gripud:{type:"boolean",default:false},
		gripfly:{type:"boolean",default:false},
		move:{type:"boolean",default:true},
		turn:{type:"boolean",default:true}
	},
	init:function() {
		const data = this.data
		let lastx = 0
		let grip = 0  
		this.el.addEventListener('thumbstickmoved',stick)
		this.el.addEventListener('trackpaddown',stick)
		
		function stick(ev){
//			console.log(ev)
			const stick = ev.detail
			const pm = document.querySelector("[padmoved]")?.components.padmoved 
			if(!pm) return 
			if(data.turn && Math.abs(stick.x)>Math.abs(stick.y)) {
				if(Math.abs(stick.x)>0.6){
					if(lastx == 0) {
						lastx = 1
						pm.rotate(stick.x)
					}
				} else lastx = 0
			}
			if(data.gripud) {
				if(grip && Math.abs(stick.x)<Math.abs(stick.y)) pm.ud(stick.y)
				else pm.ud(0)
			}
			if(data.move && !(data.gripud && grip)) {
				if(data.turn) pm.move({x:0,y:stick.y})
				else pm.move({x:stick.x,y:stick.y})
			}
			if(data.gripfly) pm.data.fly = grip 
		}
		this.el.addEventListener('gripchanged',(ev)=>{
			grip = ev.detail.pressed
		})
	}
})
// touch movee
AFRAME.registerComponent('padmoved', {
	schema: {
		movev:{default:2},
		dirlock:{default:true},
		fly:{default:false}
	},
	init:function() {
	  this.rot = {x:0,y:0,z:0}
		this.cdir = {x:0,y:0,z:0}
		this.pdir = {x:0,y:0}
	  this.velocity = 0
	  this.mode = 0
	  this.camobj = AFRAME.scenes[0].camera.el.object3D
	  this.el.addEventListener('updown',(ev)=>{
		  this.ud(ev.detail.dir)
		})
	},
	rotate:function(dir) {
		this.rot.y += THREE.Math.degToRad( (dir>0)?-30:30 ) ;
		this.el.object3D.rotation.set(this.rot.x,this.rot.y,this.rot.z)
	},
	move:function(dir) {
		this.pdir = dir
		const vl = Math.hypot(dir.x,dir.y)
		if(this.velocity==0 && Math.abs(vl)>0) {
			this.calccdir(dir)
		}
		this.velocity = this.data.movev * vl/1000
		this.mode = 0
	},
	calccdir:function(dir) {
		const d = Math.atan2(dir.x,dir.y)
		let dx,dy,dz
		dy=0
		if(this.data.fly) dy = Math.sin(-this.camobj.rotation.x)
		dz = Math.cos(this.camobj.rotation.y+this.rot.y)
		dx = Math.sin(this.camobj.rotation.y+this.rot.y)
		this.cdir.y = Math.sign(dir.y)*dy
		this.cdir.x = Math.cos(d)*dx+Math.sin(d)*dz
		this.cdir.z =-Math.sin(d)*dx+Math.cos(d)*dz
	},
	ud:function(dir) {
		this.velocity = this.data.movev * -dir/1000
		this.mode = 1 
	},
	tick:function(time, timeDelta) {
		const vv = this.velocity *timeDelta
		if(!this.data.dirlock) {
			this.calccdir(this.pdir)
		}
		const dx = this.mode==0?(this.cdir.x * vv):0
		const dz = this.mode==0?(this.cdir.z * vv):0
		const dy = this.mode==1?(vv*0.5):this.cdir.y * vv
		this.el.object3D.position.add({x:dx,y:dy,z:dz})		
	}
})
})()