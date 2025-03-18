import * as THREE from 'three';

export class Obstacle {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.createMesh();
    }
    
    createMesh() {
        // Random obstacle type
        const obstacleType = Math.floor(Math.random() * 3);
        
        switch (obstacleType) {
            case 0: // Barrier (wide)
                this.createBarrier();
                break;
            case 1: // Bollard (tall)
                this.createBollard();
                break;
            case 2: // Trash bin
                this.createTrashBin();
                break;
            default:
                this.createBarrier();
        }
    }
    
    createBarrier() {
        const geometry = new THREE.BoxGeometry(1.8, 1.2, 0.5);
        const material = new THREE.MeshLambertMaterial({ color: 0xFF4422 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }
    
    createBollard() {
        const geometry = new THREE.CylinderGeometry(0.3, 0.4, 1.8, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xFFCC22 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }
    
    createTrashBin() {
        const geometry = new THREE.CylinderGeometry(0.6, 0.5, 1.2, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0x22CC88 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }
    
    getSize() {
        if (!this.mesh) return { width: 0, height: 0, depth: 0 };
        
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        const size = boundingBox.getSize(new THREE.Vector3());
        
        return {
            width: size.x,
            height: size.y,
            depth: size.z
        };
    }
} 