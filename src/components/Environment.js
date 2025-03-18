import * as THREE from 'three';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.tracks = [];
        this.trackSegments = [];
        this.segmentLength = 30;
        this.visibleSegments = 6;
        this.totalSegments = 12;
        this.buildings = [];
        
        this.createTracks();
        this.createBackground();
    }
    
    createTracks() {
        // Create three parallel tracks (lanes)
        const trackWidth = 2;
        const trackPositions = [-4, 0, 4]; // Same as player lanes
        
        const trackGeometry = new THREE.BoxGeometry(trackWidth, 0.1, this.segmentLength);
        const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 }); // Dark gray
        
        // Add track segments for each lane
        for (let i = 0; i < this.totalSegments; i++) {
            const segmentGroup = new THREE.Group();
            
            for (let lane = 0; lane < trackPositions.length; lane++) {
                const trackSegment = new THREE.Mesh(trackGeometry, trackMaterial);
                trackSegment.position.set(trackPositions[lane], 0, -i * this.segmentLength);
                trackSegment.receiveShadow = true;
                segmentGroup.add(trackSegment);
            }
            
            // Add ground between tracks
            const groundWidth = trackPositions[trackPositions.length - 1] - trackPositions[0] + trackWidth;
            const groundGeometry = new THREE.BoxGeometry(groundWidth, 0.05, this.segmentLength);
            const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 }); // Light gray
            
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.position.set(0, -0.05, -i * this.segmentLength);
            ground.receiveShadow = true;
            segmentGroup.add(ground);
            
            this.trackSegments.push(segmentGroup);
            this.scene.add(segmentGroup);
        }
    }
    
    createBackground() {
        // Create simple buildings for the background
        const buildingCount = 40; // Number of buildings
        const maxHeight = 20;
        const buildingSpread = 150;
        const buildingDistance = 30;
        
        for (let i = 0; i < buildingCount; i++) {
            const height = 5 + Math.random() * maxHeight;
            const width = 3 + Math.random() * 5;
            const depth = 3 + Math.random() * 5;
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshLambertMaterial({ 
                color: Math.random() > 0.5 ? 0x999999 : 0xCCCCCC
            });
            
            const building = new THREE.Mesh(geometry, material);
            
            // Position buildings randomly on both sides of the track
            const side = Math.random() > 0.5 ? 1 : -1;
            const distanceFromTrack = 10 + Math.random() * 20;
            const zPosition = -Math.random() * buildingSpread;
            
            building.position.set(side * distanceFromTrack, height / 2, zPosition);
            this.scene.add(building);
            this.buildings.push(building);
        }
        
        // Add a floor plane
        const floorGeometry = new THREE.PlaneGeometry(500, 500);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x88AA88 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }
    
    update(delta, gameSpeed) {
        // Move track segments forward to create an endless runner effect
        const moveDistance = delta * gameSpeed;
        
        // Update tracks
        for (let i = 0; i < this.trackSegments.length; i++) {
            const segment = this.trackSegments[i];
            segment.position.z += moveDistance;
            
            // If a segment goes past the camera, move it to the back
            if (segment.position.z > this.segmentLength) {
                // Find the farthest back segment
                let backZ = -1000;
                for (let j = 0; j < this.trackSegments.length; j++) {
                    if (j !== i && this.trackSegments[j].position.z < backZ) {
                        backZ = this.trackSegments[j].position.z;
                    }
                }
                
                // Move current segment behind the farthest back segment
                segment.position.z = backZ - this.segmentLength;
            }
        }
        
        // Update buildings
        for (let i = 0; i < this.buildings.length; i++) {
            const building = this.buildings[i];
            building.position.z += moveDistance;
            
            // If a building goes past the camera, move it to the back
            if (building.position.z > 50) {
                building.position.z = -150;
            }
        }
    }
    
    reset() {
        // Reset all track segments to their original positions
        for (let i = 0; i < this.trackSegments.length; i++) {
            const segment = this.trackSegments[i];
            segment.position.z = 0; // Reset any accumulated offset
            segment.position.z = -i * this.segmentLength;
        }
        
        // Reset all buildings to random positions behind the camera
        for (let i = 0; i < this.buildings.length; i++) {
            const building = this.buildings[i];
            building.position.z = -Math.random() * 150;
        }
    }
} 