import * as THREE from 'three';
import C from 'cannon';

import MenuDrop from './MenuDrop';

const distance = 15;

export default class Scene {
  constructor() {
    this.$stage = document.getElementById('stage');
    
    this.setup();
    this.bindEvents();
  }
  
  bindEvents() {
    window.addEventListener('resize', () => this.onResize());
  }
  
  setup() {
    this.world = new C.World();
    this.world.gravity.set(0, -50, 0);
    
    this.scene = new THREE.Scene();
    
    this.setCamera();
    this.setLights();
    this.setRender();
    
    this.addObjects();
  }
  
  onResize() {
    const { W, H } = APP.Layout;
    
    this.camera.aspect = W / (H - 8);
    
    this.camera.top = distance;
    this.camera.right = distance * this.camera.aspect;
    this.camera.bottom = -distance;
    this.camera.left = -distance * this.camera.aspect;
    
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H - 8);
  }
  
  setCamera() {
    const { W, H } = APP.Layout;
    const aspect = W / (H - 8);
    
    this.camera = new THREE.OrthographicCamera(-distance * aspect, distance * aspect, distance, -distance, -10, 100);
    
    this.camera.position.set(-3, 3, 8);
    this.camera.lookAt(new THREE.Vector3());
  }
  
  setLights() {
    const ambient = new THREE.AmbientLight(0xcccccc);
    this.scene.add(ambient);
    
    const foreLight = new THREE.DirectionalLight(0xffffff, 0.5);
    foreLight.position.set(5, 5, 20);
    this.scene.add(foreLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 1);
    backLight.position.set(-5, -5, -10);
    this.scene.add(backLight);
  }
  
  setRender() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.$stage,
    });
    
    this.renderer.setClearColor(0xFFEDFE);
    this.renderer.setSize(APP.Layout.W, APP.Layout.H - 8);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    this.renderer.setAnimationLoop(() => this.draw());
  }
  
  addObjects() {
    this.menu = new MenuDrop(this.scene, this.world, this.camera);
  }

  draw() {
    this.updatePhysics();
    this.renderer.render(this.scene, this.camera);
  }
  
  updatePhysics() {
    if (this.dbr) this.dbr.update();
    
    this.menu.update();
    
    this.world.step(1 / 60);
  }
}
