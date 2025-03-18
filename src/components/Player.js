import * as THREE from 'three';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.position = new THREE.Vector3(0, 0, 0);
        this.speed = 0.3;  // Horizontal movement speed
        this.moveSpeed = 15; // Lane changing speed
        this.jumpForce = 15;
        this.gravity = 35;
        this.verticalVelocity = 0;
        this.isJumping = false;
        this.isRunning = true;
        this.characterHeight = 2;
        this.laneSwitchTarget = 0;
        this.lanes = [-4, 0, 4]; // Left, center, right
        this.currentLane = 1; // Start in center lane (0-indexed)
        
        // Mobile optimization
        this.isMobile = this.checkIfMobile();
        
        // Character animation properties
        this.legsPivot = null;
        this.armsPivot = null;
        this.headPivot = null;
        this.legRotationSpeed = 10;
        this.armRotationSpeed = 7;
        this.bobHeight = 0.15;
        this.bobSpeed = 10;
        this.timeOffset = 0;
        this.isDead = false;
        
        this.createMesh();
    }
    
    checkIfMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    createMesh() {
        // Create character group
        this.mesh = new THREE.Group();
        
        // Create material - optimize for mobile
        const bodyMaterial = this.isMobile 
            ? new THREE.MeshBasicMaterial({ color: 0x3498db }) 
            : new THREE.MeshLambertMaterial({ color: 0x3498db });
        
        const faceMaterial = this.isMobile 
            ? new THREE.MeshBasicMaterial({ color: 0xecf0f1 }) 
            : new THREE.MeshLambertMaterial({ color: 0xecf0f1 });
            
        // Create body
        const bodyGeometry = new THREE.BoxGeometry(1, 1.2, 0.8);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.2;
        
        // Create head
        this.headPivot = new THREE.Group();
        this.headPivot.position.y = 1.8;
        
        const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        
        // Create face
        const faceGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.z = 0.45;
        
        // Create eyes
        const eyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x2c3e50 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 0.1, 0.5);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 0.1, 0.5);
        
        // Create mouth
        const mouthGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.1);
        const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.15, 0.5);
        
        // Add face components to head
        head.add(face);
        head.add(leftEye);
        head.add(rightEye);
        head.add(mouth);
        
        this.headPivot.add(head);
        
        // Create arms
        this.armsPivot = new THREE.Group();
        this.armsPivot.position.y = 1.5;
        
        const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.65, -0.25, 0);
        this.armsPivot.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.65, -0.25, 0);
        this.armsPivot.add(rightArm);
        
        // Create legs
        this.legsPivot = new THREE.Group();
        this.legsPivot.position.y = 0.6;
        
        const legGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.4);
        
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.25, -0.4, 0);
        this.legsPivot.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.25, -0.4, 0);
        this.legsPivot.add(rightLeg);
        
        // Assemble character
        this.mesh.add(body);
        this.mesh.add(this.headPivot);
        this.mesh.add(this.armsPivot);
        this.mesh.add(this.legsPivot);
        
        // Set initial position
        this.mesh.position.y = this.characterHeight / 2;
        this.mesh.position.z = 0;
        
        // Add shadow casting if not on mobile
        if (!this.isMobile) {
            this.mesh.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });
        }
        
        this.scene.add(this.mesh);
    }
    
    update(delta, inputHandler) {
        // Handle movement
        let moved = false;
        
        if (this.isDead) {
            // Death animation - fall backwards
            this.verticalVelocity -= this.gravity * delta;
            this.mesh.position.y += this.verticalVelocity * delta;
            this.mesh.rotation.x -= 3 * delta;
            
            // Keep it from falling too far
            if (this.mesh.position.y < -5) {
                this.mesh.position.y = -5;
            }
            return false;
        }
        
        // Jump
        if (inputHandler.isJumping && !this.isJumping) {
            this.verticalVelocity = this.jumpForce;
            this.isJumping = true;
            moved = true;
        }
        
        // Vertical movement (jumping/gravity)
        if (this.isJumping) {
            this.verticalVelocity -= this.gravity * delta;
            this.mesh.position.y += this.verticalVelocity * delta;
            
            // Adjust character animations for jumping
            this.legsPivot.rotation.x = Math.PI / 4;
            this.armsPivot.rotation.x = -Math.PI / 4;
            
            // Check if landed
            if (this.mesh.position.y <= this.characterHeight / 2) {
                this.mesh.position.y = this.characterHeight / 2;
                this.isJumping = false;
                this.verticalVelocity = 0;
            }
            
            moved = true;
        }
        
        // Horizontal lane movement
        if (inputHandler.isMovingLeft && this.currentLane > 0) {
            this.currentLane--;
            this.laneSwitchTarget = this.lanes[this.currentLane];
            moved = true;
        } else if (inputHandler.isMovingRight && this.currentLane < this.lanes.length - 1) {
            this.currentLane++;
            this.laneSwitchTarget = this.lanes[this.currentLane];
            moved = true;
        }
        
        // Smooth lane transition
        if (this.mesh.position.x !== this.laneSwitchTarget) {
            const diff = this.laneSwitchTarget - this.mesh.position.x;
            const step = Math.sign(diff) * Math.min(Math.abs(diff), this.moveSpeed * delta);
            this.mesh.position.x += step;
            
            // Add tilt effect when moving
            const targetTilt = Math.sign(diff) * -0.3;
            this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, targetTilt, 5 * delta);
            
            moved = true;
        } else {
            // Reset tilt when centered
            this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, 5 * delta);
        }
        
        // Update character animations
        this.timeOffset += delta;
        
        if (!this.isJumping) {
            // Running animation for legs and arms
            this.legsPivot.rotation.x = Math.sin(this.timeOffset * this.legRotationSpeed) * 0.5;
            this.armsPivot.rotation.x = Math.sin(this.timeOffset * this.armRotationSpeed) * 0.4 * -1;
            
            // Head bobbing for run cycle
            this.headPivot.position.y = 1.8 + Math.sin(this.timeOffset * this.bobSpeed) * this.bobHeight;
            
            // Add slight head tilt when turning
            const headTiltTarget = this.mesh.rotation.z * -0.5;
            this.headPivot.rotation.z = THREE.MathUtils.lerp(this.headPivot.rotation.z, headTiltTarget, 5 * delta);
        }
        
        // Check responder mods - reset if these flags were set for a frame
        inputHandler.resetJumpState();
        inputHandler.resetMoveState();
        
        // Update position vector (useful for collision)
        this.position.copy(this.mesh.position);
        
        return moved;
    }
    
    getPosition() {
        return this.mesh.position.clone();
    }
    
    getSize() {
        return { width: 1, height: this.characterHeight, depth: 0.8 };
    }
    
    die() {
        this.isDead = true;
        this.isRunning = false;
        this.verticalVelocity = 5; // Initial upward velocity on death
    }
    
    reset() {
        this.isDead = false;
        this.isRunning = true;
        this.isJumping = false;
        this.verticalVelocity = 0;
        this.currentLane = 1;
        this.laneSwitchTarget = this.lanes[this.currentLane];
        this.mesh.position.set(0, this.characterHeight / 2, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.position.copy(this.mesh.position);
    }
} 