import * as THREE from 'three';
import C from 'cannon';
import faceType from './helvetiker_regular.typeface.json';

const force = 10;

export default class Menu {
  constructor(scene, world, camera) {
    this.loader = new THREE.FontLoader();
    const font = this.loader.parse(faceType);
    
    this.worlds = ['You\'re', 'Cute', 'As', 'Fuck'];
    this.scene = scene;
    this.world = world;
    this.camera = camera;
    
    this.totalMass = 1;
    this.cMaterial = new C.Material();
    this.worldMat = new C.Material();
    
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.pointerHandler = this.onPointer();
    this.pointDiffer = this.getCoordsDiff();
    
    this.setup(font);
    this.bindEvents();
  }
  
  bindEvents() {
    document.addEventListener('pointerdown', (event) => this.pointerHandler(event));
    document.addEventListener('pointerup', (event) => this.pointerHandler(event));
    document.addEventListener('pointermove', (event) => this.pointerHandler(event));
    document.addEventListener('click', () => this.onClick());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }
  
  getCoordsDiff = () => {
    let prevEvent = null;
    const alpha = Math.atan(3 / 8);
    const beta = Math.atan(3 / Math.sqrt(3 ** 2 + 8 ** 2));
    
    return (event) => {
      if (!prevEvent) {
        prevEvent = event;
        
        return null;
      }
      
      if (!event) {
        prevEvent = null;
        
        return null;
      }
      
      const { W, H } = window.APP.Layout;
      const aspect = W / H;
      const axeHeight = H / 2;
      const axeLength = W / 2;
      
      const { clientX: prevX, clientY: prevY } = prevEvent;
      const { clientX, clientY } = event;
      
      const deltaX = ((clientX - prevX) * 15 * aspect) / axeLength;
      const deltaY = ((-1) * (clientY - prevY) * 15) / axeHeight;
      
      const dx = deltaX * Math.cos(alpha);
      const dy = deltaY * Math.cos(beta);
      const dz = deltaX * Math.sin(alpha) + deltaY * Math.sin(beta);
      
      prevEvent = event;
      
      return { dx, dy, dz };
    };
  };
  
  onPointer() {
    let wordObject = null;
    let moveCount = 0;

    return (event) => {
      event.preventDefault();

      const { type } = event;

      switch (type) {
        case 'pointerdown': {
          this.raycaster.setFromCamera(this.mouse, this.camera);
          const intersects = this.raycaster.intersectObjects(this.scene.children, true);

          if (intersects.length > 0) {
            const [intersection] = intersects;
            
            wordObject = intersection.object.isMesh && intersection.object;
          }

          return;
        }
        case 'pointerup': {
          this.moving = false;

          const diff = this.pointDiffer(event);

          if (!diff) {
            this.pointDiffer(null);
            wordObject = null;
            
            return;
          }

          const impulse = new C.Vec3(diff.dx / 5, diff.dy, -diff.dz).scale(10);
          wordObject.body.applyLocalImpulse(impulse, new C.Vec3());

          this.pointDiffer(null);
          wordObject = null;

          return;
        }
        case 'pointermove': {
          if (wordObject) {
            this.moving = true;
            
            const diff = this.pointDiffer(event);
            const word = this.words.find((word, i) => {
              return word.children.some((letter) => letter === wordObject);
            });

            if (!diff) return;

            if (moveCount === 5) {
              const impulse = new C.Vec3(diff.dx / 10, diff.dy, -diff.dz).scale(10);
              wordObject.body.applyLocalImpulse(impulse, new C.Vec3());

              moveCount = 0;
            }

            word.position.set(
              word.position.x + diff.dx,
              word.position.y + diff.dy > 15 ? word.position.y : word.position.y + diff.dy,
              word.position.z + diff.dz > 10 ? word.position.z : word.position.z + diff.dz,
            );
            moveCount++;
          }
        }
      }
    };
  }
  
