import * as THREE from 'three';

export class Collectible {
    constructor(scene, type = 'coin') {
        this.scene = scene;
        this.mesh = null;
        this.rotationSpeed = 3; // Increased rotation speed
        this.bobSpeed = 1.5; // Speed of bobbing up and down
        this.bobHeight = 0.2; // Height of bobbing
        this.startY = 0; // Will be set when positioned
        this.time = Math.random() * Math.PI * 2; // Random starting phase
        this.type = type; // Type of collectible: 'coin', 'magnet', 'shield', 'multiplier'
        this.effect = this.getEffectForType(type);
        
        this.createMesh();
    }
    
    getEffectForType(type) {
        switch(type) {
            case 'coin':
                return { points: 10, duration: 0 };
            case 'magnet':
                return { points: 5, duration: 10 }; // Attract coins for 10 seconds
            case 'shield':
                return { points: 5, duration: 8 }; // Invulnerable for 8 seconds
            case 'multiplier':
                return { points: 5, duration: 15, multiplier: 2 }; // 2x score for 15 seconds
            default:
                return { points: 10, duration: 0 };
        }
    }
    
    createMesh() {
        // Create a group for the collectible
        const group = new THREE.Group();
        
        switch(this.type) {
            case 'coin':
                this.createCoin(group);
                break;
            case 'magnet':
                this.createMagnet(group);
                break;
            case 'shield':
                this.createShield(group);
                break;
            case 'multiplier':
                this.createMultiplier(group);
                break;
            default:
                this.createCoin(group);
        }
        
        // Add to scene
        this.mesh = group;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;
        
        this.scene.add(this.mesh);
    }
    
    createCoin(group) {
        // Outer ring
        const ringGeometry = new THREE.TorusGeometry(0.5, 0.1, 8, 24);
        const ringMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFD700,
            emissive: 0xBB8C00,
            emissiveIntensity: 0.5
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Make it flat
        group.add(ring);
        
        // Inner coin
        const coinGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16);
        const coinMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFDF00, 
            emissive: 0xDD9500,
            emissiveIntensity: 0.3
        });
        
        const coin = new THREE.Mesh(coinGeometry, coinMaterial);
        coin.rotation.x = Math.PI / 2; // Make it flat
        group.add(coin);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
    }
    
    createMagnet(group) {
        // Create a horseshoe magnet
        const magnetGeometry = new THREE.TorusGeometry(0.4, 0.1, 8, 16, Math.PI);
        const magnetMaterial = new THREE.MeshLambertMaterial({
            color: 0xFF0000,
            emissive: 0xAA0000,
            emissiveIntensity: 0.5
        });
        
        const magnet = new THREE.Mesh(magnetGeometry, magnetMaterial);
        group.add(magnet);
        
        // Add poles
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        
        const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
        leftPole.position.set(-0.4, 0, 0);
        group.add(leftPole);
        
        const rightPole = new THREE.Mesh(poleGeometry, poleMaterial);
        rightPole.position.set(0.4, 0, 0);
        group.add(rightPole);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF5555,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
    }
    
    createShield(group) {
        // Create a shield
        const shieldGeometry = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const shieldMaterial = new THREE.MeshLambertMaterial({
            color: 0x00AAFF,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        group.add(shield);
        
        // Add inner shield detail
        const innerGeometry = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const innerMaterial = new THREE.MeshLambertMaterial({
            color: 0x0088CC,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const innerShield = new THREE.Mesh(innerGeometry, innerMaterial);
        group.add(innerShield);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00AAFF,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
    }
    
    createMultiplier(group) {
        // Create a multiplier (x2)
        const symbolGroup = new THREE.Group();
        
        // "x" character
        const xGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        const xMaterial = new THREE.MeshLambertMaterial({
            color: 0x00FF00,
            emissive: 0x00AA00,
            emissiveIntensity: 0.5
        });
        
        const xBar1 = new THREE.Mesh(xGeometry, xMaterial);
        xBar1.rotation.z = Math.PI / 4;
        symbolGroup.add(xBar1);
        
        const xBar2 = new THREE.Mesh(xGeometry, xMaterial);
        xBar2.rotation.z = -Math.PI / 4;
        symbolGroup.add(xBar2);
        
        // "2" character
        const textGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.1);
        const textMaterial = new THREE.MeshLambertMaterial({
            color: 0x00FF00,
            emissive: 0x00AA00,
            emissiveIntensity: 0.5
        });
        
        // Top bar of "2"
        const topBar = new THREE.Mesh(textGeometry, textMaterial);
        topBar.position.set(0.35, 0.2, 0);
        symbolGroup.add(topBar);
        
        // Middle bar of "2"
        const midBar = new THREE.Mesh(textGeometry, textMaterial);
        midBar.position.set(0.35, 0, 0);
        symbolGroup.add(midBar);
        
        // Bottom bar of "2"
        const bottomBar = new THREE.Mesh(textGeometry, textMaterial);
        bottomBar.position.set(0.35, -0.2, 0);
        symbolGroup.add(bottomBar);
        
        // Connecting bars
        const rightBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), textMaterial);
        rightBar.position.set(0.55, 0.1, 0);
        symbolGroup.add(rightBar);
        
        const leftBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), textMaterial);
        leftBar.position.set(0.15, -0.1, 0);
        symbolGroup.add(leftBar);
        
        symbolGroup.position.set(-0.3, 0, 0);
        group.add(symbolGroup);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF00,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
    }
    
    update(delta) {
        if (!this.mesh) return;
        
        // Update time
        this.time += delta * this.bobSpeed;
        
        // Rotate the collectible
        this.mesh.rotation.z += this.rotationSpeed * delta;
        
        // Bob up and down
        if (this.startY !== 0) {
            this.mesh.position.y = this.startY + Math.sin(this.time) * this.bobHeight;
        } else {
            // Initialize startY if not set yet
            this.startY = this.mesh.position.y;
        }
        
        // Pulse the glow effect (last child is glow)
        const glowIndex = this.mesh.children.length - 1;
        if (this.mesh.children[glowIndex] && this.mesh.children[glowIndex].material) {
            const glow = this.mesh.children[glowIndex];
            glow.material.opacity = 0.15 + Math.sin(this.time * 2) * 0.05;
        }
    }
    
    getSize() {
        return {
            width: 1,
            height: 0.1,
            depth: 1
        };
    }
} 