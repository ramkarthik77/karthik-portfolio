import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import type { Mood, Mode, Vehicle } from '../App'

type Props = { vehicle: Vehicle; mood: Mood; mode: Mode; paused: boolean; reduced: boolean; input: RefObject<{throttle:number;steering:number}>; onStop: (i:number)=>void }
const palettes = { sunset: { sky:'#372e42', fog:'#75504d', sun:'#ffbc78', light:'#ff733e' }, night: { sky:'#050816', fog:'#10172f', sun:'#a4b5ff', light:'#6a72ff' }, day: { sky:'#799eae', fog:'#97b6bf', sun:'#fff2d6', light:'#e2fbff' } }
function Box({position,scale,color='#181c23',metal=0.4,glow=false}: {position:[number,number,number];scale:[number,number,number];color?:string;metal?:number;glow?:boolean}) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={scale}/><meshStandardMaterial color={color} metalness={metal} roughness={glow?0.3:0.24} emissive={glow?color:'#000'} emissiveIntensity={glow?3:0}/></mesh>
}
function Wheel({x,z,r=0.43,width=0.3}: {x:number;z:number;r?:number;width?:number}) { return <group position={[x,r,z]} rotation={[0,0,Math.PI/2]}><mesh castShadow><cylinderGeometry args={[r,r,width,32]}/><meshStandardMaterial color="#08090c" roughness={0.8}/></mesh><mesh><cylinderGeometry args={[r*0.65,r*0.65,width+0.02,12]}/><meshStandardMaterial color="#69717a" metalness={1} roughness={0.22}/></mesh><mesh><cylinderGeometry args={[r*0.28,r*0.28,width+0.04,12]}/><meshStandardMaterial color="#ff613c" metalness={0.7} roughness={0.2}/></mesh></group> }
function VehicleModel({kind}: {kind:Vehicle}) {return kind==='car' ? <group>
  <Box position={[0,0.57,0]} scale={[2.05,0.42,4.25]} color="#b8c6c9" metal={0.95}/><Box position={[0,0.85,0.1]} scale={[1.85,0.24,3.5]} color="#b8c6c9" metal={0.95}/>
  <mesh position={[0,1.05,-0.05]} rotation={[0,0,0]} castShadow><sphereGeometry args={[1,32,16,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#101d28" metalness={0.8} roughness={0.12}/></mesh>
  <Box position={[0,0.9,1.35]} scale={[0.25,0.03,1.2]} color="#ff5b35"/><Box position={[0,0.91,-1.5]} scale={[0.25,0.03,1]} color="#ff5b35"/>
  {[-1.01,1.01].flatMap(x=>[-1.3,1.3].map(z=><Wheel key={`${x}${z}`} x={x} z={z}/>))}
  {[-0.72,0.72].map(x=><group key={x}><Box position={[x,0.74,2.14]} scale={[0.5,0.07,0.04]} color="#daefff" glow/><Box position={[x,0.73,-2.14]} scale={[0.55,0.07,0.04]} color="#ff241c" glow/><Box position={[x,1.03,-1.65]} scale={[0.08,0.4,0.15]}/></group>)}
  <Box position={[0,1.24,-1.7]} scale={[2.3,0.08,0.38]}/><Box position={[0,0.32,2.14]} scale={[2.1,0.07,0.25]}/>
  </group> : <group>
  <Wheel x={0} z={1.2} r={0.52} width={0.23}/><Wheel x={0} z={-1.15} r={0.55} width={0.3}/>
  <Box position={[0,0.76,0]} scale={[0.43,0.52,1.75]} color="#22252c"/>
  <mesh position={[0,1.15,0.25]} scale={[0.43,0.42,0.8]} castShadow><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#eb582e" metalness={0.75} roughness={0.2}/></mesh>
  <Box position={[0,1.1,-0.65]} scale={[0.48,0.18,0.8]}/><Box position={[0,1.37,1]} scale={[0.55,0.4,0.12]} color="#102936"/>
  <Box position={[0,1.12,1.12]} scale={[0.36,0.09,0.06]} color="#dff5ff" glow/><Box position={[0,1.2,-1.05]} scale={[0.32,0.06,0.04]} color="#ff2020" glow/>
  <Box position={[0,1.38,0.8]} scale={[0.95,0.07,0.09]} color="#acb8c3"/>
  <mesh position={[0,1.66,-0.23]} rotation={[0.5,0,0]} castShadow><capsuleGeometry args={[0.24,0.45,6,16]}/><meshStandardMaterial color="#171b24" roughness={0.6}/></mesh>
  <mesh position={[0,2.13,0.08]} castShadow><sphereGeometry args={[0.29,24,16]}/><meshStandardMaterial color="#d8e2e8" metalness={0.6} roughness={0.2}/></mesh><Box position={[0,2.13,0.32]} scale={[0.4,0.12,0.08]} color="#07101c"/>
  </group>}
function World(props: Props) {
  const {vehicle,mood,mode,paused,reduced,input,onStop}=props
  const rig=useRef<THREE.Group>(null)
  const angle=useRef(0), speed=useRef(0), lane=useRef(0), nextStop=useRef(1)
  const previous=useRef(mode)
  const target=useMemo(()=>new THREE.Vector3(),[])
  const cameraTarget=useMemo(()=>new THREE.Vector3(),[])
  const palette=palettes[mood]
  const road=useMemo(()=>{const shape=new THREE.Shape();shape.absellipse(0,0,39,29,0,Math.PI*2,false,0);const hole=new THREE.Path();hole.absellipse(0,0,30,20,0,Math.PI*2,true,0);shape.holes.push(hole);return new THREE.ShapeGeometry(shape,128)},[])
  useEffect(()=>()=>road.dispose(),[road])
  useFrame(({camera,clock},rawDelta)=>{
    const dt=Math.min(rawDelta,0.05)
    if(previous.current!==mode){speed.current=0;if(mode==='garage'){angle.current=0;lane.current=0}nextStop.current=Math.floor(angle.current/(Math.PI*2/5))+1;previous.current=mode}
    if(!rig.current)return
    if(mode==='garage') {
      rig.current.position.set(0,0,0);rig.current.rotation.set(0,-0.55,0)
      const sway=reduced?0:Math.sin(clock.elapsedTime*0.12)*0.7
      cameraTarget.set(8+sway,3.6,9);target.set(-1.5,0.7,0)
    } else {
      if(!paused){speed.current=THREE.MathUtils.damp(speed.current,mode==='tour'?7:input.current.throttle>0?14:input.current.throttle<0?0:0,3,dt);lane.current=THREE.MathUtils.clamp(lane.current+input.current.steering*dt*3,-2.6,2.6);angle.current+=speed.current*dt/34.5
        if(angle.current>=nextStop.current*Math.PI*2/5){onStop(nextStop.current%5);nextStop.current++}
      }
      const a=angle.current, x=(34.5+lane.current)*Math.cos(a), z=(24.5+lane.current)*Math.sin(a)
      rig.current.position.set(x,0,z);const heading=Math.atan2(-34.5*Math.sin(a),24.5*Math.cos(a));rig.current.rotation.set(0,heading,vehicle==='bike'?-input.current.steering*0.18-0.12:0)
      if(reduced){cameraTarget.set(x+11,17,z+16);target.set(x,0,z)}else {cameraTarget.set(x-Math.sin(heading)*9,4.8,z-Math.cos(heading)*9);target.set(x+Math.sin(heading)*4,0.9,z+Math.cos(heading)*4)}
    }
    camera.position.lerp(cameraTarget,1-Math.exp(-dt*3));camera.lookAt(target)
  })
  return <><color attach="background" args={[palette.sky]}/><fog attach="fog" args={[palette.fog,55,190]}/><ambientLight intensity={mood==='night'?0.45:0.9}/><directionalLight position={[20,25,-30]} color={palette.sun} intensity={mood==='night'?1.2:3} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={50} shadow-camera-bottom={-50}/>
    <Environment resolution={128}><Lightformer position={[0,6,0]} rotation={[Math.PI/2,0,0]} scale={[20,3,1]} intensity={4}/><Lightformer position={[-5,2,0]} rotation={[0,Math.PI/2,0]} scale={[10,2,1]} color={palette.light} intensity={5}/></Environment>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow position={[0,-0.05,0]}><planeGeometry args={[500,500]}/><meshStandardMaterial color={mood==='day'?'#404a48':'#151821'} roughness={0.6}/></mesh>
    {mode==='garage' ? <group>
      <Box position={[0,-0.02,0]} scale={[23,0.1,19]} color="#252a30" metal={0.7}/>
      <Box position={[0,3,-6]} scale={[23,6,0.3]} color="#161c26"/>
      {[-8,-4,0,4,8].map(x=><group key={x}><Box position={[x,3,-5.8]} scale={[0.06,5.7,0.04]} color={palette.light} glow/><Box position={[x,0.06,0]} scale={[0.035,0.02,12]} color="#58616b"/></group>)}
      <Box position={[0,5,-5.7]} scale={[18,0.06,0.05]} color="#fff0d3" glow/>
      <group position={[-5,0,-2]} rotation={[0,0.35,0]}><VehicleModel kind={vehicle==='car'?'bike':'car'}/></group>
      <pointLight position={[0,3,4]} color={palette.light} intensity={35} distance={15}/>
    </group> : <group>
      <mesh geometry={road} rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]} receiveShadow><meshStandardMaterial color="#252a32" metalness={mood==='night'?0.65:0.2} roughness={0.3}/></mesh>
      {Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2;return <group key={i} position={[39.3*Math.cos(a),0,29.3*Math.sin(a)]} rotation={[0,-a,0]}><Box position={[0,0.1,0]} scale={[0.7,0.18,1.4]} color={i%2?'#eee5d4':'#d4472c'}/></group>})}
      {Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2;return <group key={i} position={[34.5*Math.cos(a),0.025,24.5*Math.sin(a)]} rotation={[0,-a,0]}><Box position={[0,0,0]} scale={[0.08,0.015,0.9]} color="#d6cfb9"/></group>})}
      {Array.from({length:5},(_,i)=>{const a=i/5*Math.PI*2;return <group key={i} position={[44*Math.cos(a),0,34*Math.sin(a)]} rotation={[0,-a,0]}><Box position={[0,2,0]} scale={[5,4,7]} color="#222b37"/><Box position={[-2.55,2,0]} scale={[0.08,0.18,7]} color={palette.light} glow/><Box position={[-3,3.6,0]} scale={[0.15,0.15,6]} color="#e2ecff" glow/><pointLight position={[-4,3,0]} color={palette.light} intensity={20} distance={12}/></group>})}
      <Box position={[0,1.5,0]} scale={[20,3,9]} color="#1f2731"/><Box position={[0,3.08,0]} scale={[21,0.15,10]} color="#84909a"/>
    </group>}
    {Array.from({length:18},(_,i)=><mesh key={i} position={[Math.cos(i*0.7)*125,8,Math.sin(i*0.7)*125]} rotation={[0,i,0]}><coneGeometry args={[20+(i%4)*8,25+(i%5)*8,4]}/><meshStandardMaterial color={mood==='day'?'#617781':'#353346'} roughness={1}/></mesh>)}
    <mesh position={[-80,22,-100]}><sphereGeometry args={[9,32,16]}/><meshBasicMaterial color={palette.sun}/></mesh>
    <group ref={rig}><VehicleModel kind={vehicle}/></group>
  </>
}
export default function Circuit(props: Props) {return <Canvas shadows dpr={[1,1.5]} camera={{position:[8,3.6,9],fov:43,near:0.1,far:400}} gl={{antialias:true, powerPreference:'high-performance'}}><World {...props}/></Canvas>}