  setup(font) {
    this.words = [];
    this.margin = 6;
    this.offset = this.worlds.length * this.margin * 0.5;
    
    const options = {
      font,
      size: 5,
      height: 0.4,
      curveSegments: 24,
      bevelEnabled: true,
      bevelThickness: 0.9,
      bevelSize: 0.3,
      bevelOffset: 0,
      bevelSegments: 10,
    };
    
    Array.from(this.worlds).reverse().forEach((innerText, i) => {
      const words = new THREE.Group();
      words.len = 0;
      
      words.ground = new C.Body({
        mass: 0,
        shape: new C.Box(new C.Vec3(100, 100, 0.1)),
        quaternion: new C.Quaternion().setFromEuler(Math.PI / -2, 0, 0),
        position: new C.Vec3(0, i * this.margin - this.offset, 0),
        material: this.worldMat,
      });
      
      words.isGroundDisplayed = false;
      
      Array.from(innerText).forEach((letter, j) => {
        const progress = (j) / (innerText.length - 1);
        
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color('#7A5099')
            .clone()
            .lerp(new THREE.Color('#7A5099'), progress)
        });
        const geometry = new THREE.TextBufferGeometry(letter, options);
        
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.size = mesh.geometry.boundingBox.getSize(new THREE.Vector3());
        mesh.size.multiply(new THREE.Vector3(0.5, 0.5, 0.5));
        
        mesh.initPosition = new C.Vec3(words.len * 2, (this.worlds.length - 1 - i) * this.margin - this.offset, 0);
        mesh.initPositionOffset = new C.Vec3(
          mesh.initPosition.x,
          mesh.initPosition.y + (i + 1) * 30 + 30 + j * 0.01,
          mesh.initPosition.z
        );
        
        words.len += mesh.size.x;
        
        const box = new C.Box(new C.Vec3(mesh.size.x, mesh.size.y, mesh.size.z));
        
        mesh.body = new C.Body({
          mass: this.totalMass / innerText.length,
          position: mesh.initPositionOffset,
          material: this.cMaterial,
          linearDamping: 0.1,
          angularDamping: 0.99,
        });
        
        mesh.body.addShape(
          box,
          new C.Vec3(
            mesh.geometry.boundingSphere.center.x,
            mesh.geometry.boundingSphere.center.y,
            mesh.geometry.boundingSphere.center.z
          )
        );
        
        this.world.addBody(mesh.body);
        words.add(mesh);
      });
      
      words.children.forEach((letter) => {
        letter.body.position.x -= words.len;
      });
      
      this.words.push(words);
      this.scene.add(words);
    });
    
    const contactMat = new C.ContactMaterial(this.cMaterial, this.worldMat, {
      friction: 0.002,
      frictionEquationStiffness: 1e6,
      frictionEquationRelaxation: 3,
      restitution: 0.2,
      contactEquationStiffness: 1e20,
      contactEquationRelaxation: 3,
    });
    
    this.world.addContactMaterial(contactMat);
    
    this.setConstraints();
  }
  
  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : '';
  }
  
  onClick() {
    if (this.moving) return;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const obj = intersects[0];
      const { object, face } = obj;
      
      if (!object.isMesh) return;
      
      const impulse = new C.Vec3().copy(face.normal).scale(-force);
      
      this.words.forEach((word, i) => {
        word.children.forEach((letter) => {
          const { body } = letter;
          
          if (letter !== object) return;
          
          body.applyLocalImpulse(impulse, new C.Vec3());
        });
        
      });
    }
  }
  
  update() {
    if (!this.words) return;
    
    this.words.forEach((word, j) => {
      for (let i = 0; i < word.children.length; i++) {
        const letter = word.children[i];
        
        letter.position.copy(letter.body.position);
        letter.quaternion.copy(letter.body.quaternion);
        
        if (j === this.words.length - 1 && letter.body.position.y <= -50) {
          this.reset();
        }
        
        if (word.isGroundDisplayed) continue;
        
        if (letter.body.position.y + letter.initPosition.y <= 0) {
          this.world.addBody(word.ground);
          
          word.isGroundDisplayed = true;
        }
      }
    });
  }
  
  reset() {
    this.words.forEach((word) => {
      word.isGroundDisplayed = false;
      
      const randomColor = {
        from: new THREE.Color('#7A5099'),
        to: new THREE.Color('#7A5099'),
      };
      
      for (let i = 0; i < word.children.length; i++) {
        const progress = (i) / (word.children.length - 1);
        
        const letter = word.children[i];
        letter.body.sleep();
        const { x, y, z } = letter.initPositionOffset;
        
        letter.material.color = randomColor.from.clone().lerp(randomColor.to, progress);
        
        letter.material.needsUpdate = true;
        
        letter.body.position.set(x - word.len, y, z);
        letter.body.quaternion.set(0, 0, 0, 1);
        
        letter.body.angularVelocity.setZero();
        letter.body.torque.setZero();
        letter.body.force.setZero();
        letter.body.wakeUp();
      }
    });
  }
  
  setConstraints() {
    this.words.forEach((word) => {
      for (let i = 0; i < word.children.length; i++) {
        const letter = word.children[i];
        const nextLetter = i + 1 === word.children.length ? null : word.children[i + 1];
        
        if (!nextLetter) continue;
        
        const c = new C.ConeTwistConstraint(letter.body, nextLetter.body, {
          pivotA: new C.Vec3(letter.size.x * 2, 0, 0),
          pivotB: new C.Vec3(0, 0, 0),
          axisA: C.Vec3.UNIT_X,
          axisB: C.Vec3.UNIT_X,
          angle: 0,
          twistAngle: 0,
          maxForce: 1e30,
        });
        
        c.collideConnected = true;
        
        this.world.addConstraint(c);
      }
    });
  }
}
